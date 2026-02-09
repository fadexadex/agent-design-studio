/**
 * Global Evaluation Worker
 * 
 * BullMQ worker that processes global (Tier 2) evaluation tasks.
 * Evaluates the entire video holistically for narrative cohesion,
 * brand consistency, and overall quality across all scenes.
 */

import { Worker, Job } from 'bullmq';

import { getRedisConnection } from '../../queues/redisConnection.js';
import {
  QUEUE_NAMES,
  QUEUE_CONCURRENCY,
  GlobalEvaluationJobData,
  GlobalEvaluationJobResult,
  getDirectorQueue,
} from '../../queues/definitions.js';
import { uiEvents } from '../../events/UIEventEmitter.js';
import { createCommand, GlobalEvaluationCompleteCommand } from '../director/DirectorCommands.js';
import { BrandContext, SCORE_THRESHOLDS } from '../types.js';
import { 
  GlobalEvaluator, 
  GlobalEvaluationInput, 
  SceneInfo,
  createGlobalEvaluator,
} from './GlobalEvaluator.js';

// ============================================================================
// Worker Types
// ============================================================================

export interface GlobalEvaluationWorkerOptions {
  concurrency?: number;
}

// ============================================================================
// Extended Job Data (with scene code for evaluation)
// ============================================================================

export interface ExtendedGlobalEvaluationJobData extends GlobalEvaluationJobData {
  scenes: Array<{
    sceneId: string;
    sceneIndex: number;
    version: number;
    score: number;
    code: string;
    videoPath: string;
  }>;
  iterationNumber: number;
  previousGlobalScore?: number;
}

// ============================================================================
// Global Evaluation Worker
// ============================================================================

export function createGlobalEvaluationWorker(
  options: GlobalEvaluationWorkerOptions = {}
): Worker<ExtendedGlobalEvaluationJobData, GlobalEvaluationJobResult> {
  const { concurrency = QUEUE_CONCURRENCY[QUEUE_NAMES.GLOBAL_EVALUATION] } = options;

  // Create evaluator instance
  const evaluator = createGlobalEvaluator();

  const worker = new Worker<ExtendedGlobalEvaluationJobData, GlobalEvaluationJobResult>(
    QUEUE_NAMES.GLOBAL_EVALUATION,
    async (job: Job<ExtendedGlobalEvaluationJobData, GlobalEvaluationJobResult>) => {
      const {
        projectId,
        scenes,
        brandContext,
        iterationNumber,
        previousGlobalScore,
      } = job.data;

      console.log(
        `[GlobalEvaluation] Evaluating ${scenes.length} scenes for project ${projectId} ` +
        `(iteration ${iterationNumber})`
      );

      // Emit evaluation started event
      await uiEvents.evaluationStarted(projectId, {
        tier: 2,
        sceneId: undefined,
        sceneIndex: undefined,
        version: undefined,
      });

      try {
        // Build scene info for evaluator
        const sceneInfos: SceneInfo[] = scenes.map(scene => ({
          sceneId: scene.sceneId,
          sceneIndex: scene.sceneIndex,
          version: scene.version,
          code: scene.code,
          score: scene.score,
          videoPath: scene.videoPath,
        }));

        // Emit progress
        await uiEvents.evaluationProgress(projectId, {
          tier: 2,
          sceneId: undefined,
          step: 'Analyzing narrative cohesion',
          progress: 25,
        });

        // Build evaluation input
        const input: GlobalEvaluationInput = {
          projectId,
          scenes: sceneInfos,
          brandContext: brandContext as unknown as BrandContext,
          iterationNumber: iterationNumber ?? 1,
          previousGlobalScore,
        };

        // Emit progress
        await uiEvents.evaluationProgress(projectId, {
          tier: 2,
          sceneId: undefined,
          step: 'Evaluating brand consistency',
          progress: 50,
        });

        // Run global evaluation
        const result = await evaluator.evaluate(input);

        // Emit progress
        await uiEvents.evaluationProgress(projectId, {
          tier: 2,
          sceneId: undefined,
          step: 'Computing global score',
          progress: 75,
        });

        // Emit evaluation completed event
        await uiEvents.evaluationCompleted(projectId, {
          tier: 2,
          sceneId: undefined,
          sceneIndex: undefined,
          evaluatedVersion: undefined,
          score: result.globalScore,
          passed: result.passed,
          feedback: result.feedback,
          details: {
            narrativeCohesion: result.narrativeCohesion,
            brandConsistency: result.brandConsistency,
          },
        });

        // If diminishing returns detected, emit a warning
        if (result.diminishingReturns) {
          console.log(`[GlobalEvaluation] Diminishing returns detected for project ${projectId}`);
          await uiEvents.evaluationEscalated(projectId, {
            sceneId: undefined,
            sceneIndex: undefined,
            sceneNumber: undefined,
            reason: 'diminishing_returns',
            attempts: iterationNumber,
            lastScore: result.globalScore,
          });
        }

        // Send command to Director
        // Use DirectorJobData format
        await getDirectorQueue().add('GLOBAL_EVALUATION_COMPLETE', {
          projectId,
          command: 'GLOBAL_EVALUATION_COMPLETE',
          payload: {
            globalScore: result.globalScore,
            passed: result.passed,
            narrativeCohesion: result.narrativeCohesion,
            brandConsistency: result.brandConsistency,
            feedback: result.feedback,
            sceneVersionSnapshot: result.sceneVersionSnapshot,
            sceneSpecificFeedback: result.sceneSpecificFeedback,
          },
          timestamp: Date.now(),
        });

        console.log(
          `[GlobalEvaluation] Global score: ${(result.globalScore * 100).toFixed(1)}% ` +
          `(${result.passed ? 'PASSED' : 'FAILED'})` +
          `${result.diminishingReturns ? ' [Diminishing Returns]' : ''}`
        );

        // Return job result
        return {
          projectId,
          globalScore: result.globalScore,
          passed: result.passed,
          narrativeCohesion: result.narrativeCohesion,
          brandConsistency: result.brandConsistency,
          feedback: result.feedback,
          sceneVersionSnapshot: result.sceneVersionSnapshot,
        };

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[GlobalEvaluation] Evaluation failed:`, error);

        // Emit error as system event
        await uiEvents.systemError(projectId, {
          error: errorMessage,
          component: 'GlobalEvaluationWorker',
          fatal: false,
        });

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
    console.log(`[GlobalEvaluation] Job ${job.id} completed for project ${job.data.projectId}`);
  });

  worker.on('failed', (job, error) => {
    console.error(`[GlobalEvaluation] Job ${job?.id} failed:`, error.message);
  });

  worker.on('error', (error) => {
    console.error('[GlobalEvaluation] Worker error:', error);
  });

  console.log(`[GlobalEvaluation] Worker started with concurrency ${concurrency}`);

  return worker;
}

// ============================================================================
// Queue Helper
// ============================================================================

/**
 * Add a global evaluation job to the queue
 */
export async function queueGlobalEvaluation(
  projectId: string,
  scenes: Array<{
    sceneId: string;
    sceneIndex: number;
    version: number;
    score: number;
    code: string;
    videoPath: string;
  }>,
  brandContext: BrandContext,
  iterationNumber: number,
  previousGlobalScore?: number
): Promise<string> {
  const { getGlobalEvaluationQueue } = await import('../../queues/definitions.js');
  
  const job = await getGlobalEvaluationQueue().add(
    'EVALUATE_GLOBAL',
    {
      projectId,
      scenes,
      brandContext: brandContext as unknown as Record<string, unknown>,
      iterationNumber,
      previousGlobalScore,
    } as ExtendedGlobalEvaluationJobData
  );

  return job.id || '';
}
