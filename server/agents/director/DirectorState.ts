/**
 * Director State
 * 
 * Defines the state structure for the Director agent.
 * State is persisted to Redis for durability and crash recovery.
 */

import {
  BrandContext,
  VideoPlan,
  SceneState,
  AgentReflection,
} from '../types.js';

// ============================================================================
// Director Phase - Current execution phase
// ============================================================================

export type DirectorPhase =
  | 'initializing'
  | 'planning'
  | 'generating'
  | 'evaluating_local'   // Tier 1 scene evaluations
  | 'evaluating_global'  // Tier 2 holistic evaluation
  | 'iterating'
  | 'rendering_final'
  | 'completed'
  | 'failed';

// ============================================================================
// Director State
// ============================================================================

export interface DirectorState {
  /** Project/job identifier */
  projectId: string;
  
  /** Current phase */
  phase: DirectorPhase;
  
  /** State version for optimistic locking */
  stateVersion: number;
  
  /** Brand context input */
  brandContext: BrandContext;
  
  /** Video plan (created during planning phase) */
  videoPlan?: VideoPlan;
  
  /** Scene states indexed by scene ID */
  scenes: Record<string, SceneState>;
  
  /** Global evaluation results */
  globalEvaluation?: {
    score: number;
    narrativeCohesion: number;
    brandConsistency: number;
    feedback: string;
    sceneVersionSnapshot: Record<string, number>;
    timestamp: number;
  };
  
  /** Whether Director is satisfied with current output */
  directorSatisfied: boolean;
  
  /** Global iteration count */
  globalIteration: number;
  
  /** Maximum global iterations allowed */
  maxGlobalIterations: number;
  
  /** Director's reflection history */
  reflections: AgentReflection[];
  
  /** Error information if failed */
  error?: {
    message: string;
    code: string;
    phase: DirectorPhase;
    recoverable: boolean;
    timestamp: number;
  };
  
  /** Final output path */
  outputPath?: string;
  
  /** Timestamps */
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

// ============================================================================
// State Factory
// ============================================================================

export interface CreateDirectorStateOptions {
  projectId: string;
  brandContext: BrandContext;
  maxGlobalIterations?: number;
}

/**
 * Create initial Director state
 */
export function createDirectorState(options: CreateDirectorStateOptions): DirectorState {
  const now = Date.now();
  
  return {
    projectId: options.projectId,
    phase: 'initializing',
    stateVersion: 1,
    brandContext: options.brandContext,
    scenes: {},
    directorSatisfied: false,
    globalIteration: 0,
    maxGlobalIterations: options.maxGlobalIterations ?? 5,
    reflections: [],
    createdAt: now,
    updatedAt: now,
  };
}

// ============================================================================
// State Serialization for Redis
// ============================================================================

/**
 * Serialize state for Redis storage
 * Converts to flat key-value pairs for HSET
 */
export function serializeState(state: DirectorState): Record<string, string> {
  return {
    projectId: state.projectId,
    phase: state.phase,
    stateVersion: state.stateVersion.toString(),
    brandContext: JSON.stringify(state.brandContext),
    videoPlan: state.videoPlan ? JSON.stringify(state.videoPlan) : '',
    scenes: JSON.stringify(state.scenes),
    globalEvaluation: state.globalEvaluation ? JSON.stringify(state.globalEvaluation) : '',
    directorSatisfied: state.directorSatisfied.toString(),
    globalIteration: state.globalIteration.toString(),
    maxGlobalIterations: state.maxGlobalIterations.toString(),
    reflections: JSON.stringify(state.reflections),
    error: state.error ? JSON.stringify(state.error) : '',
    outputPath: state.outputPath || '',
    createdAt: state.createdAt.toString(),
    updatedAt: state.updatedAt.toString(),
    completedAt: state.completedAt?.toString() || '',
  };
}

/**
 * Deserialize state from Redis storage
 */
export function deserializeState(data: Record<string, string>): DirectorState {
  return {
    projectId: data.projectId,
    phase: data.phase as DirectorPhase,
    stateVersion: parseInt(data.stateVersion, 10),
    brandContext: JSON.parse(data.brandContext),
    videoPlan: data.videoPlan ? JSON.parse(data.videoPlan) : undefined,
    scenes: JSON.parse(data.scenes),
    globalEvaluation: data.globalEvaluation ? JSON.parse(data.globalEvaluation) : undefined,
    directorSatisfied: data.directorSatisfied === 'true',
    globalIteration: parseInt(data.globalIteration, 10),
    maxGlobalIterations: parseInt(data.maxGlobalIterations, 10),
    reflections: JSON.parse(data.reflections),
    error: data.error ? JSON.parse(data.error) : undefined,
    outputPath: data.outputPath || undefined,
    createdAt: parseInt(data.createdAt, 10),
    updatedAt: parseInt(data.updatedAt, 10),
    completedAt: data.completedAt ? parseInt(data.completedAt, 10) : undefined,
  };
}

// ============================================================================
// State Helpers
// ============================================================================

/**
 * Get all scenes in order
 */
export function getScenesInOrder(state: DirectorState): SceneState[] {
  return Object.values(state.scenes).sort(
    (a, b) => a.definition.index - b.definition.index
  );
}

/**
 * Get scenes by status
 */
export function getScenesByStatus(
  state: DirectorState,
  ...statuses: SceneState['status'][]
): SceneState[] {
  return Object.values(state.scenes).filter(s => statuses.includes(s.status));
}

/**
 * Check if all scenes have passed local evaluation
 */
export function allScenesPassedLocal(state: DirectorState): boolean {
  const scenes = Object.values(state.scenes);
  return scenes.length > 0 && scenes.every(s => s.status === 'passed');
}

/**
 * Check if any scene is still being processed
 */
export function hasActiveScenes(state: DirectorState): boolean {
  const activeStatuses: SceneState['status'][] = [
    'generating',
    'rendering',
    'evaluating',
  ];
  return Object.values(state.scenes).some(s => activeStatuses.includes(s.status));
}

/**
 * Get the latest score for each scene
 */
export function getLatestSceneScores(state: DirectorState): Record<string, number> {
  const scores: Record<string, number> = {};
  
  for (const [sceneId, scene] of Object.entries(state.scenes)) {
    if (scene.scoreHistory.length > 0) {
      scores[sceneId] = scene.scoreHistory[scene.scoreHistory.length - 1];
    }
  }
  
  return scores;
}

/**
 * Calculate weighted mean of scene scores with worst-scene penalty
 */
export function calculateWeightedMeanSceneScore(state: DirectorState): number {
  const scores = Object.values(getLatestSceneScores(state));
  
  if (scores.length === 0) return 0;
  
  const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  const min = Math.min(...scores);
  
  // Weighted: 70% mean, 30% min (worst-scene penalty)
  return (mean * 0.7) + (min * 0.3);
}

/**
 * Get Redis key for Director state
 */
export function getStateRedisKey(projectId: string): string {
  return `director:${projectId}`;
}

/**
 * State TTL in seconds (24 hours)
 */
export const STATE_TTL_SECONDS = 86400;
