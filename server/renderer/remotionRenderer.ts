import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import fs from 'fs/promises';
import { VideoConfig } from '../agent/types';

export class RemotionRenderer {
    private outputDir: string;

    constructor() {
        this.outputDir = path.join(process.cwd(), 'output', 'videos');
    }

    async render(
        compositionPath: string,
        config: VideoConfig,
        onProgress: (progress: number) => void
    ): Promise<string> {
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
            const bundleDir = path.join(process.cwd(), 'remotion');
            const entryPoint = path.join(bundleDir, 'src', 'index.ts');

            console.log('Bundling Remotion project...');
            const bundled = await bundle({
                entryPoint,
                onProgress: (progress) => {
                    onProgress(progress * 0.2); // Bundling is 20% of progress
                },
            });

            // Select the composition
            console.log('Selecting composition...');
            const composition = await selectComposition({
                serveUrl: bundled,
                id: 'BrandVideo',
                inputProps: {
                    compositionPath,
                },
            });

            // Render the video
            console.log('Rendering video...');
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

            console.log(`Video rendered successfully: ${outputPath}`);
            return outputPath;
        } catch (error) {
            console.error('Render error:', error);
            throw new Error(`Failed to render video: ${error}`);
        }
    }
}
