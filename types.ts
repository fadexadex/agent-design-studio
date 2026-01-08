
export type MotionStyle = 'fluid' | 'geometric' | 'minimalist' | 'brutalist' | 'cinematic';

export interface BrandContext {
  name: string;
  industry: string;
  colors: string[];
  logoBase64?: string;
  tagline: string;
}

export interface VideoConfig {
  style: MotionStyle;
  aspectRatio: '16:9' | '9:16';
  resolution: '720p' | '1080p';
  prompt: string;
}

export interface GenerationState {
  isGenerating: boolean;
  progressMessage: string;
  videoUrl?: string;
  error?: string;
}

export interface WizardStep {
  id: string;
  title: string;
  description: string;
  isComplete: boolean;
}

// Workflow Types
export interface AgentThought {
  type: 'reason' | 'act' | 'observe';
  content: string;
  timestamp: string | Date;
  /**
   * The model's actual thinking summary from Gemini (when includeThoughts is enabled).
   * This is the human-readable summary of the model's internal reasoning process.
   */
  modelThinking?: string;
  /**
   * Opaque thought signature from Gemini for maintaining reasoning context across turns.
   * This should be passed back to the API but not displayed to users.
   */
  thoughtSignature?: string;
}

export enum WorkflowPhase {
  INITIALIZATION = 'initialization',
  QUERY_ENHANCEMENT = 'query_enhancement',
  PLANNING = 'planning',
  IMPLEMENTATION = 'implementation',
  CHECKPOINT = 'checkpoint',
  EVALUATION = 'evaluation',
  ITERATION_DECISION = 'iteration_decision',
  AWAITING_FEEDBACK = 'awaiting_feedback',
  RENDERING = 'rendering',
  COMPLETE = 'complete',
  ERROR = 'error'
}

export interface SceneDescription {
  id: string;
  sceneNumber: number;
  description: string;
  frameRange: { start: number; end: number };
  keyElements: string[];
}

export interface ImplementationPlan {
  approach: string;
  sceneBreakdown: SceneDescription[];
  estimatedComplexity: 'low' | 'medium' | 'high';
  createdAt: string | Date;
}

export interface GeneratedFile {
  filePath: string;
  content: string;
  sceneId?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ImplementationRound {
  roundNumber: number;
  files: GeneratedFile[];
  validationResult: ValidationResult;
  issues: string[];
  thoughts: AgentThought[];
  startedAt: string | Date;
  completedAt?: string | Date;
}

export interface Checkpoint {
  id: string;
  roundNumber: number;
  files: GeneratedFile[];
  description: string;
  timestamp: string | Date;
}

export interface ErrorRecord {
  id: string;
  roundNumber: number;
  errorType: 'validation' | 'runtime' | 'generation' | 'render';
  errorMessage: string;
  context?: string;
  resolved: boolean;
  resolvedAt?: string | Date;
}

export interface WorkflowProgress {
  currentPhase: WorkflowPhase;
  phaseProgress: number;
  currentMessage: string;
  subStep?: string;
}

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

export interface WorkflowState {
  jobId: string;
  currentPhase: WorkflowPhase;
  brand: BrandContext;
  config: VideoConfig;
  plan?: ImplementationPlan;
  currentRound: number;
  maxRounds: number;
  rounds: ImplementationRound[];
  lastEvaluation?: EvaluationResultRef;
  nextRoundTargets?: string[];
  checkpoints: Checkpoint[];
  activeCheckpointId?: string;
  errorHistory: ErrorRecord[];
  thoughts: AgentThought[];
  progress: WorkflowProgress;
  outputVideoPath?: string;
  updatedAt: string | Date;
  createdAt: string | Date;
}

