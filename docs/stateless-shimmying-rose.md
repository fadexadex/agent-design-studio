
# Scene-Based Preview Rendering System - Implementation Plan

## Overview

Transform the video preview system to render scenes individually as they're generated, allowing users to play scene videos immediately without waiting for the entire workflow to complete.

## Key Goals
1. **Per-scene rendering** - Each scene renders to MP4 immediately after generation
2. **Instant playback** - Users can play scene videos as soon as they're ready
3. **Maximum speed** - Optimized rendering at 720p for previews
4. **Error isolation** - Scene failures don't block other scenes

---

## Architecture

```
Scene Generated (ImplementationPhase)
        ↓
   Create ScenePreview{N}.tsx wrapper
        ↓
   Bundle & Render scene to MP4
        ↓
   Emit previewUrl via SSE
        ↓
   Frontend displays video player
```

---

## Implementation Steps

### Phase 1: Scene Preview Wrapper Generation

**File**: `server/workflow/phases/ImplementationPhase.ts`

Create a lightweight wrapper component for each scene that allows independent bundling:

```typescript
// After scene code is saved, generate preview wrapper
private async generateScenePreviewWrapper(sceneNumber: number): Promise<GeneratedFile> {
  const code = `import React from 'react';
import { Composition } from 'remotion';
import { Scene${sceneNumber} } from './Scene${sceneNumber}';

export const ScenePreview${sceneNumber}: React.FC = () => <Scene${sceneNumber} />;

export const RemotionRoot: React.FC = () => (
  <Composition
    id="ScenePreview"
    component={ScenePreview${sceneNumber}}
    durationInFrames={270}
    fps={30}
    width={1920}
    height={1080}
  />
);`;

  return {
    filePath: path.join(this.outputDir, 'previews', `ScenePreview${sceneNumber}.tsx`),
    content: code
  };
}
```

---

### Phase 2: Integrate Scene Rendering into ImplementationPhase

**File**: `server/workflow/phases/ImplementationPhase.ts`

After each scene validation succeeds, trigger rendering:

1. Update scene status to `'rendering'`
2. Call `RemotionRenderer.renderScenePreview()`
3. Get preview URL and emit via `onSceneProgress`
4. Update scene status to `'complete'` with `previewUrl`
5. Handle errors gracefully (don't fail entire workflow)

Key changes:
- Import `RemotionRenderer`
- Add rendering block after scene validation (around line 187-199)
- Wrap in try/catch to isolate errors

---

### Phase 3: Fix RemotionRenderer.renderScenePreview()

**File**: `server/renderer/remotionRenderer.ts`

Current issues:
- Tries to find `ScenePreview{N}` composition in Root.tsx (doesn't exist)
- Uses cached bundle (stale)
- Falls back silently instead of actually rendering

Fixes:
1. Clear bundle cache before each preview render
2. Use scene preview wrapper as entry point (not Root.tsx)
3. Look for `ScenePreview` composition ID
4. Use 720p resolution for speed (0.667 scale factor)
5. Propagate errors instead of swallowing them

```typescript
async renderScenePreview(
  sceneNumber: number,
  sceneDurationFrames: number,
  config: VideoConfig,
  onProgress: (progress: number) => void
): Promise<ScenePreviewResult> {
  // CRITICAL: Clear cache to pick up new scene file
  this.clearBundleCache();

  // Bundle from scene preview entry point
  const sceneEntryPoint = path.join(
    process.cwd(), 'remotion', 'src', 'generated', 'scenes',
    'previews', `ScenePreview${sceneNumber}.tsx`
  );

  const bundled = await bundle({
    entryPoint: sceneEntryPoint,
    onProgress: (p) => onProgress(p * 0.3),
  });

  // Select the ScenePreview composition
  const composition = await selectComposition({
    serveUrl: bundled,
    id: 'ScenePreview',
  });

  // Render at 720p for speed
  await renderMedia({
    composition: {
      ...composition,
      width: Math.round(width * 0.667),
      height: Math.round(height * 0.667),
      durationInFrames: sceneDurationFrames,
      fps: 30,
    },
    serveUrl: bundled,
    codec: 'h264',
    outputLocation: outputPath,
    onProgress: ({ progress }) => onProgress(0.3 + progress * 0.7),
  });

  return { sceneNumber, videoPath: outputPath, durationInFrames: sceneDurationFrames };
}
```

---

### Phase 4: Add Preview Serving API Endpoint

**File**: `server/index.ts`

Add endpoint to serve scene preview videos:

```typescript
/**
 * GET /api/preview/:filename
 * Stream scene preview video file
 */
app.get('/api/preview/:filename', async (req, res) => {
  const { filename } = req.params;
  const previewPath = path.join(process.cwd(), 'output', 'previews', filename);

  try {
    await fs.access(previewPath);
    res.sendFile(previewPath);
  } catch {
    res.status(404).json({ error: 'Preview not found' });
  }
});
```

---

### Phase 5: Frontend - Scene Preview Display

**File**: `components/workflow/LivePreview.tsx`

Replace the single loading/video display with a grid of scene preview cards:

**New ScenePreviewCard Component:**
- Shows scene header with number and status icon
- Displays video player when `status.previewUrl` is available
- Shows animated loading states for generating/rendering
- Shows error state with message
- Clickable to select scene

**Layout Changes:**
- Replace center content area with responsive grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)
- Each card is `aspect-video` for consistent sizing
- Final rendered video appears in footer when complete

---

## Files to Modify

| File | Changes |
|------|---------|
| `server/workflow/phases/ImplementationPhase.ts` | Add preview wrapper generation + render trigger |
| `server/renderer/remotionRenderer.ts` | Fix `renderScenePreview()` to use dynamic entry points |
| `server/index.ts` | Add `/api/preview/:filename` endpoint |
| `components/workflow/LivePreview.tsx` | Replace with scene preview card grid |

---

## Error Isolation Strategy

1. **Scene Generation Error**: Mark scene as `'error'`, continue to next scene
2. **Scene Rendering Error**: Mark scene as `'complete'` without `previewUrl`, log warning
3. **Bundle Error**: Catch in `renderScenePreview()`, return empty path
4. **Frontend 404**: Handle gracefully, show "Preview unavailable" message

---

## Performance Optimizations

1. **720p Previews**: 0.667 scale factor (1280x720) - faster encoding
2. **Clear Bundle Cache**: Prevents stale code but adds ~10s per scene
3. **Sequential Rendering**: More stable than parallel, easier error handling
4. **H.264 Codec**: Fast encoding with good compression

---

## Verification Plan

### Test 1: Single Scene
1. Create workflow with 1 scene
2. Verify `ScenePreview1.tsx` generated in `remotion/src/generated/scenes/previews/`
3. Verify MP4 created in `output/previews/`
4. Verify `previewUrl` in `sceneProgress` SSE event
5. Verify video plays in frontend

### Test 2: Multi-Scene Flow
1. Create workflow with 5 scenes
2. Watch scene statuses transition: `pending` → `generating` → `rendering` → `complete`
3. Verify each scene preview appears as it completes
4. Verify all 5 previews playable before final render starts

### Test 3: Error Isolation
1. Inject error in Scene 3 code
2. Verify Scenes 1, 2, 4, 5 still render successfully
3. Verify Scene 3 shows error state in UI
4. Verify workflow continues to final render

### Test 4: Frontend
1. Click scene cards while generating
2. Play/pause preview videos
3. Verify final video appears after all scenes
4. Test on different screen sizes (responsive grid)

---

## Optional Enhancements (Future)

1. **Parallel Rendering**: Render 2-3 scenes concurrently (resource permitting)
2. **Preview Caching**: Skip re-render if scene code unchanged
3. **Thumbnail Extraction**: Generate poster frames for unplayed videos
4. **Timeline Scrubbing**: Combined preview player that jumps between scenes
