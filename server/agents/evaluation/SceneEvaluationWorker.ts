/**
 * Scene Evaluation Worker
 * 
 * BullMQ worker that processes scene evaluation tasks.
 * Evaluates generated scene code for quality, brand alignment, and technical correctness.
 */

import { Worker, Job } from 'bullmq';

import { getRedisConnection } from '../../queues/redisConnection.js';
import {
  QUEUE_NAMES,
  QUEUE_CONCURRENCY,
  SceneEvaluationJobData,
  SceneEvaluationJobResult,
  getDirectorQueue,
} from '../../queues/definitions.js';
import { uiEvents } from '../../events/UIEventEmitter.js';
import { createCommand, SceneEvaluationCompleteCommand } from '../director/DirectorCommands.js';
import { BrandContext, SCORE_THRESHOLDS } from '../types.js';
import { SceneEvaluator, SceneEvaluationInput, createSceneEvaluator } from './SceneEvaluator.js';

// ============================================================================
// Worker Types
// ============================================================================

export interface SceneEvaluationWorkerOptions {
  concurrency?: number;
}

// ============================================================================
// Scene Evaluation Worker
// ============================================================================

export function createSceneEvaluationWorker(
  options: SceneEvaluationWorkerOptions = {}
): Worker<SceneEvaluationJobData, SceneEvaluationJobResult> {
  const { concurrency = QUEUE_CONCURRENCY[QUEUE_NAMES.SCENE_EVALUATION] } = options;

  // Create evaluator instance
  const evaluator = createSceneEvaluator();

  const worker = new Worker<SceneEvaluationJobData, SceneEvaluationJobResult>(
    QUEUE_NAMES.SCENE_EVALUATION,
    async (job: Job<SceneEvaluationJobData, SceneEvaluationJobResult>) => {
      const {
        projectId,
        sceneId,
        sceneIndex,
        version,
        code,
        videoPath,
        brandContext,
      } = job.data;

      console.log(`[SceneEvaluation] Evaluating scene ${sceneIndex} v${version} for project ${projectId}`);

      // Emit evaluation started event
      await uiEvents.evaluationStarted(projectId, {
        tier: 1,
        sceneId,
        sceneIndex,
        sceneNumber: sceneIndex + 1,
        version,
      });

      try {
        // Build evaluation input
        const input: SceneEvaluationInput = {
          projectId,
          sceneId,
          sceneIndex,
          version,
          code,
          videoPath,
          brandContext: brandContext as unknown as BrandContext,
        };

        // Emit progress
        await uiEvents.evaluationProgress(projectId, {
          tier: 1,
          sceneId,
          step: 'Analyzing code quality',
          progress: 25,
        });

        // Run evaluation
        const result = await evaluator.evaluate(input);

        // Emit progress
        await uiEvents.evaluationProgress(projectId, {
          tier: 1,
          sceneId,
          step: 'Computing scores',
          progress: 75,
        });

        // Emit evaluation completed event
        await uiEvents.evaluationCompleted(projectId, {
          tier: 1,
          sceneId,
          sceneIndex,
          sceneNumber: sceneIndex + 1,
          evaluatedVersion: version,
          score: result.score,
          passed: result.passed,
          feedback: result.feedback,
          details: {
            codeQuality: result.details.codeQuality,
            visualAppeal: result.details.visualAppeal,
            brandAlignment: result.details.brandAlignment,
            technicalCorrectness: result.details.technicalCorrectness,
          },
        });

        // If should escalate, emit escalation event
        if (result.shouldEscalate && result.escalationReason) {
          await uiEvents.evaluationEscalated(projectId, {
            sceneId,
            sceneIndex,
            sceneNumber: sceneIndex + 1,
            reason: result.escalationReason,
            attempts: version,
            lastScore: result.score,
          });
        }

        // Send command to Director
        // Use DirectorJobData format
        await getDirectorQueue().add('SCENE_EVALUATION_COMPLETE', {
          projectId,
          command: 'SCENE_EVALUATION_COMPLETE',
          payload: {
            sceneId,
            evaluatedVersion: version,
            score: result.score,
            passed: result.passed,
            feedback: result.feedback,
            details: {
              codeQuality: result.details.codeQuality,
              visualAppeal: result.details.visualAppeal,
              brandAlignment: result.details.brandAlignment,
              technicalCorrectness: result.details.technicalCorrectness,
            },
          },
          timestamp: Date.now(),
        });

        console.log(
          `[SceneEvaluation] Scene ${sceneIndex} v${version}: ${(result.score * 100).toFixed(1)}% ` +
          `(${result.passed ? 'PASSED' : 'FAILED'})`
        );

        // Return job result
        return {
          projectId,
          sceneId,
          evaluatedVersion: version,
          score: result.score,
          passed: result.passed,
          feedback: result.feedback,
          details: {
            codeQuality: result.details.codeQuality,
            visualAppeal: result.details.visualAppeal,
            brandAlignment: result.details.brandAlignment,
            technicalCorrectness: result.details.technicalCorrectness,
          },
        };

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[SceneEvaluation] Evaluation failed:`, error);

        // Emit error as system event
        await uiEvents.systemError(projectId, {
          error: errorMessage,
          component: 'SceneEvaluationWorker',
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
    console.log(`[SceneEvaluation] Job ${job.id} completed for scene ${job.data.sceneIndex}`);
  });

  worker.on('failed', (job, error) => {
    console.error(`[SceneEvaluation] Job ${job?.id} failed:`, error.message);
  });

  worker.on('error', (error) => {
    console.error('[SceneEvaluation] Worker error:', error);
  });

  console.log(`[SceneEvaluation] Worker started with concurrency ${concurrency}`);

  return worker;
}

// ============================================================================
// Queue Helper
// ============================================================================

/**
 * Add a scene evaluation job to the queue
 */
export async function queueSceneEvaluation(
  projectId: string,
  sceneId: string,
  sceneIndex: number,
  version: number,
  code: string,
  videoPath: string,
  brandContext: BrandContext
): Promise<string> {
  const { getSceneEvaluationQueue } = await import('../../queues/definitions.js');
  
  const job = await getSceneEvaluationQueue().add(
    'EVALUATE_SCENE',
    {
      projectId,
      sceneId,
      sceneIndex,
      version,
      code,
      videoPath,
      brandContext: brandContext as unknown as Record<string, unknown>,
    }
  );

  return job.id || '';
}
