import { BrandContext, VideoConfig } from '../../agent/types';
import { AgentThought } from '../../agent/orchestrator';

// Forward declaration to avoid circular imports
// Full type is defined in iteration/SelfEvaluator.ts
export interface SceneScoreRef {
  sceneId: string;
  sceneNumber: number;
  score: number;
  issues: string[];
  suggestions: string[];
}

export interface EvaluationResultRef {
  score: number;
  compilability: number;
  visualFidelity: number;
  animationSmoothness: number;
  brandConsistency: number;
  sceneScores: SceneScoreRef[];
  feedback: string;
  globalSuggestions: string[];
  passesThreshold: boolean;
  needsUserFeedback: boolean;
}

/**
 * Scene render status for tracking individual scene generation and rendering progress.
 * Used for incremental UI updates during the implementation phase.
 */
export interface SceneRenderStatus {
  sceneNumber: number;
  sceneId: string;
  status: 'pending' | 'generating' | 'rendering' | 'complete' | 'error';
  progress: number; // 0-100
  message?: string;
  previewUrl?: string;
  error?: string;
}

/**
 * Workflow Phases - The discrete states in the video generation pipeline.
 * Follows the distributed agent architecture for modular scene generation.
 */
export enum WorkflowPhase {
  INITIALIZATION = 'initialization',
  QUERY_ENHANCEMENT = 'query_enhancement',
  PLANNING = 'planning',
  IMPLEMENTATION = 'implementation',
  CHECKPOINT = 'checkpoint',
  EVALUATION = 'evaluation',
  ITERATION_DECISION = 'iteration_decision',
  AWAITING_FEEDBACK = 'awaiting_feedback', // Critical for User Loop
  RENDERING = 'rendering',
  COMPLETE = 'complete',
  ERROR = 'error'
}

/**
 * Validation result from code validation
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Scene description for the modular scene architecture.
 * Each scene is generated as a separate file for live preview and incremental fixes.
 */
export interface SceneDescription {
  id: string; // Unique ID for drag-drop handling in UI
  sceneNumber: number;
  description: string;
  frameRange: { start: number; end: number };
  keyElements: string[];

  // Timeline architecture fields
  visualStyle?: 'kinetic_typography' | 'app_demo' | 'abstract_shape' | 'logo_reveal' | '3d_product_showcase' | 'abstract_ui' | '3d_grid_view';
  energyLevel?: 'high' | 'medium' | 'low';
  suggestedDuration?: number; // in seconds (AI-suggested, normalized later)
  textOverlay?: string[];    // text to display on screen
  cameraMovement?: string;   // e.g., "Zoom in", "Pan left"
  assets?: string[];         // referenced assets
}

/**
 * Implementation plan created during the planning phase.
 * The scene breakdown is reorderable in the Script Builder UI.
 */
export interface ImplementationPlan {
  approach: string;
  sceneBreakdown: SceneDescription[]; // Reorderable in UI
  estimatedComplexity: 'low' | 'medium' | 'high';
  createdAt: Date;
}

/**
 * Generated file - supports multi-file scene generation
 */
export interface GeneratedFile {
  filePath: string;
  content: string;
  sceneId?: string; // Links to SceneDescription.id
}

/**
 * A single implementation round (attempt) with its results
 */
export interface ImplementationRound {
  roundNumber: number;
  files: GeneratedFile[];
  validationResult: ValidationResult;
  issues: string[];
  thoughts: AgentThought[];
  startedAt: Date;
  completedAt?: Date;
}

/**
 * Checkpoint for saving/restoring workflow state
 */
export interface Checkpoint {
  id: string;
  roundNumber: number;
  files: GeneratedFile[];
  description: string;
  timestamp: Date;
}

/**
 * Error record for tracking and preventing repeated mistakes
 */
export interface ErrorRecord {
  id: string;
  roundNumber: number;
  errorType: 'validation' | 'runtime' | 'generation' | 'render';
  errorMessage: string;
  context?: string;
  resolved: boolean;
  resolvedAt?: Date;
}

/**
 * Progress tracking for UI updates
 */
export interface WorkflowProgress {
  currentPhase: WorkflowPhase;
  phaseProgress: number; // 0-100
  currentMessage: string;
  subStep?: string;
}

/**
 * Core workflow state that tracks the entire video generation process
 */
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

  // Scene Generation Progress (for incremental UI updates)
  sceneStatuses?: SceneRenderStatus[];

  // Iteration Control
  lastEvaluation?: EvaluationResultRef; // Latest evaluation for iteration decisions
  nextRoundTargets?: string[]; // Scene IDs to target in next implementation round

  // History & Checkpoints
  checkpoints: Checkpoint[];
  activeCheckpointId?: string;
  errorHistory: ErrorRecord[];

  // Agent Stream
  thoughts: AgentThought[];

  // Progress
  progress: WorkflowProgress;

  // Output
  outputVideoPath?: string;

  // Timestamps
  updatedAt: Date;
  createdAt: Date;
}

/**
 * Creates initial workflow state with sensible defaults
 */
export function createInitialState(
  jobId: string,
  brand: BrandContext,
  config: VideoConfig
): WorkflowState {
  const now = new Date();

  return {
    jobId,
    currentPhase: WorkflowPhase.INITIALIZATION,
    brand,
    config,

    // Execution defaults
    currentRound: 0,
    maxRounds: 3,
    rounds: [],

    // Empty collections
    checkpoints: [],
    errorHistory: [],
    thoughts: [],

    // Initial progress
    progress: {
      currentPhase: WorkflowPhase.INITIALIZATION,
      phaseProgress: 0,
      currentMessage: 'Initializing workflow...'
    },

    // Timestamps
    updatedAt: now,
    createdAt: now
  };
}

/**
 * Updates the workflow state immutably
 */
export function updateState(
  state: WorkflowState,
  updates: Partial<WorkflowState>
): WorkflowState {
  return {
    ...state,
    ...updates,
    updatedAt: new Date()
  };
}

/**
 * Transitions the workflow to a new phase
 */
export function transitionPhase(
  state: WorkflowState,
  newPhase: WorkflowPhase,
  message?: string
): WorkflowState {
  return updateState(state, {
    currentPhase: newPhase,
    progress: {
      currentPhase: newPhase,
      phaseProgress: 0,
      currentMessage: message || `Entering ${newPhase} phase...`
    }
  });
}

/**
 * Adds a thought to the workflow state
 */
export function addThought(
  state: WorkflowState,
  thought: AgentThought
): WorkflowState {
  return updateState(state, {
    thoughts: [...state.thoughts, thought]
  });
}

/**
 * Gets the current round or undefined if none started
 */
export function getCurrentRound(state: WorkflowState): ImplementationRound | undefined {
  return state.rounds[state.currentRound - 1];
}

/**
 * Checks if the workflow can continue iterating
 */
export function canIterate(state: WorkflowState): boolean {
  return state.currentRound < state.maxRounds;
}

/**
 * Stores an evaluation result in the workflow state
 */
export function storeEvaluation(
  state: WorkflowState,
  evaluation: EvaluationResultRef
): WorkflowState {
  return updateState(state, {
    lastEvaluation: evaluation
  });
}

/**
 * Sets target scenes for the next implementation round
 */
export function setTargetScenes(
  state: WorkflowState,
  sceneIds: string[]
): WorkflowState {
  return updateState(state, {
    nextRoundTargets: sceneIds
  });
}

/**
 * Clears target scenes after they've been processed
 */
export function clearTargetScenes(state: WorkflowState): WorkflowState {
  return updateState(state, {
    nextRoundTargets: undefined
  });
}

/**
 * Gets the scenes that need to be regenerated in the next round.
 * Returns undefined if all scenes should be regenerated.
 */
export function getTargetScenes(state: WorkflowState): string[] | undefined {
  return state.nextRoundTargets;
}
