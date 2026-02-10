/**
 * API Configuration Utility
 * 
 * Centralizes API base URL configuration for the frontend.
 * Uses VITE_API_URL environment variable if set, otherwise defaults to localhost:3001.
 */

/**
 * Get the base URL for API requests
 * In development with Vite proxy, this returns empty string (relative URLs work)
 * In production or when explicitly set, returns the full backend URL
 */
export function getApiBaseUrl(): string {
  // Check for explicit API URL override
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    return envUrl;
  }

  // In development mode, use relative URLs (Vite proxy handles it)
  if (import.meta.env.DEV) {
    return '';
  }

  // Default fallback for production
  return 'http://localhost:3001';
}

/**
 * Build a full API URL from a path
 * @param path - The API path (e.g., '/api/director/start')
 */
export function buildApiUrl(path: string): string {
  const baseUrl = getApiBaseUrl();
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

/**
 * Build an SSE/EventSource URL
 * @param path - The SSE endpoint path
 */
export function buildSseUrl(path: string): string {
  // SSE always needs absolute URL for EventSource
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}
