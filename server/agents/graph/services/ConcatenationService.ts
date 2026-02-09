import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

export class ConcatenationService {
  static async concatenateVideos(
    projectId: string, 
    inputPaths: string[], 
    outputPath: string
  ): Promise<void> {
    const listPath = path.join(path.dirname(outputPath), 'concat_list.txt');
    
    try {
      const listContent = inputPaths.map(p => `file '${p}'`).join('\n');
      await fs.writeFile(listPath, listContent);

      return new Promise((resolve, reject) => {
        const ffmpeg = spawn('ffmpeg', [
          '-y',
          '-f', 'concat',
          '-safe', '0',
          '-i', listPath,
          '-c', 'copy',
          outputPath
        ]);

        let stderr = '';

        ffmpeg.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        ffmpeg.on('close', async (code) => {
          await fs.unlink(listPath).catch(() => {});

          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`ffmpeg failed with code ${code}: ${stderr.slice(-500)}`));
          }
        });

        ffmpeg.on('error', async (err) => {
          await fs.unlink(listPath).catch(() => {});
          reject(new Error(`Failed to spawn ffmpeg: ${err.message}. Is ffmpeg installed?`));
        });
      });
    } catch (error) {
      await fs.unlink(listPath).catch(() => {});
      throw error;
    }
  }
}
