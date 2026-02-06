# Narrative Engine: Engineering Creative Storytelling in AI Video Generation

## 1. The Core Concept: Narrative Archetypes
Instead of asking the AI for "5-6 scenes," we will constrain it to specific **Narrative Archetypes**. Professional motion design rarely "just happens"—it follows proven structural curves.

By explicitly prompting these structures, we move the AI from "random sequence of events" to "coherent storytelling."

### Proposed Archetypes

#### A. The "Problem-Solver" (SaaS/Product Focus)
*Best for: Explainers, App Launches, B2B*
1.  **The Friction (Sc 1):** Visual representation of the problem (e.g., "Chaos", "Slow", "Disconnected"). Darker or chaotic motion.
2.  **The Spark (Sc 2):** The turning point. A shift in color/motion. The introduction of the solution.
3.  **The Mechanism (Sc 3):** How it works. Abstract UI or schematics. "Connecting the dots."
4.  **The Harmony (Sc 4):** The result. Smooth, aligned, flow state. Brighter colors.
5.  **The Brand (Sc 5):** Final lockup. "Order restored."

#### B. The "Kinetic Manifesto" (High Energy/Hype)
*Best for: Lifestyle, Sports, Event Promos, Brutalist styles*
1.  **The Beat (Sc 1):** Rapid cuts. Single words. High contrast. Sync to imaginary beat.
2.  **The Build (Sc 2):** Increasing complexity. Elements layering on top of each other.
3.  **The Drop (Sc 3):** Sudden minimalist impact. Maximum negative space. The core message.
4.  **The Rush (Sc 4):** Kinetic typography. Fast motion.
5.  **The Stamp (Sc 5):** Heavy, solid logo reveal.

#### C. The "Visionary Journey" (Brand/Identity)
*Best for: Luxury, Corporate Identity, Cinematic styles*
1.  **The Atmosphere (Sc 1):** Slow, atmospheric setup. Establishing the mood (texture, light).
2.  **The Concept (Sc 2):** Abstract shapes morphing. "Forming an idea."
3.  **The Emergence (Sc 3):** The brand elements start to coalesce.
4.  **The Realization (Sc 4):** The tagline or value prop integrates with the visuals.
5.  **The Legacy (Sc 5):** Clean, elegant, timeless logo hold.

## 2. Engineering the Implementation

### Step 1: Define Archetypes in Code
Create a new definition file (e.g., `server/core/agent/narrative-patterns.ts`) to store these prompts.

```typescript
export interface NarrativeArchetype {
  id: string;
  name: string;
  description: string;
  structure: {
    scene: number;
    purpose: string;
    motionCue: string;
  }[];
}
```

### Step 2: Intelligent Archetype Selection
Modify `script.service.ts` to select an archetype *before* generating the script.
- **Input:** Brand Industry + Motion Style + User Prompt.
- **Logic:**
    - If `style === 'brutalist'`, lean towards **Kinetic Manifesto**.
    - If `industry === 'SaaS'`, lean towards **Problem-Solver**.
    - If `style === 'cinematic'`, lean towards **Visionary Journey**.

### Step 3: Structured Prompt Injection
Update the `generateScriptFromAI` prompt to include the specific steps of the selected archetype.

**Old Prompt:**
> "Create exactly 5-6 distinct scenes..."

**New Prompt:**
> "Follow the 'Problem-Solver' narrative structure strictly:
> - Scene 1 (The Friction): Visualize a conflict or problem related to [Brand Industry]. Motion should be chaotic.
> - Scene 2 (The Spark): Show the transition to clarity.
> - Scene 3 (The Mechanism): Abstractly demonstrate how [Brand Name] works.
> ..."

## 3. Enhancing the Script Data Model
Update `ScriptScene` to include "Emotional Tone" and "Pacing" metadata, which the renderer can later use to adjust animation curves (e.g., `chaos` = high stiffness springs, `harmony` = slow interpolation).

```typescript
export interface ScriptScene {
    // ... existing fields
    pacing: 'slow' | 'medium' | 'fast' | 'blitz';
    energyLevel: number; // 0-10
}
```

## 4. Execution Plan
1.  **Define Patterns:** Create the `narrative-patterns.ts` file with 3 initial archetypes.
2.  **Update Service:** Modify `script.service.ts` to import these patterns and select one based on `VideoConfig`.
3.  **Update Prompt:** Rewrite the Gemini system prompt to enforce the selected structure.
4.  **Test:** Generate scripts for the same brand using different archetypes to verify creative range.
