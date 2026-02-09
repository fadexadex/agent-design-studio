/**
 * BullMQ Queue Definitions
 * 
 * Defines the 4 queues for the Director-Agent architecture:
 * 1. director-queue - Director commands
 * 2. scene-agent-queue - Scene code generation (concurrency: 3)
 * 3. scene-evaluation-queue - Tier 1 per-scene evaluation (concurrency: 3)
 * 4. global-evaluation-queue - Tier 2 holistic evaluation (concurrency: 1)
 */

import { Queue, Worker, QueueEvents, JobsOptions, WorkerOptions } from 'bullmq';
import { getRedisConnection } from './redisConnection.js';

// ============================================================================
// Queue Names
// ============================================================================

export const QUEUE_NAMES = {
  DIRECTOR: 'director-queue',
  SCENE_AGENT: 'scene-agent-queue',
  SCENE_RENDER: 'scene-render-queue',
  SCENE_EVALUATION: 'scene-evaluation-queue',
  GLOBAL_EVALUATION: 'global-evaluation-queue',
} as const;

export type QueueName = typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES];

// ============================================================================
// Concurrency Settings
// ============================================================================

export const QUEUE_CONCURRENCY = {
  [QUEUE_NAMES.DIRECTOR]: 1,           // Single director orchestrator
  [QUEUE_NAMES.SCENE_AGENT]: 10,       // 10 concurrent scene generations
  [QUEUE_NAMES.SCENE_RENDER]: 5,       // 5 concurrent scene renders
  [QUEUE_NAMES.SCENE_EVALUATION]: 5,   // 5 concurrent scene evaluations
  [QUEUE_NAMES.GLOBAL_EVALUATION]: 1,  // Sequential global evaluations
} as const;

// ============================================================================
// Retry Configuration
// ============================================================================

export const RETRY_CONFIG = {
  // Director commands - retry on transient failures
  [QUEUE_NAMES.DIRECTOR]: {
    attempts: 3,
    backoff: {
      type: 'exponential' as const,
      delay: 1000, // 1s, 2s, 4s
    },
  },
  
  // Scene generation - retry with longer backoff (API rate limits)
  [QUEUE_NAMES.SCENE_AGENT]: {
    attempts: 3,
    backoff: {
      type: 'exponential' as const,
      delay: 2000, // 2s, 4s, 8s
    },
  },
  
  // Scene rendering - retry on failures (bundling/encoding can be flaky)
  [QUEUE_NAMES.SCENE_RENDER]: {
    attempts: 2,
    backoff: {
      type: 'exponential' as const,
      delay: 3000, // 3s, 6s
    },
  },
  
  // Scene evaluation - quick retries
  [QUEUE_NAMES.SCENE_EVALUATION]: {
    attempts: 2,
    backoff: {
      type: 'fixed' as const,
      delay: 1000,
    },
  },
  
  // Global evaluation - minimal retries
  [QUEUE_NAMES.GLOBAL_EVALUATION]: {
    attempts: 2,
    backoff: {
      type: 'fixed' as const,
      delay: 2000,
    },
  },
} as const;

// ============================================================================
// Default Job Options
// ============================================================================

export function getDefaultJobOptions(queueName: QueueName): JobsOptions {
  const retryConfig = RETRY_CONFIG[queueName];
  
  return {
    attempts: retryConfig.attempts,
    backoff: retryConfig.backoff,
    removeOnComplete: {
      age: 3600, // Remove completed jobs after 1 hour
      count: 100, // Keep last 100 completed jobs
    },
    removeOnFail: {
      age: 86400, // Remove failed jobs after 24 hours
      count: 500, // Keep last 500 failed jobs for debugging
    },
  };
}

// ============================================================================
// Queue Instances (Lazy Initialization)
// ============================================================================

const queues: Map<QueueName, Queue> = new Map();
const queueEvents: Map<QueueName, QueueEvents> = new Map();

/**
 * Get or create a queue instance
 */
export function getQueue(name: QueueName): Queue {
  let queue = queues.get(name);
  
  if (!queue) {
    queue = new Queue(name, {
      connection: getRedisConnection(),
      defaultJobOptions: getDefaultJobOptions(name),
    });
    
    queue.on('error', (err) => {
      console.error(`[Queue:${name}] Error:`, err.message);
    });
    
    queues.set(name, queue);
    console.log(`[Queue:${name}] Initialized`);
  }
  
  return queue;
}

/**
 * Get or create queue events instance for listening to job events
 */
export function getQueueEvents(name: QueueName): QueueEvents {
  let events = queueEvents.get(name);
  
  if (!events) {
    events = new QueueEvents(name, {
      connection: getRedisConnection(),
    });
    
    queueEvents.set(name, events);
    console.log(`[QueueEvents:${name}] Initialized`);
  }
  
  return events;
}

// ============================================================================
// Worker Factory
// ============================================================================

export interface CreateWorkerOptions<T, R> {
  queueName: QueueName;
  processor: (job: { id?: string; name: string; data: T }) => Promise<R>;
  concurrency?: number;
  options?: Partial<WorkerOptions>;
}

/**
 * Create a worker for a queue
 */
export function createWorker<T, R>(opts: CreateWorkerOptions<T, R>): Worker<T, R> {
  const { queueName, processor, concurrency, options } = opts;
  
  const worker = new Worker<T, R>(
    queueName,
    async (job) => {
      console.log(`[Worker:${queueName}] Processing job ${job.id} (${job.name})`);
      const startTime = Date.now();
      
      try {
        const result = await processor(job);
        const duration = Date.now() - startTime;
        console.log(`[Worker:${queueName}] Job ${job.id} completed in ${duration}ms`);
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`[Worker:${queueName}] Job ${job.id} failed after ${duration}ms:`, error);
        throw error;
      }
    },
    {
      connection: getRedisConnection(),
      concurrency: concurrency ?? QUEUE_CONCURRENCY[queueName],
      ...options,
    }
  );
  
  worker.on('error', (err) => {
    console.error(`[Worker:${queueName}] Error:`, err.message);
  });
  
  worker.on('failed', (job, err) => {
    console.error(`[Worker:${queueName}] Job ${job?.id} failed:`, err.message);
  });
  
  worker.on('stalled', (jobId) => {
    console.warn(`[Worker:${queueName}] Job ${jobId} stalled`);
  });
  
  console.log(`[Worker:${queueName}] Started with concurrency ${concurrency ?? QUEUE_CONCURRENCY[queueName]}`);
  
  return worker;
}

// ============================================================================
// Convenience Queue Getters
// ============================================================================

export function getDirectorQueue(): Queue {
  return getQueue(QUEUE_NAMES.DIRECTOR);
}

export function getSceneAgentQueue(): Queue {
  return getQueue(QUEUE_NAMES.SCENE_AGENT);
}

export function getSceneRenderQueue(): Queue {
  return getQueue(QUEUE_NAMES.SCENE_RENDER);
}

export function getSceneEvaluationQueue(): Queue {
  return getQueue(QUEUE_NAMES.SCENE_EVALUATION);
}

export function getGlobalEvaluationQueue(): Queue {
  return getQueue(QUEUE_NAMES.GLOBAL_EVALUATION);
}

// ============================================================================
// Cleanup
// ============================================================================

/**
 * Close all queues and queue events
 */
export async function closeAllQueues(): Promise<void> {
  console.log('[Queues] Closing all queues...');
  
  const closePromises: Promise<void>[] = [];
  
  for (const [name, queue] of queues) {
    closePromises.push(
      queue.close().then(() => {
        console.log(`[Queue:${name}] Closed`);
      })
    );
  }
  
  for (const [name, events] of queueEvents) {
    closePromises.push(
      events.close().then(() => {
        console.log(`[QueueEvents:${name}] Closed`);
      })
    );
  }
  
  await Promise.all(closePromises);
  
  queues.clear();
  queueEvents.clear();
  
  console.log('[Queues] All queues closed');
}

// ============================================================================
// Job Type Definitions
// ============================================================================

// Director job types
export interface DirectorJobData {
  projectId: string;
  command: string;
  payload: Record<string, unknown>;
  timestamp: number;
}

// Scene agent job types
export interface SceneAgentJobData {
  projectId: string;
  sceneId: string;
  sceneIndex: number;
  version: number;
  prompt: string;
  brandContext: Record<string, unknown>;
  previousCode?: string;
  feedback?: string;
}

export interface SceneAgentJobResult {
  projectId: string;
  sceneId: string;
  version: number;
  code: string;
  generationTimeMs: number;
}

// Scene evaluation job types
export interface SceneEvaluationJobData {
  projectId: string;
  sceneId: string;
  sceneIndex: number;
  version: number;
  code: string;
  videoPath: string;
  brandContext: Record<string, unknown>;
}

export interface SceneEvaluationJobResult {
  projectId: string;
  sceneId: string;
  evaluatedVersion: number;
  score: number;
  passed: boolean;
  feedback: string;
  details: {
    codeQuality: number;
    visualAppeal: number;
    brandAlignment: number;
    technicalCorrectness: number;
  };
}

// Global evaluation job types
export interface GlobalEvaluationJobData {
  projectId: string;
  scenes: Array<{
    sceneId: string;
    version: number;
    score: number;
    videoPath: string;
  }>;
  brandContext: Record<string, unknown>;
}

export interface GlobalEvaluationJobResult {
  projectId: string;
  globalScore: number;
  passed: boolean;
  narrativeCohesion: number;
  brandConsistency: number;
  feedback: string;
  sceneVersionSnapshot: Record<string, number>;
}
