/**
 * Error Message Formatting Utilities
 * 
 * Clean up verbose error messages for better UI display.
 */

/**
 * Known error patterns and their user-friendly messages
 */
const ERROR_PATTERNS: Array<{ pattern: RegExp | string; message: string }> = [
  // Scene preview errors (check first - most specific)
  { pattern: 'entry point not found', message: 'Preview entry point missing' },
  { pattern: 'preview entry', message: 'Scene preview not found' },
  { pattern: 'ScenePreview', message: 'Preview file missing' },
  { pattern: 'Missing video paths', message: 'Some scenes failed to render' },
  // Remotion errors
  { pattern: 'registerRoot', message: 'Missing registerRoot in entry point' },
  { pattern: 'composition', message: 'Composition error' },
  // File system errors
  { pattern: 'ENOENT', message: 'File not found' },
  { pattern: 'EACCES', message: 'Permission denied' },
  { pattern: 'permission denied', message: 'Permission denied' },
  // Code errors
  { pattern: 'SyntaxError', message: 'Syntax error in code' },
  { pattern: 'TypeError', message: 'Type error' },
  { pattern: 'ReferenceError', message: 'Reference error' },
  // Module errors
  { pattern: 'Module not found', message: 'Missing module' },
  { pattern: 'Cannot find module', message: 'Module not found' },
  // Timeout/resource errors
  { pattern: 'timeout', message: 'Operation timed out' },
  { pattern: 'TIMEOUT', message: 'Render timeout' },
  { pattern: 'out of memory', message: 'Out of memory' },
  // Build errors
  { pattern: 'bundle', message: 'Bundle error' },
  { pattern: 'compile', message: 'Compilation error' },
  { pattern: 'export', message: 'Export error' },
  { pattern: 'import', message: 'Import error' },
];

/**
 * Extract a meaningful, short error message from a verbose error string.
 * Removes file paths and extracts the core error type.
 */
export function formatErrorMessage(error: string | undefined | null, maxLength: number = 50): string {
  if (!error) return 'Unknown error';
  
  // Check for known patterns first
  for (const { pattern, message } of ERROR_PATTERNS) {
    if (typeof pattern === 'string') {
      if (error.toLowerCase().includes(pattern.toLowerCase())) {
        return message;
      }
    } else if (pattern.test(error)) {
      return message;
    }
  }
  
  // Remove common path prefixes
  let cleaned = error
    // Remove absolute paths (Unix and Windows)
    .replace(/\/Users\/[^\s]+\//g, '')
    .replace(/\/home\/[^\s]+\//g, '')
    .replace(/C:\\[^\s]+\\/gi, '')
    // Remove "You passed X as your entry point, but..." pattern
    .replace(/You passed [^\s]+ as your entry point,?\s*/gi, '')
    // Remove common file extensions context
    .replace(/\.tsx?/g, '')
    .replace(/\.jsx?/g, '')
    // Clean up multiple spaces
    .replace(/\s+/g, ' ')
    .trim();
  
  // If still too long, truncate with ellipsis
  if (cleaned.length > maxLength) {
    // Try to break at a word boundary
    const truncated = cleaned.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > maxLength * 0.6) {
      return truncated.substring(0, lastSpace) + '...';
    }
    return truncated + '...';
  }
  
  return cleaned || 'Unknown error';
}

/**
 * Get a very short error label (for badges, etc.)
 */
export function getErrorLabel(error: string | undefined | null): string {
  return formatErrorMessage(error, 25);
}

/**
 * Determine error severity based on error content
 */
export function getErrorSeverity(error: string | undefined | null): 'critical' | 'warning' | 'info' {
  if (!error) return 'info';
  
  const lowerError = error.toLowerCase();
  
  if (lowerError.includes('memory') || lowerError.includes('timeout') || lowerError.includes('crash')) {
    return 'critical';
  }
  
  if (lowerError.includes('syntax') || lowerError.includes('type') || lowerError.includes('reference')) {
    return 'warning';
  }
  
  return 'info';
}
