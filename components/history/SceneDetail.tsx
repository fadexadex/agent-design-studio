/**
 * Scene Detail
 * 
 * Detailed view of a single scene showing preview, description, code, and version history.
 */

import React, { useState } from 'react';
import {
  Play,
  Code,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  History,
} from 'lucide-react';
import { useHistorySession } from '../../contexts/HistoryContext';
import type { HistoryScene, SceneVersion } from '../../types/history';

interface SceneDetailProps {
  sessionId: string;
  sceneId: string;
}

export const SceneDetail: React.FC<SceneDetailProps> = ({
  sessionId,
  sceneId,
}) => {
  const session = useHistorySession(sessionId);
  const [showCode, setShowCode] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

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

  const scene = session.scenes.find((s) => s.id === sceneId);

  if (!scene) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <div>
          <h3 className="text-zinc-400 font-medium mb-2">Scene Not Found</h3>
          <p className="text-zinc-500 text-sm">This scene may have been removed.</p>
        </div>
      </div>
    );
  }

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

  const duration = ((scene.frameRange.end - scene.frameRange.start) / 30).toFixed(2);

  // Get current code to display
  const displayCode = selectedVersionId
    ? scene.versions?.find((v) => v.id === selectedVersionId)?.codeSnapshot
    : scene.code;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Preview */}
      <div className="relative aspect-video bg-zinc-950 border-b border-zinc-800 flex-shrink-0">
        {scene.previewUrl ? (
          <>
            <img
              src={scene.previewUrl}
              alt={`Scene ${scene.sceneNumber} preview`}
              className="w-full h-full object-cover"
            />
            <button className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
              <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                <Play size={20} className="text-zinc-900 ml-0.5" />
              </div>
            </button>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-zinc-800 rounded-full flex items-center justify-center mb-2">
                <Play size={20} className="text-zinc-600 ml-0.5" />
              </div>
              <p className="text-zinc-600 text-xs">No preview</p>
            </div>
          </div>
        )}

        {/* Scene number badge */}
        <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur rounded text-sm font-bold text-white">
          Scene {scene.sceneNumber}
        </div>
      </div>

      {/* Info */}
      <div className="p-4 space-y-4 flex-1">
        {/* Title & Status */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-white">
              {scene.title || `Scene ${scene.sceneNumber}`}
            </h3>
            <StatusIcon />
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>
              Frames {scene.frameRange.start}-{scene.frameRange.end}
            </span>
            <span className="text-zinc-600">•</span>
            <span>{duration}s</span>
          </div>
        </div>

        {/* Description */}
        <div>
          <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
            Description
          </h4>
          <p className="text-sm text-zinc-300">{scene.description}</p>
        </div>

        {/* Key Elements */}
        {scene.keyElements && scene.keyElements.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Key Elements
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {scene.keyElements.map((element, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-zinc-800 text-zinc-300 text-xs rounded"
                >
                  {element}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Code Section */}
        {(scene.code || scene.codeFilePath) && (
          <div>
            <button
              onClick={() => setShowCode(!showCode)}
              className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 hover:text-white transition-colors"
            >
              <Code size={14} />
              <span>Generated Code</span>
              {showCode ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showCode && (
              <div className="relative">
                {/* Code file path */}
                {scene.codeFilePath && (
                  <div className="text-xs text-zinc-500 mb-2 font-mono">
                    {scene.codeFilePath}
                  </div>
                )}

                {/* Code display */}
                {displayCode ? (
                  <pre className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg overflow-x-auto text-xs text-zinc-300 font-mono max-h-64 overflow-y-auto">
                    <code>{displayCode}</code>
                  </pre>
                ) : (
                  <p className="text-xs text-zinc-500 italic">
                    Code content not saved in history
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Version History */}
        {scene.versions && scene.versions.length > 0 && (
          <div>
            <h4 className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              <History size={14} />
              <span>Version History</span>
            </h4>
            <div className="space-y-2">
              {scene.versions
                .sort(
                  (a, b) =>
                    new Date(b.timestamp).getTime() -
                    new Date(a.timestamp).getTime()
                )
                .map((version, index) => {
                  const isCurrent = version.id === scene.currentVersionId;
                  const isSelected = version.id === selectedVersionId;

                  return (
                    <button
                      key={version.id}
                      onClick={() =>
                        setSelectedVersionId(
                          isSelected ? null : version.id
                        )
                      }
                      className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${
                        isSelected
                          ? 'bg-purple-500/20 border border-purple-500/30'
                          : 'bg-zinc-800/50 hover:bg-zinc-800 border border-transparent'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          isCurrent
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-zinc-700 text-zinc-400'
                        }`}
                      >
                        v{scene.versions!.length - index}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-white">
                            {isCurrent ? 'Current' : `Version ${scene.versions!.length - index}`}
                          </span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-[10px] rounded">
                              Active
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-zinc-500">
                          {new Date(version.timestamp).toLocaleString('en-US', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </span>
                        {version.prompt && (
                          <p className="text-xs text-zinc-400 truncate mt-0.5">
                            "{version.prompt}"
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
