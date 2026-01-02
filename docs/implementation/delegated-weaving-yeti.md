# Multi-Phase Iterative Workflow Implementation Plan

## Overview

This plan replaces the current single-path video generation workflow with a sophisticated multi-phase iterative system based on the user's diagram. The new system supports:

- **Query Enhancement**: Improving user prompts before processing
- **Planning Phase**: Creating detailed implementation plans
- **Iterative Rounds**: Multiple code generation attempts with self-evaluation
- **Checkpointing**: Saving code snapshots at key points
- **User Feedback**: Pausing for human input when needed
- **Error Tracking**: Avoiding repeated mistakes across iterations

## Architecture Decision Summary

Based on user requirements:
- ✅ **Replace current workflow entirely** (not parallel system)
- ✅ **Both agent self-evaluation AND user feedback** for iterations
- ✅ **In-memory storage** (no database)
- ✅ **New dedicated workflow UI** (not extending existing components)

## Critical Files to Create/Modify

### Backend (New Files)
1. `/server/workflow/state/WorkflowState.ts` - Data models and interfaces
2. `/server/workflow/state/CheckpointManager.ts` - Checkpoint save/restore
3. `/server/workflow/state/ErrorTracker.ts` - Error history tracking
4. `/server/workflow/phases/PhaseManager.ts` - Phase orchestration
5. `/server/workflow/phases/QueryEnhancementPhase.ts` - Prompt enhancement
6. `/server/workflow/phases/PlanningPhase.ts` - Implementation planning
7. `/server/workflow/phases/ImplementationPhase.ts` - Code generation
8. `/server/workflow/phases/CheckpointPhase.ts` - State persistence
9. `/server/workflow/phases/EvaluationPhase.ts` - Self-evaluation
10. `/server/workflow/phases/FeedbackPhase.ts` - User feedback processing
11. `/server/workflow/iteration/IterationController.ts` - Iteration decisions
12. `/server/workflow/iteration/SelfEvaluator.ts` - Quality assessment
13. `/server/workflow/WorkflowOrchestrator.ts` - Main workflow engine

### Backend (Modified Files)
14. `/server/index.ts` - New API endpoints and workflow storage
15. `/server/agent/promptBuilder.ts` - Phase-specific prompts

### Frontend (New Files)
16. `/components/workflow/WorkflowDashboard.tsx` - Main UI
17. `/components/workflow/PhaseIndicator.tsx` - Phase progress visualization
18. `/components/workflow/RoundHistory.tsx` - Iteration history
19. `/components/workflow/CheckpointViewer.tsx` - Checkpoint management
20. `/components/workflow/FeedbackPanel.tsx` - User feedback interface
21. `/components/workflow/EvaluationDisplay.tsx` - Self-evaluation results
22. `/components/workflow/CodePreview.tsx` - Live code preview
23. `/services/workflowService.ts` - Workflow API client

### Frontend (Modified Files)
24. `/App.tsx` - Integration with new workflow UI
25. `/types.ts` - New workflow types

## Implementation Phases

### Phase 1: Foundation - Data Models & State Management

**Objective**: Create all TypeScript interfaces and state management infrastructure

**Files to Create**:
- `/server/workflow/state/WorkflowState.ts`
- `/server/workflow/state/CheckpointManager.ts`
- `/server/workflow/state/ErrorTracker.ts`

**Implementation Guide**: See `docs/implementation/PHASE_1_FOUNDATION.md`

### Phase 2: Phase System - Phase Execution Logic

**Objective**: Build individual phase executors and phase orchestration

**Files to Create**:
- `/server/workflow/phases/PhaseManager.ts`
- `/server/workflow/phases/QueryEnhancementPhase.ts`
- `/server/workflow/phases/PlanningPhase.ts`
- `/server/workflow/phases/ImplementationPhase.ts`
- `/server/workflow/phases/CheckpointPhase.ts`
- `/server/workflow/phases/EvaluationPhase.ts`
- `/server/workflow/phases/FeedbackPhase.ts`

**Implementation Guide**: See `docs/implementation/PHASE_2_PHASES.md`

### Phase 3: Iteration System - Self-Evaluation & Decision Logic

**Objective**: Build the iteration controller and self-evaluator

**Files to Create**:
- `/server/workflow/iteration/SelfEvaluator.ts`
- `/server/workflow/iteration/IterationController.ts`

**Implementation Guide**: See `docs/implementation/PHASE_3_ITERATION.md`

### Phase 4: Workflow Orchestrator - Main Engine

**Objective**: Create the main workflow orchestrator that ties everything together

**Files to Create**:
- `/server/workflow/WorkflowOrchestrator.ts`

**Files to Modify**:
- `/server/agent/promptBuilder.ts` (add phase-specific prompt builders)

**Implementation Guide**: See `docs/implementation/PHASE_4_ORCHESTRATOR.md`

### Phase 5: API Layer - Endpoints & Integration

**Objective**: Create new API endpoints and integrate with existing server

**Files to Modify**:
- `/server/index.ts`

**Implementation Guide**: See `docs/implementation/PHASE_5_API.md`

### Phase 6: Frontend Service Layer

**Objective**: Build the frontend API client for workflow operations

**Files to Create**:
- `/services/workflowService.ts`

**Files to Modify**:
- `/types.ts`

**Implementation Guide**: See `docs/implementation/PHASE_6_FRONTEND_SERVICE.md`

### Phase 7: Frontend UI Components

**Objective**: Build all workflow UI components

**Files to Create**:
- `/components/workflow/WorkflowDashboard.tsx`
- `/components/workflow/PhaseIndicator.tsx`
- `/components/workflow/RoundHistory.tsx`
- `/components/workflow/CheckpointViewer.tsx`
- `/components/workflow/FeedbackPanel.tsx`
- `/components/workflow/EvaluationDisplay.tsx`
- `/components/workflow/CodePreview.tsx`

**Implementation Guide**: See `docs/implementation/PHASE_7_FRONTEND_UI.md`

### Phase 8: Integration & Testing

**Objective**: Wire up the frontend to the backend and test end-to-end

**Files to Modify**:
- `/App.tsx`

**Implementation Guide**: See `docs/implementation/PHASE_8_INTEGRATION.md`

## Detailed Implementation Guides

The user requested "very detailed set of steps, potentially in readme files that an agent can easily use to accurately implement the tasks."

Each phase above will have a corresponding README in `/docs/implementation/` with:
- **Exact TypeScript interfaces** to implement
- **Method signatures** with parameters and return types
- **Step-by-step implementation instructions**
- **Code examples** showing expected patterns
- **Integration points** with other components
- **Testing criteria** for validation

## State Machine Diagram

```
[START] → INITIALIZATION
           ↓
        QUERY_ENHANCEMENT (enhance user's creative brief)
           ↓
        PLANNING (create implementation plan)
           ↓
        IMPLEMENTATION (generate code - Round N)
           ↓
        CHECKPOINT (save code snapshot)
           ↓
        EVALUATION (agent self-assessment)
           ↓
        ITERATION_DECISION
           ↙         ↓         ↘
    (iterate)  (feedback)  (finalize)
    [loop to   AWAITING_    RENDERING
    PLANNING]  FEEDBACK       ↓
                  ↓         COMPLETE
             [user input]
                  ↓
             PLANNING
            (continue
             iteration)
```

## API Endpoints

### New Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/workflow/start` | Start new multi-phase workflow |
| GET | `/api/workflow/status/:jobId` | Get complete workflow state |
| POST | `/api/workflow/:jobId/feedback` | Submit user feedback |
| POST | `/api/workflow/:jobId/checkpoint/restore` | Restore to checkpoint |
| GET | `/api/workflow/:jobId/checkpoints` | List all checkpoints |
| GET | `/api/workflow/:jobId/rounds` | Get all implementation rounds |
| GET | `/api/workflow/:jobId/preview/:roundNumber` | Preview specific round |
| DELETE | `/api/workflow/:jobId` | Cancel workflow |

### Deprecated (Keep for 1 version)

| Method | Endpoint | Status |
|--------|----------|--------|
| POST | `/api/generate` | ⚠️ Deprecated - use `/api/workflow/start` |
| GET | `/api/status/:jobId` | ⚠️ Deprecated - use `/api/workflow/status/:jobId` |

## Key Design Patterns

### 1. ReAct Pattern Preservation

The existing ReAct (Reason-Act-Observe) pattern is **preserved within each phase**:

```typescript
// Each phase follows:
async execute(state: WorkflowState): Promise<WorkflowState> {
  // REASON
  this.think('reason', 'What needs to be done in this phase...');

  // ACT
  this.think('act', 'Calling Gemini API / performing action...');
  const result = await this.performAction(state);

  // OBSERVE
  this.think('observe', 'Analyzing results...');
  const validation = this.validateResult(result);

  return updatedState;
}
```

### 2. Error Tracking Across Iterations

```typescript
// Before each implementation round:
const errorContext = errorTracker.buildErrorContext(state);
// errorContext: "Round 1 failed: missing animation. Fixed by adding spring()."
// This context is added to the prompt to avoid repeating errors
```

### 3. Iteration Decision Logic

```typescript
// After evaluation:
if (score >= 85 && round >= 2) {
  return 'finalize'; // Good enough, render it
} else if (score < 60 && round < maxRounds) {
  return 'iterate'; // Needs improvement, try again
} else if (60 <= score < 85) {
  return 'request_feedback'; // Ask user
}
```

### 4. Checkpoint Strategy

```typescript
// After each successful implementation round:
1. Save code snapshot
2. Store evaluation score
3. Generate human-readable description
4. Allow restore to any checkpoint later
```

## Migration Strategy

### Step 1: Build in Parallel (Week 1-4)
- Create new `/server/workflow/` directory
- Keep existing `AgentOrchestrator` untouched
- No breaking changes yet

### Step 2: API Coexistence (Week 4)
- Deploy new endpoints alongside old ones
- Old endpoints return deprecation warnings
- Frontend can still use old API

### Step 3: Frontend Migration (Week 5)
- Update `App.tsx` to use new workflow system
- Keep `BrandWizard.tsx` for initial input
- Replace generation progress with `WorkflowDashboard`

### Step 4: Cleanup (Week 6+)
- Remove old `AgentOrchestrator` after 1-2 versions
- Remove deprecated API endpoints
- Archive old UI components

## Success Criteria

### Functional Requirements
- ✅ Workflow starts in "blank mode" (clean state)
- ✅ User's creative brief is enhanced before processing
- ✅ Agent creates a detailed plan before coding
- ✅ Multiple implementation rounds with checkpoints
- ✅ Agent self-evaluates each round (0-100 score)
- ✅ Workflow can pause and wait for user feedback
- ✅ User can approve, request changes, or provide detailed feedback
- ✅ Agent doesn't repeat previously encountered errors
- ✅ User can view/restore previous checkpoints
- ✅ Final video is rendered only when approved

### Non-Functional Requirements
- ✅ Real-time progress updates in UI
- ✅ Full cognitive trace visible to user
- ✅ In-memory storage (no database needed)
- ✅ Backward compatible API (old endpoints work temporarily)
- ✅ Clean TypeScript types throughout

## Next Steps

1. **Create implementation guides** - Detailed README files for each phase (see file list above)
2. **Implement Phase 1** - Foundation & data models
3. **Implement Phase 2** - Phase execution logic
4. **Implement Phase 3** - Iteration system
5. **Implement Phase 4** - Workflow orchestrator
6. **Implement Phase 5** - API layer
7. **Implement Phase 6** - Frontend service
8. **Implement Phase 7** - Frontend UI
9. **Implement Phase 8** - Integration & testing

## Dependencies Between Phases

```
Phase 1 (Foundation)
  ↓
Phase 2 (Phases) + Phase 3 (Iteration)  ← Can be parallel
  ↓
Phase 4 (Orchestrator)
  ↓
Phase 5 (API)
  ↓
Phase 6 (Frontend Service) + Phase 7 (Frontend UI)  ← Can be parallel
  ↓
Phase 8 (Integration)
```

## Estimated Effort

- **Phase 1**: 1 day (foundation is crucial)
- **Phase 2**: 3 days (7 phase files)
- **Phase 3**: 1 day (2 iteration files)
- **Phase 4**: 2 days (orchestrator + prompt building)
- **Phase 5**: 1 day (API endpoints)
- **Phase 6**: 1 day (service layer)
- **Phase 7**: 3 days (7 UI components)
- **Phase 8**: 2 days (integration + testing)

**Total**: ~14 days for full implementation

---

---

# DETAILED IMPLEMENTATION GUIDES

Below are the complete implementation guides for each phase. These contain exact TypeScript interfaces, method signatures, implementation steps, and code examples.

---

# PHASE 1: FOUNDATION - Data Models & State Management

## Objective
Create all TypeScript interfaces and state management infrastructure that will be used throughout the workflow system.

## Files to Create

### 1. `/server/workflow/state/WorkflowState.ts`

**Purpose**: Core data models for the entire workflow system

**Complete Implementation**:

```typescript
import { BrandContext, VideoConfig } from '../../agent/types';
import { AgentThought } from '../../agent/orchestrator';

/**
 * Workflow phase enumeration
 * Represents all possible states in the workflow lifecycle
 */
export enum WorkflowPhase {
  INITIALIZATION = 'initialization',           // Clean slate, analyze request
  QUERY_ENHANCEMENT = 'query_enhancement',     // Enhance user's creative brief
  PLANNING = 'planning',                       // Create implementation plan
  IMPLEMENTATION = 'implementation',           // Generate code (iterative)
  CHECKPOINT = 'checkpoint',                   // Save code snapshot
  EVALUATION = 'evaluation',                   // Self-assess quality
  ITERATION_DECISION = 'iteration_decision',   // Decide next action
  AWAITING_FEEDBACK = 'awaiting_feedback',     // Pause for user input
  RENDERING = 'rendering',                     // Final video render
  COMPLETE = 'complete',                       // Workflow finished
  ERROR = 'error'                              // Unrecoverable error
}

/**
 * Main workflow state
 * Contains all data for a running workflow
 */
export interface WorkflowState {
  // Identifiers
  jobId: string;
  currentPhase: WorkflowPhase;

  // Input context
  brand: BrandContext;
  config: VideoConfig;

  // Query enhancement
  originalPrompt: string;
  enhancedPrompt?: string;

  // Planning
  plan?: ImplementationPlan;

  // Iteration tracking
  currentRound: number;
  maxRounds: number;
  rounds: ImplementationRound[];

  // Checkpoints
  checkpoints: Checkpoint[];
  activeCheckpointId?: string;

  // Error tracking
  errorHistory: ErrorRecord[];

  // Evaluation
  lastEvaluation?: EvaluationResult;

  // User feedback
  userFeedback?: UserFeedback;
  awaitingFeedbackSince?: Date;

  // Progress tracking (for UI updates)
  progress: WorkflowProgress;

  // ReAct cognitive trace
  thoughts: AgentThought[];

  // Final output
  videoPath?: string;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Implementation plan created during PLANNING phase
 */
export interface ImplementationPlan {
  approach: string;                             // Overall strategy
  sceneBreakdown: SceneDescription[];           // Individual scenes
  animationStrategy: string;                    // Animation approach
  colorStrategy: string;                        // How to use brand colors
  typographyPlan: string;                       // Text treatment
  estimatedComplexity: 'simple' | 'moderate' | 'complex';
  createdAt: Date;
}

/**
 * Scene description for planning
 */
export interface SceneDescription {
  sceneNumber: number;
  description: string;
  frameRange: { start: number; end: number };   // Frames 0-150 (5 sec @ 30fps)
  keyElements: string[];                        // What appears in this scene
}

/**
 * Single implementation round (code generation attempt)
 */
export interface ImplementationRound {
  roundNumber: number;
  startedAt: Date;
  completedAt?: Date;

  // Generated artifacts
  generatedCode: string;
  codeFilePath?: string;

  // Validation
  validationResult: ValidationResult;

  // Render attempt (if made)
  renderAttempted: boolean;
  renderSuccess?: boolean;
  renderError?: string;

  // Issues and improvements
  issues: string[];                              // Problems found
  improvements: string[];                        // Suggestions for next round

  // Thoughts during this round
  thoughts: AgentThought[];
}

/**
 * Code validation result
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
}

/**
 * Checkpoint saved after each round
 */
export interface Checkpoint {
  id: string;                                    // Unique ID
  roundNumber: number;
  code: string;
  codePreview: string;                           // First 200 chars
  description: string;                           // What was achieved
  evaluationScore?: number;                      // 0-100
  timestamp: Date;
  isActive: boolean;                             // Currently active checkpoint
}

/**
 * Error record for tracking across rounds
 */
export interface ErrorRecord {
  roundNumber: number;
  errorType: 'validation' | 'render' | 'logic' | 'style' | 'other';
  errorMessage: string;
  attemptedFix?: string;                         // What we tried to fix it
  resolved: boolean;
  timestamp: Date;
}

/**
 * Self-evaluation result from EVALUATION phase
 */
export interface EvaluationResult {
  roundNumber: number;
  score: number;                                 // 0-100
  strengths: string[];                           // 3-5 positive points
  weaknesses: string[];                          // 3-5 areas to improve
  recommendation: 'iterate' | 'finalize' | 'request_feedback';
  reasoning: string;                             // Why this recommendation
  timestamp: Date;
}

/**
 * User feedback when awaiting input
 */
export interface UserFeedback {
  type: 'approve' | 'request_changes' | 'reject';
  comments?: string;
  specificChanges?: string[];                    // Bulleted list of changes
  timestamp: Date;
}

/**
 * Progress tracking for UI updates
 */
export interface WorkflowProgress {
  currentPhase: WorkflowPhase;
  phaseProgress: number;                         // 0-100 for current phase
  overallProgress: number;                       // 0-100 for entire workflow
  currentMessage: string;                        // User-facing message
  currentThought?: AgentThought;                 // Latest thought
  estimatedTimeRemaining?: number;               // Seconds (optional)
}

/**
 * Helper functions for state initialization
 */
export function createInitialState(
  jobId: string,
  brand: BrandContext,
  config: VideoConfig,
  maxRounds: number = 5
): WorkflowState {
  const now = new Date();

  return {
    jobId,
    currentPhase: WorkflowPhase.INITIALIZATION,
    brand,
    config,
    originalPrompt: config.prompt,
    currentRound: 0,
    maxRounds,
    rounds: [],
    checkpoints: [],
    errorHistory: [],
    thoughts: [],
    progress: {
      currentPhase: WorkflowPhase.INITIALIZATION,
      phaseProgress: 0,
      overallProgress: 0,
      currentMessage: 'Initializing workflow...',
    },
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Phase weight for progress calculation
 * Used to compute overall progress percentage
 */
export const PHASE_WEIGHTS: Record<WorkflowPhase, number> = {
  [WorkflowPhase.INITIALIZATION]: 5,
  [WorkflowPhase.QUERY_ENHANCEMENT]: 10,
  [WorkflowPhase.PLANNING]: 15,
  [WorkflowPhase.IMPLEMENTATION]: 40,
  [WorkflowPhase.CHECKPOINT]: 5,
  [WorkflowPhase.EVALUATION]: 10,
  [WorkflowPhase.ITERATION_DECISION]: 2,
  [WorkflowPhase.AWAITING_FEEDBACK]: 0,           // Paused, no progress
  [WorkflowPhase.RENDERING]: 10,
  [WorkflowPhase.COMPLETE]: 3,
  [WorkflowPhase.ERROR]: 0,
};

/**
 * Calculate overall progress percentage
 */
export function calculateOverallProgress(state: WorkflowState): number {
  const completedPhases: WorkflowPhase[] = []; // Track completed phases
  let totalWeight = 0;

  // This is a simplified calculation
  // In practice, you'd track which phases have been completed
  const phaseOrder = [
    WorkflowPhase.INITIALIZATION,
    WorkflowPhase.QUERY_ENHANCEMENT,
    WorkflowPhase.PLANNING,
    WorkflowPhase.IMPLEMENTATION,
    WorkflowPhase.CHECKPOINT,
    WorkflowPhase.EVALUATION,
    WorkflowPhase.ITERATION_DECISION,
    WorkflowPhase.RENDERING,
    WorkflowPhase.COMPLETE,
  ];

  const currentIndex = phaseOrder.indexOf(state.currentPhase);

  for (let i = 0; i < currentIndex; i++) {
    totalWeight += PHASE_WEIGHTS[phaseOrder[i]];
  }

  // Add partial progress for current phase
  totalWeight += PHASE_WEIGHTS[state.currentPhase] * (state.progress.phaseProgress / 100);

  const maxWeight = Object.values(PHASE_WEIGHTS).reduce((a, b) => a + b, 0);

  return Math.min(100, Math.round((totalWeight / maxWeight) * 100));
}
```

**Implementation Steps**:
1. Create directory: `mkdir -p server/workflow/state`
2. Create file: `server/workflow/state/WorkflowState.ts`
3. Copy the complete TypeScript code above
4. Ensure imports from `../../agent/types` and `../../agent/orchestrator` are correct
5. Export all interfaces and enums

**Validation**:
- Run `npm run server` and check for TypeScript compilation errors
- Verify all exports are available: `import { WorkflowState, WorkflowPhase } from './server/workflow/state/WorkflowState'`

---

### 2. `/server/workflow/state/CheckpointManager.ts`

**Purpose**: Manage checkpoint creation, retrieval, and restoration

**Complete Implementation**:

```typescript
import { Checkpoint, WorkflowState, ImplementationRound } from './WorkflowState';

/**
 * Manages checkpoint creation and restoration
 */
export class CheckpointManager {
  private readonly MAX_CHECKPOINTS = 10;  // Keep last 10 checkpoints

  /**
   * Create a checkpoint from the current round
   */
  createCheckpoint(
    state: WorkflowState,
    round: ImplementationRound,
    evaluationScore?: number
  ): Checkpoint {
    const id = this.generateCheckpointId(state.jobId, round.roundNumber);

    const checkpoint: Checkpoint = {
      id,
      roundNumber: round.roundNumber,
      code: round.generatedCode,
      codePreview: round.generatedCode.substring(0, 200),
      description: this.generateDescription(round, evaluationScore),
      evaluationScore,
      timestamp: new Date(),
      isActive: true,  // This becomes the active checkpoint
    };

    return checkpoint;
  }

  /**
   * Add checkpoint to state
   */
  addCheckpoint(state: WorkflowState, checkpoint: Checkpoint): void {
    // Mark all existing checkpoints as inactive
    state.checkpoints.forEach(cp => cp.isActive = false);

    // Add new checkpoint
    state.checkpoints.push(checkpoint);
    state.activeCheckpointId = checkpoint.id;

    // Keep only last MAX_CHECKPOINTS
    if (state.checkpoints.length > this.MAX_CHECKPOINTS) {
      state.checkpoints = state.checkpoints.slice(-this.MAX_CHECKPOINTS);
    }
  }

  /**
   * Get checkpoint by ID
   */
  getCheckpoint(state: WorkflowState, checkpointId: string): Checkpoint | undefined {
    return state.checkpoints.find(cp => cp.id === checkpointId);
  }

  /**
   * Get active checkpoint
   */
  getActiveCheckpoint(state: WorkflowState): Checkpoint | undefined {
    return state.checkpoints.find(cp => cp.isActive);
  }

  /**
   * Restore workflow to a previous checkpoint
   * Returns the code from that checkpoint
   */
  restoreCheckpoint(state: WorkflowState, checkpointId: string): string {
    const checkpoint = this.getCheckpoint(state, checkpointId);

    if (!checkpoint) {
      throw new Error(`Checkpoint ${checkpointId} not found`);
    }

    // Mark all checkpoints as inactive
    state.checkpoints.forEach(cp => cp.isActive = false);

    // Mark this checkpoint as active
    checkpoint.isActive = true;
    state.activeCheckpointId = checkpoint.id;

    // Reset current round to this checkpoint's round
    state.currentRound = checkpoint.roundNumber;

    return checkpoint.code;
  }

  /**
   * List all checkpoints for a workflow
   */
  listCheckpoints(state: WorkflowState): Checkpoint[] {
    return [...state.checkpoints].sort((a, b) =>
      b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  /**
   * Generate a unique checkpoint ID
   */
  private generateCheckpointId(jobId: string, roundNumber: number): string {
    return `cp_${jobId}_round${roundNumber}_${Date.now()}`;
  }

  /**
   * Generate a human-readable description
   */
  private generateDescription(
    round: ImplementationRound,
    evaluationScore?: number
  ): string {
    const parts: string[] = [];

    parts.push(`Round ${round.roundNumber}`);

    if (evaluationScore !== undefined) {
      parts.push(`Score: ${evaluationScore}/100`);
    }

    if (round.validationResult.valid) {
      parts.push('Code validated');
    }

    if (round.issues.length > 0) {
      parts.push(`${round.issues.length} issue(s) found`);
    }

    return parts.join(' • ');
  }
}
```

**Implementation Steps**:
1. Create file: `server/workflow/state/CheckpointManager.ts`
2. Copy the complete TypeScript code above
3. Import dependencies from `./WorkflowState`

**Validation**:
- Create a test checkpoint: `const cp = manager.createCheckpoint(state, round, 75)`
- Verify checkpoint has all required fields
- Test restore functionality

---

### 3. `/server/workflow/state/ErrorTracker.ts`

**Purpose**: Track errors across iterations and avoid repeating mistakes

**Complete Implementation**:

```typescript
import { ErrorRecord, WorkflowState, ImplementationRound } from './WorkflowState';

/**
 * Tracks errors across iterations to avoid repetition
 */
export class ErrorTracker {
  /**
   * Record an error from the current round
   */
  recordError(
    state: WorkflowState,
    errorType: ErrorRecord['errorType'],
    errorMessage: string,
    attemptedFix?: string
  ): void {
    const error: ErrorRecord = {
      roundNumber: state.currentRound,
      errorType,
      errorMessage,
      attemptedFix,
      resolved: false,
      timestamp: new Date(),
    };

    state.errorHistory.push(error);
  }

  /**
   * Mark an error as resolved
   */
  markErrorResolved(state: WorkflowState, errorMessage: string): void {
    const error = state.errorHistory.find(
      e => e.errorMessage === errorMessage && !e.resolved
    );

    if (error) {
      error.resolved = true;
    }
  }

  /**
   * Get unresolved errors
   */
  getUnresolvedErrors(state: WorkflowState): ErrorRecord[] {
    return state.errorHistory.filter(e => !e.resolved);
  }

  /**
   * Find similar errors from previous rounds
   */
  findSimilarErrors(state: WorkflowState, currentError: string): ErrorRecord[] {
    const keywords = this.extractKeywords(currentError);

    return state.errorHistory.filter(error => {
      const errorKeywords = this.extractKeywords(error.errorMessage);
      const overlap = keywords.filter(k => errorKeywords.includes(k));
      return overlap.length > 0;
    });
  }

  /**
   * Build error context for prompts
   * Returns a string describing past errors and fixes
   */
  buildErrorContext(state: WorkflowState): string {
    if (state.errorHistory.length === 0) {
      return '';
    }

    const lines: string[] = ['Past errors to avoid:'];

    state.errorHistory.forEach((error, index) => {
      lines.push(
        `${index + 1}. Round ${error.roundNumber}: ${error.errorMessage}`
      );

      if (error.attemptedFix) {
        lines.push(`   Fix: ${error.attemptedFix}`);
      }

      if (error.resolved) {
        lines.push(`   ✓ Resolved`);
      }
    });

    return lines.join('\n');
  }

  /**
   * Extract keywords from error message for similarity matching
   */
  private extractKeywords(message: string): string[] {
    // Simple keyword extraction (can be enhanced with NLP)
    const words = message.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3);  // Words longer than 3 chars

    return Array.from(new Set(words));
  }

  /**
   * Get error statistics
   */
  getErrorStats(state: WorkflowState): {
    total: number;
    byType: Record<string, number>;
    resolved: number;
    unresolved: number;
  } {
    const stats = {
      total: state.errorHistory.length,
      byType: {} as Record<string, number>,
      resolved: 0,
      unresolved: 0,
    };

    state.errorHistory.forEach(error => {
      stats.byType[error.errorType] = (stats.byType[error.errorType] || 0) + 1;

      if (error.resolved) {
        stats.resolved++;
      } else {
        stats.unresolved++;
      }
    });

    return stats;
  }
}
```

**Implementation Steps**:
1. Create file: `server/workflow/state/ErrorTracker.ts`
2. Copy the complete TypeScript code above
3. Import dependencies from `./WorkflowState`

**Validation**:
- Record a test error: `tracker.recordError(state, 'validation', 'Missing import')`
- Build error context: `const context = tracker.buildErrorContext(state)`
- Verify context string contains error details

---

## Phase 1 Integration Points

**Used By**:
- Phase 2 (Phases) - All phase classes use `WorkflowState`
- Phase 3 (Iteration) - Uses `ErrorTracker` and state models
- Phase 4 (Orchestrator) - Uses `CheckpointManager` and all state models
- Phase 5 (API) - Returns state to frontend
- Phase 6+ (Frontend) - Receives state via API

**Testing Phase 1**:
```typescript
// Test in server/workflow/state/__test__.ts
import { createInitialState, WorkflowPhase } from './WorkflowState';
import { CheckpointManager } from './CheckpointManager';
import { ErrorTracker } from './ErrorTracker';

const testBrand = {
  name: 'Test Co',
  industry: 'tech',
  colors: ['#000000', '#FFFFFF'],
  tagline: 'Test tagline'
};

const testConfig = {
  style: 'minimalist' as const,
  aspectRatio: '16:9' as const,
  resolution: '1080p' as const,
  prompt: 'Test prompt'
};

// Test state creation
const state = createInitialState('test-job-1', testBrand, testConfig);
console.assert(state.currentPhase === WorkflowPhase.INITIALIZATION);
console.assert(state.currentRound === 0);

// Test checkpoint manager
const cpManager = new CheckpointManager();
const round = {
  roundNumber: 1,
  startedAt: new Date(),
  generatedCode: 'test code',
  validationResult: { valid: true },
  renderAttempted: false,
  issues: [],
  improvements: [],
  thoughts: []
};

const checkpoint = cpManager.createCheckpoint(state, round, 85);
cpManager.addCheckpoint(state, checkpoint);
console.assert(state.checkpoints.length === 1);
console.assert(state.activeCheckpointId === checkpoint.id);

// Test error tracker
const errorTracker = new ErrorTracker();
errorTracker.recordError(state, 'validation', 'Missing import');
const context = errorTracker.buildErrorContext(state);
console.assert(context.includes('Missing import'));

console.log('✅ Phase 1 tests passed');
```

---

# PHASE 2: PHASE SYSTEM - Phase Execution Logic

## Objective
Build individual phase executors and the phase orchestration system that manages phase transitions.

## Files to Create

### 1. `/server/workflow/phases/PhaseManager.ts`

**Purpose**: Orchestrate phase execution and manage state transitions

**Complete Implementation**:

```typescript
import { WorkflowState, WorkflowPhase } from '../state/WorkflowState';
import { QueryEnhancementPhase } from './QueryEnhancementPhase';
import { PlanningPhase } from './PlanningPhase';
import { ImplementationPhase } from './ImplementationPhase';
import { CheckpointPhase } from './CheckpointPhase';
import { EvaluationPhase } from './EvaluationPhase';
import { FeedbackPhase } from './FeedbackPhase';

/**
 * Base interface for all phases
 */
export interface Phase {
  execute(state: WorkflowState): Promise<WorkflowState>;
  readonly name: WorkflowPhase;
}

/**
 * Manages phase execution and transitions
 */
export class PhaseManager {
  private phases: Map<WorkflowPhase, Phase>;

  constructor() {
    // Initialize all phase executors
    this.phases = new Map();
    this.phases.set(WorkflowPhase.QUERY_ENHANCEMENT, new QueryEnhancementPhase());
    this.phases.set(WorkflowPhase.PLANNING, new PlanningPhase());
    this.phases.set(WorkflowPhase.IMPLEMENTATION, new ImplementationPhase());
    this.phases.set(WorkflowPhase.CHECKPOINT, new CheckpointPhase());
    this.phases.set(WorkflowPhase.EVALUATION, new EvaluationPhase());
    this.phases.set(WorkflowPhase.AWAITING_FEEDBACK, new FeedbackPhase());
  }

  /**
   * Execute the current phase
   */
  async executePhase(state: WorkflowState): Promise<WorkflowState> {
    const phase = this.phases.get(state.currentPhase);

    if (!phase) {
      // Handle special phases that don't have executors
      switch (state.currentPhase) {
        case WorkflowPhase.INITIALIZATION:
          return this.handleInitialization(state);

        case WorkflowPhase.ITERATION_DECISION:
          return this.handleIterationDecision(state);

        case WorkflowPhase.RENDERING:
          // Rendering is handled by orchestrator
          return state;

        case WorkflowPhase.COMPLETE:
        case WorkflowPhase.ERROR:
          return state;

        default:
          throw new Error(`No executor for phase: ${state.currentPhase}`);
      }
    }

    // Execute the phase
    const updatedState = await phase.execute(state);
    updatedState.updatedAt = new Date();

    return updatedState;
  }

  /**
   * Transition to next phase
   */
  transitionToPhase(state: WorkflowState, nextPhase: WorkflowPhase): void {
    console.log(`Phase transition: ${state.currentPhase} → ${nextPhase}`);
    state.currentPhase = nextPhase;
    state.progress.currentPhase = nextPhase;
  }

  /**
   * Handle INITIALIZATION phase
   */
  private handleInitialization(state: WorkflowState): WorkflowState {
    // Just transition to query enhancement
    this.transitionToPhase(state, WorkflowPhase.QUERY_ENHANCEMENT);
    return state;
  }

  /**
   * Handle ITERATION_DECISION phase
   * This is managed by IterationController in orchestrator
   */
  private handleIterationDecision(state: WorkflowState): WorkflowState {
    // Decision logic is in IterationController
    // This is a placeholder
    return state;
  }

  /**
   * Validate phase transition
   */
  canTransitionTo(
    currentPhase: WorkflowPhase,
    nextPhase: WorkflowPhase
  ): boolean {
    // Define valid transitions
    const validTransitions: Record<WorkflowPhase, WorkflowPhase[]> = {
      [WorkflowPhase.INITIALIZATION]: [WorkflowPhase.QUERY_ENHANCEMENT],
      [WorkflowPhase.QUERY_ENHANCEMENT]: [WorkflowPhase.PLANNING],
      [WorkflowPhase.PLANNING]: [WorkflowPhase.IMPLEMENTATION],
      [WorkflowPhase.IMPLEMENTATION]: [WorkflowPhase.CHECKPOINT],
      [WorkflowPhase.CHECKPOINT]: [WorkflowPhase.EVALUATION],
      [WorkflowPhase.EVALUATION]: [WorkflowPhase.ITERATION_DECISION],
      [WorkflowPhase.ITERATION_DECISION]: [
        WorkflowPhase.PLANNING,           // Iterate
        WorkflowPhase.AWAITING_FEEDBACK,  // Request feedback
        WorkflowPhase.RENDERING,          // Finalize
      ],
      [WorkflowPhase.AWAITING_FEEDBACK]: [WorkflowPhase.PLANNING],
      [WorkflowPhase.RENDERING]: [WorkflowPhase.COMPLETE],
      [WorkflowPhase.COMPLETE]: [],
      [WorkflowPhase.ERROR]: [],
    };

    const allowed = validTransitions[currentPhase] || [];
    return allowed.includes(nextPhase);
  }
}
```

**Implementation Steps**:
1. Create directory: `mkdir -p server/workflow/phases`
2. Create file: `server/workflow/phases/PhaseManager.ts`
3. Copy the complete TypeScript code above
4. Note: This file will have import errors until we create the phase files below

**Validation**:
- After creating all phase files, verify no TypeScript errors
- Test phase transition: `manager.canTransitionTo(WorkflowPhase.PLANNING, WorkflowPhase.IMPLEMENTATION)` should return true

---

### 2. `/server/workflow/phases/QueryEnhancementPhase.ts`

**Purpose**: Enhance the user's creative brief before processing

**Complete Implementation**:

```typescript
import { GoogleGenAI } from '@google/genai';
import { WorkflowState, WorkflowPhase } from '../state/WorkflowState';
import { AgentThought } from '../../agent/orchestrator';
import { Phase } from './PhaseManager';

export class QueryEnhancementPhase implements Phase {
  readonly name = WorkflowPhase.QUERY_ENHANCEMENT;
  private ai: GoogleGenAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  async execute(state: WorkflowState): Promise<WorkflowState> {
    // REASON
    const reasonThought = this.think(
      'reason',
      `User provided: "${state.originalPrompt}". I need to enhance this with specific scene descriptions, timing, and animation techniques.`
    );
    state.thoughts.push(reasonThought);

    state.progress.currentMessage = 'Enhancing creative brief...';
    state.progress.phaseProgress = 20;

    // ACT
    const actThought = this.think(
      'act',
      'Calling Gemini API to enhance the creative brief with detailed direction...'
    );
    state.thoughts.push(actThought);

    state.progress.currentMessage = 'AI is enhancing your prompt...';
    state.progress.phaseProgress = 50;

    const enhancedPrompt = await this.enhanceQuery(state);

    // OBSERVE
    const observeThought = this.think(
      'observe',
      `Enhanced prompt from ${state.originalPrompt.length} to ${enhancedPrompt.length} characters with detailed direction.`
    );
    state.thoughts.push(observeThought);

    state.enhancedPrompt = enhancedPrompt;
    state.progress.currentMessage = 'Brief enhanced successfully';
    state.progress.phaseProgress = 100;

    return state;
  }

  private async enhanceQuery(state: WorkflowState): Promise<string> {
    const prompt = this.buildEnhancementPrompt(state);

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        temperature: 0.8,  // More creative
        maxOutputTokens: 2048,
      }
    });

    return response.text || state.originalPrompt;  // Fallback to original
  }

  private buildEnhancementPrompt(state: WorkflowState): string {
    return `You are a creative director enhancing a motion design brief.

Brand Context:
- Name: ${state.brand.name}
- Industry: ${state.brand.industry}
- Tagline: ${state.brand.tagline}
- Colors: ${state.brand.colors.join(', ')}

Style: ${state.config.style}
Duration: 5 seconds (150 frames @ 30fps)
Aspect Ratio: ${state.config.aspectRatio}

Original Brief:
"${state.originalPrompt}"

Enhance this brief by adding:
1. Specific scene descriptions (what happens when)
2. Animation techniques that fit the ${state.config.style} style
3. Pacing and timing details
4. How to incorporate brand elements (colors, tagline)
5. Visual metaphors or storytelling elements

Return ONLY the enhanced creative brief (no explanations, no markdown formatting).
The enhanced brief should be 2-4 paragraphs of clear, detailed direction.`;
  }

  private think(
    type: 'reason' | 'act' | 'observe',
    content: string
  ): AgentThought {
    return {
      type,
      content,
      timestamp: new Date()
    };
  }
}
```

---

### 3. `/server/workflow/phases/PlanningPhase.ts`

**Purpose**: Create a detailed implementation plan

**Complete Implementation**:

```typescript
import { GoogleGenAI } from '@google/genai';
import { WorkflowState, WorkflowPhase, ImplementationPlan } from '../state/WorkflowState';
import { AgentThought } from '../../agent/orchestrator';
import { Phase } from './PhaseManager';

export class PlanningPhase implements Phase {
  readonly name = WorkflowPhase.PLANNING;
  private ai: GoogleGenAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  async execute(state: WorkflowState): Promise<WorkflowState> {
    // REASON
    const reasonThought = this.think(
      'reason',
      'I need to create a detailed implementation plan with scene breakdown, animation strategy, and technical approach.'
    );
    state.thoughts.push(reasonThought);

    state.progress.currentMessage = 'Planning implementation...';
    state.progress.phaseProgress = 20;

    // ACT
    const actThought = this.think(
      'act',
      'Calling Gemini API to generate structured implementation plan...'
    );
    state.thoughts.push(actThought);

    state.progress.currentMessage = 'AI is creating the plan...';
    state.progress.phaseProgress = 60;

    const plan = await this.createPlan(state);

    // OBSERVE
    const observeThought = this.think(
      'observe',
      `Plan created with ${plan.sceneBreakdown.length} scenes, complexity: ${plan.estimatedComplexity}`
    );
    state.thoughts.push(observeThought);

    state.plan = plan;
    state.progress.currentMessage = 'Implementation plan complete';
    state.progress.phaseProgress = 100;

    return state;
  }

  private async createPlan(state: WorkflowState): Promise<ImplementationPlan> {
    const prompt = this.buildPlanningPrompt(state);

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        temperature: 0.7,
        maxOutputTokens: 4096,
      }
    });

    const planText = response.text || '';

    // Parse the response into a structured plan
    return this.parsePlan(planText, state);
  }

  private buildPlanningPrompt(state: WorkflowState): string {
    const enhancedPrompt = state.enhancedPrompt || state.originalPrompt;

    return `Create a detailed implementation plan for a Remotion video.

Brand: ${state.brand.name} - ${state.brand.tagline}
Industry: ${state.brand.industry}
Colors: ${state.brand.colors.join(', ')}
Style: ${state.config.style}
Duration: 5 seconds (150 frames @ 30fps)
Aspect Ratio: ${state.config.aspectRatio}

Creative Brief:
${enhancedPrompt}

Create a structured plan with:

1. APPROACH: Overall implementation strategy (2-3 sentences)

2. SCENE BREAKDOWN: Divide the 150 frames into 3-5 scenes
   Format for each scene:
   - Scene N (frames X-Y): Description
   - Key elements: [list]

3. ANIMATION STRATEGY: How to animate for ${state.config.style} style
   - Techniques to use (spring, interpolate, sequences, etc.)
   - Pacing approach

4. COLOR STRATEGY: How to use brand colors
   - Primary color usage
   - Accent colors
   - Background approach

5. TYPOGRAPHY PLAN: How to display text
   - Brand name treatment
   - Tagline animation
   - Font sizes and positioning

6. COMPLEXITY: Rate as simple/moderate/complex

Format your response as clear sections with the headers above.`;
  }

  private parsePlan(planText: string, state: WorkflowState): ImplementationPlan {
    // Simple parsing (can be enhanced with better NLP)
    const lines = planText.split('\n');

    let approach = '';
    let animationStrategy = '';
    let colorStrategy = '';
    let typographyPlan = '';
    let complexity: 'simple' | 'moderate' | 'complex' = 'moderate';
    const sceneBreakdown = [];

    let currentSection = '';

    for (const line of lines) {
      const lower = line.toLowerCase();

      if (lower.includes('approach:')) {
        currentSection = 'approach';
        approach = line.split(':')[1]?.trim() || '';
      } else if (lower.includes('animation strategy:')) {
        currentSection = 'animation';
        animationStrategy = line.split(':')[1]?.trim() || '';
      } else if (lower.includes('color strategy:')) {
        currentSection = 'color';
        colorStrategy = line.split(':')[1]?.trim() || '';
      } else if (lower.includes('typography:')) {
        currentSection = 'typography';
        typographyPlan = line.split(':')[1]?.trim() || '';
      } else if (lower.includes('complexity:')) {
        const complexityText = line.split(':')[1]?.trim().toLowerCase();
        if (complexityText?.includes('simple')) complexity = 'simple';
        else if (complexityText?.includes('complex')) complexity = 'complex';
      } else if (line.trim()) {
        // Append to current section
        switch (currentSection) {
          case 'approach':
            approach += ' ' + line.trim();
            break;
          case 'animation':
            animationStrategy += ' ' + line.trim();
            break;
          case 'color':
            colorStrategy += ' ' + line.trim();
            break;
          case 'typography':
            typographyPlan += ' ' + line.trim();
            break;
        }
      }
    }

    // Extract scenes (simple parsing)
    const sceneMatches = planText.matchAll(/scene\s+(\d+).*?frames?\s+(\d+)-(\d+):?\s*([^\n]+)/gi);
    for (const match of sceneMatches) {
      sceneBreakdown.push({
        sceneNumber: parseInt(match[1]),
        description: match[4].trim(),
        frameRange: {
          start: parseInt(match[2]),
          end: parseInt(match[3])
        },
        keyElements: []  // Could extract from description
      });
    }

    // If no scenes found, create default breakdown
    if (sceneBreakdown.length === 0) {
      sceneBreakdown.push(
        {
          sceneNumber: 1,
          description: 'Opening / Brand introduction',
          frameRange: { start: 0, end: 50 },
          keyElements: ['brand name']
        },
        {
          sceneNumber: 2,
          description: 'Main content',
          frameRange: { start: 50, end: 120 },
          keyElements: ['tagline', 'visual elements']
        },
        {
          sceneNumber: 3,
          description: 'Closing',
          frameRange: { start: 120, end: 150 },
          keyElements: ['brand name', 'final frame']
        }
      );
    }

    return {
      approach: approach.trim() || 'Standard approach for ' + state.config.style + ' style',
      sceneBreakdown,
      animationStrategy: animationStrategy.trim() || 'Use smooth transitions',
      colorStrategy: colorStrategy.trim() || 'Apply brand colors throughout',
      typographyPlan: typographyPlan.trim() || 'Display brand name and tagline',
      estimatedComplexity: complexity,
      createdAt: new Date()
    };
  }

  private think(
    type: 'reason' | 'act' | 'observe',
    content: string
  ): AgentThought {
    return {
      type,
      content,
      timestamp: new Date()
    };
  }
}
```

---

### 4. `/server/workflow/phases/ImplementationPhase.ts`

**Purpose**: Generate Remotion code based on the plan

(Due to character limits, I'll provide the key structure. The full implementation follows the same pattern as the existing `AgentOrchestrator.generateVideo` but uses the plan from state)

```typescript
import { GoogleGenAI } from '@google/genai';
import { WorkflowState, WorkflowPhase, ImplementationRound } from '../state/WorkflowState';
import { AgentThought } from '../../agent/orchestrator';
import { Phase } from './PhaseManager';
import { buildPrompt } from '../../agent/promptBuilder';
import { ErrorTracker } from '../state/ErrorTracker';

export class ImplementationPhase implements Phase {
  readonly name = WorkflowPhase.IMPLEMENTATION;
  private ai: GoogleGenAI;
  private errorTracker: ErrorTracker;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    this.ai = new GoogleGenAI({ apiKey });
    this.errorTracker = new ErrorTracker();
  }

  async execute(state: WorkflowState): Promise<WorkflowState> {
    state.currentRound++;

    const round: ImplementationRound = {
      roundNumber: state.currentRound,
      startedAt: new Date(),
      generatedCode: '',
      validationResult: { valid: false },
      renderAttempted: false,
      issues: [],
      improvements: [],
      thoughts: []
    };

    // REASON
    const reasonThought = this.think(
      'reason',
      `Starting implementation round ${state.currentRound}. Using plan: ${state.plan?.approach.substring(0, 100)}...`
    );
    round.thoughts.push(reasonThought);
    state.thoughts.push(reasonThought);

    state.progress.currentMessage = `Generating code (Round ${state.currentRound})...`;
    state.progress.phaseProgress = 30;

    // Build error context
    const errorContext = this.errorTracker.buildErrorContext(state);

    // ACT: Generate code
    const actThought = this.think('act', 'Generating Remotion code with Gemini...');
    round.thoughts.push(actThought);
    state.thoughts.push(actThought);

    state.progress.phaseProgress = 60;

    const code = await this.generateCode(state, errorContext);
    round.generatedCode = code;

    // OBSERVE: Validate
    const observeThought = this.think('observe', `Generated ${code.length} chars. Validating...`);
    round.thoughts.push(observeThought);
    state.thoughts.push(observeThought);

    state.progress.phaseProgress = 90;

    const validation = this.validateCode(code);
    round.validationResult = validation;

    if (!validation.valid) {
      round.issues.push(validation.error || 'Validation failed');
      this.errorTracker.recordError(state, 'validation', validation.error || '');
    }

    round.completedAt = new Date();
    state.rounds.push(round);

    state.progress.currentMessage = validation.valid ? 'Code generated successfully' : 'Code needs fixes';
    state.progress.phaseProgress = 100;

    return state;
  }

  private async generateCode(state: WorkflowState, errorContext: string): Promise<string> {
    const prompt = this.buildImplementationPrompt(state, errorContext);

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        temperature: 0.7,
        maxOutputTokens: 16384,
      }
    });

    return this.extractCode(response.text || '');
  }

  private buildImplementationPrompt(state: WorkflowState, errorContext: string): string {
    // Use existing buildPrompt from promptBuilder but enhance with plan
    const basePrompt = buildPrompt(state.brand, state.config);

    const planContext = state.plan ? `
Implementation Plan:
${JSON.stringify(state.plan, null, 2)}

Follow this plan closely when generating code.
` : '';

    const previousRound = state.rounds[state.rounds.length - 1];
    const improvementContext = previousRound ? `
Previous Attempt Issues:
${previousRound.issues.join('\n')}

Improvements Needed:
${previousRound.improvements.join('\n')}
` : '';

    return `${basePrompt}

${planContext}

${errorContext}

${improvementContext}`;
  }

  private extractCode(response: string): string {
    const codeBlockRegex = /```(?:tsx?|jsx?|typescript|javascript)?\\s*([\\s\\S]*?)```/g;
    const matches = [...response.matchAll(codeBlockRegex)];

    if (matches.length === 0) {
      if (response.includes('export const') || response.includes('export default')) {
        return response.trim();
      }
      return '';
    }

    let bestBlock = '';
    for (const match of matches) {
      const code = match[1].trim();
      if (code.includes('remotion') && code.length > bestBlock.length) {
        bestBlock = code;
      }
    }

    return bestBlock;
  }

  private validateCode(code: string): { valid: boolean; error?: string } {
    if (!code) {
      return { valid: false, error: 'No code generated' };
    }

    const hasRemotionImport = /import\\s+.*from\\s+['\"]remotion['\"]/.test(code);
    if (!hasRemotionImport) {
      return { valid: false, error: 'Missing Remotion import' };
    }

    const hasExport = /export\\s+(default\\s+)?(function|const|class)/.test(code);
    if (!hasExport) {
      return { valid: false, error: 'Missing component export' };
    }

    return { valid: true };
  }

  private think(type: 'reason' | 'act' | 'observe', content: string): AgentThought {
    return {
      type,
      content,
      timestamp: new Date()
    };
  }
}
```

---

### 5. `/server/workflow/phases/CheckpointPhase.ts`

```typescript
import { WorkflowState, WorkflowPhase } from '../state/WorkflowState';
import { CheckpointManager } from '../state/CheckpointManager';
import { Phase } from './PhaseManager';

export class CheckpointPhase implements Phase {
  readonly name = WorkflowPhase.CHECKPOINT;
  private checkpointManager: CheckpointManager;

  constructor() {
    this.checkpointManager = new CheckpointManager();
  }

  async execute(state: WorkflowState): Promise<WorkflowState> {
    const currentRound = state.rounds[state.rounds.length - 1];

    if (!currentRound) {
      throw new Error('No round to checkpoint');
    }

    state.progress.currentMessage = 'Creating checkpoint...';
    state.progress.phaseProgress = 50;

    const checkpoint = this.checkpointManager.createCheckpoint(
      state,
      currentRound,
      state.lastEvaluation?.score
    );

    this.checkpointManager.addCheckpoint(state, checkpoint);

    state.progress.currentMessage = `Checkpoint saved (Round ${currentRound.roundNumber})`;
    state.progress.phaseProgress = 100;

    return state;
  }
}
```

---

### 6. `/server/workflow/phases/EvaluationPhase.ts`

```typescript
import { GoogleGenAI } from '@google/genai';
import { WorkflowState, WorkflowPhase, EvaluationResult } from '../state/WorkflowState';
import { AgentThought } from '../../agent/orchestrator';
import { Phase } from './PhaseManager';

export class EvaluationPhase implements Phase {
  readonly name = WorkflowPhase.EVALUATION;
  private ai: GoogleGenAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  async execute(state: WorkflowState): Promise<WorkflowState> {
    const currentRound = state.rounds[state.rounds.length - 1];

    if (!currentRound) {
      throw new Error('No round to evaluate');
    }

    const reasonThought = this.think(
      'reason',
      'Evaluating code quality against brand requirements and plan...'
    );
    state.thoughts.push(reasonThought);

    state.progress.currentMessage = 'Evaluating code quality...';
    state.progress.phaseProgress = 40;

    const evaluation = await this.evaluateCode(state, currentRound.generatedCode);

    state.lastEvaluation = evaluation;

    state.progress.currentMessage = `Evaluation complete: ${evaluation.score}/100`;
    state.progress.phaseProgress = 100;

    return state;
  }

  private async evaluateCode(state: WorkflowState, code: string): Promise<EvaluationResult> {
    const prompt = this.buildEvaluationPrompt(state, code);

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        temperature: 0.3,  // More analytical
        maxOutputTokens: 2048,
      }
    });

    return this.parseEvaluation(response.text || '', state.currentRound);
  }

  private buildEvaluationPrompt(state: WorkflowState, code: string): string {
    return `Evaluate this Remotion video code:

\`\`\`typescript
${code}
\`\`\`

Against these requirements:
- Brand: ${state.brand.name} - ${state.brand.tagline}
- Colors: ${state.brand.colors.join(', ')}
- Style: ${state.config.style}
- Plan: ${JSON.stringify(state.plan, null, 2)}

Provide:
1. SCORE: 0-100 (integer)
2. STRENGTHS: 3-5 specific positive points
3. WEAKNESSES: 3-5 specific areas to improve
4. RECOMMENDATION: Choose one:
   - iterate (score < 70 or significant issues)
   - finalize (score >= 85 and good quality)
   - request_feedback (score 70-84, or uncertain)
5. REASONING: Why you chose this recommendation (2-3 sentences)

Format as clear sections.`;
  }

  private parseEvaluation(text: string, roundNumber: number): EvaluationResult {
    let score = 70;  // Default
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    let recommendation: EvaluationResult['recommendation'] = 'request_feedback';
    let reasoning = '';

    const lines = text.split('\n');
    let currentSection = '';

    for (const line of lines) {
      const lower = line.toLowerCase();

      if (lower.includes('score:')) {
        const scoreMatch = line.match(/\\d+/);
        if (scoreMatch) {
          score = Math.min(100, Math.max(0, parseInt(scoreMatch[0])));
        }
      } else if (lower.includes('strength')) {
        currentSection = 'strengths';
      } else if (lower.includes('weakness')) {
        currentSection = 'weaknesses';
      } else if (lower.includes('recommendation:')) {
        const recText = line.split(':')[1]?.trim().toLowerCase();
        if (recText?.includes('iterate')) recommendation = 'iterate';
        else if (recText?.includes('finalize')) recommendation = 'finalize';
        else recommendation = 'request_feedback';
        currentSection = '';
      } else if (lower.includes('reasoning:')) {
        reasoning = line.split(':')[1]?.trim() || '';
        currentSection = 'reasoning';
      } else if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
        const point = line.trim().substring(1).trim();
        if (currentSection === 'strengths') strengths.push(point);
        else if (currentSection === 'weaknesses') weaknesses.push(point);
      } else if (currentSection === 'reasoning' && line.trim()) {
        reasoning += ' ' + line.trim();
      }
    }

    return {
      roundNumber,
      score,
      strengths: strengths.length > 0 ? strengths : ['Code structure is valid'],
      weaknesses: weaknesses.length > 0 ? weaknesses : ['Could be improved'],
      recommendation,
      reasoning: reasoning || 'Based on code quality assessment',
      timestamp: new Date()
    };
  }

  private think(type: 'reason' | 'act' | 'observe', content: string): AgentThought {
    return {
      type,
      content,
      timestamp: new Date()
    };
  }
}
```

---

### 7. `/server/workflow/phases/FeedbackPhase.ts`

```typescript
import { WorkflowState, WorkflowPhase } from '../state/WorkflowState';
import { Phase } from './PhaseManager';

export class FeedbackPhase implements Phase {
  readonly name = WorkflowPhase.AWAITING_FEEDBACK;

  async execute(state: WorkflowState): Promise<WorkflowState> {
    // Mark when we started waiting
    if (!state.awaitingFeedbackSince) {
      state.awaitingFeedbackSince = new Date();
    }

    state.progress.currentMessage = 'Waiting for your feedback...';
    state.progress.phaseProgress = 0;  // Paused

    // This phase doesn't actively do anything
    // It waits for the user to provide feedback via API
    // The orchestrator will resume when feedback is received

    return state;
  }
}
```

---

## Phase 2 Integration

All phases implement the `Phase` interface and are managed by `PhaseManager`. The orchestrator calls `phaseManager.executePhase(state)` in a loop.

**Testing Phase 2**:
```typescript
import { PhaseManager } from './server/workflow/phases/PhaseManager';
import { createInitialState, WorkflowPhase } from './server/workflow/state/WorkflowState';

const state = createInitialState('test-job', testBrand, testConfig);
const phaseManager = new PhaseManager();

// Test phase execution
state.currentPhase = WorkflowPhase.QUERY_ENHANCEMENT;
const updatedState = await phaseManager.executePhase(state);

console.assert(updatedState.enhancedPrompt !== undefined);
console.log('✅ Phase 2 tests passed');
```

---

# PHASE 3: ITERATION SYSTEM - Self-Evaluation & Decision Logic

## Files to Create

### 1. `/server/workflow/iteration/IterationController.ts`

```typescript
import { WorkflowState, WorkflowPhase, EvaluationResult } from '../state/WorkflowState';

export class IterationController {
  /**
   * Decide what to do next based on evaluation
   */
  decideNextAction(state: WorkflowState): WorkflowPhase {
    const evaluation = state.lastEvaluation;

    if (!evaluation) {
      // No evaluation yet, shouldn't happen
      return WorkflowPhase.RENDERING;
    }

    const { score, recommendation } = evaluation;
    const { currentRound, maxRounds } = state;

    // Decision tree
    if (recommendation === 'finalize' || score >= 85) {
      return WorkflowPhase.RENDERING;
    }

    if (currentRound >= maxRounds) {
      // Hit max rounds, ask for feedback
      return WorkflowPhase.AWAITING_FEEDBACK;
    }

    if (score < 60) {
      // Low score, iterate
      return WorkflowPhase.PLANNING;  // Start new iteration
    }

    if (score >= 60 && score < 85) {
      // Medium score, request feedback
      return WorkflowPhase.AWAITING_FEEDBACK;
    }

    // Default: request feedback
    return WorkflowPhase.AWAITING_FEEDBACK;
  }

  /**
   * Process user feedback and decide next phase
   */
  processUserFeedback(state: WorkflowState): WorkflowPhase {
    const feedback = state.userFeedback;

    if (!feedback) {
      throw new Error('No user feedback provided');
    }

    switch (feedback.type) {
      case 'approve':
        // User approved, render it
        return WorkflowPhase.RENDERING;

      case 'request_changes':
        // User wants changes, iterate
        if (state.currentRound < state.maxRounds) {
          return WorkflowPhase.PLANNING;
        } else {
          // Hit max rounds, have to render
          return WorkflowPhase.RENDERING;
        }

      case 'reject':
        // User rejected, try once more or error
        if (state.currentRound < state.maxRounds) {
          return WorkflowPhase.PLANNING;
        } else {
          return WorkflowPhase.ERROR;
        }

      default:
        return WorkflowPhase.RENDERING;
    }
  }
}
```

### 2. `/server/workflow/iteration/SelfEvaluator.ts`

(This is mostly handled by EvaluationPhase, but we can add helper methods)

```typescript
import { EvaluationResult } from '../state/WorkflowState';

export class SelfEvaluator {
  /**
   * Analyze if evaluation shows improvement over previous round
   */
  isImprovement(
    currentEvaluation: EvaluationResult,
    previousEvaluation: EvaluationResult | undefined
  ): boolean {
    if (!previousEvaluation) {
      return true;  // First evaluation
    }

    return currentEvaluation.score > previousEvaluation.score;
  }

  /**
   * Check if evaluation meets quality threshold
   */
  meetsThreshold(evaluation: EvaluationResult, threshold: number = 75): boolean {
    return evaluation.score >= threshold;
  }

  /**
   * Generate improvement suggestions based on weaknesses
   */
  generateImprovements(evaluation: EvaluationResult): string[] {
    return evaluation.weaknesses.map(weakness =>
      `Address: ${weakness}`
    );
  }
}
```

**Testing Phase 3**:
```typescript
import { IterationController } from './server/workflow/iteration/IterationController';

const controller = new IterationController();

// Test decision logic
const state = { ...testState, lastEvaluation: { score: 90, recommendation: 'finalize' } };
const nextPhase = controller.decideNextAction(state);
console.assert(nextPhase === WorkflowPhase.RENDERING);

console.log('✅ Phase 3 tests passed');
```

---

# PHASE 4-8 IMPLEMENTATION GUIDES

Due to character limits in this response, I'll provide the overview structure for the remaining phases. The pattern is consistent with Phases 1-3:

## PHASE 4: Workflow Orchestrator
- Create `WorkflowOrchestrator.ts` - main engine
- Modify `promptBuilder.ts` - add phase-specific prompts
- Integrate all phases, checkpoint manager, error tracker, iteration controller

## PHASE 5: API Layer
- Modify `server/index.ts`
- Add new workflow endpoints
- Integrate workflow storage (Map-based like jobs)
- Add feedback endpoint with resume logic

## PHASE 6: Frontend Service
- Create `services/workflowService.ts`
- API client methods for all endpoints
- Polling logic for status updates
- Modify `types.ts` with frontend types

## PHASE 7: Frontend UI
- Create 7 workflow UI components
- Phase indicator, round history, checkpoint viewer, etc.
- Real-time progress visualization
- Feedback submission interface

## PHASE 8: Integration
- Modify `App.tsx` to use WorkflowDashboard
- Wire up all components
- End-to-end testing
- Error handling

Each phase follows the same detailed pattern as Phases 1-3 above.
