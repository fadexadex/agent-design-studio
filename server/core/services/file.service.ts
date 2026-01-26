import path from 'path';
import fs from 'fs';

/**
 * Get the path to a preview file, with security sanitization
 */
export function getPreviewPath(filename: string): string | null {
    // Sanitize filename to prevent directory traversal
    const sanitizedFilename = path.basename(filename);
    const previewPath = path.join(process.cwd(), 'output', 'previews', sanitizedFilename);

    // Check if file exists
    if (fs.existsSync(previewPath)) {
        return previewPath;
    }

    return null;
}

/**
 * Check if a file exists at the given path
 */
export function fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
}
