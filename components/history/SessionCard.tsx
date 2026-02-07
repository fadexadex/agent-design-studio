/**
 * Session Card
 * 
 * Compact card showing session summary in the history list.
 */

import React from 'react';
import {
  CheckCircle,
  AlertCircle,
  Loader2,
  Trash2,
  Film,
} from 'lucide-react';
import { useHistory } from '../../contexts/HistoryContext';
import type { HistorySession } from '../../types/history';

interface SessionCardProps {
  session: HistorySession;
}

// Style icons/colors mapping
const styleConfig: Record<string, { icon: string; color: string }> = {
  fluid: { icon: '🌊', color: 'bg-blue-500/20 text-blue-400' },
  geometric: { icon: '◆', color: 'bg-purple-500/20 text-purple-400' },
  minimalist: { icon: '○', color: 'bg-zinc-500/20 text-zinc-400' },
  brutalist: { icon: '█', color: 'bg-orange-500/20 text-orange-400' },
  cinematic: { icon: '🎬', color: 'bg-amber-500/20 text-amber-400' },
};

// Format relative time
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export const SessionCard: React.FC<SessionCardProps> = ({ session }) => {
  const { navigateToSession, deleteSession } = useHistory();
  const [showDelete, setShowDelete] = React.useState(false);

  const style = styleConfig[session.summary.style] || styleConfig.minimalist;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteSession(session.id);
  };

  const StatusIcon = () => {
    switch (session.status) {
      case 'complete':
        return <CheckCircle size={12} className="text-green-400" />;
      case 'error':
        return <AlertCircle size={12} className="text-red-400" />;
      case 'in_progress':
        return <Loader2 size={12} className="text-blue-400 animate-spin" />;
      default:
        return null;
    }
  };

  return (
    <div
      onClick={() => navigateToSession(session.id)}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
      className="group relative p-3 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 hover:border-zinc-600 rounded-lg cursor-pointer transition-all"
    >
      <div className="flex items-start gap-3">
        {/* Thumbnail or Style Icon */}
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${style.color}`}
        >
          {session.summary.thumbnailDataUrl ? (
            <img
              src={session.summary.thumbnailDataUrl}
              alt=""
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <span>{style.icon}</span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="font-medium text-white text-sm truncate">
            {session.summary.brandName || 'Untitled'}
          </h3>

          {/* Meta */}
          <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400">
            <span className="capitalize">{session.summary.style}</span>
            <span className="text-zinc-600">•</span>
            <span>{session.summary.sceneCount} scenes</span>
          </div>

          {/* Status & Time */}
          <div className="flex items-center gap-2 mt-1.5">
            <StatusIcon />
            <span className="text-xs text-zinc-500">
              {formatRelativeTime(session.updatedAt)}
            </span>
          </div>
        </div>

        {/* Delete button */}
        {showDelete && (
          <button
            onClick={handleDelete}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-zinc-700/80 hover:bg-red-600 text-zinc-400 hover:text-white transition-colors"
            title="Delete session"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Aspect ratio indicator */}
      <div className="absolute bottom-2 right-2">
        <div
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-zinc-500 bg-zinc-800`}
        >
          <Film size={10} />
          <span>{session.summary.aspectRatio}</span>
        </div>
      </div>
    </div>
  );
};
