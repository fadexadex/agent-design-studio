import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import fs from 'fs/promises';
import { VideoConfig } from '../agent/types';

/**
 * Result of rendering a scene preview
 */
export interface ScenePreviewResult {
    sceneNumber: number;
    videoPath: string;
    durationInFrames: number;
}

export class RemotionRenderer {
    private outputDir: string;
    private scenePreviewDir: string;
    private bundleCache: string | null = null;

    constructor() {
        this.outputDir = path.join(process.cwd(), 'output', 'videos');
        this.scenePreviewDir = path.join(process.cwd(), 'output', 'previews');
    }

    /**
     * Bundle the Remotion project (cached for efficiency)
     */
    private async ensureBundle(onProgress?: (progress: number) => void): Promise<string> {
        if (this.bundleCache) {
            return this.bundleCache;
        }

        const bundleDir = path.join(process.cwd(), 'remotion');
        const entryPoint = path.join(bundleDir, 'src', 'index.ts');

        console.log('[RemotionRenderer] Bundling Remotion project...');
        const bundled = await bundle({
            entryPoint,
            onProgress: (progress) => {
                if (onProgress) {
                    onProgress(progress);
                }
            },
        });

        this.bundleCache = bundled;
        console.log('[RemotionRenderer] Bundle complete:', bundled);
        return bundled;
    }

    /**
     * Clear the bundle cache (call when scene files change)
     */
    clearBundleCache(): void {
        this.bundleCache = null;
    }

    /**
     * Render a single scene as a preview video clip
     */
    async renderScenePreview(
        sceneNumber: number,
        sceneDurationFrames: number,
        config: VideoConfig,
        onProgress: (progress: number) => void
    ): Promise<ScenePreviewResult> {
        // Ensure preview directory exists
        await fs.mkdir(this.scenePreviewDir, { recursive: true });

        const outputFileName = `scene_${sceneNumber}_${Date.now()}.mp4`;
        const outputPath = path.join(this.scenePreviewDir, outputFileName);

        try {
            const width = config.aspectRatio === '16:9' ? 1920 : 1080;
            const height = config.aspectRatio === '16:9' ? 1080 : 1920;
            const scale = config.resolution === '1080p' ? 1 : 0.667;

            // Bundle (or use cached bundle)
            const bundled = await this.ensureBundle((p) => onProgress(p * 0.3));

            // For scene preview, we need to render just that scene
            // We'll use a special composition ID pattern: ScenePreview{N}
            const compositionId = `ScenePreview${sceneNumber}`;

            console.log(`[RemotionRenderer] Selecting composition: ${compositionId}`);

            // Try to select the scene-specific composition
            let composition;
            try {
                composition = await selectComposition({
                    serveUrl: bundled,
                    id: compositionId,
                });
            } catch (e) {
                // Fallback: use the main composition but we can't easily render just one scene
                // For now, we'll skip individual scene previews and just mark as complete
                console.log(`[RemotionRenderer] Scene preview composition ${compositionId} not found, skipping preview`);
                return {
                    sceneNumber,
                    videoPath: '', // No preview available
                    durationInFrames: sceneDurationFrames
                };
            }

            console.log(`[RemotionRenderer] Rendering scene ${sceneNumber} preview...`);

            await renderMedia({
                composition: {
                    ...composition,
                    width: Math.round(width * scale),
                    height: Math.round(height * scale),
                    durationInFrames: sceneDurationFrames,
                    fps: 30,
                },
                serveUrl: bundled,
                codec: 'h264',
                outputLocation: outputPath,
                onProgress: ({ progress }) => {
                    onProgress(0.3 + progress * 0.7);
                },
            });

            console.log(`[RemotionRenderer] Scene ${sceneNumber} preview complete: ${outputPath}`);

            return {
                sceneNumber,
                videoPath: outputPath,
                durationInFrames: sceneDurationFrames
            };
        } catch (error) {
            console.error(`[RemotionRenderer] Scene ${sceneNumber} preview error:`, error);
            // Return empty path on error - scene preview is optional
            return {
                sceneNumber,
                videoPath: '',
                durationInFrames: sceneDurationFrames
            };
        }
    }

    /**
     * Render the full video from MainComposition
     */
    async render(
        compositionPath: string,
        config: VideoConfig,
        onProgress: (progress: number) => void
    ): Promise<string> {
        // Clear bundle cache to pick up any new scene files
        this.clearBundleCache();

        // Ensure output directory exists
        await fs.mkdir(this.outputDir, { recursive: true });

        const outputFileName = `video_${Date.now()}.mp4`;
        const outputPath = path.join(this.outputDir, outputFileName);

        try {
            // Get video dimensions
            const width = config.aspectRatio === '16:9' ? 1920 : 1080;
            const height = config.aspectRatio === '16:9' ? 1080 : 1920;
            const scale = config.resolution === '1080p' ? 1 : 0.667;

            // Bundle the Remotion project
            console.log('[RemotionRenderer] Bundling Remotion project...');
            const bundled = await this.ensureBundle((p) => onProgress(p * 0.2));

            // Select the composition - try the new ID first, fallback to legacy
            console.log('[RemotionRenderer] Selecting composition...');
            let composition;
            try {
                composition = await selectComposition({
                    serveUrl: bundled,
                    id: 'BrandVideo', // Use the main composition that includes MainComposition
                });
            } catch (e) {
                console.error('[RemotionRenderer] Failed to select BrandVideo composition:', e);
                throw new Error('Could not find BrandVideo composition. Ensure Root.tsx is properly configured.');
            }

            // Render the video
            console.log('[RemotionRenderer] Rendering video...');
            await renderMedia({
                composition: {
                    ...composition,
                    width: Math.round(width * scale),
                    height: Math.round(height * scale),
                    durationInFrames: 1350, // 45 seconds at 30fps
                    fps: 30,
                },
                serveUrl: bundled,
                codec: 'h264',
                outputLocation: outputPath,
                onProgress: ({ progress }) => {
                    onProgress(0.2 + progress * 0.8); // Rendering is 80% of progress
                },
            });

            console.log(`[RemotionRenderer] Video rendered successfully: ${outputPath}`);
            return outputPath;
        } catch (error) {
            console.error('[RemotionRenderer] Render error:', error);
            throw new Error(`Failed to render video: ${error}`);
        }
    }

    /**
     * Get the public URL path for a video file
     */
    getVideoUrl(videoPath: string): string {
        // Convert absolute path to relative URL for the API
        const relativePath = path.relative(path.join(process.cwd(), 'output'), videoPath);
        return `/api/video/${path.basename(videoPath)}`;
    }

    /**
     * Get the public URL path for a scene preview
     */
    getScenePreviewUrl(videoPath: string): string {
        if (!videoPath) return '';
        return `/api/preview/${path.basename(videoPath)}`;
    }
}
