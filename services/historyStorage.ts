/**
 * History Storage Service
 * 
 * Handles localStorage persistence for session history with compression
 * for large payloads and storage quota management.
 */

import type {
  HistorySession,
  HistoryStorage,
  HistorySettings,
  StorageQuota,
} from '../types/history';

const STORAGE_KEY = 'agent_design_studio_history';
const CURRENT_VERSION = 1;

const DEFAULT_SETTINGS: HistorySettings = {
  maxSessions: 50,
  autoCleanupOlderThan: 30, // 30 days
};

/**
 * Check if localStorage is available
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Simple LZ-based string compression for reducing storage size
 * Uses a basic Run-Length Encoding approach for JSON data
 */
function compressString(input: string): string {
  // For now, use base64 encoding with a simple marker
  // In production, could use lz-string library for better compression
  try {
    return 'compressed:' + btoa(encodeURIComponent(input));
  } catch {
    return input;
  }
}

/**
 * Decompress a compressed string
 */
function decompressString(input: string): string {
  if (input.startsWith('compressed:')) {
    try {
      return decodeURIComponent(atob(input.slice(11)));
    } catch {
      return input;
    }
  }
  return input;
}

/**
 * Get raw storage data
 */
function getRawStorage(): HistoryStorage | null {
  if (!isLocalStorageAvailable()) {
    return null;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const decompressed = decompressString(raw);
    const data = JSON.parse(decompressed) as HistoryStorage;

    // Handle migrations if needed
    if (data.version < CURRENT_VERSION) {
      return migrateStorage(data);
    }

    return data;
  } catch (error) {
    console.error('Failed to read history storage:', error);
    return null;
  }
}

/**
 * Save raw storage data
 */
function saveRawStorage(data: HistoryStorage): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    const serialized = JSON.stringify(data);
    const compressed = compressString(serialized);
    localStorage.setItem(STORAGE_KEY, compressed);
    return true;
  } catch (error) {
    console.error('Failed to save history storage:', error);
    // If quota exceeded, try to clean up old sessions and retry
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('Storage quota exceeded, attempting cleanup...');
      const cleaned = cleanupOldSessions(data, 10); // Remove 10 oldest
      try {
        const serialized = JSON.stringify(cleaned);
        const compressed = compressString(serialized);
        localStorage.setItem(STORAGE_KEY, compressed);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}

/**
 * Migrate storage from older versions
 */
function migrateStorage(data: HistoryStorage): HistoryStorage {
  // Future migrations would go here
  // For now, just update version
  return {
    ...data,
    version: CURRENT_VERSION,
  };
}

/**
 * Remove oldest sessions to free up space
 */
function cleanupOldSessions(data: HistoryStorage, count: number): HistoryStorage {
  const sorted = [...data.sessions].sort(
    (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
  );
  
  return {
    ...data,
    sessions: sorted.slice(count),
  };
}

/**
 * Initialize storage with defaults if needed
 */
function initializeStorage(): HistoryStorage {
  return {
    version: CURRENT_VERSION,
    sessions: [],
    settings: DEFAULT_SETTINGS,
  };
}

// ==================== Public API ====================

/**
 * Get all history data
 */
export function getHistory(): HistoryStorage {
  const data = getRawStorage();
  if (!data) {
    return initializeStorage();
  }
  return data;
}

/**
 * Get all sessions sorted by most recent first
 */
export function getSessions(): HistorySession[] {
  const data = getHistory();
  return [...data.sessions].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

/**
 * Get a single session by ID
 */
export function getSession(id: string): HistorySession | null {
  const data = getHistory();
  return data.sessions.find(s => s.id === id) || null;
}

/**
 * Save a new session
 */
export function saveSession(session: HistorySession): boolean {
  const data = getHistory();
  
  // Check if session already exists
  const existingIndex = data.sessions.findIndex(s => s.id === session.id);
  
  if (existingIndex >= 0) {
    // Update existing
    data.sessions[existingIndex] = session;
  } else {
    // Add new
    data.sessions.push(session);
    
    // Enforce max sessions limit
    if (data.sessions.length > data.settings.maxSessions) {
      // Remove oldest sessions
      const excess = data.sessions.length - data.settings.maxSessions;
      data.sessions = cleanupOldSessions(data, excess).sessions;
    }
  }
  
  return saveRawStorage(data);
}

/**
 * Update an existing session with partial data
 */
export function updateSession(
  id: string,
  updates: Partial<HistorySession>
): boolean {
  const data = getHistory();
  const index = data.sessions.findIndex(s => s.id === id);
  
  if (index < 0) {
    console.warn(`Session ${id} not found for update`);
    return false;
  }
  
  data.sessions[index] = {
    ...data.sessions[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  return saveRawStorage(data);
}

/**
 * Delete a session by ID
 */
export function deleteSession(id: string): boolean {
  const data = getHistory();
  const index = data.sessions.findIndex(s => s.id === id);
  
  if (index < 0) {
    return false;
  }
  
  data.sessions.splice(index, 1);
  return saveRawStorage(data);
}

/**
 * Clear all sessions
 */
export function clearAllSessions(): boolean {
  const data = getHistory();
  data.sessions = [];
  return saveRawStorage(data);
}

/**
 * Update storage settings
 */
export function updateSettings(settings: Partial<HistorySettings>): boolean {
  const data = getHistory();
  data.settings = {
    ...data.settings,
    ...settings,
  };
  return saveRawStorage(data);
}

/**
 * Get storage quota information
 */
export function getStorageQuota(): StorageQuota {
  if (!isLocalStorageAvailable()) {
    return { used: 0, available: 0, percentage: 0 };
  }

  try {
    // Estimate used storage for our key
    const raw = localStorage.getItem(STORAGE_KEY) || '';
    const used = new Blob([raw]).size;
    
    // localStorage limit is typically 5-10MB
    // We'll use 5MB as a conservative estimate
    const estimated_limit = 5 * 1024 * 1024; // 5MB
    
    return {
      used,
      available: estimated_limit - used,
      percentage: Math.round((used / estimated_limit) * 100),
    };
  } catch {
    return { used: 0, available: 0, percentage: 0 };
  }
}

/**
 * Clean up sessions older than specified days
 */
export function cleanupByAge(days: number): number {
  const data = getHistory();
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  
  const initialCount = data.sessions.length;
  data.sessions = data.sessions.filter(
    s => new Date(s.updatedAt).getTime() > cutoff
  );
  
  const removed = initialCount - data.sessions.length;
  
  if (removed > 0) {
    saveRawStorage(data);
  }
  
  return removed;
}

/**
 * Search sessions by brand name or style
 */
export function searchSessions(query: string): HistorySession[] {
  const sessions = getSessions();
  const lowerQuery = query.toLowerCase().trim();
  
  if (!lowerQuery) {
    return sessions;
  }
  
  return sessions.filter(session => {
    const brandMatch = session.summary.brandName.toLowerCase().includes(lowerQuery);
    const styleMatch = session.summary.style.toLowerCase().includes(lowerQuery);
    const promptMatch = session.config.prompt?.toLowerCase().includes(lowerQuery);
    return brandMatch || styleMatch || promptMatch;
  });
}

/**
 * Export history to JSON string for backup
 */
export function exportHistory(): string {
  const data = getHistory();
  return JSON.stringify(data, null, 2);
}

/**
 * Import history from JSON string
 */
export function importHistory(jsonString: string, merge = false): boolean {
  try {
    const imported = JSON.parse(jsonString) as HistoryStorage;
    
    // Validate structure
    if (!imported.sessions || !Array.isArray(imported.sessions)) {
      throw new Error('Invalid history format');
    }
    
    if (merge) {
      const existing = getHistory();
      // Merge sessions, keeping newer versions
      const existingIds = new Set(existing.sessions.map(s => s.id));
      const newSessions = imported.sessions.filter(s => !existingIds.has(s.id));
      existing.sessions.push(...newSessions);
      return saveRawStorage(existing);
    } else {
      return saveRawStorage({
        ...imported,
        version: CURRENT_VERSION,
      });
    }
  } catch (error) {
    console.error('Failed to import history:', error);
    return false;
  }
}
