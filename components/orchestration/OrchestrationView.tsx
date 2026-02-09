/**
 * OrchestrationView Component
 * 
 * Main container for the Director-Agent orchestration dashboard.
 * Two-panel layout:
 * - Left: AgentHierarchyPanel (Director + spawned agents)
 * - Right: CookingPreview (scene previews as they render)
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useDirectorStream, UseDirectorStreamReturn } from '../../hooks/useDirectorStream';
import { InterventionAction, OrchestrationState } from '../../types/orchestration';
import { ProjectHealthBar } from './health/ProjectHealthBar';
import { AgentHierarchyPanel } from './agents/AgentHierarchyPanel';
import { CookingPreview } from './preview/CookingPreview';
import { InterventionFAB } from './controls/InterventionFAB';
import { KillConfirmModal } from './controls/KillConfirmModal';
import { VideoPlayerModal } from './preview/VideoPlayerModal';
import { cn } from '@/lib/utils';
import { WifiOff, RefreshCw, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

interface OrchestrationViewProps {
  projectId: string;
  /** Optional: pass director stream from parent to preserve state across view toggles */
  directorStream?: UseDirectorStreamReturn;
  onKillJob?: () => Promise<void>;
  onPauseJob?: () => Promise<void>;
  onResumeJob?: () => Promise<void>;
  onApproveAll?: () => Promise<void>;
  className?: string;
}

export function OrchestrationView({
  projectId,
  directorStream: externalStream,
  onKillJob,
  onPauseJob,
  onResumeJob,
  onApproveAll,
  className,
}: OrchestrationViewProps) {
  const [showKillModal, setShowKillModal] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>();
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  
  // Video player modal state
  const [videoPlayerOpen, setVideoPlayerOpen] = useState(false);
  const [videoPlayerSrc, setVideoPlayerSrc] = useState<string | null>(null);
  const [videoPlayerTitle, setVideoPlayerTitle] = useState<string>('');

  // Use external stream if provided, otherwise create internal one
  // This allows parent to lift state up for view toggle persistence
  const internalStream = useDirectorStream({ projectId, enabled: !externalStream });
  const {
    state,
    isConnected,
    error,
    reconnect,
  } = externalStream || internalStream;

  // Calculate active scenes for intervention controls
  const activeScenes = useMemo(() => 
    Array.from(state.scenes.values()).filter(
      scene => ['generating', 'rendering', 'evaluating'].includes(scene.status)
    ),
    [state.scenes]
  );

  // Calculate intervention state
  const hasRunningScenes = activeScenes.length > 0;
  const canApproveAll = Array.from(state.scenes.values()).some(
    scene => scene.status === 'passed' && !scene.isLocked
  );
  const scenesInProgress = activeScenes.length;

  // Handle intervention actions
  const handleIntervention = useCallback(async (action: InterventionAction) => {
    switch (action) {
      case 'kill':
        setShowKillModal(true);
        break;
      case 'pause':
        await onPauseJob?.();
        setIsPaused(true);
        break;
      case 'resume':
        await onResumeJob?.();
        setIsPaused(false);
        break;
      case 'approve-all':
        await onApproveAll?.();
        break;
    }
  }, [onPauseJob, onResumeJob, onApproveAll]);

  const handleKillConfirm = useCallback(async () => {
    setShowKillModal(false);
    await onKillJob?.();
  }, [onKillJob]);

  // Handle scene preview playback
  const handlePlayScene = useCallback((sceneIndex: number, videoPath: string) => {
    setVideoPlayerSrc(videoPath);
    setVideoPlayerTitle(`Scene ${sceneIndex + 1}`);
    setVideoPlayerOpen(true);
  }, []);

  // Handle full video playback
  const handlePlayAll = useCallback((finalVideoPath: string) => {
    setVideoPlayerSrc(finalVideoPath);
    setVideoPlayerTitle('Full Video');
    setVideoPlayerOpen(true);
  }, []);

  // Handle agent selection in hierarchy
  const handleAgentSelect = useCallback((agentId: string) => {
    setSelectedAgentId(prev => prev === agentId ? undefined : agentId);
  }, []);

  return (
    <div className={cn('flex flex-col h-full bg-zinc-950', className)}>
      {/* Connection Status Banner */}
      {!isConnected && (
        <div className={cn(
          'flex items-center justify-center gap-3 px-4 py-2',
          error ? 'bg-red-500/10 border-b border-red-500/20' : 'bg-amber-500/10 border-b border-amber-500/20'
        )}>
          <WifiOff className={cn(
            'h-4 w-4',
            error ? 'text-red-400' : 'text-amber-400'
          )} />
          <span className={cn(
            'text-sm',
            error ? 'text-red-300' : 'text-amber-300'
          )}>
            {error ? error.message : 'Connecting...'}
          </span>
          <button
            onClick={reconnect}
            className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 border border-zinc-700"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </button>
        </div>
      )}

      {/* Project Health Bar */}
      <div className="p-4 pb-0">
        <ProjectHealthBar
          overallScore={state.overallScore}
          trend={state.trend}
          passedScenes={state.passedScenes}
          totalScenes={state.totalScenes}
          isComplete={state.isComplete}
        />
      </div>

      {/* Main Two-Panel Layout */}
      <div className="flex-1 p-4 overflow-hidden">
        <div className={cn(
          'grid gap-4 h-full',
          leftPanelCollapsed 
            ? 'grid-cols-1'
            : 'grid-cols-1 lg:grid-cols-2'
        )}>
          {/* Left Panel: Agent Hierarchy */}
          {!leftPanelCollapsed && (
            <div className={cn(
              'overflow-hidden rounded-xl border border-zinc-700/50 bg-zinc-900/80 backdrop-blur-sm',
              'p-4 flex flex-col'
            )}>
              {/* Panel header with collapse button */}
              <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <h2 className="text-sm font-semibold text-zinc-300">Agent Hierarchy</h2>
                <button
                  onClick={() => setLeftPanelCollapsed(true)}
                  className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors lg:hidden"
                  title="Collapse panel"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </button>
              </div>
              
              <AgentHierarchyPanel
                director={state.agents.director}
                spawnedAgents={state.agents.spawned}
                selectedAgentId={selectedAgentId}
                onAgentSelect={handleAgentSelect}
                className="flex-1 min-h-0"
              />
            </div>
          )}

          {/* Right Panel: Cooking Preview */}
          <div className={cn(
            'overflow-hidden rounded-xl border border-zinc-700/50 bg-zinc-900/80 backdrop-blur-sm',
            'p-4 flex flex-col',
            leftPanelCollapsed && 'col-span-full'
          )}>
            {/* Panel header */}
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h2 className="text-sm font-semibold text-zinc-300">Scene Previews</h2>
              {leftPanelCollapsed && (
                <button
                  onClick={() => setLeftPanelCollapsed(false)}
                  className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
                  title="Show agents panel"
                >
                  <PanelLeftOpen className="h-4 w-4" />
                </button>
              )}
            </div>
            
            <CookingPreview
              preview={state.preview}
              scenes={state.scenes}
              totalScenes={state.totalScenes}
              onPlayScene={handlePlayScene}
              onPlayAll={handlePlayAll}
              onStopReview={onApproveAll}
              className="flex-1 min-h-0"
            />
          </div>
        </div>
      </div>

      {/* Mobile Panel Toggle - appears below on small screens */}
      <div className="lg:hidden fixed bottom-20 left-6 z-40 flex gap-2">
        <button
          onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
          className="px-4 py-2 rounded-full bg-zinc-800/90 backdrop-blur-sm border border-zinc-700 text-zinc-300 text-sm hover:bg-zinc-700"
        >
          {leftPanelCollapsed ? 'Show Agents' : 'Hide Agents'}
        </button>
      </div>

      {/* Intervention FAB */}
      <InterventionFAB
        isPaused={isPaused}
        hasRunningScenes={hasRunningScenes}
        canApproveAll={canApproveAll}
        onAction={handleIntervention}
      />

      {/* Kill Confirmation Modal */}
      <KillConfirmModal
        isOpen={showKillModal}
        onConfirm={handleKillConfirm}
        onCancel={() => setShowKillModal(false)}
        scenesInProgress={scenesInProgress}
      />

      {/* Video Player Modal */}
      <VideoPlayerModal
        isOpen={videoPlayerOpen}
        videoSrc={videoPlayerSrc}
        title={videoPlayerTitle}
        onClose={() => {
          setVideoPlayerOpen(false);
          setVideoPlayerSrc(null);
        }}
      />
    </div>
  );
}

export default OrchestrationView;
