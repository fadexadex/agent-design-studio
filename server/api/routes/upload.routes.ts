/**
 * Upload Routes - Handle media file uploads for Remotion compositions
 * 
 * Uploaded files are saved to remotion/public/uploads/ so they can be
 * accessed via staticFile() in generated Remotion compositions.
 * 
 * Best Practice (from Remotion docs):
 * - Place assets in the `public/` folder at your project root
 * - Use `staticFile()` to reference files: <Img src={staticFile('uploads/logo.png')} />
 */

import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Ensure the uploads directory exists
const REMOTION_PUBLIC_DIR = path.join(process.cwd(), 'remotion', 'public');
const UPLOADS_DIR = path.join(REMOTION_PUBLIC_DIR, 'uploads');

// Create directories if they don't exist (sync on startup)
if (!existsSync(REMOTION_PUBLIC_DIR)) {
    mkdirSync(REMOTION_PUBLIC_DIR, { recursive: true });
}
if (!existsSync(UPLOADS_DIR)) {
    mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Extracts mime type and extension from base64 data URL
 */
function parseBase64DataUrl(dataUrl: string): { mimeType: string; data: string; extension: string } | null {
    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
        return null;
    }

    const mimeType = matches[1];
    const data = matches[2];
    
    // Determine file extension from mime type
    const extMap: Record<string, string> = {
        'image/png': '.png',
        'image/jpeg': '.jpg',
        'image/jpg': '.jpg',
        'image/gif': '.gif',
        'image/webp': '.webp',
        'image/svg+xml': '.svg',
        'video/mp4': '.mp4',
        'video/webm': '.webm',
        'video/quicktime': '.mov'
    };

    const extension = extMap[mimeType] || '.bin';

    return { mimeType, data, extension };
}

/**
 * POST /api/upload/media
 * Upload a media file (image/video) for use in Remotion compositions
 * 
 * Request: { base64: "data:<mime>;base64,<data>", originalName?: string }
 * Response: { 
 *   success: true, 
 *   filePath: "uploads/uuid.png",  // Path to use with staticFile()
 *   fullPath: "/absolute/path/to/file.png"
 * }
 */
router.post('/media', async (req: Request, res: Response) => {
    try {
        const { base64, originalName } = req.body;

        if (!base64) {
            return res.status(400).json({ 
                success: false, 
                error: 'No base64 data provided. Expected: { base64: "data:<mime>;base64,<data>" }' 
            });
        }

        const parsed = parseBase64DataUrl(base64);
        if (!parsed) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid base64 format. Expected: data:<mime>;base64,<data>' 
            });
        }

        const { mimeType, data, extension } = parsed;
        const filename = `${uuidv4()}${extension}`;
        const filePath = path.join(UPLOADS_DIR, filename);

        // Write the file
        const buffer = Buffer.from(data, 'base64');
        await fs.writeFile(filePath, buffer);

        // The path relative to remotion/public/ for use with staticFile()
        const staticFilePath = `uploads/${filename}`;

        console.log(`[Upload] Media saved: ${filename} (original: ${originalName || 'unknown'})`);

        res.json({
            success: true,
            filePath: staticFilePath,  // Use this with staticFile() in Remotion
            fullPath: filePath,
            originalName: originalName || filename,
            mimeType: mimeType,
            size: buffer.length
        });
    } catch (error: any) {
        console.error('[Upload] Error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Failed to upload file' 
        });
    }
});

/**
 * POST /api/upload/logo
 * Convenience endpoint specifically for logo uploads
 * 
 * Request: { base64: "data:image/png;base64,...", originalName?: string }
 * 
 * Response: { 
 *   success: true, 
 *   logoPath: "uploads/logo-uuid.png"  // Path to use with staticFile()
 * }
 */
router.post('/logo', async (req: Request, res: Response) => {
    try {
        const { base64, originalName } = req.body;

        if (!base64) {
            return res.status(400).json({ 
                success: false, 
                error: 'No base64 data provided. Expected: { base64: "data:image/...;base64,<data>" }' 
            });
        }

        const parsed = parseBase64DataUrl(base64);
        if (!parsed) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid base64 format. Expected: data:<mime>;base64,<data>' 
            });
        }

        // Validate it's an image
        if (!parsed.mimeType.startsWith('image/')) {
            return res.status(400).json({ 
                success: false, 
                error: `Logo must be an image. Received: ${parsed.mimeType}` 
            });
        }

        const { mimeType, data, extension } = parsed;
        const filename = `logo-${uuidv4()}${extension}`;
        const filePath = path.join(UPLOADS_DIR, filename);

        // Write the file
        const buffer = Buffer.from(data, 'base64');
        await fs.writeFile(filePath, buffer);

        // The path relative to remotion/public/ for use with staticFile()
        const staticFilePath = `uploads/${filename}`;

        console.log(`[Upload] Logo saved: ${filename} (original: ${originalName || 'unknown'})`);

        res.json({
            success: true,
            logoPath: staticFilePath,  // Use this with staticFile() in Remotion
            fullPath: filePath,
            originalName: originalName || filename,
            mimeType: mimeType,
            size: buffer.length
        });
    } catch (error: any) {
        console.error('[Upload] Logo error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Failed to upload logo' 
        });
    }
});

/**
 * DELETE /api/upload/:filename
 * Delete an uploaded file
 */
router.delete('/:filename', async (req: Request, res: Response) => {
    try {
        const { filename } = req.params;
        
        // Sanitize filename to prevent directory traversal
        const sanitizedFilename = path.basename(filename);
        const filePath = path.join(UPLOADS_DIR, sanitizedFilename);

        // Check if file exists
        try {
            await fs.access(filePath);
        } catch {
            return res.status(404).json({ 
                success: false, 
                error: 'File not found' 
            });
        }

        // Delete the file
        await fs.unlink(filePath);
        console.log(`[Upload] File deleted: ${sanitizedFilename}`);

        res.json({ success: true, message: 'File deleted' });
    } catch (error: any) {
        console.error('[Upload] Delete error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Failed to delete file' 
        });
    }
});

/**
 * GET /api/upload/list
 * List all uploaded files
 */
router.get('/list', async (_req: Request, res: Response) => {
    try {
        const files = await fs.readdir(UPLOADS_DIR);
        const fileDetails = await Promise.all(
            files.map(async (filename) => {
                const filePath = path.join(UPLOADS_DIR, filename);
                const stats = await fs.stat(filePath);
                return {
                    filename,
                    staticFilePath: `uploads/${filename}`,
                    size: stats.size,
                    createdAt: stats.birthtime
                };
            })
        );

        res.json({ 
            success: true, 
            files: fileDetails,
            uploadsDir: 'remotion/public/uploads'
        });
    } catch (error: any) {
        console.error('[Upload] List error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Failed to list files' 
        });
    }
});

export default router;
