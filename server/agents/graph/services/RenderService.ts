import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import type { WebpackOverrideFn } from '@remotion/bundler';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import path from 'path';
import fs from 'fs/promises';

const REMOTION_ROOT = path.join(process.cwd(), 'remotion');
const REMOTION_PUBLIC_DIR = path.join(REMOTION_ROOT, 'public');
const PREVIEW_FPS = 30;

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

export interface RenderResult {
  /** Absolute filesystem path for backend operations (ffmpeg, etc.) */
  videoPath: string;
  /** URL path for frontend API calls (/api/preview/...) */
  videoUrl: string;
  renderTimeMs: number;
  fileSizeBytes: number;
}

export class RenderService {
  static async renderScene(
    projectId: string,
    sceneId: string,
    sceneIndex: number,
    version: number,
    durationFrames: number,
    aspectRatio: '16:9' | '9:16',
    onProgress?: (progress: number) => void
  ): Promise<RenderResult> {
    const startTime = Date.now();
    const resolutionScale = 0.667; // 720p

    // Calculate dimensions
    const baseWidth = aspectRatio === '16:9' ? 1920 : 1080;
    const baseHeight = aspectRatio === '16:9' ? 1080 : 1920;
    const width = Math.round(baseWidth * resolutionScale);
    const height = Math.round(baseHeight * resolutionScale);

    // Get the preview wrapper path
    // Note: We assume GenerationService created this wrapper already.
    // Ideally GenerationService should return the wrapper path, but following convention:
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

    try {
      await fs.access(previewEntryPoint);
    } catch {
      throw new Error(`Scene preview entry point not found: ${previewEntryPoint}`);
    }

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
    const sceneMatch = sceneId.match(/scene-(\d+)/);
    // const index = sceneMatch ? sceneMatch[1] : '0'; 
    // Actually we use sceneId in filename
    const videoFilename = `${sceneId}_v${version}.mp4`;
    // Store relative path for API URL construction
    const relativeVideoPath = `${projectId}/${videoFilename}`;
    const absoluteVideoPath = path.join(process.cwd(), 'output', 'previews', projectId, videoFilename);
    
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

    const stats = await fs.stat(absoluteVideoPath);

    // Return both absolute path (for backend) and URL path (for frontend)
    return {
      videoPath: absoluteVideoPath,
      videoUrl: `/api/preview/${relativeVideoPath}`,
      renderTimeMs: Date.now() - startTime,
      fileSizeBytes: stats.size,
    };
  }
}
