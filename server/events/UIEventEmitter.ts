/**
 * UI Event Emitter
 * 
 * Publishes events to Redis Streams for real-time UI updates.
 * Uses XADD for publishing and supports per-project streams.
 */

import { getRedisConnection } from '../queues/redisConnection.js';
import {
  UIEvent,
  BaseUIEvent,
  EventCategory,
  STREAM_KEYS,
  DirectorStartedEvent,
  DirectorThinkingEvent,
  DirectorDecisionEvent,
  DirectorCompletedEvent,
  DirectorErrorEvent,
  SceneQueuedEvent,
  SceneGeneratingEvent,
  SceneGeneratedEvent,
  SceneRenderingEvent,
  SceneRenderedEvent,
  SceneErrorEvent,
  EvaluationStartedEvent,
  EvaluationProgressEvent,
  EvaluationCompletedEvent,
  EvaluationEscalatedEvent,
  RenderStartedEvent,
  RenderProgressEvent,
  RenderCompletedEvent,
  RenderErrorEvent,
  SystemHealthEvent,
  SystemErrorEvent,
  // New agent events
  AgentSpawnedEvent,
  AgentThinkingEvent,
  AgentActionEvent,
  AgentCompletedEvent,
  AgentErrorEvent,
  // New preview events
  PreviewReadyEvent,
  PreviewAllCompleteEvent,
  PreviewErrorEvent,
} from './types.js';

// Stream configuration
const MAX_STREAM_LENGTH = 10000; // Max entries per stream before trimming
const STREAM_TTL_SECONDS = 86400; // 24 hours

/**
 * UI Event Emitter class
 * 
 * Singleton that manages event publishing to Redis Streams.
 */
class UIEventEmitter {
  private static instance: UIEventEmitter | null = null;

  private constructor() {}

  static getInstance(): UIEventEmitter {
    if (!UIEventEmitter.instance) {
      UIEventEmitter.instance = new UIEventEmitter();
    }
    return UIEventEmitter.instance;
  }

  /**
   * Emit an event to Redis Streams
   */
  async emit<T extends UIEvent>(
    projectId: string,
    type: T['type'],
    category: EventCategory,
    data: T['data']
  ): Promise<string> {
    const redis = getRedisConnection();
    const timestamp = Date.now();
    
    const event: Omit<BaseUIEvent, 'id'> & { data: T['data'] } = {
      projectId,
      timestamp,
      category,
      type,
      data,
    };

    // Serialize event data
    const fields: string[] = [
      'projectId', projectId,
      'timestamp', timestamp.toString(),
      'category', category,
      'type', type,
      'data', JSON.stringify(data),
    ];

    // Publish to project-specific stream
    const streamKey = STREAM_KEYS.projectEvents(projectId);
    
    // XADD with MAXLEN for automatic trimming
    const eventId = await redis.xadd(
      streamKey,
      'MAXLEN',
      '~',
      MAX_STREAM_LENGTH.toString(),
      '*',
      ...fields
    );

    // Set TTL on stream if this is the first entry
    await redis.expire(streamKey, STREAM_TTL_SECONDS);

    console.log(`[UIEvent] ${type} -> ${streamKey} (${eventId})`);
    
    return eventId as string;
  }

  // ============================================================================
  // Director Events
  // ============================================================================

  async directorStarted(
    projectId: string,
    data: DirectorStartedEvent['data']
  ): Promise<string> {
    return this.emit<DirectorStartedEvent>(
      projectId,
      'director:started',
      'director',
      data
    );
  }

  async directorThinking(
    projectId: string,
    data: DirectorThinkingEvent['data']
  ): Promise<string> {
    return this.emit<DirectorThinkingEvent>(
      projectId,
      'director:thinking',
      'director',
      data
    );
  }

  async directorDecision(
    projectId: string,
    data: DirectorDecisionEvent['data']
  ): Promise<string> {
    return this.emit<DirectorDecisionEvent>(
      projectId,
      'director:decision',
      'director',
      data
    );
  }

  async directorCompleted(
    projectId: string,
    data: DirectorCompletedEvent['data']
  ): Promise<string> {
    return this.emit<DirectorCompletedEvent>(
      projectId,
      'director:completed',
      'director',
      data
    );
  }

  async directorError(
    projectId: string,
    data: DirectorErrorEvent['data']
  ): Promise<string> {
    return this.emit<DirectorErrorEvent>(
      projectId,
      'director:error',
      'director',
      data
    );
  }

  // ============================================================================
  // Scene Events
  // ============================================================================

  async sceneQueued(
    projectId: string,
    data: SceneQueuedEvent['data']
  ): Promise<string> {
    return this.emit<SceneQueuedEvent>(
      projectId,
      'scene:queued',
      'scene',
      data
    );
  }

  async sceneGenerating(
    projectId: string,
    data: SceneGeneratingEvent['data']
  ): Promise<string> {
    return this.emit<SceneGeneratingEvent>(
      projectId,
      'scene:generating',
      'scene',
      data
    );
  }

  async sceneGenerated(
    projectId: string,
    data: SceneGeneratedEvent['data']
  ): Promise<string> {
    return this.emit<SceneGeneratedEvent>(
      projectId,
      'scene:generated',
      'scene',
      data
    );
  }

  async sceneRendering(
    projectId: string,
    data: SceneRenderingEvent['data']
  ): Promise<string> {
    return this.emit<SceneRenderingEvent>(
      projectId,
      'scene:rendering',
      'scene',
      data
    );
  }

  async sceneRendered(
    projectId: string,
    data: SceneRenderedEvent['data']
  ): Promise<string> {
    return this.emit<SceneRenderedEvent>(
      projectId,
      'scene:rendered',
      'scene',
      data
    );
  }

  async sceneError(
    projectId: string,
    data: SceneErrorEvent['data']
  ): Promise<string> {
    return this.emit<SceneErrorEvent>(
      projectId,
      'scene:error',
      'scene',
      data
    );
  }

  // ============================================================================
  // Evaluation Events
  // ============================================================================

  async evaluationStarted(
    projectId: string,
    data: EvaluationStartedEvent['data']
  ): Promise<string> {
    return this.emit<EvaluationStartedEvent>(
      projectId,
      'evaluation:started',
      'evaluation',
      data
    );
  }

  async evaluationProgress(
    projectId: string,
    data: EvaluationProgressEvent['data']
  ): Promise<string> {
    return this.emit<EvaluationProgressEvent>(
      projectId,
      'evaluation:progress',
      'evaluation',
      data
    );
  }

  async evaluationCompleted(
    projectId: string,
    data: EvaluationCompletedEvent['data']
  ): Promise<string> {
    return this.emit<EvaluationCompletedEvent>(
      projectId,
      'evaluation:completed',
      'evaluation',
      data
    );
  }

  async evaluationEscalated(
    projectId: string,
    data: EvaluationEscalatedEvent['data']
  ): Promise<string> {
    return this.emit<EvaluationEscalatedEvent>(
      projectId,
      'evaluation:escalated',
      'evaluation',
      data
    );
  }

  // ============================================================================
  // Render Events
  // ============================================================================

  async renderStarted(
    projectId: string,
    data: RenderStartedEvent['data']
  ): Promise<string> {
    return this.emit<RenderStartedEvent>(
      projectId,
      'render:started',
      'render',
      data
    );
  }

  async renderProgress(
    projectId: string,
    data: RenderProgressEvent['data']
  ): Promise<string> {
    return this.emit<RenderProgressEvent>(
      projectId,
      'render:progress',
      'render',
      data
    );
  }

  async renderCompleted(
    projectId: string,
    data: RenderCompletedEvent['data']
  ): Promise<string> {
    return this.emit<RenderCompletedEvent>(
      projectId,
      'render:completed',
      'render',
      data
    );
  }

  async renderError(
    projectId: string,
    data: RenderErrorEvent['data']
  ): Promise<string> {
    return this.emit<RenderErrorEvent>(
      projectId,
      'render:error',
      'render',
      data
    );
  }

  // ============================================================================
  // System Events
  // ============================================================================

  async systemHealth(
    projectId: string,
    data: SystemHealthEvent['data']
  ): Promise<string> {
    return this.emit<SystemHealthEvent>(
      projectId,
      'system:health',
      'system',
      data
    );
  }

  async systemError(
    projectId: string,
    data: SystemErrorEvent['data']
  ): Promise<string> {
    return this.emit<SystemErrorEvent>(
      projectId,
      'system:error',
      'system',
      data
    );
  }

  // ============================================================================
  // Agent Events (for agent hierarchy visualization)
  // ============================================================================

  async agentSpawned(
    projectId: string,
    data: AgentSpawnedEvent['data']
  ): Promise<string> {
    return this.emit<AgentSpawnedEvent>(
      projectId,
      'agent:spawned',
      'agent',
      data
    );
  }

  async agentThinking(
    projectId: string,
    data: AgentThinkingEvent['data']
  ): Promise<string> {
    return this.emit<AgentThinkingEvent>(
      projectId,
      'agent:thinking',
      'agent',
      data
    );
  }

  async agentAction(
    projectId: string,
    data: AgentActionEvent['data']
  ): Promise<string> {
    return this.emit<AgentActionEvent>(
      projectId,
      'agent:action',
      'agent',
      data
    );
  }

  async agentCompleted(
    projectId: string,
    data: AgentCompletedEvent['data']
  ): Promise<string> {
    return this.emit<AgentCompletedEvent>(
      projectId,
      'agent:completed',
      'agent',
      data
    );
  }

  async agentError(
    projectId: string,
    data: AgentErrorEvent['data']
  ): Promise<string> {
    return this.emit<AgentErrorEvent>(
      projectId,
      'agent:error',
      'agent',
      data
    );
  }

  // ============================================================================
  // Preview Events (for cooking preview visualization)
  // ============================================================================

  async previewReady(
    projectId: string,
    data: PreviewReadyEvent['data']
  ): Promise<string> {
    return this.emit<PreviewReadyEvent>(
      projectId,
      'preview:ready',
      'preview',
      data
    );
  }

  async previewAllComplete(
    projectId: string,
    data: PreviewAllCompleteEvent['data']
  ): Promise<string> {
    return this.emit<PreviewAllCompleteEvent>(
      projectId,
      'preview:all_complete',
      'preview',
      data
    );
  }

  async previewError(
    projectId: string,
    data: PreviewErrorEvent['data']
  ): Promise<string> {
    return this.emit<PreviewErrorEvent>(
      projectId,
      'preview:error',
      'preview',
      data
    );
  }
}

// Export singleton instance
export const uiEvents = UIEventEmitter.getInstance();

// Export class for testing
export { UIEventEmitter };

// ============================================================================
// Stream Reader Utilities
// ============================================================================

export interface StreamEntry {
  id: string;
  projectId: string;
  timestamp: number;
  category: EventCategory;
  type: string;
  data: Record<string, unknown>;
}

/**
 * Parse a Redis Stream entry into a structured event
 */
export function parseStreamEntry(
  id: string,
  fields: string[]
): StreamEntry {
  const entry: Record<string, string> = {};
  
  for (let i = 0; i < fields.length; i += 2) {
    entry[fields[i]] = fields[i + 1];
  }

  return {
    id,
    projectId: entry.projectId,
    timestamp: parseInt(entry.timestamp, 10),
    category: entry.category as EventCategory,
    type: entry.type,
    data: JSON.parse(entry.data),
  };
}

/**
 * Read events from a project stream
 */
export async function readProjectEvents(
  projectId: string,
  lastId: string = '0',
  count: number = 100
): Promise<StreamEntry[]> {
  const redis = getRedisConnection();
  const streamKey = STREAM_KEYS.projectEvents(projectId);
  
  const result = await redis.xread(
    'COUNT',
    count.toString(),
    'STREAMS',
    streamKey,
    lastId
  );

  if (!result || result.length === 0) {
    return [];
  }

  const [, entries] = result[0] as [string, [string, string[]][]];
  
  return entries.map(([id, fields]) => parseStreamEntry(id, fields));
}

/**
 * Read events with blocking (for SSE)
 * Returns null if timeout expires
 */
export async function readProjectEventsBlocking(
  projectId: string,
  lastId: string = '$',
  blockMs: number = 5000,
  count: number = 100
): Promise<StreamEntry[] | null> {
  const redis = getRedisConnection();
  const streamKey = STREAM_KEYS.projectEvents(projectId);
  
  // Use call() to avoid TypeScript overload issues with BLOCK parameter
  const result = await redis.call(
    'XREAD',
    'BLOCK',
    blockMs.toString(),
    'COUNT',
    count.toString(),
    'STREAMS',
    streamKey,
    lastId
  ) as [string, [string, string[]][]][] | null;

  if (!result || result.length === 0) {
    return null; // Timeout
  }

  const [, entries] = result[0];
  
  return entries.map(([id, fields]) => parseStreamEntry(id, fields));
}

/**
 * Get the latest event ID from a stream
 */
export async function getLatestEventId(projectId: string): Promise<string | null> {
  const redis = getRedisConnection();
  const streamKey = STREAM_KEYS.projectEvents(projectId);
  
  const info = await redis.xinfo('STREAM', streamKey).catch(() => null);
  
  if (!info) {
    return null;
  }

  // Parse XINFO STREAM response to get last-generated-id
  const infoArray = info as unknown[];
  for (let i = 0; i < infoArray.length; i += 2) {
    if (infoArray[i] === 'last-generated-id') {
      return infoArray[i + 1] as string;
    }
  }

  return null;
}

/**
 * Delete a project's event stream
 */
export async function deleteProjectStream(projectId: string): Promise<void> {
  const redis = getRedisConnection();
  const streamKey = STREAM_KEYS.projectEvents(projectId);
  await redis.del(streamKey);
}
