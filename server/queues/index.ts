/**
 * Queues Module
 * 
 * Exports all queue-related functionality for the Director-Agent architecture.
 */

// Redis connection
export {
  getRedisConnection,
  getRedisSubscriber,
  createNewConnection,
  checkRedisHealth,
  closeRedisConnections,
  getConnectionStatus,
  getConnectionInfo,
  Redis,
} from './redisConnection.js';

// Queue definitions and utilities
export {
  // Queue names
  QUEUE_NAMES,
  type QueueName,
  
  // Configuration
  QUEUE_CONCURRENCY,
  RETRY_CONFIG,
  getDefaultJobOptions,
  
  // Queue instances
  getQueue,
  getQueueEvents,
  getDirectorQueue,
  getSceneAgentQueue,
  getSceneEvaluationQueue,
  getGlobalEvaluationQueue,
  
  // Worker factory
  createWorker,
  type CreateWorkerOptions,
  
  // Cleanup
  closeAllQueues,
  
  // Job types
  type DirectorJobData,
  type SceneAgentJobData,
  type SceneAgentJobResult,
  type SceneEvaluationJobData,
  type SceneEvaluationJobResult,
  type GlobalEvaluationJobData,
  type GlobalEvaluationJobResult,
} from './definitions.js';
