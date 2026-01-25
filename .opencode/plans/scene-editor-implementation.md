# Scene Editor Implementation Plan

## Overview

A dedicated post-generation video editing experience where users can:
- View scenes in a timeline with preview players
- Select one or multiple scenes and send natural language prompts to refine them
- Add new scenes via prompt or delete existing scenes
- Reorder and trim scenes via drag-and-drop
- Watch individual scene previews auto-render (720p) after AI updates
- Maintain version history with undo/redo capabilities
- Export the final video (1080p)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (React/Vite)                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  /editor/:jobId                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  SceneEditor (Main Container)                                        │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐│   │
│  │  │  EditorTimeline                                                  ││   │
│  │  │  [+]┌───────┐[+]┌───────┐[+]┌───────┐[+]┌───────┐[+]           ││   │
│  │  │     │Scene 1│   │Scene 2│   │Scene 3│   │Scene 4│               ││   │
│  │  │     │ 🗑️ ✂️ │   │ 🗑️ ✂️ │   │ 🗑️ ✂️ │   │ 🗑️ ✂️ │               ││   │
│  │  │     └───────┘   └───────┘   └───────┘   └───────┘               ││   │
│  │  │  [+] = Add Scene button                                          ││   │
│  │  └─────────────────────────────────────────────────────────────────┘│   │
│  │  ┌────────────────────────────────────────────────────────────────┐ │   │
│  │  │  ScenePreviewPanel             │  PromptPanel                  │ │   │
│  │  │  - 720p video player           │  - Context: "Scene 2"         │ │   │
│  │  │  - Version dropdown            │  - "Make the logo spin..."    │ │   │
│  │  │  - Code viewer (collapsible)   │  - [Send] button              │ │   │
│  │  └────────────────────────────────────────────────────────────────┘ │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐│   │
│  │  │  ActionBar: [↩ Undo] [↪ Redo] [💾 Saved] [📤 Export]           ││   │
│  │  └─────────────────────────────────────────────────────────────────┘│   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ SSE + REST API
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BACKEND (Express)                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  /api/editor/*                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  EditorOrchestrator                                                  │   │
│  │  - processEdit()      → Gemini code update → render preview          │   │
│  │  - addScene()         → Gemini new scene → render preview            │   │
│  │  - deleteScene()      → Remove file → update MainComposition         │   │
│  │  - reorderScenes()    → Update MainComposition                       │   │
│  │  - trimScene()        → Adjust frame range → update MainComposition  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  EditorPersistence                                                   │   │
│  │  - saveState() / loadState()   → output/editor/{jobId}/state.json   │   │
│  │  - saveVersion() / loadVersions()  → output/editor/{jobId}/versions/│   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  SceneVersionManager                                                 │   │
│  │  - Version history per scene                                         │   │
│  │  - Undo/redo stack                                                   │   │
│  │  - Restore operations                                                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  RemotionRenderer                                                    │   │
│  │  - renderScenePreview() @ 720p (scale: 0.667)                       │   │
│  │  - renderFinalVideo() @ 1080p (scale: 1.0)                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### EditorState

```typescript
interface EditorState {
  jobId: string;
  brand: BrandContext;
  config: GenerationConfig;
  
  // Timeline data
  scenes: EditorScene[];
  totalDuration: number; // frames
  
  // Selection
  selectedSceneIds: string[];
  
  // Version control
  undoStack: EditorOperation[];
  redoStack: EditorOperation[];
  
  // Export status
  exportStatus?: 'idle' | 'rendering' | 'complete' | 'error';
  exportedVideoPath?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

### EditorScene

```typescript
interface EditorScene {
  id: string;
  sceneNumber: number;
  title: string;
  description: string;
  
  // Timeline positioning
  order: number;
  frameRange: { start: number; end: number };
  trimmedRange?: { start: number; end: number }; // For trimming
  
  // Files
  codeFilePath: string;
  previewUrl?: string;
  
  // Versioning
  versions: SceneVersion[];
  currentVersionId: string;
  
  // Status
  status: 'ready' | 'generating' | 'regenerating' | 'rendering' | 'error';
  error?: string;
}
```

### SceneVersion

```typescript
interface SceneVersion {
  id: string;
  timestamp: Date;
  prompt?: string; // What user asked for (null for initial)
  codeSnapshot: string;
  previewUrl?: string;
}
```

### EditorOperation (for undo/redo)

```typescript
interface EditorOperation {
  id: string;
  type: 'edit' | 'add' | 'delete' | 'reorder' | 'trim' | 'revert';
  sceneIds: string[];
  previousState: Partial<EditorScene>[];
  newState: Partial<EditorScene>[];
  timestamp: Date;
}
```

---

## API Endpoints

| Endpoint | Method | Purpose | Request Body | Response |
|----------|--------|---------|--------------|----------|
| `/api/editor/:jobId/state` | GET | Load or initialize editor state | - | `EditorState` |
| `/api/editor/:jobId/stream` | GET (SSE) | Real-time updates | - | SSE events |
| `/api/editor/:jobId/edit` | POST | Edit selected scene(s) | `{ sceneIds: string[], prompt: string }` | `{ success: true }` |
| `/api/editor/:jobId/scenes` | POST | Add new scene | `{ afterSceneId?: string, prompt: string }` | `{ sceneId: string }` |
| `/api/editor/:jobId/scenes/:sceneId` | DELETE | Delete scene | - | `{ success: true }` |
| `/api/editor/:jobId/reorder` | POST | Reorder scenes | `{ sceneOrder: string[] }` | `{ success: true }` |
| `/api/editor/:jobId/trim` | POST | Trim scene duration | `{ sceneId: string, frameRange: {start, end} }` | `{ success: true }` |
| `/api/editor/:jobId/revert` | POST | Revert to version | `{ sceneId: string, versionId: string }` | `{ success: true }` |
| `/api/editor/:jobId/undo` | POST | Undo last operation | - | `{ operation: EditorOperation }` |
| `/api/editor/:jobId/redo` | POST | Redo operation | - | `{ operation: EditorOperation }` |
| `/api/editor/:jobId/export` | POST | Start final render | - | `{ success: true }` |
| `/api/editor/:jobId/export/status` | GET | Check export progress | - | `{ progress: number, videoPath?: string }` |

---

## SSE Events

```typescript
interface EditorSSEEvents {
  // Scene status changes
  sceneStatus: { 
    sceneId: string; 
    status: EditorScene['status']; 
    progress?: number;
    message?: string;
  };
  
  // Scene updated with new preview
  sceneUpdated: { 
    sceneId: string; 
    previewUrl: string; 
    code: string;
    versionId: string;
  };
  
  // Agent thinking/progress
  thinking: { 
    message: string; 
    detail?: string;
  };
  
  // Export progress
  exportProgress: { 
    progress: number; 
    status: string;
  };
  
  // Export complete
  exportComplete: {
    videoPath: string;
  };
  
  // Errors
  error: { 
    sceneId?: string; 
    message: string;
  };
}
```

---

## File Structure

```
components/
  editor/
    SceneEditor.tsx              # Main container + state management
    EditorTimeline.tsx           # Horizontal timeline with playhead
    SceneTimelineCard.tsx        # Scene card with trim handles + delete
    AddSceneButton.tsx           # "+" button between scenes
    ScenePreviewPanel.tsx        # Video player + version selector
    PromptPanel.tsx              # Edit/add scene prompt input
    ActionBar.tsx                # Undo/Redo/Export
    TrimHandle.tsx               # Draggable trim control
    DeleteConfirmModal.tsx       # Confirmation for scene deletion
    AddSceneModal.tsx            # Prompt input for new scene
    ExportProgressModal.tsx      # Export progress overlay

hooks/
  useEditorStream.ts             # SSE connection
  useEditorState.ts              # State + dispatch
  useKeyboardShortcuts.ts        # Hotkeys

services/
  editorService.ts               # API client

server/
  routes/
    editorRoutes.ts              # All editor endpoints
  editor/
    EditorOrchestrator.ts        # Main coordinator
    EditorState.ts               # Types + interfaces
    EditorPersistence.ts         # File-based storage
    SceneVersionManager.ts       # Version history
    editorPrompts.ts             # Gemini prompts for editing/adding

types/
  editor.ts                      # Shared frontend types
```

---

## Persistence Structure

```
output/
├── editor/
│   └── {jobId}/
│       ├── state.json          # EditorState
│       ├── versions/
│       │   ├── scene_1_v1.tsx  # Version snapshots
│       │   ├── scene_1_v2.tsx
│       │   └── ...
│       └── history.json        # Undo/redo operations
├── previews/
│   └── ...
└── videos/
    └── ...
```

---

## Implementation Phases

### Phase 1: Core Backend (Days 1-2)

| Task | Description |
|------|-------------|
| 1.1 | Create `server/editor/EditorState.ts` with all interfaces |
| 1.2 | Implement `server/editor/EditorPersistence.ts` (save/load JSON) |
| 1.3 | Implement `EditorOrchestrator.loadFromWorkflow()` |
| 1.4 | Create `server/routes/editorRoutes.ts` with GET `/state` endpoint |
| 1.5 | Add route to `server/index.ts` |

### Phase 2: Basic Frontend (Days 2-3)

| Task | Description |
|------|-------------|
| 2.1 | Create `/editor/:jobId` route in App.tsx |
| 2.2 | Build `SceneEditor.tsx` container with state management |
| 2.3 | Build `EditorTimeline.tsx` (view-only, no drag-drop yet) |
| 2.4 | Build `SceneTimelineCard.tsx` with thumbnails |
| 2.5 | Build `ScenePreviewPanel.tsx` with video player |
| 2.6 | Add "Edit Video" button to WorkflowDashboard completion state |

### Phase 3: Edit Flow (Days 3-4)

| Task | Description |
|------|-------------|
| 3.1 | Implement `EditorOrchestrator.processEdit()` with Gemini |
| 3.2 | Create `server/editor/editorPrompts.ts` for scene editing prompts |
| 3.3 | Add POST `/edit` endpoint with SSE progress |
| 3.4 | Build `PromptPanel.tsx` with thinking indicator |
| 3.5 | Implement `hooks/useEditorStream.ts` hook |
| 3.6 | Wire up scene selection (single + multi-select) |

### Phase 4: Add & Delete Scenes (Days 4-5)

| Task | Description |
|------|-------------|
| 4.1 | Implement `EditorOrchestrator.addScene()` |
| 4.2 | Implement `EditorOrchestrator.deleteScene()` |
| 4.3 | Add POST `/scenes` and DELETE `/scenes/:id` endpoints |
| 4.4 | Build `AddSceneButton.tsx` and `AddSceneModal.tsx` |
| 4.5 | Add delete button to `SceneTimelineCard.tsx` |
| 4.6 | Build `DeleteConfirmModal.tsx` |

### Phase 5: Reorder & Trim (Days 5-6)

| Task | Description |
|------|-------------|
| 5.1 | Implement `EditorOrchestrator.reorderScenes()` |
| 5.2 | Implement `EditorOrchestrator.trimScene()` |
| 5.3 | Add drag-drop to `EditorTimeline.tsx` using @dnd-kit |
| 5.4 | Build `TrimHandle.tsx` with drag interaction |
| 5.5 | Add POST `/reorder` and `/trim` endpoints |

### Phase 6: Version Control (Days 6-7)

| Task | Description |
|------|-------------|
| 6.1 | Implement `server/editor/SceneVersionManager.ts` |
| 6.2 | Add version dropdown to `ScenePreviewPanel.tsx` |
| 6.3 | Implement undo/redo in `EditorOrchestrator` |
| 6.4 | Add POST `/undo`, `/redo`, `/revert` endpoints |
| 6.5 | Build `ActionBar.tsx` with undo/redo buttons |
| 6.6 | Implement `hooks/useKeyboardShortcuts.ts` |

### Phase 7: Export & Polish (Days 7-8)

| Task | Description |
|------|-------------|
| 7.1 | Implement export endpoint with progress tracking |
| 7.2 | Build `ExportProgressModal.tsx` |
| 7.3 | Add download button after export complete |
| 7.4 | Error handling and retry logic |
| 7.5 | Loading states and skeleton UI |
| 7.6 | Mobile-responsive adjustments |
| 7.7 | Final testing and bug fixes |

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl+Z` | Undo |
| `Cmd/Ctrl+Shift+Z` | Redo |
| `Cmd/Ctrl+A` | Select all scenes |
| `Delete/Backspace` | Delete selected scene(s) |
| `Space` | Play/pause preview |
| `Cmd/Ctrl+E` | Export video |
| `←/→` | Navigate to prev/next scene |
| `Escape` | Deselect all / close modal |

---

## Gemini Prompt Templates

### Scene Edit Prompt

```
You are a senior Remotion developer editing a scene in a motion design video.

BRAND CONTEXT:
- Name: {brand.name}
- Style: {config.style}
- Colors: {brand.colors}

CURRENT SCENE CODE:
{sceneCode}

ADJACENT SCENES (for continuity):
Previous: {previousSceneCode}
Next: {nextSceneCode}

USER REQUEST:
{userPrompt}

INSTRUCTIONS:
1. Analyze the user's request
2. Determine which scene(s) need modification
3. Generate updated code that:
   - Maintains Remotion best practices
   - Uses only: AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Sequence
   - Keeps brand colors and style consistent
   - Ensures smooth transitions with adjacent scenes

OUTPUT FORMAT (JSON):
{
  "scenesToUpdate": [
    {
      "sceneNumber": 2,
      "code": "// Full updated scene code...",
      "summary": "Added spinning animation to logo"
    }
  ],
  "reasoning": "Explanation of changes made"
}
```

### Add Scene Prompt

```
You are a senior Remotion developer creating a new scene for a motion design video.

BRAND CONTEXT:
- Name: {brand.name}
- Style: {config.style}
- Colors: {brand.colors}

EXISTING SCENES:
{existingScenesSummary}

INSERT POSITION: After Scene {afterSceneNumber}

PREVIOUS SCENE CODE (for continuity):
{previousSceneCode}

NEXT SCENE CODE (for continuity):
{nextSceneCode}

USER REQUEST:
{userPrompt}

INSTRUCTIONS:
Generate a new scene that:
1. Follows the {style} design style
2. Uses brand colors: {colors}
3. Creates smooth visual transition from previous scene
4. Leads naturally into next scene
5. Duration: 150-300 frames (5-10 seconds)

OUTPUT FORMAT (JSON):
{
  "code": "// Full scene code...",
  "title": "Scene title",
  "description": "What this scene shows",
  "suggestedDuration": 200
}
```

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Gemini generates invalid code | Validation + auto-fix + fallback template (already exists) |
| Long render times block UX | Async rendering with SSE progress updates |
| State corruption | Auto-save after each operation + version history |
| Browser crash loses work | File-based persistence + auto-recovery on load |
| Concurrent edits conflict | Operation queue + optimistic UI + conflict detection |

---

## Future Considerations

1. **Scene duration limits**: Min/max duration for scenes
2. **Export formats**: WebM/GIF in addition to MP4
3. **Collaboration**: Multi-user editing support
4. **Asset management**: User-uploaded images/logos in scenes
5. **Templates**: Save/load scene templates for reuse
