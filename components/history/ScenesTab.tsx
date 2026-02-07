/**
 * Scenes Tab
 * 
 * List of scenes in the session with status indicators and navigation to scene detail.
 */

import React from 'react';
import {
  CheckCircle,
  AlertCircle,
  Loader2,
  Clock,
  ChevronRight,
  Play,
} from 'lucide-react';
import { useHistory } from '../../contexts/HistoryContext';
import type { HistorySession, HistoryScene } from '../../types/history';

interface ScenesTabProps {
  session: HistorySession;
}

interface SceneItemProps {
  scene: HistoryScene;
  sessionId: string;
}

const SceneItem: React.FC<SceneItemProps> = ({ scene, sessionId }) => {
  const { navigateToScene } = useHistory();

  const StatusIcon = () => {
    switch (scene.status) {
      case 'complete':
        return <CheckCircle size={14} className="text-green-400" />;
      case 'error':
        return <AlertCircle size={14} className="text-red-400" />;
      case 'generating':
        return <Loader2 size={14} className="text-blue-400 animate-spin" />;
      default:
        return <Clock size={14} className="text-zinc-500" />;
    }
  };

  // Calculate duration from frame range
  const duration = ((scene.frameRange.end - scene.frameRange.start) / 30).toFixed(1);

  return (
    <button
      onClick={() => navigateToScene(sessionId, scene.id)}
      className="w-full flex items-center gap-3 p-3 bg-zinc-800/30 hover:bg-zinc-800 border border-zinc-700/50 hover:border-zinc-600 rounded-lg transition-all text-left group"
    >
      {/* Scene number */}
      <div className="w-8 h-8 bg-zinc-700/50 rounded-lg flex items-center justify-center text-sm font-bold text-zinc-300 flex-shrink-0">
        {scene.sceneNumber}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium text-white truncate">
            {scene.title || `Scene ${scene.sceneNumber}`}
          </h4>
          <StatusIcon />
        </div>
        <p className="text-xs text-zinc-500 truncate mt-0.5">
          {scene.description}
        </p>
        <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-500">
          <span>
            Frames {scene.frameRange.start}-{scene.frameRange.end}
          </span>
          <span className="text-zinc-600">•</span>
          <span>{duration}s</span>
        </div>
      </div>

      {/* Preview thumbnail or arrow */}
      <div className="flex-shrink-0">
        {scene.previewUrl ? (
          <div className="relative w-16 h-10 bg-zinc-900 rounded overflow-hidden">
            <img
              src={scene.previewUrl}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
              <Play size={12} className="text-white" />
            </div>
          </div>
        ) : (
          <ChevronRight
            size={16}
            className="text-zinc-600 group-hover:text-zinc-400 transition-colors"
          />
        )}
      </div>
    </button>
  );
};

export const ScenesTab: React.FC<ScenesTabProps> = ({ session }) => {
  const { scenes } = session;

  if (!scenes || scenes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 p-6 text-center">
        <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mb-3">
          <Play size={20} className="text-zinc-600" />
        </div>
        <h3 className="text-zinc-400 font-medium mb-1">No Scenes Yet</h3>
        <p className="text-zinc-500 text-sm">
          Scenes will appear here as they are generated
        </p>
      </div>
    );
  }

  // Calculate totals
  const totalDuration = scenes.reduce(
    (acc, s) => acc + (s.frameRange.end - s.frameRange.start),
    0
  );
  const completedScenes = scenes.filter((s) => s.status === 'complete').length;

  return (
    <div className="p-4 space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-400">
          {completedScenes} of {scenes.length} scenes complete
        </span>
        <span className="text-zinc-500">
          {(totalDuration / 30).toFixed(1)}s total
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all"
          style={{ width: `${(completedScenes / scenes.length) * 100}%` }}
        />
      </div>

      {/* Scene list */}
      <div className="space-y-2">
        {scenes
          .sort((a, b) => a.sceneNumber - b.sceneNumber)
          .map((scene) => (
            <SceneItem key={scene.id} scene={scene} sessionId={session.id} />
          ))}
      </div>
    </div>
  );
};
