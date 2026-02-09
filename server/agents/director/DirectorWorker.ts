/**
 * Director Worker
 * 
 * BullMQ worker that processes Director commands.
 * The Director is the orchestrating agent that manages the entire
 * video generation workflow, coordinates scene agents, and makes
 * high-level decisions about iteration and quality.
 */

import { Worker, Job } from 'bullmq';

import { getRedisConnection } from '../../queues/redisConnection.js';
import {
  QUEUE_NAMES,
  QUEUE_CONCURRENCY,
  DirectorJobData,
} from '../../queues/definitions.js';
import { DirectorCommand } from './DirectorCommands.js';
import { DirectorAgent } from './DirectorAgent.js';

// ============================================================================
// Worker Types
// ============================================================================

export interface DirectorWorkerOptions {
  concurrency?: number;
}

// ============================================================================
// Director Worker
// ============================================================================

/**
 * Create the Director worker
 * 
 * This worker processes all Director commands from the director-queue.
 * Each command is handled by a DirectorAgent instance which maintains
 * state in Redis for durability.
 */
export function createDirectorWorker(
  options: DirectorWorkerOptions = {}
): Worker<DirectorJobData, void> {
  const { concurrency = QUEUE_CONCURRENCY[QUEUE_NAMES.DIRECTOR] } = options;

  // Cache of active Director agents (by projectId)
  const agentCache = new Map<string, DirectorAgent>();

  const worker = new Worker<DirectorJobData, void>(
    QUEUE_NAMES.DIRECTOR,
    async (job: Job<DirectorJobData, void>) => {
      const { projectId, command: commandType, payload, timestamp } = job.data;

      console.log(`[DirectorWorker] Processing ${commandType} for project ${projectId}`);

      try {
        // Get or create Director agent for this project
        let agent = agentCache.get(projectId);
        
        if (!agent) {
          agent = new DirectorAgent(projectId);
          await agent.loadState();
          agentCache.set(projectId, agent);
        }

        // Reconstruct the command
        const command: DirectorCommand = {
          type: commandType,
          projectId,
          payload,
          timestamp,
        } as DirectorCommand;

        // Handle the command
        await agent.handleCommand(command);

        // Check if project is complete and clean up cache
        const state = agent.getState();
        if (state && (state.phase === 'completed' || state.phase === 'failed')) {
          agentCache.delete(projectId);
          console.log(`[DirectorWorker] Project ${projectId} ${state.phase}, removed from cache`);
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[DirectorWorker] Error processing ${commandType}:`, error);
        
        // Clean up cache on error
        agentCache.delete(projectId);
        
        throw error;
      }
    },
    {
      connection: getRedisConnection(),
      concurrency,
    }
  );

  // Event handlers
  worker.on('completed', (job) => {
    console.log(`[DirectorWorker] Job ${job.id} completed (${job.data.command})`);
  });

  worker.on('failed', (job, error) => {
    console.error(`[DirectorWorker] Job ${job?.id} failed (${job?.data.command}):`, error.message);
  });

  worker.on('error', (error) => {
    console.error('[DirectorWorker] Worker error:', error);
  });

  console.log(`[DirectorWorker] Worker started with concurrency ${concurrency}`);

  return worker;
}

// ============================================================================
// Queue Helper
// ============================================================================

/**
 * Send a command to the Director queue
 */
export async function sendDirectorCommand(command: DirectorCommand): Promise<string> {
  const { getDirectorQueue } = await import('../../queues/definitions.js');
  
  const job = await getDirectorQueue().add(
    command.type,
    {
      projectId: command.projectId,
      command: command.type,
      payload: (command as any).payload,
      timestamp: command.timestamp,
    } as DirectorJobData
  );

  return job.id || '';
}

/**
 * Start a new project via the Director queue
 */
export async function queueStartProject(
  projectId: string,
  brandContext: Record<string, unknown>,
  options?: { maxGlobalIterations?: number; targetScore?: number }
): Promise<string> {
  const { getDirectorQueue } = await import('../../queues/definitions.js');
  
  const job = await getDirectorQueue().add(
    'START_PROJECT',
    {
      projectId,
      command: 'START_PROJECT',
      payload: {
        brandContext,
        options,
      },
      timestamp: Date.now(),
    } as DirectorJobData
  );

  return job.id || '';
}
