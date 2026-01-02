# Phase 2: Phase Execution Engine

**Objective**: Build the Phase Manager and individual phase logic.

> [!WARNING]
> **Diagram Alignment**: The "Planning" phase must produce a structured script that the UI can visualize. The "Implementation" phase must support scene-by-scene locking if we implement granular controls.

## 📂 Files to Create
1.  `/server/workflow/phases/PhaseManager.ts`
2.  `/server/workflow/phases/BasePhase.ts` (Abstract class recommended)
3.  `/server/workflow/phases/QueryEnhancementPhase.ts`
4.  `/server/workflow/phases/PlanningPhase.ts`
5.  `/server/workflow/phases/ImplementationPhase.ts`
6.  `/server/workflow/phases/EvaluationPhase.ts`

---

## 1. Phase Architecture

Create a `PhaseManager` that acts as the "Switch" between phases.

```typescript
// /server/workflow/phases/PhaseManager.ts
export class PhaseManager {
  async executePhase(phase: WorkflowPhase, state: WorkflowState): Promise<WorkflowState> {
    const handler = this.getHandler(phase);
    return handler.execute(state);
  }
}
```

Create a common interface/abstract class `BasePhase`:
```typescript
abstract class BasePhase {
  abstract execute(state: WorkflowState): Promise<WorkflowState>;
}
```

---

## 2. Planning Phase (The "Script Builder")
**Path**: `/server/workflow/phases/PlanningPhase.ts`

**Goal**: Convert users request into a `SceneDescription[]`.
- **Prompt**: Ask Gemini to break the video into logical scenes.
- **Output JSON**: Must return strict JSON matching `ImplementationPlan` interface.
- **Critical**: Ensure the output includes `frameRange` estimates for Remotion.

---

## 3. Implementation Phase (The "Code Generator")
**Path**: `/server/workflow/phases/ImplementationPhase.ts`

**Goal**: Write the Remotion code using a **Modular Scene Architecture**.
- **Input**: `state.plan` (The Script) + `state.checkpoints` (Previous code).
- **Process**:
  1.  **Scene Isolation**: The system must treat each scene as a separate file (e.g., `Scene1.tsx`, `Scene2.tsx`).
  2.  **Composition Assembly**: Maintain a `MainComposition.tsx` that imports and sequences these scenes using `<Series>`.
  3.  **Targeted Generation**:
      - If doing a full run -> Generate all scene files.
      - If iterating -> Identify which scene needs repair and **ONLY** regenerate that specific file (`SceneX.tsx`).
      - This ensures that fixing Scene 3 does NOT break Scene 1.
  4.  **Validation**: Compile the specific scene file to ensure it exports the correct component.

> 🤨 **Diagram Note**: The diagram mentions "incremental scene by scene" and "fix certain part of the scene".
> **Strategy**:
> - Create a `scenes/` directory.
> - The Agent Prompt must explicitly be told: "You are editing `Scene2.tsx`. Do not modify other files. Ensure you export a component named `Scene2`."
> - This facilitates the "Websocket based implementation" where users see scenes pop in one by one.

---

## 4. Evaluation Phase (The "Critic")
**Path**: `/server/workflow/phases/EvaluationPhase.ts`

**Goal**: Look at the code and rate it.
- **Prompt**: "You are a senior React developer. Rate this code 0-100 based on: 1. Compilability, 2. Visual Fidelity to Plan, 3. Animation Smoothness."
- **Output**: `EvaluationResult` object.

---

## ✅ Verification
- Test `PlanningPhase` with a mock prompt -> assert it returns a valid user plan.
- Test `ImplementationPhase` mock -> assert it handles previous error context.
