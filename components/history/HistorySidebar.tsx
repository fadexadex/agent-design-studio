/**
 * History Sidebar
 * 
 * Collapsible sidebar panel for browsing session history.
 * Manages navigation between list view, session detail, and scene detail.
 */

import React from 'react';
import { X, History, ChevronLeft } from 'lucide-react';
import { useHistory } from '../../contexts/HistoryContext';
import { SessionList } from './SessionList';
import { SessionDetail } from './SessionDetail';
import { SceneDetail } from './SceneDetail';

export const HistorySidebar: React.FC = () => {
  const {
    isSidebarOpen,
    setSidebarOpen,
    currentView,
    navigateToList,
    navigateToSession,
    isAvailable,
    storageQuota,
  } = useHistory();

  if (!isSidebarOpen) {
    return null;
  }

  const renderBackButton = () => {
    if (currentView.type === 'list') return null;

    const handleBack = () => {
      if (currentView.type === 'scene') {
        navigateToSession(currentView.sessionId);
      } else {
        navigateToList();
      }
    };

    return (
      <button
        onClick={handleBack}
        className="flex items-center gap-1 text-zinc-400 hover:text-white text-sm transition-colors"
      >
        <ChevronLeft size={16} />
        <span>Back</span>
      </button>
    );
  };

  const getTitle = () => {
    switch (currentView.type) {
      case 'list':
        return 'History';
      case 'session':
        return 'Session Details';
      case 'scene':
        return 'Scene Details';
      default:
        return 'History';
    }
  };

  const renderContent = () => {
    if (!isAvailable) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <History size={48} className="text-zinc-600 mb-4" />
          <h3 className="text-zinc-400 font-medium mb-2">History Unavailable</h3>
          <p className="text-zinc-500 text-sm">
            Local storage is not available. History cannot be saved in private browsing mode.
          </p>
        </div>
      );
    }

    switch (currentView.type) {
      case 'list':
        return <SessionList />;
      case 'session':
        return <SessionDetail sessionId={currentView.sessionId} />;
      case 'scene':
        return (
          <SceneDetail
            sessionId={currentView.sessionId}
            sceneId={currentView.sceneId}
          />
        );
      default:
        return <SessionList />;
    }
  };

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={() => setSidebarOpen(false)}
      />
      
      {/* Sidebar */}
      <aside className="fixed lg:relative inset-y-0 left-0 z-50 w-80 bg-zinc-900 border-r border-zinc-800 flex flex-col shadow-xl lg:shadow-none">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            {renderBackButton()}
            {currentView.type === 'list' && (
              <>
                <History size={20} className="text-purple-400" />
                <h2 className="font-semibold text-white">{getTitle()}</h2>
              </>
            )}
            {currentView.type !== 'list' && (
              <h2 className="font-medium text-white text-sm">{getTitle()}</h2>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            title="Close History"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {renderContent()}
        </div>

        {/* Storage indicator */}
        {isAvailable && currentView.type === 'list' && (
          <div className="p-3 border-t border-zinc-800">
            <div className="flex items-center justify-between text-xs text-zinc-500 mb-1.5">
              <span>Storage Used</span>
              <span>{storageQuota.percentage}%</span>
            </div>
            <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  storageQuota.percentage > 80
                    ? 'bg-red-500'
                    : storageQuota.percentage > 60
                    ? 'bg-yellow-500'
                    : 'bg-purple-500'
                }`}
                style={{ width: `${Math.min(storageQuota.percentage, 100)}%` }}
              />
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
