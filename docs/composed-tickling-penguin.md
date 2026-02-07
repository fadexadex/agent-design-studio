# Timeline Architecture Refactoring Plan

## Context

The current script generation system uses a "Slide Deck" architecture where all scenes have equal duration (`framesPerScene = totalFrames / sceneCount`). This creates flat, PowerPoint-like videos instead of dynamic motion graphics with variable pacing.

Professional motion design videos use variable pacing: hooks are 2-3 seconds, demos are 6-10 seconds, outros are 2-3 seconds. This refactoring moves to a "Timeline" architecture where the AI suggests per-scene durations, which are then normalized to fit the target video length.

**Goal:** Enable rhythm, visual variety, and narrative flow by allowing variable scene durations based on scene purpose (Hook, Demo, CTA, etc.).

---

## Implementation Overview

| Phase | Description | Files Modified |
|-------|-------------|----------------|
| 1 | Type System Updates | `script.service.ts`, `WorkflowState.ts`, `types.ts` |
| 2 | Frame Calculation Engine | `script.service.ts` |
| 3 | AI Prompt Engineering | `script.service.ts` |
| 4 | Downstream Integration | `WorkflowOrchestrator.ts`, `ImplementationPhase.ts` |
| 5 | Testing | Manual verification |

---

## Phase 1: Type System Updates

### 1.1 Update ScriptScene Interface

**File:** `/server/core/services/script.service.ts` (lines 70-77)

Add new fields for timeline architecture:

```typescript
export interface ScriptScene {
    id: string;
    sceneNumber: number;
    description: string;
    frameRange: { start: number; end: number };
    keyElements: string[];

    // NEW: Timeline architecture fields
    visualStyle: 'kinetic_typography' | 'app_demo' | 'abstract_shape' | 'logo_reveal' | '3d_product_showcase' | 'abstract_ui';
    energyLevel: 'high' | 'medium' | 'low';
    suggestedDuration: number; // in seconds (AI-suggested, normalized later)
    textOverlay?: string[];    // text to display on screen
    cameraMovement?: string;   // e.g., "Zoom in", "Pan left"
    assets?: string[];         // referenced assets
}
```

### 1.2 Update SceneDescription (Backend)

**File:** `/server/core/workflow/state/WorkflowState.ts` (lines 72-78)

Add same new fields to match ScriptScene.

### 1.3 Update SceneDescription (Frontend)

**File:** `/types.ts` (lines 69-75)

Add same new fields (optional with `?` for backward compatibility).

---

## Phase 2: Frame Calculation Engine

### 2.1 Add calculateFrameRanges Function

**File:** `/server/core/services/script.service.ts` (add after line 68)

```typescript
/**
 * Calculate frame ranges based on AI-suggested durations.
 * Normalizes total suggested time to fit the target video duration.
 */
function calculateFrameRanges(
    scenes: ScriptScene[],
    targetDurationSec: number,
    fps: number = 30
): ScriptScene[] {
    const totalTargetFrames = targetDurationSec * fps;
    const totalSuggestedDuration = scenes.reduce(
        (sum, scene) => sum + (scene.suggestedDuration || 5),
        0
    );

    let currentFrame = 0;

    return scenes.map((scene, index) => {
        const weight = (scene.suggestedDuration || 5) / totalSuggestedDuration;
        const sceneFrames = Math.floor(totalTargetFrames * weight);
        const start = currentFrame;
        const end = index === scenes.length - 1
            ? totalTargetFrames - 1
            : start + sceneFrames - 1;
        currentFrame = end + 1;
        return { ...scene, frameRange: { start, end } };
    });
}
```

### 2.2 Replace Equal-Duration Logic

**File:** `/server/core/services/script.service.ts` (lines 202-215)

Remove:
```typescript
const framesPerScene = Math.floor(totalFrames / scriptData.scenes.length);
```

Replace with scene normalization that preserves timeline metadata, then apply:
```typescript
scriptData.scenes = calculateFrameRanges(scriptData.scenes, targetDuration, 30);
```

---

## Phase 3: AI Prompt Engineering

### 3.1 Update Prompt Structure

**File:** `/server/core/services/script.service.ts` (lines 98-140)

Add pacing guidelines after line 113:

```
## PACING STRATEGY (CRITICAL)
You are creating a motion design video, NOT a PowerPoint presentation.
Professional motion graphics use **variable pacing** to create narrative flow:

- **Hook** (0-15%): High energy, kinetic typography, 2-3 seconds
- **Problem/Context** (15-35%): Medium pace, establishes "Why", 4-5 seconds
- **Solution/Reveal** (35-45%): Impactful transition, 3-4 seconds
- **Demo/Features** (45-80%): Smooth flowing, 6-10 seconds
- **Outro/CTA** (80-100%): Punchy memorable close, 2-3 seconds

**DO NOT** make all scenes equal duration. Vary pacing to create rhythm.
```

### 3.2 Update JSON Schema in Prompt

Update the OUTPUT FORMAT section to include new fields:

```json
{
  "scenes": [{
    "id": "scene-1",
    "sceneNumber": 1,
    "description": "...",
    "keyElements": ["..."],
    "visualStyle": "kinetic_typography",
    "energyLevel": "high",
    "suggestedDuration": 3.0,
    "textOverlay": ["Brand Name"],
    "cameraMovement": "Zoom in"
  }]
}
```

### 3.3 Add Visual Style Definitions

```
## VISUAL STYLE DEFINITIONS
- **kinetic_typography**: Animated text, word reveals, typewriter effects
- **app_demo**: UI mockups, device frames, screen interactions
- **abstract_shape**: Geometric patterns, morphing shapes, particle systems
- **logo_reveal**: Brand logo animation, clean lockup
- **3d_product_showcase**: Product renders, 3D rotation effects
- **abstract_ui**: Futuristic interfaces, holographic effects

## ENERGY LEVEL GUIDE
- **high**: Fast animations, quick cuts, spring damping 80-120
- **medium**: Balanced pacing, smooth transitions, spring damping 100-150
- **low**: Slow reveals, cinematic easing, spring damping 150-200
```

---

## Phase 4: Downstream Integration

### 4.1 WorkflowOrchestrator Scene Conversion

**File:** `/server/core/workflow/WorkflowOrchestrator.ts` (lines 162-168)

Update scene mapping to pass through timeline metadata:

```typescript
const sceneBreakdown: SceneDescription[] = script.scenes.map((scene, idx) => ({
    // existing fields...
    visualStyle: scene.visualStyle || 'abstract_shape',
    energyLevel: scene.energyLevel || 'medium',
    suggestedDuration: scene.suggestedDuration || 5,
    textOverlay: scene.textOverlay,
    cameraMovement: scene.cameraMovement,
    assets: scene.assets
}));
```

### 4.2 ImplementationPhase Prompt Enhancement

**File:** `/server/core/workflow/phases/ImplementationPhase.ts`

Add to `buildScenePrompt` (after line 648):

```
## SCENE PACING METADATA
- **Visual Style**: ${scene.visualStyle} - [style-specific guidance]
- **Energy Level**: ${scene.energyLevel} - [animation timing guidance]
- **Duration**: ${durationSeconds}s - [complexity guidance]
```

Add helper methods:
- `getVisualStyleHint(style)` - Returns code guidance per visual style
- `getEnergyLevelHint(energy)` - Returns spring config per energy level
- `getDurationHint(duration)` - Returns complexity guidance per duration

---

## Phase 5: Verification

### Manual Testing Steps

1. **Start server:** `npm run dev:all`
2. **Generate script:** Use the BrandWizard to create a new video
3. **Verify JSON response:**
   - Check for `visualStyle`, `energyLevel`, `suggestedDuration` fields
   - Confirm frame ranges are non-uniform (variable pacing)
4. **Generate video:** Complete the workflow
5. **Verify output:** Watch the video for variable pacing

### Expected Behavior

- Scenes have different durations based on their purpose
- Hook scenes are shorter (2-3s)
- Demo/feature scenes are longer (6-10s)
- Animation energy matches the `energyLevel` field

---

## Critical Files Summary

| File | Changes |
|------|---------|
| `server/core/services/script.service.ts` | Interface updates, calculateFrameRanges, prompt updates |
| `server/core/workflow/state/WorkflowState.ts` | SceneDescription interface |
| `types.ts` | Frontend SceneDescription interface |
| `server/core/workflow/WorkflowOrchestrator.ts` | Scene conversion |
| `server/core/workflow/phases/ImplementationPhase.ts` | Prompt hints |

---

## Backward Compatibility

All new fields are optional with sensible defaults:
- `visualStyle` defaults to `'abstract_shape'`
- `energyLevel` defaults to `'medium'`
- `suggestedDuration` defaults to `targetDuration / sceneCount`

Existing scripts without new fields will work with equal-duration fallback.

---

## Estimated Time

- Phase 1 (Types): 20 min
- Phase 2 (Frame calculation): 30 min
- Phase 3 (Prompt engineering): 45 min
- Phase 4 (Downstream): 30 min
- Phase 5 (Testing): 20 min

**Total: ~2.5 hours**
