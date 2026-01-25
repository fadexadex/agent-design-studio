/**
 * ScenePreviewPanel
 * 
 * Video player and scene details panel.
 */

import React, { useRef, useState, useEffect, MutableRefObject } from 'react';
import { EditorScene } from '../../services/editorService';
import { Play, Pause, RotateCcw, Code, ChevronDown, History } from 'lucide-react';
import { TrimHandle } from './TrimHandle';

interface ScenePreviewPanelProps {
  scene?: EditorScene;
  brand: {
    name: string;
    colors: string[];
  };
  config: {
    style: string;
  };
  videoRef?: MutableRefObject<HTMLVideoElement | null>;
  onRevertVersion?: (sceneId: string, versionId: string) => void;
  onTrimChange?: (sceneId: string, start: number, end: number) => void;
  isProcessing?: boolean;
}

export const ScenePreviewPanel: React.FC<ScenePreviewPanelProps> = ({
  scene,
  brand,
  config,
  videoRef: externalVideoRef,
  onRevertVersion,
  onTrimChange,
  isProcessing = false,
}) => {
  const internalVideoRef = useRef<HTMLVideoElement>(null);
  const videoRef = externalVideoRef || internalVideoRef;
  const [isPlaying, setIsPlaying] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [showTrim, setShowTrim] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [localTrimStart, setLocalTrimStart] = useState(0);
  const [localTrimEnd, setLocalTrimEnd] = useState(0);

  // Sync video element to external ref
  useEffect(() => {
    if (externalVideoRef && internalVideoRef.current) {
      externalVideoRef.current = internalVideoRef.current;
    }
  }, [externalVideoRef]);

  // Get current version
  const currentVersion = scene?.versions.find(
    (v) => v.id === (selectedVersionId || scene.currentVersionId)
  );

  // Check if viewing an older version (for revert button)
  const isViewingOlderVersion = scene && selectedVersionId && selectedVersionId !== scene.currentVersionId;

  // Initialize trim values when scene changes
  useEffect(() => {
    if (scene) {
      const range = scene.trimmedRange || scene.frameRange;
      setLocalTrimStart(range.start - scene.frameRange.start);
      setLocalTrimEnd(range.end - scene.frameRange.start);
    }
  }, [scene?.id, scene?.trimmedRange, scene?.frameRange]);

  // Handle play/pause
  const togglePlay = () => {
    const video = internalVideoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Handle restart
  const restart = () => {
    const video = internalVideoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.play();
    setIsPlaying(true);
  };

  // Handle revert to selected version
  const handleRevert = () => {
    if (scene && selectedVersionId && onRevertVersion) {
      onRevertVersion(scene.id, selectedVersionId);
      setSelectedVersionId(null); // Reset to show current version
    }
  };

  // Handle trim change
  const handleTrimChange = (start: number, end: number) => {
    setLocalTrimStart(start);
    setLocalTrimEnd(end);
  };

  // Handle trim commit
  const handleTrimCommit = (start: number, end: number) => {
    if (scene && onTrimChange) {
      // Convert to absolute frame numbers
      const absoluteStart = scene.frameRange.start + start;
      const absoluteEnd = scene.frameRange.start + end;
      onTrimChange(scene.id, absoluteStart, absoluteEnd);
    }
  };

  // No scene selected
  if (!scene) {
    return (
      <div className="h-full flex items-center justify-center text-zinc-500">
        <div className="text-center">
          <p className="text-lg font-medium">No Scene Selected</p>
          <p className="text-sm mt-1">Select a scene from the timeline to preview</p>
        </div>
      </div>
    );
  }

  // Calculate duration
  const range = scene.trimmedRange || scene.frameRange;
  const durationFrames = range.end - range.start + 1;
  const durationSeconds = (durationFrames / 30).toFixed(1);

  return (
    <div className="h-full flex flex-col">
      {/* Video player */}
      <div className="flex-1 relative bg-zinc-900 rounded-lg overflow-hidden">
        {scene.previewUrl ? (
          <>
            <video
              ref={internalVideoRef}
              src={scene.previewUrl}
              className="w-full h-full object-contain"
              loop
              playsInline
              onEnded={() => setIsPlaying(false)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />

            {/* Play/pause overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/30">
              <div className="flex items-center gap-4">
                <button
                  onClick={restart}
                  className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <RotateCcw size={20} />
                </button>
                <button
                  onClick={togglePlay}
                  className="p-4 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                >
                  {isPlaying ? <Pause size={32} /> : <Play size={32} />}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-600">
            <p>No preview available</p>
          </div>
        )}
      </div>

      {/* Scene info */}
      <div className="mt-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading font-bold text-lg">Scene {scene.sceneNumber}</h3>
            <p className="text-sm text-zinc-400">{scene.description}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">{durationSeconds}s</p>
            <p className="text-xs text-zinc-500">{durationFrames} frames</p>
          </div>
        </div>

        {/* Version selector */}
        {scene.versions.length > 1 && (
          <div className="space-y-2">
            <div className="relative">
              <select
                value={selectedVersionId || scene.currentVersionId}
                onChange={(e) => setSelectedVersionId(e.target.value)}
                className="w-full appearance-none bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {scene.versions.map((version, index) => (
                  <option key={version.id} value={version.id}>
                    Version {index + 1}
                    {version.id === scene.currentVersionId ? ' (Current)' : ''}
                    {version.prompt ? ` - "${version.prompt.substring(0, 30)}..."` : ' (Original)'}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
              />
            </div>

            {/* Revert button - only shows when viewing an older version */}
            {isViewingOlderVersion && onRevertVersion && (
              <button
                onClick={handleRevert}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
              >
                <History size={14} />
                Revert to this version
              </button>
            )}
          </div>
        )}

        {/* Trim control */}
        {onTrimChange && (
          <div className="space-y-2">
            <button
              onClick={() => setShowTrim(!showTrim)}
              className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              <span className="w-4 h-4 flex items-center justify-center">
                {showTrim ? '−' : '+'}
              </span>
              Trim Duration
            </button>

            {showTrim && (
              <TrimHandle
                trimStart={localTrimStart}
                trimEnd={localTrimEnd}
                totalFrames={scene.frameRange.end - scene.frameRange.start + 1}
                onTrimChange={handleTrimChange}
                onTrimCommit={handleTrimCommit}
                disabled={isProcessing}
              />
            )}
          </div>
        )}

        {/* Code toggle */}
        <button
          onClick={() => setShowCode(!showCode)}
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <Code size={14} />
          {showCode ? 'Hide Code' : 'Show Code'}
        </button>

        {/* Code viewer */}
        {showCode && currentVersion && (
          <div className="bg-zinc-900 rounded-lg p-3 max-h-48 overflow-auto">
            <pre className="text-xs text-zinc-300 font-mono whitespace-pre-wrap">
              {currentVersion.codeSnapshot}
            </pre>
          </div>
        )}

        {/* Brand info */}
        <div className="flex items-center gap-4 pt-2 border-t border-zinc-800">
          <div className="flex items-center gap-1">
            {brand.colors.slice(0, 3).map((color, i) => (
              <div
                key={i}
                className="w-4 h-4 rounded"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
          <span className="text-xs text-zinc-500 uppercase tracking-wider">
            {config.style}
          </span>
        </div>
      </div>
    </div>
  );
};
