/**
 * Scene Render Worker
 * 
 * BullMQ worker that renders scene previews using Remotion.
 * Takes generated code and produces MP4 preview clips.
 */

import { Worker, Job } from 'bullmq';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import type { WebpackOverrideFn } from '@remotion/bundler';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import path from 'path';
import fs from 'fs/promises';

import { getRedisConnection } from '../../queues/redisConnection.js';
import { QUEUE_NAMES, QUEUE_CONCURRENCY, getDirectorQueue } from '../../queues/definitions.js';
import { uiEvents } from '../../events/UIEventEmitter.js';
import { SceneRenderTask, SceneRenderResult, getSceneVideoPath } from './SceneTask.js';

// ============================================================================
// Constants
// ============================================================================

const REMOTION_ROOT = path.join(process.cwd(), 'remotion');
const REMOTION_PUBLIC_DIR = path.join(REMOTION_ROOT, 'public');
const OUTPUT_PREVIEWS_DIR = path.join(process.cwd(), 'output', 'previews');

// Preview render settings (lower quality for speed)
const PREVIEW_SCALE = 0.667; // 720p
const PREVIEW_FPS = 30;

// ============================================================================
// Webpack Configuration
// ============================================================================

/**
 * Webpack override for path resolution
 */
const webpackOverride: WebpackOverrideFn = (currentConfiguration) => {
  const existingAliases = currentConfiguration.resolve?.alias ?? {};
  const filteredAliases = Object.fromEntries(
    Object.entries(existingAliases).filter(([key]) => !key.startsWith('@/components'))
  );

  const existingPlugins = currentConfiguration.resolve?.plugins ?? [];

  return {
    ...currentConfiguration,
    resolve: {
      ...currentConfiguration.resolve,
      alias: {
        ...filteredAliases,
        '@/components': path.join(REMOTION_ROOT, 'src', 'components'),
      },
      plugins: [
        ...existingPlugins,
        new TsconfigPathsPlugin({
          configFile: path.join(REMOTION_ROOT, 'tsconfig.json'),
        }),
      ],
    },
  };
};

// ============================================================================
// Job Types
// ============================================================================

export interface SceneRenderJobData {
  projectId: string;
  sceneId: string;
  sceneIndex: number;
  version: number;
  codePath: string;
  durationFrames: number;
  aspectRatio: '16:9' | '9:16';
  resolutionScale?: number;
}

export interface SceneRenderJobResult {
  projectId: string;
  sceneId: string;
  sceneIndex: number;
  version: number;
  videoPath: string;
  renderTimeMs: number;
  fileSizeBytes: number;
}

// ============================================================================
// Scene Render Worker
// ============================================================================

export interface SceneRenderWorkerOptions {
  concurrency?: number;
}

export function createSceneRenderWorker(options: SceneRenderWorkerOptions = {}): Worker<SceneRenderJobData, SceneRenderJobResult> {
  const { concurrency = QUEUE_CONCURRENCY[QUEUE_NAMES.SCENE_RENDER] } = options;

  const worker = new Worker<SceneRenderJobData, SceneRenderJobResult>(
    QUEUE_NAMES.SCENE_RENDER, // Use dedicated render queue
    async (job: Job<SceneRenderJobData, SceneRenderJobResult>) => {
      const {
        projectId,
        sceneId,
        sceneIndex,
        version,
        codePath,
        durationFrames,
        aspectRatio,
        resolutionScale = PREVIEW_SCALE,
      } = job.data;

      const startTime = Date.now();
      console.log(`[SceneRender] Rendering scene ${sceneIndex} v${version} for project ${projectId}`);

      // Emit rendering event
      await uiEvents.sceneRendering(projectId, {
        sceneId,
        sceneIndex,
        sceneNumber: sceneIndex + 1,
        version,
      });

      await uiEvents.renderStarted(projectId, {
        phase: 'scene',
        sceneId,
      });

      try {
        // Calculate dimensions
        const baseWidth = aspectRatio === '16:9' ? 1920 : 1080;
        const baseHeight = aspectRatio === '16:9' ? 1080 : 1920;
        const width = Math.round(baseWidth * resolutionScale);
        const height = Math.round(baseHeight * resolutionScale);

        // Ensure output directory exists
        const projectOutputDir = path.join(OUTPUT_PREVIEWS_DIR, projectId);
        await fs.mkdir(projectOutputDir, { recursive: true });

        // Get the preview wrapper path
        const previewEntryPoint = path.join(
          process.cwd(),
          'remotion',
          'src',
          'generated',
          'scenes',
          projectId,
          'previews',
          `ScenePreview${sceneIndex}.tsx`
        );

        // Verify entry point exists
        try {
          await fs.access(previewEntryPoint);
        } catch {
          throw new Error(`Scene preview entry point not found: ${previewEntryPoint}`);
        }

        console.log(`[SceneRender] Bundling from ${previewEntryPoint}...`);

        // Bundle the scene
        const bundled = await bundle({
          entryPoint: previewEntryPoint,
          webpackOverride,
          publicDir: REMOTION_PUBLIC_DIR,
          onProgress: (progress) => {
            // Emit bundle progress (0-30%)
            uiEvents.renderProgress(projectId, {
              phase: 'scene',
              sceneId,
              progress: Math.round(progress * 30),
              framesRendered: 0,
              totalFrames: durationFrames,
            }).catch(() => {}); // Ignore emit errors
          },
        });

        console.log(`[SceneRender] Bundle complete, selecting composition...`);

        // Select composition
        const composition = await selectComposition({
          serveUrl: bundled,
          id: 'ScenePreview',
        });

        // Output path
        const outputFileName = `${sceneId}_v${version}.mp4`;
        const outputPath = path.join(projectOutputDir, outputFileName);

        console.log(`[SceneRender] Rendering ${width}x${height} @ ${durationFrames} frames...`);

        // Render the scene
        await renderMedia({
          composition: {
            ...composition,
            width,
            height,
            durationInFrames: durationFrames,
            fps: PREVIEW_FPS,
          },
          serveUrl: bundled,
          codec: 'h264',
          outputLocation: outputPath,
          onProgress: ({ progress, renderedFrames }) => {
            // Emit render progress (30-100%)
            const totalProgress = 30 + Math.round(progress * 70);
            uiEvents.renderProgress(projectId, {
              phase: 'scene',
              sceneId,
              progress: totalProgress,
              framesRendered: renderedFrames,
              totalFrames: durationFrames,
            }).catch(() => {}); // Ignore emit errors
          },
        });

        // Get file size
        const stats = await fs.stat(outputPath);
        const renderTimeMs = Date.now() - startTime;

        console.log(`[SceneRender] Scene ${sceneIndex} rendered in ${renderTimeMs}ms (${stats.size} bytes)`);

        // Emit success events
        await uiEvents.sceneRendered(projectId, {
          sceneId,
          sceneIndex,
          sceneNumber: sceneIndex + 1,
          version,
          durationMs: renderTimeMs,
          videoPath: outputPath,
        });

        await uiEvents.renderCompleted(projectId, {
          phase: 'scene',
          sceneId,
          durationMs: renderTimeMs,
          outputPath,
          fileSizeBytes: stats.size,
        });

        // DEBUG: Log the outputPath being sent to Director
        console.log(`[SceneRender] Sending SCENE_RENDERED command with videoPath:`, {
          outputPath,
          isAbsolute: outputPath.startsWith('/'),
          projectId,
          sceneId,
          version,
        });

        // Send command to Director (use DirectorJobData format)
        await getDirectorQueue().add('SCENE_RENDERED', {
          projectId,
          command: 'SCENE_RENDERED',
          payload: {
            sceneId,
            version,
            videoPath: outputPath,
            renderTimeMs,
          },
          timestamp: Date.now(),
        });

        // Return result
        return {
          projectId,
          sceneId,
          sceneIndex,
          version,
          videoPath: outputPath,
          renderTimeMs,
          fileSizeBytes: stats.size,
        };

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[SceneRender] Render failed:`, error);

        // Emit error events
        await uiEvents.sceneError(projectId, {
          sceneId,
          sceneIndex,
          sceneNumber: sceneIndex + 1,
          version,
          error: errorMessage,
          phase: 'rendering',
        });

        await uiEvents.renderError(projectId, {
          phase: 'scene',
          sceneId,
          error: errorMessage,
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
    console.log(`[SceneRender] Job ${job.id} completed for scene ${job.data.sceneIndex}`);
  });

  worker.on('failed', (job, error) => {
    console.error(`[SceneRender] Job ${job?.id} failed:`, error.message);
  });

  worker.on('error', (error) => {
    console.error('[SceneRender] Worker error:', error);
  });

  console.log(`[SceneRender] Worker started with concurrency ${concurrency}`);

  return worker;
}

// ============================================================================
// Standalone Render Function
// ============================================================================

/**
 * Render a scene directly (without going through the queue)
 * Useful for testing or synchronous workflows
 */
export async function renderScenePreview(
  task: SceneRenderTask,
  onProgress?: (progress: number) => void
): Promise<SceneRenderResult> {
  const {
    projectId,
    sceneId,
    sceneIndex,
    version,
    codePath,
    durationFrames,
    aspectRatio,
    resolutionScale = PREVIEW_SCALE,
  } = task;

  const startTime = Date.now();

  // Calculate dimensions
  const baseWidth = aspectRatio === '16:9' ? 1920 : 1080;
  const baseHeight = aspectRatio === '16:9' ? 1080 : 1920;
  const width = Math.round(baseWidth * resolutionScale);
  const height = Math.round(baseHeight * resolutionScale);

  // Ensure output directory exists
  const projectOutputDir = path.join(OUTPUT_PREVIEWS_DIR, projectId);
  await fs.mkdir(projectOutputDir, { recursive: true });

  // Get the preview wrapper path
  const previewEntryPoint = path.join(
    process.cwd(),
    'remotion',
    'src',
    'generated',
    'scenes',
    projectId,
    'previews',
    `ScenePreview${sceneIndex}.tsx`
  );

  // Bundle
  const bundled = await bundle({
    entryPoint: previewEntryPoint,
    webpackOverride,
    publicDir: REMOTION_PUBLIC_DIR,
    onProgress: (progress) => {
      onProgress?.(progress * 0.3);
    },
  });

  // Select composition
  const composition = await selectComposition({
    serveUrl: bundled,
    id: 'ScenePreview',
  });

  // Output path
  const videoPath = getSceneVideoPath(projectId, sceneId, version);
  const absoluteVideoPath = path.join(process.cwd(), videoPath);
  await fs.mkdir(path.dirname(absoluteVideoPath), { recursive: true });

  // Render
  await renderMedia({
    composition: {
      ...composition,
      width,
      height,
      durationInFrames: durationFrames,
      fps: PREVIEW_FPS,
    },
    serveUrl: bundled,
    codec: 'h264',
    outputLocation: absoluteVideoPath,
    onProgress: ({ progress }) => {
      onProgress?.(0.3 + progress * 0.7);
    },
  });

  // Get file size
  const stats = await fs.stat(absoluteVideoPath);
  const renderTimeMs = Date.now() - startTime;

  return {
    projectId,
    sceneId,
    sceneIndex,
    version,
    videoPath: absoluteVideoPath,
    renderTimeMs,
    fileSizeBytes: stats.size,
  };
}

// ============================================================================
// Exports
// ============================================================================

export { webpackOverride };
