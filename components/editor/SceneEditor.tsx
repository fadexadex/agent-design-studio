/**
 * SceneEditor
 * 
 * Main container component for the scene editor.
 * Manages editor state and coordinates sub-components.
 */

import React, { useState, useCallback, useRef } from 'react';
import { useEditorStream } from '../../hooks/useEditorStream';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import {
  editScenes,
  addScene,
  deleteScene,
  reorderScenes,
  revertScene,
  trimScene,
  undo,
  redo,
  startExport,
} from '../../services/editorService';
import { EditorTimeline } from './EditorTimeline';
import { ScenePreviewPanel } from './ScenePreviewPanel';
import { PromptPanel } from './PromptPanel';
import { ActionBar } from './ActionBar';
import { ExportProgressModal } from './ExportProgressModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { EditorSkeleton } from './EditorSkeleton';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  WifiOff,
} from 'lucide-react';

interface SceneEditorProps {
  jobId: string;
  onBack?: () => void;
}

export const SceneEditor: React.FC<SceneEditorProps> = ({ jobId, onBack }) => {
  const {
    state,
    isLoading,
    isConnected,
    error,
    thinkingMessage,
    thinkingDetail,
    refreshState,
    setSelectedScenes,
  } = useEditorStream(jobId);

  const [isProcessing, setIsProcessing] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ sceneId: string; sceneNumber: number } | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Get selected scene IDs
  const selectedSceneIds = state?.selectedSceneIds || [];

  // Get the first selected scene for preview
  const selectedScene = state?.scenes.find((s) => selectedSceneIds.includes(s.id));

  // Handle scene selection
  const handleSceneSelect = useCallback(
    (sceneId: string, multiSelect?: boolean) => {
      if (!state) return;

      if (multiSelect) {
        // Toggle selection
        const isSelected = selectedSceneIds.includes(sceneId);
        if (isSelected) {
          setSelectedScenes(selectedSceneIds.filter((id) => id !== sceneId));
        } else {
          setSelectedScenes([...selectedSceneIds, sceneId]);
        }
      } else {
        // Single select
        setSelectedScenes([sceneId]);
      }
    },
    [state, selectedSceneIds, setSelectedScenes]
  );

  // Handle edit submission
  const handleEdit = useCallback(
    async (prompt: string) => {
      if (!state || selectedSceneIds.length === 0) return;

      setIsProcessing(true);
      setLocalError(null);

      try {
        await editScenes(jobId, selectedSceneIds, prompt);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Edit failed';
        setLocalError(message);
      } finally {
        setIsProcessing(false);
      }
    },
    [jobId, state, selectedSceneIds]
  );

  // Handle add scene
  const handleAddScene = useCallback(
    async (prompt: string, afterSceneId?: string) => {
      setIsProcessing(true);
      setLocalError(null);

      try {
        const result = await addScene(jobId, prompt, afterSceneId);
        // Select the new scene
        setSelectedScenes([result.sceneId]);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to add scene';
        setLocalError(message);
      } finally {
        setIsProcessing(false);
      }
    },
    [jobId, setSelectedScenes]
  );

  // Handle delete scene
  const handleDeleteScene = useCallback(
    async (sceneId: string) => {
      setIsProcessing(true);
      setLocalError(null);

      try {
        await deleteScene(jobId, sceneId);
        // Clear selection if deleted scene was selected
        if (selectedSceneIds.includes(sceneId)) {
          setSelectedScenes(selectedSceneIds.filter((id) => id !== sceneId));
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to delete scene';
        setLocalError(message);
      } finally {
        setIsProcessing(false);
      }
    },
    [jobId, selectedSceneIds, setSelectedScenes]
  );

  // Handle reorder
  const handleReorder = useCallback(
    async (newOrder: string[]) => {
      setIsProcessing(true);
      setLocalError(null);

      try {
        await reorderScenes(jobId, newOrder);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to reorder scenes';
        setLocalError(message);
      } finally {
        setIsProcessing(false);
      }
    },
    [jobId]
  );

  // Handle undo
  const handleUndo = useCallback(async () => {
    if (!state || state.undoStack.length === 0) return;

    setIsProcessing(true);
    setLocalError(null);

    try {
      await undo(jobId);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Undo failed';
      setLocalError(message);
    } finally {
      setIsProcessing(false);
    }
  }, [jobId, state]);

  // Handle redo
  const handleRedo = useCallback(async () => {
    if (!state || state.redoStack.length === 0) return;

    setIsProcessing(true);
    setLocalError(null);

    try {
      await redo(jobId);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Redo failed';
      setLocalError(message);
    } finally {
      setIsProcessing(false);
    }
  }, [jobId, state]);

  // Handle revert to previous version
  const handleRevertVersion = useCallback(
    async (sceneId: string, versionId: string) => {
      setIsProcessing(true);
      setLocalError(null);

      try {
        await revertScene(jobId, sceneId, versionId);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to revert scene';
        setLocalError(message);
      } finally {
        setIsProcessing(false);
      }
    },
    [jobId]
  );

  // Handle trim scene
  const handleTrimScene = useCallback(
    async (sceneId: string, start: number, end: number) => {
      setIsProcessing(true);
      setLocalError(null);

      try {
        await trimScene(jobId, sceneId, { start, end });
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to trim scene';
        setLocalError(message);
      } finally {
        setIsProcessing(false);
      }
    },
    [jobId]
  );

  // Handle export
  const handleExport = useCallback(async () => {
    setShowExportModal(true);
    setIsProcessing(true);
    setLocalError(null);

    try {
      await startExport(jobId);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Export failed';
      setLocalError(message);
    } finally {
      setIsProcessing(false);
    }
  }, [jobId]);

  // Handle delete with confirmation
  const handleDeleteWithConfirm = useCallback((sceneId: string) => {
    const scene = state?.scenes.find(s => s.id === sceneId);
    if (scene) {
      setDeleteConfirm({ sceneId, sceneNumber: scene.sceneNumber });
    }
  }, [state]);

  // Handle confirmed delete
  const handleConfirmDelete = useCallback(async () => {
    if (!deleteConfirm) return;
    await handleDeleteScene(deleteConfirm.sceneId);
    setDeleteConfirm(null);
  }, [deleteConfirm, handleDeleteScene]);

  // Handle select all
  const handleSelectAll = useCallback(() => {
    if (!state) return;
    setSelectedScenes(state.scenes.map(s => s.id));
  }, [state, setSelectedScenes]);

  // Handle deselect all
  const handleDeselectAll = useCallback(() => {
    setSelectedScenes([]);
    setDeleteConfirm(null);
  }, [setSelectedScenes]);

  // Handle delete selected
  const handleDeleteSelected = useCallback(() => {
    if (selectedSceneIds.length === 0) return;
    const scene = state?.scenes.find(s => s.id === selectedSceneIds[0]);
    if (scene) {
      setDeleteConfirm({ sceneId: scene.id, sceneNumber: scene.sceneNumber });
    }
  }, [selectedSceneIds, state]);

  // Handle play/pause
  const handlePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  }, []);

  // Handle next scene
  const handleNextScene = useCallback(() => {
    if (!state || state.scenes.length === 0) return;
    const sortedScenes = [...state.scenes].sort((a, b) => a.order - b.order);
    
    if (selectedSceneIds.length === 0) {
      setSelectedScenes([sortedScenes[0].id]);
    } else {
      const currentIndex = sortedScenes.findIndex(s => s.id === selectedSceneIds[0]);
      const nextIndex = Math.min(currentIndex + 1, sortedScenes.length - 1);
      setSelectedScenes([sortedScenes[nextIndex].id]);
    }
  }, [state, selectedSceneIds, setSelectedScenes]);

  // Handle previous scene
  const handlePrevScene = useCallback(() => {
    if (!state || state.scenes.length === 0) return;
    const sortedScenes = [...state.scenes].sort((a, b) => a.order - b.order);
    
    if (selectedSceneIds.length === 0) {
      setSelectedScenes([sortedScenes[sortedScenes.length - 1].id]);
    } else {
      const currentIndex = sortedScenes.findIndex(s => s.id === selectedSceneIds[0]);
      const prevIndex = Math.max(currentIndex - 1, 0);
      setSelectedScenes([sortedScenes[prevIndex].id]);
    }
  }, [state, selectedSceneIds, setSelectedScenes]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onUndo: handleUndo,
    onRedo: handleRedo,
    onDelete: handleDeleteSelected,
    onSelectAll: handleSelectAll,
    onEscape: handleDeselectAll,
    onPlayPause: handlePlayPause,
    onExport: handleExport,
    onNextScene: handleNextScene,
    onPrevScene: handlePrevScene,
  }, !isProcessing && !deleteConfirm);

  // Loading state - show skeleton
  if (isLoading) {
    return <EditorSkeleton />;
  }

  // Error state
  if (error && !state) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white gap-4">
        <AlertCircle size={48} className="text-red-500" />
        <h2 className="text-xl font-bold text-red-400">Failed to Load Editor</h2>
        <p className="text-zinc-500">{error}</p>
        <div className="flex gap-4 mt-4">
          <button
            onClick={refreshState}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
          >
            Retry
          </button>
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
            >
              Go Back
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!state) return null;

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-900/50 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h1 className="font-heading font-bold text-lg">{state.brand.name}</h1>
            <p className="text-xs text-zinc-500">Scene Editor</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Connection indicator */}
          {!isConnected && (
            <div className="flex items-center gap-2 text-yellow-500 text-xs">
              <WifiOff size={14} />
              <span>Reconnecting...</span>
            </div>
          )}

          {/* Thinking indicator */}
          {thinkingMessage && (
            <div className="flex items-center gap-2 text-purple-400 text-xs animate-pulse">
              <Loader2 size={14} className="animate-spin" />
              <span>{thinkingMessage}</span>
            </div>
          )}
        </div>
      </header>

      {/* Error banner */}
      {(error || localError) && (
        <div className="bg-red-950/50 border-b border-red-900/50 px-4 py-2 flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle size={14} />
          <span>{error || localError}</span>
          <button
            onClick={() => setLocalError(null)}
            className="ml-auto text-xs hover:text-red-300"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Timeline */}
        <div className="h-40 border-b border-zinc-800 shrink-0">
          <EditorTimeline
            scenes={state.scenes}
            selectedSceneIds={selectedSceneIds}
            onSceneSelect={handleSceneSelect}
            onAddScene={handleAddScene}
            onDeleteScene={handleDeleteWithConfirm}
            onReorder={handleReorder}
            isProcessing={isProcessing}
          />
        </div>

        {/* Preview and Prompt panels */}
        <div className="flex-1 flex overflow-hidden">
          {/* Preview Panel */}
          <div className="flex-1 p-4 overflow-hidden">
            <ScenePreviewPanel
              scene={selectedScene}
              brand={state.brand}
              config={state.config}
              videoRef={videoRef}
              onRevertVersion={handleRevertVersion}
              onTrimChange={handleTrimScene}
              isProcessing={isProcessing}
            />
          </div>

          {/* Prompt Panel */}
          <div className="w-96 border-l border-zinc-800 shrink-0">
            <PromptPanel
              selectedScenes={state.scenes.filter((s) => selectedSceneIds.includes(s.id))}
              onSubmit={handleEdit}
              isProcessing={isProcessing}
              thinkingMessage={thinkingMessage}
              thinkingDetail={thinkingDetail}
            />
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <ActionBar
        canUndo={state.undoStack.length > 0}
        canRedo={state.redoStack.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onExport={handleExport}
        exportStatus={state.exportStatus}
        exportProgress={state.exportProgress}
        exportedVideoPath={state.exportedVideoPath}
        isProcessing={isProcessing}
      />

      {/* Export Progress Modal */}
      {showExportModal && (
        <ExportProgressModal
          status={state.exportStatus}
          progress={state.exportProgress}
          videoPath={state.exportedVideoPath}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <DeleteConfirmModal
          sceneNumber={deleteConfirm.sceneNumber}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
};
