# Phase 3: Iteration & Decision Logic

**Objective**: Build the "Brain" that decides whether to Loop, Stop, or Ask for Help.

## 📂 Files to Create
1.  `/server/workflow/iteration/IterationController.ts`
2.  `/server/workflow/iteration/SelfEvaluator.ts`

---

// 1. Iteration Controller
// Logic:
// determineNextPhase returns NOT just the phase, but potentially modifies state to target specific scenes.

determineNextPhase(state: WorkflowState): WorkflowPhase {
  const evaluation = state.lastEvaluation;
  
  // Per-Scene Analysis
  const messyScenes = evaluation?.sceneScores.filter(s => s.score < 60) || [];
  
  if (messyScenes.length > 0) {
     // 1. Set state to ONLY target these scenes next round
     state.nextRoundTargets = messyScenes.map(s => s.sceneId);
     return WorkflowPhase.IMPLEMENTATION;
  }
  
  // ... standard checks ...
}

// 2. Self Evaluator
// Path: /server/workflow/iteration/SelfEvaluator.ts
// Goal: Rate the code GLOBALLY and PER SCENE.
interface EvaluationResult {
  score: number; // Global
  sceneScores: { sceneId: string; score: number; issues: string[] }[]; // Granular
}

---

## ✅ Verification
- Unit test `IterationController`:
  - Case: Score 95 -> Returns RENDERING.
  - Case: Score 40, Round 1 -> Returns IMPLEMENTATION.
  - Case: Score 70, Round 3 -> Returns AWAITING_FEEDBACK.
