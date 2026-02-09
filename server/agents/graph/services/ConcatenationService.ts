import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

// Available background music tracks
const AUDIO_TRACKS: Record<string, string> = {
  epic: 'kornevmusic-epic-478847.mp3',
  lofi: 'sonican-lo-fi-music-loop-sentimental-jazzy-love-473154.mp3',
  cinematic: 'tunetank-inspiring-cinematic-music-409347.mp3',
};

// Map visual styles to music tracks
const STYLE_TO_MUSIC: Record<string, keyof typeof AUDIO_TRACKS> = {
  'motion-graphics': 'cinematic',
  'kinetic-typography': 'epic',
  'product-showcase': 'cinematic',
  'social-media': 'lofi',
  'corporate': 'cinematic',
  'default': 'cinematic',
};

export interface ConcatenateOptions {
  /** Visual style to determine music selection */
  visualStyle?: string;
  /** Volume level for background music (0.0 to 1.0) */
  musicVolume?: number;
  /** Fade in duration in seconds */
  fadeInSeconds?: number;
  /** Fade out duration in seconds */
  fadeOutSeconds?: number;
}

export class ConcatenationService {
  static async concatenateVideos(
    projectId: string, 
    inputPaths: string[], 
    outputPath: string,
    options: ConcatenateOptions = {}
  ): Promise<void> {
    const {
      visualStyle = 'default',
      musicVolume = 0.3,
      fadeInSeconds = 1,
      fadeOutSeconds = 2,
    } = options;

    console.log(`[ConcatenationService] Starting concatenation for project ${projectId}`);
    console.log(`[ConcatenationService] Input paths (${inputPaths.length}):`, inputPaths);
    console.log(`[ConcatenationService] Output path:`, outputPath);
    console.log(`[ConcatenationService] Options:`, { visualStyle, musicVolume, fadeInSeconds, fadeOutSeconds });

    const listPath = path.join(path.dirname(outputPath), 'concat_list.txt');
    const tempVideoPath = path.join(path.dirname(outputPath), 'temp_video.mp4');
    
    // Select music based on style
    const musicKey = STYLE_TO_MUSIC[visualStyle] || STYLE_TO_MUSIC['default'];
    const musicFilename = AUDIO_TRACKS[musicKey];
    const musicPath = path.join(process.cwd(), 'remotion', 'public', 'audio', musicFilename);
    
    console.log(`[ConcatenationService] Selected music: ${musicKey} -> ${musicFilename}`);
    console.log(`[ConcatenationService] Music path: ${musicPath}`);
    
    // Check if music file exists
    let hasMusicFile = false;
    try {
      await fs.access(musicPath);
      const musicStats = await fs.stat(musicPath);
      hasMusicFile = true;
      console.log(`[ConcatenationService] Music file found! Size: ${musicStats.size} bytes`);
    } catch (err) {
      console.warn(`[ConcatenationService] Music file NOT found: ${musicPath}`);
      console.warn(`[ConcatenationService] Error:`, err);
      // List available audio files for debugging
      try {
        const audioDir = path.join(process.cwd(), 'remotion', 'public', 'audio');
        const audioFiles = await fs.readdir(audioDir);
        console.log(`[ConcatenationService] Available audio files in ${audioDir}:`, audioFiles);
      } catch {
        console.warn(`[ConcatenationService] Could not list audio directory`);
      }
    }
    
    try {
      const listContent = inputPaths.map(p => `file '${p}'`).join('\n');
      await fs.writeFile(listPath, listContent);
      console.log(`[ConcatenationService] Concat list written to ${listPath}`);

      // Step 1: Concatenate videos without audio first
      console.log(`[ConcatenationService] Step 1: Concatenating ${inputPaths.length} videos...`);
      const concatOutputPath = hasMusicFile ? tempVideoPath : outputPath;
      console.log(`[ConcatenationService] Concat output: ${concatOutputPath}`);
      
      await new Promise<void>((resolve, reject) => {
        const args = [
          '-y',
          '-f', 'concat',
          '-safe', '0',
          '-i', listPath,
          '-c', 'copy',
          concatOutputPath
        ];
        console.log(`[ConcatenationService] FFmpeg concat command: ffmpeg ${args.join(' ')}`);
        
        const ffmpeg = spawn('ffmpeg', args);

        let stderr = '';

        ffmpeg.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        ffmpeg.on('close', async (code) => {
          if (code === 0) {
            console.log(`[ConcatenationService] Step 1 complete: Video concatenation successful`);
            resolve();
          } else {
            console.error(`[ConcatenationService] Step 1 FAILED with code ${code}`);
            console.error(`[ConcatenationService] FFmpeg stderr:`, stderr.slice(-1000));
            reject(new Error(`ffmpeg concat failed with code ${code}: ${stderr.slice(-500)}`));
          }
        });

        ffmpeg.on('error', (err) => {
          console.error(`[ConcatenationService] FFmpeg spawn error:`, err);
          reject(new Error(`Failed to spawn ffmpeg: ${err.message}. Is ffmpeg installed?`));
        });
      });

      // Step 2: Add background music with fade in/out if music file exists
      if (hasMusicFile) {
        console.log(`[ConcatenationService] Step 2: Adding background music...`);
        
        // Get video duration
        const videoDuration = await this.getVideoDuration(tempVideoPath);
        console.log(`[ConcatenationService] Video duration: ${videoDuration} seconds`);
        
        await new Promise<void>((resolve, reject) => {
          // Build audio filter with fade in and fade out
          const fadeOutStart = Math.max(0, videoDuration - fadeOutSeconds);
          const audioFilter = [
            `afade=t=in:st=0:d=${fadeInSeconds}`,
            `afade=t=out:st=${fadeOutStart}:d=${fadeOutSeconds}`,
            `volume=${musicVolume}`,
          ].join(',');

          console.log(`[ConcatenationService] Audio filter: ${audioFilter}`);
          console.log(`[ConcatenationService] Fade out starts at: ${fadeOutStart}s`);

          const args = [
            '-y',
            '-i', tempVideoPath,        // Video input (no audio)
            '-i', musicPath,             // Audio input
            '-filter_complex', `[1:a]${audioFilter},atrim=0:${videoDuration}[a]`,
            '-map', '0:v',               // Use video from first input
            '-map', '[a]',               // Use filtered audio
            '-c:v', 'copy',              // Copy video (no re-encode)
            '-c:a', 'aac',               // Encode audio to AAC
            '-b:a', '128k',              // Audio bitrate
            '-shortest',                 // Finish when shortest input ends
            outputPath
          ];
          console.log(`[ConcatenationService] FFmpeg audio mix command: ffmpeg ${args.join(' ')}`);
          
          const ffmpeg = spawn('ffmpeg', args);

          let stderr = '';

          ffmpeg.stderr.on('data', (data) => {
            stderr += data.toString();
          });

          ffmpeg.on('close', async (code) => {
            // Clean up temp file
            await fs.unlink(tempVideoPath).catch(() => {});
            
            if (code === 0) {
              console.log(`[ConcatenationService] Step 2 complete: Audio mix successful`);
              console.log(`[ConcatenationService] Final output: ${outputPath}`);
              resolve();
            } else {
              console.error(`[ConcatenationService] Step 2 FAILED with code ${code}`);
              console.error(`[ConcatenationService] FFmpeg stderr:`, stderr.slice(-1000));
              reject(new Error(`ffmpeg audio mix failed with code ${code}: ${stderr.slice(-500)}`));
            }
          });

          ffmpeg.on('error', async (err) => {
            console.error(`[ConcatenationService] FFmpeg audio mix spawn error:`, err);
            await fs.unlink(tempVideoPath).catch(() => {});
            reject(new Error(`Failed to spawn ffmpeg for audio mix: ${err.message}`));
          });
        });
      } else {
        console.log(`[ConcatenationService] Skipping audio mix - no music file available`);
      }

      // Clean up list file
      await fs.unlink(listPath).catch(() => {});

      // Verify final output exists
      try {
        const outputStats = await fs.stat(outputPath);
        console.log(`[ConcatenationService] SUCCESS! Final video size: ${outputStats.size} bytes`);
      } catch {
        console.error(`[ConcatenationService] WARNING: Output file not found after concatenation!`);
      }

    } catch (error) {
      console.error(`[ConcatenationService] FATAL ERROR:`, error);
      await fs.unlink(listPath).catch(() => {});
      await fs.unlink(tempVideoPath).catch(() => {});
      throw error;
    }
  }

  /**
   * Get video duration in seconds using ffprobe
   */
  private static async getVideoDuration(videoPath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const ffprobe = spawn('ffprobe', [
        '-v', 'error',
        '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1',
        videoPath
      ]);

      let stdout = '';
      let stderr = '';

      ffprobe.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      ffprobe.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ffprobe.on('close', (code) => {
        if (code === 0) {
          const duration = parseFloat(stdout.trim());
          if (isNaN(duration)) {
            reject(new Error('Failed to parse video duration'));
          } else {
            resolve(duration);
          }
        } else {
          reject(new Error(`ffprobe failed with code ${code}: ${stderr}`));
        }
      });

      ffprobe.on('error', (err) => {
        reject(new Error(`Failed to spawn ffprobe: ${err.message}`));
      });
    });
  }
}
