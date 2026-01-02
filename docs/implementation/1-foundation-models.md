# Phase 1: Foundation - Data Models & State Management

**Objective**: Create all TypeScript interfaces and state management infrastructure.

> [!NOTE]
> This is a pure data-structure phase. No complex logic, just definitions and state managers.

## 📂 Files to Create
1.  `/server/workflow/state/WorkflowState.ts`
2.  `/server/workflow/state/CheckpointManager.ts`
3.  `/server/workflow/state/ErrorTracker.ts`

---

## 1. WorkflowState.ts
**Path**: `/server/workflow/state/WorkflowState.ts`

Create the core state machine definitions.

```typescript
import { BrandContext, VideoConfig } from '../../agent/types';
import { AgentThought } from '../../agent/orchestrator';

export enum WorkflowPhase {
  INITIALIZATION = 'initialization',
  QUERY_ENHANCEMENT = 'query_enhancement',
  PLANNING = 'planning',
  IMPLEMENTATION = 'implementation',
  CHECKPOINT = 'checkpoint',
  EVALUATION = 'evaluation',
  ITERATION_DECISION = 'iteration_decision',
  AWAITING_FEEDBACK = 'awaiting_feedback', // ⚠️ Critical for User Loop
  RENDERING = 'rendering',
  COMPLETE = 'complete',
  ERROR = 'error'
}

export interface WorkflowState {
  jobId: string;
  currentPhase: WorkflowPhase;
  brand: BrandContext;
  config: VideoConfig;
  
  // Script / Planning
  plan?: ImplementationPlan; 
  
  // Execution State
  currentRound: number;
  maxRounds: number;
  rounds: ImplementationRound[];
  
  // History & Checkpoints
  checkpoints: Checkpoint[];
  activeCheckpointId?: string;
  errorHistory: ErrorRecord[];
  
  // Agent Stream
  thoughts: AgentThought[];
  
  // Progress
  progress: WorkflowProgress;
  
  updatedAt: Date;
  createdAt: Date;
}

export interface ImplementationPlan {
  approach: string;
  // 🤨 SCENE BUILDER REQUIREMENT: This list must be reorderable in UI
  sceneBreakdown: SceneDescription[]; 
  createdAt: Date;
}

export interface SceneDescription {
  id: string; // Add ID for drag-drop handling
  sceneNumber: number;
  description: string;
  frameRange: { start: number; end: number };
  keyElements: string[];
}

export interface ImplementationRound {
  roundNumber: number;
  // Support multi-file generation
  files: {
    filePath: string;
    content: string;
  }[];
  validationResult: ValidationResult;
  issues: string[];
  thoughts: AgentThought[];
}

export interface Checkpoint {
  id: string;
  roundNumber: number;
  files: {
    filePath: string;
    content: string;
  }[];
  description: string;
  timestamp: Date;
}

export interface ErrorRecord {
  roundNumber: number;
  errorType: string;
  errorMessage: string;
  resolved: boolean;
}

export interface WorkflowProgress {
  currentPhase: WorkflowPhase;
  phaseProgress: number; // 0-100
  currentMessage: string;
}

// Initializer
export function createInitialState(jobId: string, brand: BrandContext, config: VideoConfig): WorkflowState {
  // Implement simple default state factory
}
```

---

## 2. CheckpointManager.ts
**Path**: `/server/workflow/state/CheckpointManager.ts`

Manages saving and restoring state.

**Methods to Implement**:
- `createCheckpoint(state, round): Checkpoint`
- `restoreCheckpoint(state, checkpointId): string` (Returns code)
- `getCheckpoints(state): Checkpoint[]`

*Tip: Keep the last 10 checkpoints to save memory.*

---

## 3. ErrorTracker.ts
**Path**: `/server/workflow/state/ErrorTracker.ts`

Tracks errors to prevent the agent from repeating them.

**Methods to Implement**:
- `recordError(state, error): void`
- `getErrorContext(state): string` (Returns a summary string for the prompt: "Previously failed because X, Y...")

---

## ✅ Verification
1.  Compile project (`tsc --noEmit`).
2.  Verify `WorkflowState` exports are accessible.
3.  Ensure `SceneDescription` has `id` field (crucial for React interaction).
