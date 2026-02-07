# Story Generation Enhancement Plan

## Critical Insight: Beat-Based Generation

**The Problem:** Current system generates *screenplays* (vague narratives like "shapes morph into gate").
**The Goal:** Generate *choreography* (executable instructions like "Cursor enters from bottom-right, clicks 'Submit', cursor fades out").

| Metric | Current Output | LangEase Reference |
|--------|---------------|-------------------|
| Event density | ~1 event per 5s scene | ~3-4 events per 5s scene |
| Instruction type | "Chaos resolves" (vague) | "4 elements converge to center over 1.5s" (precise) |
| Programmability | Renderer guesses timing | Renderer executes exact instruction |

## Target Specifications
- **Duration**: 30 seconds (900 frames @ 30fps)
- **Event Density**: 3-5 beats per scene (minimum 3, enforce via validation)
- **Beat Duration**: ~1.5-2 seconds average
- **Priority**: Beat architecture first (this is the core fix)

## Reference Video Timing Analysis (LangEase - Complete 30s Breakdown)

| Time | Event | Pattern ID |
|------|-------|------------|
| **0:00-0:01** | "Turn Books" - Turn enters up, Books catches up with unique animation | `text_choreography_catchup` |
| **0:01** | Audio waveform animates to screen | `element_entrance` |
| **0:02** | "Any language" text appears | `text_entrance` |
| **0:03-0:04** | Text shifts left, folder component appears with click SFX | `element_shift_reveal` |
| **0:04-0:05** | Cursor picks folder, drops into UI mockup with gradient edges and ripple boxes | `cursor_pickup_drop_ripple` |
| **0:06-0:08** | "Just Drop and Go" word sequence + 4 devices enter from corners | `text_sequence + multi_device_corners` |
| **0:08-0:10** | "Books" → "Audio" → "Video" text swap in place | `text_swap_sequence` |
| **0:10-0:12** | "All In One Platform", 3 devices exit, 1 zooms + bends vertical | `device_focus_zoom_bend` |
| **0:12-0:14** | Progress bar gradient flows, counter 50→100, morphs to checkmark, confetti | `progress_counter_morph_confetti` |
| **0:14-0:19** | Checkmark → grid boxes → dashboard scroll → video click → flip → 4 versions | `morph_to_dashboard_split` |
| **0:20-0:24** | UI with gradient edges, video isolated, camera pans left, "Distribute to YouTube" clicked | `ui_isolate_camera_pan` |
| **0:24-0:25** | Button morphs, star shape overlays screen, scales down, spins, exits bottom-right | `star_overlay_transition` |
| **0:25-0:30** | Bouncing star + "Translate. Dub. Distribute." sequence → star forms logo → LangEase text | `bouncing_mascot_logo_reveal` |

**Animation Density**: ~13 distinct pattern events in 30 seconds = 1 event every 2.3 seconds average

## Key Technical Patterns Identified

1. **Text Choreography** - Words with staggered timing and catch-up effects
2. **Cursor Interactions** - Pick, drag, drop with disappearing cursor
3. **UI Ripple Effects** - Boxes incrementally increasing within each other
4. **Multi-Device Orchestration** - 4 devices from corners, coordinated movement
5. **Text Swap Sequence** - In-place text replacement with animation
6. **Device Bend/Zoom** - Device tilts and zooms to vertical
7. **Progress Counter Morph** - Counter → checkmark → confetti chain
8. **Element Flip Split** - Element flips and splits into multiple versions
9. **Camera Pan/Zoom** - Coordinated camera movement with interactions
10. **Star Bounce Mascot** - Bouncing element with trail + text reveals
11. **Star to Logo Morph** - Mascot element forms final logo

## Context

The current script generation system produces basic 5-6 scene structures with coarse-grained timing. Reference videos (LangEase, Teamble AI) demonstrate professional SaaS video quality with:
- **Micro-timing precision** (0.01-0.02s granularity)
- **Text choreography** (words animate in sequences, catch-up effects)
- **Interactive patterns** (cursor pick/drop, button clicks)
- **Multi-element orchestration** (4+ devices entering simultaneously)
- **Morphing transitions** (progress bar → checkmark → confetti)
- **Narrative structure** (problem → solution → harmony)

Current system gaps:
- No sub-scene "animation beats" for micro-timing
- Generic scene descriptions without choreography details
- Missing SaaS-specific pattern catalog
- Narrative archetypes proposed in `docs/design/narrative-engine-guide.md` but not implemented

## Implementation Approach

### Phase 1: Motion Pattern Catalog (The "Moves")

**New file: `server/core/services/types/script.types.ts`**

Define the executable motion patterns - these are reusable code blocks:

```typescript
// The specific "Move" the engine needs to execute
export type MotionPattern =
  | 'text_choreography'      // Staggered text entry, gradient wipes, catch-up physics
  | 'cursor_interaction'     // Mouse pick/drop, click, hover, trigger ripples
  | 'ui_morph_reveal'        // Shape A becomes Shape B (Button -> Progress Bar)
  | 'grid_orchestration'     // Multiple elements entering/exiting in synchronized layout
  | 'camera_movement'        // Pan, Zoom to element, Isolate focus
  | 'physics_reaction';      // Bounce, collision, gravity drop, confetti

export interface AnimationBeat {
  id: string;

  // CRUCIAL: timing relationship with other beats
  timingType: 'sequential' | 'overlap' | 'simultaneous';
  durationFrames: number;

  pattern: MotionPattern;

  // THE KEY DIFFERENCE: Specific executable instruction
  action: string;
  // Examples:
  // "Cursor enters from bottom-right, clicks 'Submit', cursor fades out"
  // "Header text slides up. Subtext fades in 0.2s later"
  // "Drop zone ripples, then morphs into a progress bar"

  // Elements involved in this beat
  activeElements: string[];
}

export interface ScriptScene {
  id: string;
  sceneNumber: number;
  frameRange: { start: number; end: number };

  // Narrative context (from archetype)
  narrativeGoal: string; // "The Problem", "The Solution", "The Social Proof"

  // THIS IS THE GAME CHANGER - beats are PRIMARY, not optional
  beats: AnimationBeat[]; // MUST have 3-5 beats per scene
}
```

### Phase 2: Narrative Archetypes (Structure Templates)

**New file: `server/core/services/narrative/archetypes.ts`**

Archetypes define *pacing* and *motion patterns per role*:

```typescript
export const NARRATIVE_ARCHETYPES = {
  // The "LangEase" Style - High density, functional, sleek
  'saas_product_demo': {
    pacing: 'rapid', // ~2 seconds per beat
    minBeatsPerScene: 3,
    structure: [
      { role: 'The Friction', motion: 'text_choreography', mood: 'chaotic' },
      { role: 'The Spark', motion: 'cursor_interaction', mood: 'energetic' },
      { role: 'The Mechanism', motion: 'ui_morph_reveal', mood: 'focused' },
      { role: 'The Harmony', motion: 'grid_orchestration', mood: 'elegant' },
      { role: 'The Payoff', motion: 'physics_reaction', mood: 'celebratory' }
    ]
  },

  'kinetic_manifesto': {
    pacing: 'punchy', // Sync to heavy beat
    minBeatsPerScene: 4,
    structure: [
      { role: 'The Statement', motion: 'text_choreography', mood: 'bold' },
      { role: 'The Build', motion: 'grid_orchestration', mood: 'intense' },
      { role: 'The Drop', motion: 'camera_movement', mood: 'dramatic' },
      { role: 'The Rush', motion: 'physics_reaction', mood: 'energetic' },
      { role: 'The Stamp', motion: 'ui_morph_reveal', mood: 'solid' }
    ]
  },

  'visionary_journey': {
    pacing: 'measured', // Slow, atmospheric
    minBeatsPerScene: 2,
    structure: [
      { role: 'The Atmosphere', motion: 'camera_movement', mood: 'ethereal' },
      { role: 'The Concept', motion: 'ui_morph_reveal', mood: 'curious' },
      { role: 'The Emergence', motion: 'grid_orchestration', mood: 'hopeful' },
      { role: 'The Realization', motion: 'text_choreography', mood: 'confident' },
      { role: 'The Legacy', motion: 'physics_reaction', mood: 'serene' }
    ]
  }
};
```

### Phase 3: Motion Director Prompt (The Critical Fix)

**Modify: `server/core/services/script.service.ts`**

Change the AI persona from "writer" to "Motion Director":

```typescript
const prompt = `
ROLE: You are a Technical Motion Director. You do not write stories; you choreograph animation data.

INPUT:
Brand: ${brand.name}
Industry: ${brand.industry}
Archetype: ${selectedArchetype.name}
Pacing: ${selectedArchetype.pacing}

TASK:
Break the video into ${selectedArchetype.structure.length} scenes.
CRITICAL: Each scene MUST contain 3-5 distinct "Animation Beats".
High-quality motion design relies on continuous movement (Event A -> Event B -> Event C).

MOTION PATTERN CATALOG:
1. 'text_choreography': Words entering with staggered timing, catch-up physics, gradient wipes
2. 'cursor_interaction': Mouse picking up objects, clicking buttons, triggering ripples
3. 'ui_morph_reveal': One object stretching/reshaping into another (Button -> Progress Bar)
4. 'grid_orchestration': Multiple items (phones/cards) entering in synchronized layout
5. 'camera_movement': Pan to element, zoom in, isolate focus
6. 'physics_reaction': Bounce, collision, gravity drop, confetti explosion

EXAMPLE OF HIGH-QUALITY SCENE (Use this density as benchmark):
Scene 3: "The Mechanism"
- Beat 1 (0.0s-1.5s): 'text_choreography' - "Header 'Just Drop' slides up. 'and Go' fades in 0.2s later, shifts left."
- Beat 2 (1.5s-3.0s): 'cursor_interaction' - "Cursor enters from right, picks up folder element, drags toward center."
- Beat 3 (3.0s-4.5s): 'ui_morph_reveal' - "Cursor drops folder into UI frame. Frame ripples, boxes expand incrementally inward."
- Beat 4 (4.5s-6.0s): 'grid_orchestration' - "4 device mockups enter simultaneously from corners, converge around center text."

VALIDATION RULE: If a scene has fewer than 3 beats, it will be rejected.

OUTPUT JSON:
{
  "scenes": [
    {
      "id": "scene-1",
      "sceneNumber": 1,
      "narrativeGoal": "The Friction",
      "frameRange": { "start": 0, "end": 180 },
      "beats": [
        {
          "id": "beat-1-1",
          "timingType": "sequential",
          "durationFrames": 45,
          "pattern": "text_choreography",
          "action": "'Turn' enters from bottom, slides up. 'Books' catches up from left with spring physics.",
          "activeElements": ["text-turn", "text-books"]
        },
        // ... more beats (minimum 3)
      ]
    }
  ]
}
`;
```

### Phase 4: Density Validation

**New file: `server/core/services/validation/beatValidator.ts`**

Enforce minimum event density:

```typescript
export function validateScriptDensity(script: ScriptData): ValidationResult {
  const errors: string[] = [];

  for (const scene of script.scenes) {
    if (scene.beats.length < 3) {
      errors.push(`Scene ${scene.sceneNumber} has ${scene.beats.length} beats (minimum 3 required)`);
    }

    // Check for vague instructions
    for (const beat of scene.beats) {
      if (beat.action.includes('morph') && !beat.action.includes('into')) {
        errors.push(`Beat ${beat.id}: "morph" instruction too vague, specify what morphs into what`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
```

### Phase 5: Time Normalization (Critical Math Fix)

**Add to: `server/core/services/script.service.ts`**

The AI is good at logic but bad at math. It might return beats that don't fit the target duration. This normalizes timing to prevent desync:

```typescript
/**
 * Normalize beat durations to fit within scene frame limits.
 * Handles the fact that AI-suggested durations often don't add up correctly.
 */
function normalizeBeatTiming(scenes: ScriptScene[], targetTotalFrames: number): ScriptScene[] {
  scenes.forEach(scene => {
    // 1. Sum up sequential beat durations (simultaneous beats don't add to timeline length)
    const totalAiFrames = scene.beats.reduce((acc, beat) => {
      return beat.timingType === 'sequential' ? acc + beat.durationFrames : acc;
    }, 0);

    // 2. Get the actual strict frame limit for this scene
    const allowedSceneFrames = scene.frameRange.end - scene.frameRange.start;

    // 3. Calculate the squeeze/stretch factor
    const ratio = allowedSceneFrames / totalAiFrames;

    // 4. Apply new timing to every beat
    let currentFrame = scene.frameRange.start;
    scene.beats.forEach(beat => {
      beat.durationFrames = Math.floor(beat.durationFrames * ratio);
      // Track start frame for sequential beats
      if (beat.timingType === 'sequential') {
        currentFrame += beat.durationFrames;
      }
    });
  });

  return scenes;
}
```

**Why this is critical:**
- AI might return Scene 1 with 4 beats totaling 8s, Scene 2 with 3 beats totaling 4s
- Without normalization, video length could be 34s instead of 30s
- This ensures beats always fit exactly within scene frame ranges

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `server/core/services/types/script.types.ts` | Create | MotionPattern + AnimationBeat + ScriptScene types |
| `server/core/services/narrative/archetypes.ts` | Create | Archetype definitions with pacing + motion patterns |
| `server/core/services/narrative/archetypeSelector.ts` | Create | Select archetype based on brand/style |
| `server/core/services/validation/beatValidator.ts` | Create | Enforce minimum 3 beats per scene |
| `server/core/services/script.service.ts` | Modify | Motion Director prompt + beat-based generation + time normalization |
| `server/core/agent/skills/rules/motion-patterns.md` | Create | Pattern implementation docs for code generation |
| `server/core/agent/skills/index.json` | Modify | Add motion-patterns skill |

## Implementation Order

### Step 1: Types + Motion Patterns (Foundation)
**Files to create:**
- `server/core/services/types/script.types.ts` - MotionPattern enum, AnimationBeat, ScriptScene

**Why first:** Everything else depends on these types.

### Step 2: Archetypes (Structure)
**Files to create:**
- `server/core/services/narrative/archetypes.ts` - 3 archetype definitions
- `server/core/services/narrative/archetypeSelector.ts` - Selection logic

**Why second:** Prompt needs to know which archetype to enforce.

### Step 3: Motion Director Prompt (Core Fix)
**Files to modify:**
- `server/core/services/script.service.ts` - Replace "writer" prompt with "Motion Director" prompt

**This is the critical change:** From "write a story" to "choreograph beats".

### Step 4: Time Normalization (Math Fix)
**Files to modify:**
- `server/core/services/script.service.ts` - Add `normalizeBeatTiming()` function

**Why:** AI is bad at math. This ensures beats fit exactly within frame limits.

### Step 5: Beat Validation (Quality Gate)
**Files to create:**
- `server/core/services/validation/beatValidator.ts` - Enforce density rules

**Why:** Programmatically reject low-density scripts.

### Step 6: Skills Integration
**Files to create:**
- `server/core/agent/skills/rules/motion-patterns.md` - Code implementation for each pattern

## Verification

1. Generate script for a SaaS brand → count beats per scene (must be ≥3)
2. Check beat actions are executable ("Cursor clicks X" not "Things happen")
3. Validate timingType usage (sequential vs simultaneous)
4. Render 30-second video → compare event density to LangEase (~13 events)
5. Test archetype selection (SaaS → saas_product_demo, Luxury → visionary_journey)

## Why This Works

1. **Decoupled Complexity:**
   - Old: Renderer reads "Shapes morph into gate" → must guess timing, shapes, paths
   - New: Renderer reads "Beat 2: cursor_interaction" → spawns cursor asset, follows path, triggers click

2. **Generic Applicability:**
   - FinTech: `cursor_interaction` → "Clicking 'Invest'"
   - E-commerce: `cursor_interaction` → "Clicking 'Add to Cart'"
   - Pattern stays same, only asset changes → reusable animation blocks

3. **Density Control:**
   - `if (scene.beats.length < 3) regenerate()` → guarantees LangEase-level activity
