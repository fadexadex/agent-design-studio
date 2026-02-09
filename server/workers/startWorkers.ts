/**
 * Worker Startup
 * 
 * Boots all BullMQ workers for the Director-Agent architecture.
 * Call startWorkers() to initialize all workers.
 */

import { Worker } from 'bullmq';
import { createSceneGeneratorWorker } from '../agents/scene/SceneGeneratorWorker.js';
import { createSceneRenderWorker } from '../agents/scene/SceneRenderWorker.js';
import { createSceneEvaluationWorker } from '../agents/evaluation/SceneEvaluationWorker.js';
import { createGlobalEvaluationWorker } from '../agents/evaluation/GlobalEvaluationWorker.js';
import { createDirectorWorker } from '../agents/director/DirectorWorker.js';
import { closeAllQueues } from '../queues/definitions.js';
import { closeRedisConnections, getConnectionStatus, getRedisConnection } from '../queues/redisConnection.js';

// ============================================================================
// Worker Registry
// ============================================================================

interface WorkerRegistry {
  director: Worker | null;
  sceneGenerator: Worker | null;
  sceneRender: Worker | null;
  sceneEvaluator: Worker | null;
  globalEvaluator: Worker | null;
}

const workers: WorkerRegistry = {
  director: null,
  sceneGenerator: null,
  sceneRender: null,
  sceneEvaluator: null,
  globalEvaluator: null,
};

let isStarted = false;
let isShuttingDown = false;

// ============================================================================
// Startup
// ============================================================================

export interface StartWorkersOptions {
  /** Director concurrency (default: 5) */
  directorConcurrency?: number;
  /** Scene generator concurrency (default: 3) */
  sceneGeneratorConcurrency?: number;
  /** Scene render concurrency (default: 2) */
  sceneRenderConcurrency?: number;
  /** Scene evaluator concurrency (default: 3) */
  sceneEvaluatorConcurrency?: number;
  /** Global evaluator concurrency (default: 1) */
  globalEvaluatorConcurrency?: number;
  /** Enable graceful shutdown handlers (default: true) */
  enableGracefulShutdown?: boolean;
}

/**
 * Start all workers
 */
export async function startWorkers(options: StartWorkersOptions = {}): Promise<void> {
  if (isStarted) {
    console.warn('[Workers] Already started, skipping...');
    return;
  }

  const {
    directorConcurrency = 1,
    sceneGeneratorConcurrency = 10,
    sceneRenderConcurrency = 5,
    sceneEvaluatorConcurrency = 5,
    globalEvaluatorConcurrency = 1,
    enableGracefulShutdown = true,
  } = options;

  console.log('[Workers] Starting workers...');
  console.log(`[Workers] Director concurrency: ${directorConcurrency}`);
  console.log(`[Workers] Scene Generator concurrency: ${sceneGeneratorConcurrency}`);
  console.log(`[Workers] Scene Render concurrency: ${sceneRenderConcurrency}`);
  console.log(`[Workers] Scene Evaluator concurrency: ${sceneEvaluatorConcurrency}`);
  console.log(`[Workers] Global Evaluator concurrency: ${globalEvaluatorConcurrency}`);

  // Check Redis connection
  const status = getConnectionStatus();
  if (status.main === 'disconnected') {
    // Initialize connection by calling getRedisConnection
    getRedisConnection();
  }

  // Start Director Worker (orchestrator)
  workers.director = createDirectorWorker({
    concurrency: directorConcurrency,
  });

  // Start Scene Generator Worker
  workers.sceneGenerator = createSceneGeneratorWorker({
    concurrency: sceneGeneratorConcurrency,
  });

  // Start Scene Render Worker
  workers.sceneRender = createSceneRenderWorker({
    concurrency: sceneRenderConcurrency,
  });
  console.log('[Workers] Scene Render worker started');

  // Start Scene Evaluator Worker (Tier 1)
  workers.sceneEvaluator = createSceneEvaluationWorker({
    concurrency: sceneEvaluatorConcurrency,
  });

  // Start Global Evaluator Worker (Tier 2)
  workers.globalEvaluator = createGlobalEvaluationWorker({
    concurrency: globalEvaluatorConcurrency,
  });

  // Setup graceful shutdown
  if (enableGracefulShutdown) {
    setupGracefulShutdown();
  }

  isStarted = true;
  console.log('[Workers] All workers started successfully');
}

// ============================================================================
// Shutdown
// ============================================================================

/**
 * Stop all workers gracefully
 */
export async function stopWorkers(): Promise<void> {
  if (!isStarted || isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  console.log('[Workers] Stopping workers...');

  const stopPromises: Promise<void>[] = [];

  // Stop Director
  if (workers.director) {
    stopPromises.push(
      workers.director.close().then(() => {
        console.log('[Workers] Director stopped');
        workers.director = null;
      })
    );
  }

  // Stop Scene Generator
  if (workers.sceneGenerator) {
    stopPromises.push(
      workers.sceneGenerator.close().then(() => {
        console.log('[Workers] Scene Generator stopped');
        workers.sceneGenerator = null;
      })
    );
  }

  // Stop Scene Render
  if (workers.sceneRender) {
    stopPromises.push(
      workers.sceneRender.close().then(() => {
        console.log('[Workers] Scene Render stopped');
        workers.sceneRender = null;
      })
    );
  }

  // Stop Scene Evaluator
  if (workers.sceneEvaluator) {
    stopPromises.push(
      workers.sceneEvaluator.close().then(() => {
        console.log('[Workers] Scene Evaluator stopped');
        workers.sceneEvaluator = null;
      })
    );
  }

  // Stop Global Evaluator
  if (workers.globalEvaluator) {
    stopPromises.push(
      workers.globalEvaluator.close().then(() => {
        console.log('[Workers] Global Evaluator stopped');
        workers.globalEvaluator = null;
      })
    );
  }

  await Promise.all(stopPromises);

  // Close queues
  await closeAllQueues();

  // Close Redis connection
  await closeRedisConnections();

  isStarted = false;
  isShuttingDown = false;
  console.log('[Workers] All workers stopped');
}

/**
 * Setup process signal handlers for graceful shutdown
 */
function setupGracefulShutdown(): void {
  const shutdown = async (signal: string) => {
    console.log(`[Workers] Received ${signal}, initiating graceful shutdown...`);
    
    try {
      await stopWorkers();
      console.log('[Workers] Graceful shutdown complete');
      process.exit(0);
    } catch (error) {
      console.error('[Workers] Shutdown error:', error);
      process.exit(1);
    }
  };

  // Handle termination signals
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  
  // Handle uncaught errors
  process.on('uncaughtException', async (error) => {
    console.error('[Workers] Uncaught exception:', error);
    await stopWorkers();
    process.exit(1);
  });

  process.on('unhandledRejection', async (reason, promise) => {
    console.error('[Workers] Unhandled rejection at:', promise, 'reason:', reason);
    await stopWorkers();
    process.exit(1);
  });
}

// ============================================================================
// Health Check
// ============================================================================

export interface WorkersHealth {
  started: boolean;
  shuttingDown: boolean;
  workers: {
    director: boolean;
    sceneGenerator: boolean;
    sceneRender: boolean;
    sceneEvaluator: boolean;
    globalEvaluator: boolean;
  };
}

/**
 * Get workers health status
 */
export function getWorkersHealth(): WorkersHealth {
  return {
    started: isStarted,
    shuttingDown: isShuttingDown,
    workers: {
      director: workers.director !== null,
      sceneGenerator: workers.sceneGenerator !== null,
      sceneRender: workers.sceneRender !== null,
      sceneEvaluator: workers.sceneEvaluator !== null,
      globalEvaluator: workers.globalEvaluator !== null,
    },
  };
}

// ============================================================================
// Standalone Worker Runner
// ============================================================================

/**
 * Run workers as a standalone process
 * Call this from a CLI entry point
 */
export async function runWorkersStandalone(): Promise<void> {
  console.log('[Workers] Starting in standalone mode...');
  
  // Import and initialize Redis (calling getRedisConnection initializes it)
  const { getRedisConnection: initRedis } = await import('../queues/redisConnection.js');
  initRedis();
  
  // Start workers
  await startWorkers({
    enableGracefulShutdown: true,
  });

  console.log('[Workers] Running. Press Ctrl+C to stop.');
  
  // Keep process alive
  await new Promise(() => {});
}

// ============================================================================
// CLI Entry Point
// ============================================================================

// If this file is run directly, start workers
if (import.meta.url === `file://${process.argv[1]}`) {
  runWorkersStandalone().catch((error) => {
    console.error('[Workers] Fatal error:', error);
    process.exit(1);
  });
}
