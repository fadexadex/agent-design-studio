/**
 * History Context
 * 
 * React context for managing session history state across the application.
 * Provides actions to save, update, delete sessions and manages UI state
 * for the history sidebar.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';

import type {
  HistorySession,
  HistorySettings,
  StorageQuota,
  SidebarView,
  SessionDetailTab,
} from '../types/history';

import {
  getSessions,
  getSession,
  saveSession as storageSaveSession,
  updateSession as storageUpdateSession,
  deleteSession as storageDeleteSession,
  clearAllSessions,
  getStorageQuota,
  searchSessions,
  isLocalStorageAvailable,
  updateSettings,
  getHistory,
} from '../services/historyStorage';

/**
 * History context value interface
 */
interface HistoryContextValue {
  // Data
  sessions: HistorySession[];
  isLoading: boolean;
  isAvailable: boolean; // localStorage availability
  storageQuota: StorageQuota;
  settings: HistorySettings;
  
  // Actions
  saveSession: (session: HistorySession) => void;
  updateSession: (id: string, updates: Partial<HistorySession>) => void;
  deleteSession: (id: string) => void;
  getSessionById: (id: string) => HistorySession | null;
  clearAll: () => void;
  refreshSessions: () => void;
  search: (query: string) => HistorySession[];
  updateSettings: (settings: Partial<HistorySettings>) => void;
  
  // UI State
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  
  currentView: SidebarView;
  setCurrentView: (view: SidebarView) => void;
  navigateToSession: (sessionId: string) => void;
  navigateToScene: (sessionId: string, sceneId: string) => void;
  navigateToList: () => void;
  
  activeTab: SessionDetailTab;
  setActiveTab: (tab: SessionDetailTab) => void;
  
  // Selection for actions like delete confirmation
  selectedSessionId: string | null;
  setSelectedSessionId: (id: string | null) => void;
}

const HistoryContext = createContext<HistoryContextValue | null>(null);

/**
 * History Provider Props
 */
interface HistoryProviderProps {
  children: ReactNode;
  defaultSidebarOpen?: boolean;
}

/**
 * History Provider Component
 */
export function HistoryProvider({
  children,
  defaultSidebarOpen = false,
}: HistoryProviderProps) {
  // Data state
  const [sessions, setSessions] = useState<HistorySession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [storageQuota, setStorageQuota] = useState<StorageQuota>({
    used: 0,
    available: 0,
    percentage: 0,
  });
  const [settings, setSettings] = useState<HistorySettings>({
    maxSessions: 50,
    autoCleanupOlderThan: 30,
  });
  
  // UI state
  const [isSidebarOpen, setSidebarOpen] = useState(defaultSidebarOpen);
  const [currentView, setCurrentView] = useState<SidebarView>({ type: 'list' });
  const [activeTab, setActiveTab] = useState<SessionDetailTab>('overview');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  
  const isAvailable = useMemo(() => isLocalStorageAvailable(), []);
  
  // Load sessions on mount
  useEffect(() => {
    if (!isAvailable) {
      setIsLoading(false);
      return;
    }
    
    try {
      const loaded = getSessions();
      setSessions(loaded);
      setStorageQuota(getStorageQuota());
      const history = getHistory();
      setSettings(history.settings);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAvailable]);
  
  // Refresh sessions from storage
  const refreshSessions = useCallback(() => {
    if (!isAvailable) return;
    
    try {
      const loaded = getSessions();
      setSessions(loaded);
      setStorageQuota(getStorageQuota());
    } catch (error) {
      console.error('Failed to refresh sessions:', error);
    }
  }, [isAvailable]);
  
  // Save session
  const saveSession = useCallback((session: HistorySession) => {
    if (!isAvailable) return;
    
    const success = storageSaveSession(session);
    if (success) {
      refreshSessions();
    }
  }, [isAvailable, refreshSessions]);
  
  // Update session
  const handleUpdateSession = useCallback((id: string, updates: Partial<HistorySession>) => {
    if (!isAvailable) return;
    
    const success = storageUpdateSession(id, updates);
    if (success) {
      refreshSessions();
    }
  }, [isAvailable, refreshSessions]);
  
  // Delete session
  const handleDeleteSession = useCallback((id: string) => {
    if (!isAvailable) return;
    
    const success = storageDeleteSession(id);
    if (success) {
      refreshSessions();
      // Reset view if we deleted the currently viewed session
      if (currentView.type === 'session' && currentView.sessionId === id) {
        setCurrentView({ type: 'list' });
      }
      if (currentView.type === 'scene' && currentView.sessionId === id) {
        setCurrentView({ type: 'list' });
      }
    }
  }, [isAvailable, refreshSessions, currentView]);
  
  // Get session by ID
  const getSessionById = useCallback((id: string): HistorySession | null => {
    return getSession(id);
  }, []);
  
  // Clear all
  const clearAll = useCallback(() => {
    if (!isAvailable) return;
    
    const success = clearAllSessions();
    if (success) {
      setSessions([]);
      setStorageQuota(getStorageQuota());
      setCurrentView({ type: 'list' });
    }
  }, [isAvailable]);
  
  // Search
  const search = useCallback((query: string): HistorySession[] => {
    return searchSessions(query);
  }, []);
  
  // Update settings
  const handleUpdateSettings = useCallback((newSettings: Partial<HistorySettings>) => {
    if (!isAvailable) return;
    
    const success = updateSettings(newSettings);
    if (success) {
      setSettings(prev => ({ ...prev, ...newSettings }));
    }
  }, [isAvailable]);
  
  // Toggle sidebar
  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);
  
  // Navigation helpers
  const navigateToSession = useCallback((sessionId: string) => {
    setCurrentView({ type: 'session', sessionId });
    setActiveTab('overview');
  }, []);
  
  const navigateToScene = useCallback((sessionId: string, sceneId: string) => {
    setCurrentView({ type: 'scene', sessionId, sceneId });
  }, []);
  
  const navigateToList = useCallback(() => {
    setCurrentView({ type: 'list' });
  }, []);
  
  const value = useMemo<HistoryContextValue>(() => ({
    // Data
    sessions,
    isLoading,
    isAvailable,
    storageQuota,
    settings,
    
    // Actions
    saveSession,
    updateSession: handleUpdateSession,
    deleteSession: handleDeleteSession,
    getSessionById,
    clearAll,
    refreshSessions,
    search,
    updateSettings: handleUpdateSettings,
    
    // UI State
    isSidebarOpen,
    setSidebarOpen,
    toggleSidebar,
    
    currentView,
    setCurrentView,
    navigateToSession,
    navigateToScene,
    navigateToList,
    
    activeTab,
    setActiveTab,
    
    selectedSessionId,
    setSelectedSessionId,
  }), [
    sessions,
    isLoading,
    isAvailable,
    storageQuota,
    settings,
    saveSession,
    handleUpdateSession,
    handleDeleteSession,
    getSessionById,
    clearAll,
    refreshSessions,
    search,
    handleUpdateSettings,
    isSidebarOpen,
    toggleSidebar,
    currentView,
    navigateToSession,
    navigateToScene,
    navigateToList,
    activeTab,
    selectedSessionId,
  ]);
  
  return (
    <HistoryContext.Provider value={value}>
      {children}
    </HistoryContext.Provider>
  );
}

/**
 * Hook to access history context
 */
export function useHistory(): HistoryContextValue {
  const context = useContext(HistoryContext);
  
  if (!context) {
    throw new Error('useHistory must be used within a HistoryProvider');
  }
  
  return context;
}

/**
 * Hook to get a specific session with auto-refresh
 */
export function useHistorySession(sessionId: string | null): HistorySession | null {
  const { getSessionById, sessions } = useHistory();
  
  return useMemo(() => {
    if (!sessionId) return null;
    return getSessionById(sessionId);
  }, [sessionId, getSessionById, sessions]);
}
