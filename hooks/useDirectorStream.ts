/**
 * useDirectorStream Hook
 * 
 * SSE hook for consuming real-time events from the Director-Agent system.
 * Connects to /api/events/:projectId and maintains derived UI state.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  UIEvent,
  OrchestrationState,
  SceneUIState,
  DirectorUIState,
  DirectorThought,
  DirectorDecisionData,
  TrendDirection,
  SceneStatus,
  SpawnedAgentState,
  PreviewState,
  PreviewSceneState,
  AgentThought,
  AgentStatus,
  isDirectorEvent,
  isSceneEvent,
  isEvaluationEvent,
  isRenderEvent,
  isSystemEvent,
  isAgentEvent,
  isPreviewEvent,
  calculateTrend,
} from '../types/orchestration';

// ============================================================================
// Types
// ============================================================================

export interface UseDirectorStreamOptions {
  projectId: string;
  enabled?: boolean;
  onEvent?: (event: UIEvent) => void;
  onError?: (error: Error) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  maxReconnectAttempts?: number;
  reconnectInterval?: number;
}

export interface UseDirectorStreamReturn {
  state: OrchestrationState;
  isConnected: boolean;
  error: Error | null;
  reconnect: () => void;
  disconnect: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

function createInitialState(projectId: string): OrchestrationState {
  const initialDirector: DirectorUIState = {
    phase: null,
    isActive: false,
    totalScenes: 0,
    thoughts: [],
    decisions: [],
  };
  
  const initialPreview: PreviewState = {
    readyScenes: [],
    allComplete: false,
    totalScenes: 0,
  };
  
  return {
    projectId,
    isConnected: false,
    events: [],
    director: initialDirector,
    scenes: new Map(),
    
    // New agent hierarchy
    agents: {
      director: initialDirector,
      spawned: new Map(),
    },
    
    // New preview state
    preview: initialPreview,
    
    overallProgress: 0,
    overallScore: 0,
    trend: 'plateau',
    passedScenes: 0,
    totalScenes: 0,
    isComplete: false,
    systemHealth: null,
    error: null,
  };
}

// ============================================================================
// Event Processors
// ============================================================================

function processDirectorEvent(
  event: UIEvent,
  state: OrchestrationState
): Partial<OrchestrationState> {
  if (!isDirectorEvent(event)) return {};

  const updates: Partial<OrchestrationState> = {};
  const directorUpdates: Partial<DirectorUIState> = {};

  switch (event.type) {
    case 'director:started':
      directorUpdates.phase = 'planning';
      directorUpdates.isActive = true;
      directorUpdates.totalScenes = event.data.totalScenes;
      updates.totalScenes = event.data.totalScenes;
      break;

    case 'director:thinking':
      directorUpdates.phase = event.data.phase;
      const thought: DirectorThought = {
        id: event.id,
        thought: event.data.thought,
        phase: event.data.phase,
        timestamp: event.timestamp,
      };
      directorUpdates.thoughts = [...state.director.thoughts, thought];
      break;

    case 'director:decision':
      const decision: DirectorDecisionData = {
        id: event.id,
        decision: event.data.decision,
        reasoning: event.data.reasoning,
        affectedScenes: event.data.affectedScenes,
        timestamp: event.timestamp,
      };
      directorUpdates.decisions = [...state.director.decisions, decision];
      break;

    case 'director:completed':
      directorUpdates.phase = null;
      directorUpdates.isActive = false;
      updates.isComplete = true;
      updates.overallScore = event.data.finalScore;
      break;

    case 'director:error':
      directorUpdates.error = event.data.error;
      directorUpdates.isRecoverable = event.data.recoverable;
      if (!event.data.recoverable) {
        directorUpdates.isActive = false;
      }
      break;
  }

  if (Object.keys(directorUpdates).length > 0) {
    const updatedDirector = { ...state.director, ...directorUpdates };
    updates.director = updatedDirector;
    // Keep agents.director in sync with director state
    updates.agents = {
      ...state.agents,
      director: updatedDirector,
    };
  }

  return updates;
}

function processSceneEvent(
  event: UIEvent,
  state: OrchestrationState
): Partial<OrchestrationState> {
  if (!isSceneEvent(event)) return {};

  const scenes = new Map(state.scenes);
  const sceneId = event.data.sceneId;
  const existing = scenes.get(sceneId);

  const baseScene: SceneUIState = existing || {
    sceneId,
    sceneIndex: event.data.sceneIndex,
    sceneNumber: event.data.sceneNumber,
    version: event.data.version,
    status: 'pending',
    scoreHistory: [],
    attempts: 0,
    isLocked: false,
  };

  let updatedScene: SceneUIState = { ...baseScene };

  switch (event.type) {
    case 'scene:queued':
      updatedScene.status = 'pending';
      updatedScene.version = event.data.version;
      break;

    case 'scene:generating':
      updatedScene.status = 'generating';
      updatedScene.version = event.data.version;
      updatedScene.attempts = event.data.attempt;
      break;

    case 'scene:generated':
      // Stay in generating status until render starts
      updatedScene.version = event.data.version;
      break;

    case 'scene:rendering':
      updatedScene.status = 'rendering';
      updatedScene.version = event.data.version;
      updatedScene.renderProgress = 0;
      break;

    case 'scene:rendered':
      // Move to evaluating or passed (depends on evaluation)
      updatedScene.videoPath = event.data.videoPath;
      updatedScene.renderProgress = 100;
      break;

    case 'scene:error':
      updatedScene.status = 'failed';
      updatedScene.error = event.data.error;
      break;
  }

  scenes.set(sceneId, updatedScene);

  return {
    scenes,
    ...recalculateDerivedState(scenes, state.totalScenes),
  };
}

function processEvaluationEvent(
  event: UIEvent,
  state: OrchestrationState
): Partial<OrchestrationState> {
  if (!isEvaluationEvent(event)) return {};

  // Only handle scene-level evaluations (tier 1)
  if (!event.data.sceneId) return {};

  const scenes = new Map(state.scenes);
  const sceneId = event.data.sceneId;
  const existing = scenes.get(sceneId);

  if (!existing) return {};

  let updatedScene: SceneUIState = { ...existing };

  switch (event.type) {
    case 'evaluation:started':
      updatedScene.status = 'evaluating';
      updatedScene.evaluationProgress = 0;
      break;

    case 'evaluation:progress':
      updatedScene.evaluationProgress = event.data.progress;
      break;

    case 'evaluation:completed':
      // Convert score from 0-1 decimal to 0-100 percentage
      updatedScene.score = event.data.score * 100;
      updatedScene.feedback = event.data.feedback;
      updatedScene.scoreHistory = [...updatedScene.scoreHistory, event.data.score * 100];
      
      if (event.data.passed) {
        updatedScene.status = 'passed';
        updatedScene.lastDecision = 'pass';
        updatedScene.isLocked = true;
      } else {
        // Will go back to generating
        updatedScene.lastDecision = 'refine';
      }
      updatedScene.evaluationProgress = 100;
      break;

    case 'evaluation:escalated':
      updatedScene.status = 'failed';
      updatedScene.lastDecision = 'fail';
      updatedScene.error = `Escalated: ${event.data.reason}`;
      break;
  }

  scenes.set(sceneId, updatedScene);

  return {
    scenes,
    ...recalculateDerivedState(scenes, state.totalScenes),
  };
}

function processRenderEvent(
  event: UIEvent,
  state: OrchestrationState
): Partial<OrchestrationState> {
  if (!isRenderEvent(event)) return {};

  // Handle scene renders
  if (event.data.phase === 'scene' && event.data.sceneId) {
    const scenes = new Map(state.scenes);
    const sceneId = event.data.sceneId;
    const existing = scenes.get(sceneId);

    if (!existing) return {};

    let updatedScene: SceneUIState = { ...existing };

    switch (event.type) {
      case 'render:progress':
        updatedScene.renderProgress = event.data.progress;
        break;

      case 'render:completed':
        updatedScene.renderProgress = 100;
        updatedScene.videoPath = event.data.outputPath;
        break;

      case 'render:error':
        updatedScene.status = 'failed';
        updatedScene.error = event.data.error;
        break;
    }

    scenes.set(sceneId, updatedScene);

    return {
      scenes,
      ...recalculateDerivedState(scenes, state.totalScenes),
    };
  }

  return {};
}

function processSystemEvent(
  event: UIEvent,
  state: OrchestrationState
): Partial<OrchestrationState> {
  if (!isSystemEvent(event)) return {};

  switch (event.type) {
    case 'system:health':
      return {
        systemHealth: {
          redis: event.data.redis,
          queues: event.data.queues,
          workers: event.data.workers,
        },
      };

    case 'system:error':
      if (event.data.fatal) {
        return {
          error: new Error(`${event.data.component}: ${event.data.error}`),
        };
      }
      break;
  }

  return {};
}

function processAgentEvent(
  event: UIEvent,
  state: OrchestrationState
): Partial<OrchestrationState> {
  if (!isAgentEvent(event)) return {};

  const spawnedAgents = new Map(state.agents.spawned);

  switch (event.type) {
    case 'agent:spawned': {
      const newAgent: SpawnedAgentState = {
        agentId: event.data.agentId,
        sceneIndex: event.data.sceneIndex,
        sceneName: event.data.sceneName,
        status: 'spawning',
        thoughts: [],
        isThinkingStreaming: false,
        startedAt: event.timestamp,
      };
      spawnedAgents.set(event.data.agentId, newAgent);
      break;
    }

    case 'agent:thinking': {
      const agent = spawnedAgents.get(event.data.agentId);
      if (agent) {
        const updatedAgent: SpawnedAgentState = {
          ...agent,
          status: 'thinking',
          currentThought: event.data.thought,
          isThinkingStreaming: event.data.isStreaming,
        };
        
        // If not streaming, add to thought history
        if (!event.data.isStreaming) {
          const thought: AgentThought = {
            id: event.id,
            thought: event.data.thought,
            timestamp: event.timestamp,
          };
          updatedAgent.thoughts = [...agent.thoughts, thought];
          updatedAgent.currentThought = undefined;
          updatedAgent.isThinkingStreaming = false;
        }
        
        spawnedAgents.set(event.data.agentId, updatedAgent);
      }
      break;
    }

    case 'agent:action': {
      const agent = spawnedAgents.get(event.data.agentId);
      if (agent) {
        // Map action to status
        let status: AgentStatus = agent.status;
        if (event.data.action === 'generating_code' || event.data.action === 'validating_code') {
          status = 'generating';
        } else if (event.data.action === 'rendering_scene') {
          status = 'rendering';
        }
        
        spawnedAgents.set(event.data.agentId, {
          ...agent,
          status,
          currentAction: event.data.action,
          actionProgress: event.data.progress,
          actionDetails: event.data.details,
        });
      }
      break;
    }

    case 'agent:completed': {
      const agent = spawnedAgents.get(event.data.agentId);
      if (agent) {
        spawnedAgents.set(event.data.agentId, {
          ...agent,
          status: event.data.status === 'success' ? 'completed' : 'error',
          completedAt: event.timestamp,
          durationMs: event.data.durationMs,
          result: event.data.result,
          currentAction: undefined,
          actionProgress: undefined,
          isThinkingStreaming: false,
          currentThought: undefined,
        });
      }
      break;
    }

    case 'agent:error': {
      const agent = spawnedAgents.get(event.data.agentId);
      if (agent) {
        spawnedAgents.set(event.data.agentId, {
          ...agent,
          status: 'error',
          error: event.data.error,
          completedAt: event.timestamp,
          isThinkingStreaming: false,
        });
      }
      break;
    }
  }

  return {
    agents: {
      ...state.agents,
      spawned: spawnedAgents,
    },
  };
}

function processPreviewEvent(
  event: UIEvent,
  state: OrchestrationState
): Partial<OrchestrationState> {
  if (!isPreviewEvent(event)) return {};

  switch (event.type) {
    case 'preview:ready': {
      const newScene: PreviewSceneState = {
        sceneIndex: event.data.sceneIndex,
        sceneId: event.data.sceneId,
        videoPath: event.data.videoPath,
        thumbnailPath: event.data.thumbnailPath,
        durationSeconds: event.data.durationSeconds,
        isReady: true,
      };
      
      // Add scene, maintaining sorted order by sceneIndex
      const readyScenes = [...state.preview.readyScenes.filter(
        s => s.sceneIndex !== event.data.sceneIndex
      ), newScene].sort((a, b) => a.sceneIndex - b.sceneIndex);
      
      return {
        preview: {
          ...state.preview,
          readyScenes,
        },
      };
    }

    case 'preview:all_complete': {
      // Convert scene paths to PreviewSceneState format
      const readyScenes: PreviewSceneState[] = event.data.scenePaths.map(sp => ({
        sceneIndex: sp.sceneIndex,
        sceneId: sp.sceneId,
        videoPath: sp.videoPath,
        durationSeconds: 5, // Default, could be passed from backend
        isReady: true,
      }));
      
      return {
        preview: {
          ...state.preview,
          readyScenes,
          allComplete: true,
          finalVideoPath: event.data.finalVideoPath,
          totalScenes: event.data.totalScenes,
        },
      };
    }

    case 'preview:error': {
      return {
        preview: {
          ...state.preview,
          error: event.data.error,
        },
      };
    }
  }

  return {};
}

function recalculateDerivedState(
  scenes: Map<string, SceneUIState>,
  totalScenes: number
): Partial<OrchestrationState> {
  const sceneArray = Array.from(scenes.values());
  const passedScenes = sceneArray.filter(s => s.status === 'passed').length;
  const failedScenes = sceneArray.filter(s => s.status === 'failed').length;
  
  // Calculate overall progress
  const completedScenes = passedScenes + failedScenes;
  const overallProgress = totalScenes > 0 
    ? Math.round((completedScenes / totalScenes) * 100)
    : 0;

  // Calculate overall score (average of passed scenes)
  const passedWithScores = sceneArray.filter(s => s.status === 'passed' && s.score !== undefined);
  const overallScore = passedWithScores.length > 0
    ? Math.round(passedWithScores.reduce((sum, s) => sum + (s.score || 0), 0) / passedWithScores.length)
    : 0;

  // Calculate trend from all score history
  const allScores = sceneArray.flatMap(s => s.scoreHistory);
  const trend = calculateTrend(allScores);

  // Check if complete
  const isComplete = totalScenes > 0 && completedScenes === totalScenes;

  return {
    passedScenes,
    overallProgress,
    overallScore,
    trend,
    isComplete,
  };
}

// ============================================================================
// Main Hook
// ============================================================================

export function useDirectorStream(options: UseDirectorStreamOptions): UseDirectorStreamReturn {
  const {
    projectId,
    enabled = true,
    onEvent,
    onError,
    onConnect,
    onDisconnect,
    maxReconnectAttempts = 5,
    reconnectInterval = 2000,
  } = options;

  const [state, setState] = useState<OrchestrationState>(() => createInitialState(projectId));
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Process incoming event
  const processEvent = useCallback((event: UIEvent) => {
    setState(prevState => {
      const updates: Partial<OrchestrationState> = {
        events: [...prevState.events, event],
      };

      // Process based on category
      if (isDirectorEvent(event)) {
        Object.assign(updates, processDirectorEvent(event, prevState));
      } else if (isSceneEvent(event)) {
        Object.assign(updates, processSceneEvent(event, prevState));
      } else if (isEvaluationEvent(event)) {
        Object.assign(updates, processEvaluationEvent(event, prevState));
      } else if (isRenderEvent(event)) {
        Object.assign(updates, processRenderEvent(event, prevState));
      } else if (isSystemEvent(event)) {
        Object.assign(updates, processSystemEvent(event, prevState));
      } else if (isAgentEvent(event)) {
        Object.assign(updates, processAgentEvent(event, prevState));
      } else if (isPreviewEvent(event)) {
        Object.assign(updates, processPreviewEvent(event, prevState));
      }

      return { ...prevState, ...updates };
    });

    onEvent?.(event);
  }, [onEvent]);

  // All event types that the backend can send
  const EVENT_TYPES = [
    // Director events
    'director:started', 'director:thinking', 'director:decision', 
    'director:completed', 'director:error',
    // Scene events
    'scene:queued', 'scene:generating', 'scene:generated',
    'scene:rendering', 'scene:rendered', 'scene:error',
    // Evaluation events
    'evaluation:started', 'evaluation:progress', 'evaluation:completed', 'evaluation:escalated',
    // Render events
    'render:started', 'render:progress', 'render:completed', 'render:error',
    // System events
    'system:health', 'system:error',
    // Agent events (new)
    'agent:spawned', 'agent:thinking', 'agent:action', 'agent:completed', 'agent:error',
    // Preview events (new)
    'preview:ready', 'preview:all_complete', 'preview:error'
  ];

  // Connect to SSE
  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const url = `${baseUrl}/api/events/${projectId}`;

    try {
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
        onConnect?.();
      };

      // Handle generic messages (fallback)
      eventSource.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data) as UIEvent;
          processEvent(event);
        } catch (parseError) {
          console.error('Failed to parse SSE event:', parseError);
        }
      };

      // Add named event listeners for all event types
      // Backend sends events with `event: {type}\n` format which requires addEventListener
      EVENT_TYPES.forEach(eventType => {
        eventSource.addEventListener(eventType, ((e: MessageEvent) => {
          try {
            const event = JSON.parse(e.data) as UIEvent;
            processEvent(event);
          } catch (parseError) {
            console.error(`Failed to parse SSE event ${eventType}:`, parseError);
          }
        }) as EventListener);
      });

      // Also listen for 'connected' event from server
      eventSource.addEventListener('connected', ((e: MessageEvent) => {
        console.log('[SSE] Connected event received:', e.data);
      }) as EventListener);

      eventSource.onerror = (e) => {
        console.error('SSE error:', e);
        setIsConnected(false);
        onDisconnect?.();

        // Attempt reconnection
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = reconnectInterval * Math.pow(2, reconnectAttemptsRef.current);
          reconnectAttemptsRef.current++;

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          const err = new Error('Max reconnection attempts reached');
          setError(err);
          onError?.(err);
        }
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to connect to SSE');
      setError(error);
      onError?.(error);
    }
  }, [projectId, processEvent, onConnect, onDisconnect, onError, maxReconnectAttempts, reconnectInterval]);

  // Disconnect from SSE
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setIsConnected(false);
    onDisconnect?.();
  }, [onDisconnect]);

  // Manual reconnect
  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    disconnect();
    connect();
  }, [connect, disconnect]);

  // Effect to manage connection lifecycle
  useEffect(() => {
    if (enabled && projectId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, projectId, connect, disconnect]);

  // Reset state when projectId changes
  useEffect(() => {
    setState(createInitialState(projectId));
  }, [projectId]);

  // Memoize return value
  const returnValue = useMemo<UseDirectorStreamReturn>(() => ({
    state,
    isConnected,
    error,
    reconnect,
    disconnect,
  }), [state, isConnected, error, reconnect, disconnect]);

  return returnValue;
}

export default useDirectorStream;
