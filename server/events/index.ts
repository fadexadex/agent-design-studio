/**
 * Events Module
 * 
 * Exports all event-related functionality for the Director-Agent architecture.
 */

// Event types
export {
  // Categories and base types
  type EventCategory,
  type BaseUIEvent,
  type UIEvent,
  
  // Director events
  type DirectorStartedEvent,
  type DirectorThinkingEvent,
  type DirectorDecisionEvent,
  type DirectorCompletedEvent,
  type DirectorErrorEvent,
  type DirectorEvent,
  
  // Scene events
  type SceneQueuedEvent,
  type SceneGeneratingEvent,
  type SceneGeneratedEvent,
  type SceneRenderingEvent,
  type SceneRenderedEvent,
  type SceneErrorEvent,
  type SceneEvent,
  
  // Evaluation events
  type EvaluationStartedEvent,
  type EvaluationProgressEvent,
  type EvaluationCompletedEvent,
  type EvaluationEscalatedEvent,
  type EvaluationEvent,
  
  // Render events
  type RenderStartedEvent,
  type RenderProgressEvent,
  type RenderCompletedEvent,
  type RenderErrorEvent,
  type RenderEvent,
  
  // System events
  type SystemHealthEvent,
  type SystemErrorEvent,
  type SystemEvent,
  
  // Type guards
  isDirectorEvent,
  isSceneEvent,
  isEvaluationEvent,
  isRenderEvent,
  isSystemEvent,
  
  // Stream keys
  STREAM_KEYS,
} from './types.js';

// Event emitter
export {
  uiEvents,
  UIEventEmitter,
  
  // Stream utilities
  type StreamEntry,
  parseStreamEntry,
  readProjectEvents,
  readProjectEventsBlocking,
  getLatestEventId,
  deleteProjectStream,
} from './UIEventEmitter.js';
