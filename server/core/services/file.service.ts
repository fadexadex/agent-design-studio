import path from 'path';
import fs from 'fs';

/**
 * Get the path to a preview file, with security sanitization
 * Supports both flat structure (filename only) and nested structure (projectId/filename)
 */
export function getPreviewPath(filename: string): string | null {
    // Sanitize to prevent directory traversal - allow only alphanumeric, dashes, underscores, dots, and forward slashes
    const sanitizedPath = filename.replace(/[^a-zA-Z0-9-_./]/g, '');
    
    // Don't allow path traversal
    if (sanitizedPath.includes('..')) {
        return null;
    }
    
    const previewPath = path.join(process.cwd(), 'output', 'previews', sanitizedPath);

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
