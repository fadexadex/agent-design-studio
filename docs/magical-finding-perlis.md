# Plan: Fix Rendering Bug & Implement Incremental Scene Rendering UI

## Problem Summary

### Issue 1: Render Never Loads (Critical Bug)
The rendering phase in `WorkflowOrchestrator.ts` is a **placeholder** that immediately transitions to `COMPLETE` without actually rendering the video. Lines 319-337 show:
```typescript
private handleRenderingPhase(context: PhaseContext): PhaseResult {
  // ...
  // Rendering is handled externally by RemotionRenderer
  // For now, we transition to complete after rendering
  const updatedState = transitionPhase(this.state, WorkflowPhase.COMPLETE, ...);
  return { state: updatedState, success: true };
}
```
**No `RemotionRenderer` is ever called**, causing infinite "loading" on the frontend since `outputVideoPath` is never set.

### Issue 2: All-or-Nothing Scene Generation UI
Currently, scenes are generated sequentially in `ImplementationPhase.ts`, but:
- The UI waits until ALL scenes complete before showing anything
- Users cannot preview Scene 1 while Scene 2 is generating
- No visual progress feedback per scene

---

## Solution Overview

### Part A: Fix Rendering Phase (Bug Fix)
Integrate `RemotionRenderer` into the workflow's rendering phase to actually render the video.

### Part B: Incremental Scene Rendering with Visual Progress (Enhancement)
1. **Nice loading animations** while scenes generate (hide code from users)
2. **Per-scene video rendering** - when each scene completes, render that individual scene as a preview clip
3. **Detailed progress** - show percentage during generation/rendering
4. Keep completed scenes visible if later scenes fail

---

## Implementation Plan

### Phase 1: Fix Main Rendering (Critical Bug Fix)

**File: `server/workflow/WorkflowOrchestrator.ts`**
1. Import `RemotionRenderer` from the existing renderer module
2. Make `handleRenderingPhase` async
3. Actually call the renderer:
   - Get the MainComposition file path from the last implementation round
   - Call `RemotionRenderer.render()` with proper config
   - Emit progress updates during rendering (0-100%)
   - Set `outputVideoPath` on the state upon completion
4. Handle errors gracefully with meaningful messages

**File: `server/renderer/remotionRenderer.ts`**
1. Ensure the renderer works with the new modular scene architecture
2. Add a `renderScene()` method for individual scene rendering
3. Use `MainComposition.tsx` as the entry point for full video

**File: `remotion/src/Root.tsx`**
1. Import `MainComposition` from `./generated/scenes/MainComposition`
2. Register a new composition `GeneratedMainComposition` that uses the modular architecture
3. Add dynamic scene compositions for per-scene preview rendering

### Phase 2: Per-Scene Rendering Infrastructure

**File: `server/renderer/remotionRenderer.ts`**
Add new method `renderScenePreview()`:
```typescript
async renderScenePreview(
  sceneNumber: number,
  scenePath: string,
  config: VideoConfig,
  onProgress: (progress: number) => void
): Promise<string>  // Returns path to rendered scene clip
```

**File: `server/workflow/state.ts`**
Add scene status tracking to `WorkflowState`:
```typescript
interface SceneRenderStatus {
  sceneNumber: number;
  status: 'pending' | 'generating' | 'rendering' | 'complete' | 'error';
  progress: number;  // 0-100
  previewUrl?: string;
  error?: string;
}
```

**File: `remotion/src/Root.tsx`**
Register individual scene compositions for preview rendering:
```typescript
<Composition id="ScenePreview1" component={Scene1} ... />
<Composition id="ScenePreview2" component={Scene2} ... />
```
(Dynamic registration based on generated scenes)

### Phase 3: Emit Per-Scene Events with Progress

**File: `server/workflow/phases/ImplementationPhase.ts`**
1. Emit events with detailed progress:
   - `sceneProgress`: `{ sceneNumber, status, progress: 0-100, message }`
   - After code generation: trigger scene preview render
   - After render completes: emit `sceneComplete` with `previewUrl`
2. Track overall progress across all scenes

**File: `server/workflow/WorkflowOrchestrator.ts`**
1. Add events to `WorkflowEvents` interface:
   ```typescript
   sceneProgress: (status: SceneRenderStatus) => void;
   sceneComplete: (sceneNumber: number, previewUrl: string) => void;
   ```
2. Wire up callbacks in `createPhaseContext()`

**File: `server/routes/workflowRoutes.ts`**
Handle new SSE events:
```typescript
const onSceneProgress = (status: SceneRenderStatus) =>
  sendEvent('sceneProgress', status);
const onSceneComplete = (num: number, url: string) =>
  sendEvent('sceneComplete', { sceneNumber: num, previewUrl: url });
```

### Phase 4: Frontend - Beautiful Loading Animations

**File: `components/workflow/SceneProgress.tsx`** (NEW)
Create a dedicated component for scene progress visualization:
- Animated progress ring/bar per scene
- Pulsing glow effect while generating
- Smooth transitions between states
- Scene number badges
- "Rendering preview..." state with spinner

**File: `components/workflow/LivePreview.tsx`**
Major redesign:
1. Remove code view tab entirely (user shouldn't see code)
2. Scene selector with visual status indicators:
   - Pending: Greyed out, dimmed
   - Generating: Animated pulsing ring, progress percentage
   - Rendering: Different animation (like video frames flickering)
   - Complete: Checkmark, clickable to view preview
   - Error: Red X with tooltip
3. Main preview area:
   - Show nice animation/placeholder while scene is generating
   - When complete, show the rendered scene video clip
   - Video player for completed scenes

**File: `components/workflow/WorkflowDashboard.tsx`**
1. Integrate `SceneProgress` component
2. Update to track scene statuses from SSE stream
3. Show overall progress bar combining all scene progress

**File: `hooks/useWorkflowStream.ts`**
1. Add `sceneStatuses: Map<number, SceneRenderStatus>` to state
2. Listen for `sceneProgress` and `sceneComplete` events
3. Calculate overall progress from individual scene progress

### Phase 5: Polish & Animations

**File: `components/workflow/SceneProgress.tsx`**
Add premium animations:
- Framer Motion for smooth state transitions
- Gradient progress rings
- Particle effects on completion
- Staggered reveal of scenes

**File: `index.css` or dedicated styles**
Add CSS animations:
- `@keyframes pulse-glow` for generating state
- `@keyframes render-flicker` for rendering state
- Gradient backgrounds for the progress area

---

## Critical Files to Modify

| File | Purpose |
|------|---------|
| `server/workflow/WorkflowOrchestrator.ts` | Implement actual rendering, add scene events |
| `server/workflow/phases/ImplementationPhase.ts` | Emit scene progress events, trigger scene renders |
| `server/workflow/phases/BasePhase.ts` | Add `onSceneProgress` to `PhaseContext` |
| `server/workflow/state.ts` | Add `SceneRenderStatus` type |
| `server/renderer/remotionRenderer.ts` | Add `renderScenePreview()` method |
| `remotion/src/Root.tsx` | Register scene preview compositions |
| `server/routes/workflowRoutes.ts` | Handle new SSE events |
| `hooks/useWorkflowStream.ts` | Track per-scene status with progress |
| `components/workflow/SceneProgress.tsx` | **NEW** - Scene progress visualization |
| `components/workflow/LivePreview.tsx` | Redesign without code view, add scene previews |
| `components/workflow/WorkflowDashboard.tsx` | Integrate scene progress |

---

## Verification Plan

### 1. Fix Main Rendering
```bash
# Start servers
npm run dev:all

# Go through wizard, approve plan, wait for implementation
# Verify:
# - RENDERING phase is reached
# - RemotionRenderer.render() is called (check server logs)
# - Video file created in output/videos/
# - state.outputVideoPath is set
# - Frontend shows video player with playable video
```

### 2. Per-Scene Progress & Rendering
```bash
# Start a new workflow, approve plan
# During IMPLEMENTATION phase, verify:
# - SSE events show sceneProgress with 0-100% for each scene
# - UI updates scene indicators with progress percentages
# - Scene 1 shows "complete" with preview before Scene 2 starts
# - Clicking completed scene shows its rendered preview video
# - Pending scenes show nice loading animation, not clickable
```

### 3. Visual Polish Check
- Progress animations are smooth
- No jarring transitions
- Loading states look professional
- Preview videos load and play correctly

### 4. Error Handling
```bash
# If a scene fails:
# - That scene shows error state
# - Previously completed scenes remain viewable
# - User gets clear error message
# - Workflow can be retried
```

---

## Design Decisions Made

1. **No code visibility**: Users see animations and video previews, not TypeScript code
2. **Per-scene video rendering**: Each scene is rendered as a standalone clip for preview
3. **Detailed progress**: Show percentage (0-100%) during generation/rendering
4. **Keep completed scenes on error**: If Scene 3 fails, Scenes 1-2 remain viewable
5. **Premium animations**: Use modern effects (glows, gradients, smooth transitions)
