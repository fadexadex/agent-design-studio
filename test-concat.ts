
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

const projectId = '620fec9b-dd60-42e5-89d4-51e0c8c1625a';
const inputPaths = [
  `output/previews/${projectId}/scene-0_v1.mp4`,
  `output/previews/${projectId}/scene-1_v1.mp4`,
  `output/previews/${projectId}/scene-2_v1.mp4`
].map(p => path.join(process.cwd(), p));

const outputDir = path.join(process.cwd(), 'output', 'final', projectId);
const outputPath = path.join(outputDir, 'video.mp4');

async function concatenateVideos(inputPaths: string[], outputPath: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      
      const listPath = path.join(path.dirname(outputPath), 'concat_list.txt');
      const listContent = inputPaths.map(p => `file '${p}'`).join('\n');
      await fs.writeFile(listPath, listContent);

      console.log(`Concatenating ${inputPaths.length} videos to ${outputPath}`);
      console.log('List content:\n', listContent);

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
        // await fs.unlink(listPath).catch(() => {});

        if (code === 0) {
          console.log(`Video concatenation complete`);
          resolve();
        } else {
          console.error(`ffmpeg failed with code ${code}:`, stderr);
          reject(new Error(`ffmpeg failed with code ${code}`));
        }
      });

      ffmpeg.on('error', async (err) => {
        // await fs.unlink(listPath).catch(() => {});
        console.error('Failed to spawn ffmpeg:', err);
        reject(err);
      });
    } catch (error) {
      console.error('Error in concatenateVideos:', error);
      reject(error);
    }
  });
}

concatenateVideos(inputPaths, outputPath).catch(console.error);
