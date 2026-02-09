/**
 * Agent Types
 * 
 * Core type definitions for the Director-Agent architecture.
 * All agents share these common interfaces and types.
 */

// ============================================================================
// Agent Reflection - Structured thinking for agents
// ============================================================================

/**
 * AgentReflection captures the reasoning process of an agent.
 * Used for debugging, logging, and UI display.
 */
export interface AgentReflection {
  /** What the agent observed/analyzed */
  observation: string;
  
  /** The agent's reasoning about what to do */
  reasoning: string;
  
  /** The action the agent decided to take */
  action: string;
  
  /** Confidence level (0-1) */
  confidence: number;
  
  /** Timestamp when this reflection was made */
  timestamp: number;
}

/**
 * Create a new AgentReflection
 */
export function createReflection(
  observation: string,
  reasoning: string,
  action: string,
  confidence: number = 0.8
): AgentReflection {
  return {
    observation,
    reasoning,
    action,
    confidence: Math.max(0, Math.min(1, confidence)),
    timestamp: Date.now(),
  };
}

// ============================================================================
// Score Thresholds - Configurable evaluation thresholds
// ============================================================================

export const SCORE_THRESHOLDS = {
  /** Minimum score for a scene to pass Tier 1 evaluation */
  SCENE_LOCAL_PASS: 0.60,
  
  /** Score below which triggers escalation to Director */
  SCENE_ESCALATION_SCORE: 0.50,
  
  /** Maximum local attempts before escalation */
  SCENE_MAX_LOCAL_ATTEMPTS: 3,
  
  /** Global score threshold for Director satisfaction */
  GLOBAL_SATISFACTION: 0.70,
  
  /** Minimum improvement to avoid diminishing returns detection */
  DIMINISHING_RETURNS_DELTA: 0.05,
  
  /** Number of iterations to check for diminishing returns */
  DIMINISHING_RETURNS_WINDOW: 3,
} as const;

// ============================================================================
// Brand Context - Input data for video generation
// ============================================================================

export interface BrandContext {
  /** Brand name */
  name: string;
  
  /** Industry/category */
  industry?: string;
  
  /** Brand tagline */
  tagline?: string;
  
  /** Primary brand colors (hex) */
  colors: {
    primary: string;
    secondary?: string;
    accent?: string;
    background?: string;
  };
  
  /** Logo URL or base64 */
  logo?: string;
  
  /** Visual style preference */
  style?: 'minimal' | 'bold' | 'elegant' | 'playful' | 'corporate' | 'dynamic';
  
  /** Aspect ratio */
  aspectRatio: '16:9' | '9:16';
  
  /** Creative prompt from user */
  prompt: string;
  
  /** Additional context */
  additionalContext?: Record<string, unknown>;
}

// ============================================================================
// Scene Definition - A single scene in the video
// ============================================================================

export interface SceneDefinition {
  /** Unique scene identifier */
  id: string;
  
  /** Scene index (0-based) */
  index: number;
  
  /** Scene title/name */
  title: string;
  
  /** Scene description for generation */
  description: string;
  
  /** Duration in frames */
  durationFrames: number;
  
  /** Start frame in the final video */
  startFrame: number;
  
  /** Scene-specific elements */
  elements?: {
    text?: string[];
    animations?: string[];
    transitions?: {
      in?: string;
      out?: string;
    };
  };
}

// ============================================================================
// Scene State - Runtime state for a scene
// ============================================================================

export type SceneStatus = 
  | 'pending'
  | 'generating'
  | 'generated'
  | 'rendering'
  | 'rendered'
  | 'evaluating'
  | 'passed'
  | 'failed'
  | 'escalated';

export interface SceneState {
  /** Scene definition */
  definition: SceneDefinition;
  
  /** Current version (increments on each regeneration) */
  version: number;
  
  /** Current status */
  status: SceneStatus;
  
  /** Generated Remotion code */
  code?: string;
  
  /** Rendered video path */
  videoPath?: string;
  
  /** Local attempt count (resets after escalation) */
  localAttempts: number;
  
  /** Total attempt count */
  totalAttempts: number;
  
  /** Score history for this scene */
  scoreHistory: number[];
  
  /** Last evaluation feedback */
  lastFeedback?: string;
  
  /** Last evaluation details */
  lastEvaluationDetails?: {
    codeQuality: number;
    visualAppeal: number;
    brandAlignment: number;
    technicalCorrectness: number;
  };
  
  /** Error if any */
  error?: string;
  
  /** Timestamps */
  createdAt: number;
  updatedAt: number;
}

/**
 * Create initial scene state from definition
 */
export function createSceneState(definition: SceneDefinition): SceneState {
  const now = Date.now();
  return {
    definition,
    version: 0,
    status: 'pending',
    localAttempts: 0,
    totalAttempts: 0,
    scoreHistory: [],
    createdAt: now,
    updatedAt: now,
  };
}

// ============================================================================
// Video Plan - The overall video structure
// ============================================================================

export interface VideoPlan {
  /** Total duration in frames */
  totalFrames: number;
  
  /** Frames per second */
  fps: number;
  
  /** Video dimensions */
  width: number;
  height: number;
  
  /** Aspect ratio */
  aspectRatio?: '16:9' | '9:16';
  
  /** Scene definitions */
  scenes: SceneDefinition[];
  
  /** Global style notes */
  styleNotes?: string;
  
  /** Narrative structure */
  narrative?: {
    hook?: string;
    body?: string;
    callToAction?: string;
  };
}

// ============================================================================
// Agent Message Types - For inter-agent communication
// ============================================================================

export interface AgentMessage<T = unknown> {
  /** Message type */
  type: string;
  
  /** Sender agent */
  from: 'director' | 'scene-generator' | 'scene-evaluator' | 'global-evaluator';
  
  /** Target agent (optional for broadcasts) */
  to?: 'director' | 'scene-generator' | 'scene-evaluator' | 'global-evaluator';
  
  /** Project ID */
  projectId: string;
  
  /** Message payload */
  payload: T;
  
  /** Timestamp */
  timestamp: number;
  
  /** Correlation ID for request/response */
  correlationId?: string;
}

// ============================================================================
// Agent Error Types
// ============================================================================

export class AgentError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly recoverable: boolean = true,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AgentError';
  }
}

export class SceneGenerationError extends AgentError {
  constructor(
    message: string,
    public readonly sceneId: string,
    public readonly version: number,
    recoverable: boolean = true
  ) {
    super(message, 'SCENE_GENERATION_ERROR', recoverable, { sceneId, version });
    this.name = 'SceneGenerationError';
  }
}

export class EvaluationError extends AgentError {
  constructor(
    message: string,
    public readonly tier: 1 | 2,
    public readonly sceneId?: string,
    recoverable: boolean = true
  ) {
    super(message, 'EVALUATION_ERROR', recoverable, { tier, sceneId });
    this.name = 'EvaluationError';
  }
}

export class DirectorError extends AgentError {
  constructor(
    message: string,
    public readonly phase: string,
    recoverable: boolean = true
  ) {
    super(message, 'DIRECTOR_ERROR', recoverable, { phase });
    this.name = 'DirectorError';
  }
}
