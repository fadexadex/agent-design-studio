/**
 * Orchestration UI Types
 * 
 * Frontend types that mirror the backend LangGraph event system.
 * These types are used to build the real-time orchestration dashboard.
 */

// ============================================================================
// Event Categories (mirrors server/events/types.ts)
// ============================================================================

export type EventCategory = 'director' | 'scene' | 'evaluation' | 'render' | 'system' | 'agent' | 'preview';

// ============================================================================
// Scene Status & Decision Types (mirrors server/agents/graph/state/SceneState.ts)
// ============================================================================

export type SceneStatus = 'pending' | 'generating' | 'rendering' | 'evaluating' | 'passed' | 'failed';

export type SceneDecision = 'pass' | 'refine' | 'fail';

export type DirectorPhase = 'planning' | 'coordinating' | 'evaluating' | 'deciding';

export type EvaluationTier = 1 | 2;

export type TrendDirection = 'improving' | 'plateau' | 'regressing';

// ============================================================================
// Base Event Structure (mirrors server/events/types.ts)
// ============================================================================

export interface BaseUIEvent {
  id: string;
  projectId: string;
  timestamp: number;
  category: EventCategory;
  type: string;
}

// ============================================================================
// Director Events
// ============================================================================

export interface DirectorStartedEvent extends BaseUIEvent {
  category: 'director';
  type: 'director:started';
  data: {
    totalScenes: number;
    config: Record<string, unknown>;
  };
}

export interface DirectorThinkingEvent extends BaseUIEvent {
  category: 'director';
  type: 'director:thinking';
  data: {
    thought: string;
    phase: DirectorPhase;
  };
}

export interface DirectorDecisionEvent extends BaseUIEvent {
  category: 'director';
  type: 'director:decision';
  data: {
    decision: string;
    reasoning: string;
    affectedScenes: string[];
  };
}

export interface DirectorCompletedEvent extends BaseUIEvent {
  category: 'director';
  type: 'director:completed';
  data: {
    success: boolean;
    totalDurationMs: number;
    finalScore: number;
    summary: string;
  };
}

export interface DirectorErrorEvent extends BaseUIEvent {
  category: 'director';
  type: 'director:error';
  data: {
    error: string;
    recoverable: boolean;
    phase: string;
  };
}

export type DirectorEvent =
  | DirectorStartedEvent
  | DirectorThinkingEvent
  | DirectorDecisionEvent
  | DirectorCompletedEvent
  | DirectorErrorEvent;

// ============================================================================
// Scene Events
// ============================================================================

export interface SceneQueuedEvent extends BaseUIEvent {
  category: 'scene';
  type: 'scene:queued';
  data: {
    sceneId: string;
    sceneIndex: number;
    sceneNumber: number;
    version: number;
  };
}

export interface SceneGeneratingEvent extends BaseUIEvent {
  category: 'scene';
  type: 'scene:generating';
  data: {
    sceneId: string;
    sceneIndex: number;
    sceneNumber: number;
    version: number;
    attempt: number;
  };
}

export interface SceneGeneratedEvent extends BaseUIEvent {
  category: 'scene';
  type: 'scene:generated';
  data: {
    sceneId: string;
    sceneIndex: number;
    sceneNumber: number;
    version: number;
    durationMs: number;
    codeLength: number;
  };
}

export interface SceneRenderingEvent extends BaseUIEvent {
  category: 'scene';
  type: 'scene:rendering';
  data: {
    sceneId: string;
    sceneIndex: number;
    sceneNumber: number;
    version: number;
  };
}

export interface SceneRenderedEvent extends BaseUIEvent {
  category: 'scene';
  type: 'scene:rendered';
  data: {
    sceneId: string;
    sceneIndex: number;
    sceneNumber: number;
    version: number;
    durationMs: number;
    videoPath: string;
  };
}

export interface SceneErrorEvent extends BaseUIEvent {
  category: 'scene';
  type: 'scene:error';
  data: {
    sceneId: string;
    sceneIndex: number;
    sceneNumber: number;
    version: number;
    error: string;
    phase: 'generation' | 'rendering';
  };
}

export type SceneEvent =
  | SceneQueuedEvent
  | SceneGeneratingEvent
  | SceneGeneratedEvent
  | SceneRenderingEvent
  | SceneRenderedEvent
  | SceneErrorEvent;

// ============================================================================
// Evaluation Events
// ============================================================================

export interface EvaluationStartedEvent extends BaseUIEvent {
  category: 'evaluation';
  type: 'evaluation:started';
  data: {
    tier: EvaluationTier;
    sceneId?: string;
    sceneIndex?: number;
    sceneNumber?: number;
    version?: number;
  };
}

export interface EvaluationProgressEvent extends BaseUIEvent {
  category: 'evaluation';
  type: 'evaluation:progress';
  data: {
    tier: EvaluationTier;
    sceneId?: string;
    step: string;
    progress: number;
  };
}

export interface EvaluationCompletedEvent extends BaseUIEvent {
  category: 'evaluation';
  type: 'evaluation:completed';
  data: {
    tier: EvaluationTier;
    sceneId?: string;
    sceneIndex?: number;
    sceneNumber?: number;
    evaluatedVersion?: number;
    score: number;
    passed: boolean;
    feedback: string;
    details?: Record<string, number>;
  };
}

export interface EvaluationEscalatedEvent extends BaseUIEvent {
  category: 'evaluation';
  type: 'evaluation:escalated';
  data: {
    sceneId: string;
    sceneIndex: number;
    sceneNumber: number;
    reason: 'max_attempts' | 'low_score' | 'diminishing_returns';
    attempts: number;
    lastScore: number;
  };
}

export type EvaluationEvent =
  | EvaluationStartedEvent
  | EvaluationProgressEvent
  | EvaluationCompletedEvent
  | EvaluationEscalatedEvent;

// ============================================================================
// Render Events
// ============================================================================

export interface RenderStartedEvent extends BaseUIEvent {
  category: 'render';
  type: 'render:started';
  data: {
    phase: 'scene' | 'final';
    sceneId?: string;
  };
}

export interface RenderProgressEvent extends BaseUIEvent {
  category: 'render';
  type: 'render:progress';
  data: {
    phase: 'scene' | 'final';
    sceneId?: string;
    progress: number;
    framesRendered: number;
    totalFrames: number;
  };
}

export interface RenderCompletedEvent extends BaseUIEvent {
  category: 'render';
  type: 'render:completed';
  data: {
    phase: 'scene' | 'final';
    sceneId?: string;
    durationMs: number;
    outputPath: string;
    fileSizeBytes: number;
  };
}

export interface RenderErrorEvent extends BaseUIEvent {
  category: 'render';
  type: 'render:error';
  data: {
    phase: 'scene' | 'final';
    sceneId?: string;
    error: string;
  };
}

export type RenderEvent =
  | RenderStartedEvent
  | RenderProgressEvent
  | RenderCompletedEvent
  | RenderErrorEvent;

// ============================================================================
// System Events
// ============================================================================

export interface SystemHealthEvent extends BaseUIEvent {
  category: 'system';
  type: 'system:health';
  data: {
    redis: 'connected' | 'disconnected';
    queues: Record<string, number>;
    workers: Record<string, boolean>;
  };
}

export interface SystemErrorEvent extends BaseUIEvent {
  category: 'system';
  type: 'system:error';
  data: {
    error: string;
    component: string;
    fatal: boolean;
  };
}

export type SystemEvent = SystemHealthEvent | SystemErrorEvent;

// ============================================================================
// Agent Events (for agent hierarchy visualization)
// ============================================================================

export type AgentStatus = 'spawning' | 'thinking' | 'generating' | 'rendering' | 'completed' | 'error';

export type AgentAction = 'planning' | 'generating_code' | 'validating_code' | 'rendering_scene' | 'reviewing' | 'refining';

export interface AgentSpawnedEvent extends BaseUIEvent {
  category: 'agent';
  type: 'agent:spawned';
  data: {
    agentId: string;
    sceneIndex: number;
    sceneName: string;
    parentAgentId?: string;
  };
}

export interface AgentThinkingEvent extends BaseUIEvent {
  category: 'agent';
  type: 'agent:thinking';
  data: {
    agentId: string;
    thought: string;
    isStreaming: boolean;
    thoughtIndex?: number;
  };
}

export interface AgentActionEvent extends BaseUIEvent {
  category: 'agent';
  type: 'agent:action';
  data: {
    agentId: string;
    action: AgentAction;
    details?: string;
    progress?: number;
  };
}

export interface AgentCompletedEvent extends BaseUIEvent {
  category: 'agent';
  type: 'agent:completed';
  data: {
    agentId: string;
    durationMs: number;
    status: 'success' | 'failed' | 'cancelled';
    result?: string;
  };
}

export interface AgentErrorEvent extends BaseUIEvent {
  category: 'agent';
  type: 'agent:error';
  data: {
    agentId: string;
    error: string;
    recoverable: boolean;
    phase: AgentAction;
  };
}

export type AgentEvent =
  | AgentSpawnedEvent
  | AgentThinkingEvent
  | AgentActionEvent
  | AgentCompletedEvent
  | AgentErrorEvent;

// ============================================================================
// Preview Events (for cooking preview visualization)
// ============================================================================

export interface PreviewReadyEvent extends BaseUIEvent {
  category: 'preview';
  type: 'preview:ready';
  data: {
    sceneIndex: number;
    sceneId: string;
    videoPath: string;
    thumbnailPath?: string;
    durationSeconds: number;
  };
}

export interface PreviewAllCompleteEvent extends BaseUIEvent {
  category: 'preview';
  type: 'preview:all_complete';
  data: {
    totalScenes: number;
    scenePaths: Array<{
      sceneIndex: number;
      sceneId: string;
      videoPath: string;
    }>;
    finalVideoPath?: string;
  };
}

export interface PreviewErrorEvent extends BaseUIEvent {
  category: 'preview';
  type: 'preview:error';
  data: {
    sceneIndex?: number;
    sceneId?: string;
    error: string;
  };
}

export type PreviewEvent =
  | PreviewReadyEvent
  | PreviewAllCompleteEvent
  | PreviewErrorEvent;

// ============================================================================
// Union Type
// ============================================================================

export type UIEvent =
  | DirectorEvent
  | SceneEvent
  | EvaluationEvent
  | RenderEvent
  | SystemEvent
  | AgentEvent
  | PreviewEvent;

// ============================================================================
// Type Guards
// ============================================================================

export function isDirectorEvent(event: UIEvent): event is DirectorEvent {
  return event.category === 'director';
}

export function isSceneEvent(event: UIEvent): event is SceneEvent {
  return event.category === 'scene';
}

export function isEvaluationEvent(event: UIEvent): event is EvaluationEvent {
  return event.category === 'evaluation';
}

export function isRenderEvent(event: UIEvent): event is RenderEvent {
  return event.category === 'render';
}

export function isSystemEvent(event: UIEvent): event is SystemEvent {
  return event.category === 'system';
}

export function isAgentEvent(event: UIEvent): event is AgentEvent {
  return event.category === 'agent';
}

export function isPreviewEvent(event: UIEvent): event is PreviewEvent {
  return event.category === 'preview';
}

// ============================================================================
// UI-Specific Derived State
// ============================================================================

export interface SceneUIState {
  sceneId: string;
  sceneIndex: number;
  sceneNumber: number;
  version: number;
  status: SceneStatus;
  lastDecision?: SceneDecision;
  score?: number;
  scoreHistory: number[];
  feedback?: string;
  videoPath?: string;
  attempts: number;
  isLocked: boolean;
  error?: string;
  renderProgress?: number;
  evaluationProgress?: number;
}

export interface DirectorUIState {
  phase: DirectorPhase | null;
  isActive: boolean;
  totalScenes: number;
  thoughts: DirectorThought[];
  decisions: DirectorDecisionData[];
  error?: string;
  isRecoverable?: boolean;
}

export interface DirectorThought {
  id: string;
  thought: string;
  phase: DirectorPhase;
  timestamp: number;
}

export interface DirectorDecisionData {
  id: string;
  decision: string;
  reasoning: string;
  affectedScenes: string[];
  timestamp: number;
}

// ============================================================================
// Agent Hierarchy State (for new UI)
// ============================================================================

export interface AgentThought {
  id: string;
  thought: string;
  timestamp: number;
  isStreaming?: boolean;
}

export interface SpawnedAgentState {
  agentId: string;
  sceneIndex: number;
  sceneName: string;
  status: AgentStatus;
  currentAction?: AgentAction;
  actionProgress?: number;
  actionDetails?: string;
  thoughts: AgentThought[];
  currentThought?: string;
  isThinkingStreaming: boolean;
  startedAt: number;
  completedAt?: number;
  durationMs?: number;
  result?: string;
  error?: string;
}

export interface PreviewSceneState {
  sceneIndex: number;
  sceneId: string;
  videoPath: string;
  thumbnailPath?: string;
  durationSeconds: number;
  isReady: boolean;
}

export interface PreviewState {
  readyScenes: PreviewSceneState[];
  allComplete: boolean;
  finalVideoPath?: string;
  totalScenes: number;
  error?: string;
}

export interface OrchestrationState {
  projectId: string;
  isConnected: boolean;
  events: UIEvent[];
  director: DirectorUIState;
  scenes: Map<string, SceneUIState>;
  
  // Agent hierarchy (new)
  agents: {
    director: DirectorUIState;
    spawned: Map<string, SpawnedAgentState>;
  };
  
  // Preview state (new)
  preview: PreviewState;
  
  // Derived state
  overallProgress: number;
  overallScore: number;
  trend: TrendDirection;
  passedScenes: number;
  totalScenes: number;
  isComplete: boolean;
  
  // System health
  systemHealth: {
    redis: 'connected' | 'disconnected';
    queues: Record<string, number>;
    workers: Record<string, boolean>;
  } | null;
  
  error: Error | null;
}

// ============================================================================
// Quiet Mode Event Grouping
// ============================================================================

export interface CollapsedEventGroup {
  type: string;
  count: number;
  firstEvent: UIEvent;
  lastEvent: UIEvent;
  collapsed: boolean;
}

// ============================================================================
// Intervention Controls
// ============================================================================

export type InterventionAction = 'kill' | 'pause' | 'resume' | 'approve-all';

export interface InterventionState {
  isPaused: boolean;
  hasRunningScenes: boolean;
  canApproveAll: boolean;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate trend direction from score history
 */
export function calculateTrend(scores: number[]): TrendDirection {
  if (scores.length < 2) return 'plateau';
  const recent = scores.slice(-3);
  if (recent.length < 2) return 'plateau';
  const diff = recent[recent.length - 1] - recent[0];
  if (diff > 5) return 'improving';
  if (diff < -5) return 'regressing';
  return 'plateau';
}

/**
 * Group consecutive events of the same type for quiet mode
 */
export function groupConsecutiveEvents(events: UIEvent[]): (UIEvent | CollapsedEventGroup)[] {
  const result: (UIEvent | CollapsedEventGroup)[] = [];
  let currentGroup: UIEvent[] = [];
  
  for (const event of events) {
    if (currentGroup.length === 0) {
      currentGroup.push(event);
    } else if (currentGroup[0].type === event.type) {
      currentGroup.push(event);
    } else {
      // Flush current group
      if (currentGroup.length >= 3) {
        result.push({
          type: currentGroup[0].type,
          count: currentGroup.length,
          firstEvent: currentGroup[0],
          lastEvent: currentGroup[currentGroup.length - 1],
          collapsed: true,
        });
      } else {
        result.push(...currentGroup);
      }
      currentGroup = [event];
    }
  }
  
  // Flush remaining
  if (currentGroup.length >= 3) {
    result.push({
      type: currentGroup[0].type,
      count: currentGroup.length,
      firstEvent: currentGroup[0],
      lastEvent: currentGroup[currentGroup.length - 1],
      collapsed: true,
    });
  } else {
    result.push(...currentGroup);
  }
  
  return result;
}

/**
 * Check if an item is a collapsed event group
 */
export function isCollapsedGroup(item: UIEvent | CollapsedEventGroup): item is CollapsedEventGroup {
  return 'collapsed' in item && item.collapsed === true;
}

/**
 * Format relative time for display
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 1000) return 'now';
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}

/**
 * Get status color for scene
 */
export function getStatusColor(status: SceneStatus): string {
  const colors: Record<SceneStatus, string> = {
    pending: 'text-gray-400',
    generating: 'text-blue-500',
    rendering: 'text-orange-500',
    evaluating: 'text-purple-500',
    passed: 'text-green-500',
    failed: 'text-red-500',
  };
  return colors[status];
}

/**
 * Get status background color for scene
 */
export function getStatusBgColor(status: SceneStatus): string {
  const colors: Record<SceneStatus, string> = {
    pending: 'bg-gray-400/10',
    generating: 'bg-blue-500/10',
    rendering: 'bg-orange-500/10',
    evaluating: 'bg-purple-500/10',
    passed: 'bg-green-500/10',
    failed: 'bg-red-500/10',
  };
  return colors[status];
}

/**
 * Get category icon name
 */
export function getCategoryIcon(category: EventCategory): string {
  const icons: Record<EventCategory, string> = {
    director: 'brain',
    scene: 'film',
    evaluation: 'check-circle',
    render: 'play',
    system: 'cog',
    agent: 'user',
    preview: 'eye',
  };
  return icons[category];
}

/**
 * Get category color
 */
export function getCategoryColor(category: EventCategory): string {
  const colors: Record<EventCategory, string> = {
    director: 'text-blue-500',
    scene: 'text-green-500',
    evaluation: 'text-purple-500',
    render: 'text-orange-500',
    system: 'text-gray-500',
    agent: 'text-cyan-500',
    preview: 'text-pink-500',
  };
  return colors[category];
}
