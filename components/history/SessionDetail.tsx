/**
 * Session Detail
 * 
 * Tabbed detail view for a history session showing overview, scenes, and agent trace.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Edit3,
  Copy,
  Trash2,
  ExternalLink,
  Info,
  Layers,
  Brain,
} from 'lucide-react';
import { useHistory, useHistorySession } from '../../contexts/HistoryContext';
import { OverviewTab } from './OverviewTab';
import { ScenesTab } from './ScenesTab';
import { AgentTraceTimeline } from './AgentTraceTimeline';
import type { SessionDetailTab } from '../../types/history';

interface SessionDetailProps {
  sessionId: string;
}

const tabs: { id: SessionDetailTab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <Info size={14} /> },
  { id: 'scenes', label: 'Scenes', icon: <Layers size={14} /> },
  { id: 'trace', label: 'Agent Trace', icon: <Brain size={14} /> },
];

export const SessionDetail: React.FC<SessionDetailProps> = ({ sessionId }) => {
  const navigate = useNavigate();
  const session = useHistorySession(sessionId);
  const { activeTab, setActiveTab, deleteSession, navigateToList, saveSession } = useHistory();
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <div>
          <h3 className="text-zinc-400 font-medium mb-2">Session Not Found</h3>
          <p className="text-zinc-500 text-sm">This session may have been deleted.</p>
        </div>
      </div>
    );
  }

  const handleOpenInEditor = () => {
    navigate(`/editor/${session.id}`);
  };

  const handleClone = () => {
    const clonedSession = {
      ...session,
      id: `${session.id}-clone-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'in_progress' as const,
      summary: {
        ...session.summary,
        brandName: `${session.summary.brandName} (Copy)`,
      },
    };
    saveSession(clonedSession);
  };

  const handleDelete = () => {
    deleteSession(session.id);
    navigateToList();
  };

  const handlePlayVideo = () => {
    if (session.outputVideoPath) {
      // Open video in new tab or show in modal
      window.open(`/api/video/${session.id}`, '_blank');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Video Preview / Thumbnail */}
      <div className="relative aspect-video bg-zinc-950 border-b border-zinc-800">
        {session.summary.thumbnailDataUrl ? (
          <img
            src={session.summary.thumbnailDataUrl}
            alt="Video thumbnail"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-zinc-800 rounded-full flex items-center justify-center mb-3">
                <Play size={24} className="text-zinc-600 ml-1" />
              </div>
              <p className="text-zinc-600 text-xs">No preview available</p>
            </div>
          </div>
        )}

        {/* Play button overlay */}
        {session.outputVideoPath && (
          <button
            onClick={handlePlayVideo}
            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity"
          >
            <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center">
              <Play size={24} className="text-zinc-900 ml-1" />
            </div>
          </button>
        )}

        {/* Status badge */}
        <div className="absolute top-2 right-2">
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              session.status === 'complete'
                ? 'bg-green-500/20 text-green-400'
                : session.status === 'error'
                ? 'bg-red-500/20 text-red-400'
                : 'bg-blue-500/20 text-blue-400'
            }`}
          >
            {session.status === 'complete'
              ? 'Complete'
              : session.status === 'error'
              ? 'Error'
              : 'In Progress'}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 p-3 border-b border-zinc-800">
        <button
          onClick={handleOpenInEditor}
          className="flex-1 flex items-center justify-center gap-2 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-lg transition-colors"
        >
          <Edit3 size={14} />
          <span>Open in Editor</span>
        </button>
        <button
          onClick={handleClone}
          className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
          title="Clone Session"
        >
          <Copy size={16} />
        </button>
        {showDeleteConfirm ? (
          <div className="flex gap-1">
            <button
              onClick={handleDelete}
              className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white text-xs rounded-lg transition-colors"
            >
              Delete
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-3 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-xs rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 bg-zinc-800 hover:bg-red-600 text-zinc-300 hover:text-white rounded-lg transition-colors"
            title="Delete Session"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-500/5'
                : 'text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/50'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'overview' && <OverviewTab session={session} />}
        {activeTab === 'scenes' && <ScenesTab session={session} />}
        {activeTab === 'trace' && <AgentTraceTimeline thoughts={session.thoughts} />}
      </div>
    </div>
  );
};
