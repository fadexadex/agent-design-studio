/**
 * SceneTimelineCard
 * 
 * A card representing a scene in the timeline with sortable support.
 */

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { EditorScene } from '../../services/editorService';
import { Trash2, Loader2, AlertCircle, GripVertical } from 'lucide-react';

interface SceneTimelineCardProps {
  scene: EditorScene;
  isSelected: boolean;
  onSelect: (multiSelect?: boolean) => void;
  onDelete: () => void;
  isProcessing: boolean;
  isDragging?: boolean;
}

/**
 * Scene card content (used both in sortable card and drag overlay)
 */
export const SceneCardContent: React.FC<{
  scene: EditorScene;
  isSelected: boolean;
  isDragging?: boolean;
  onSelect?: (multiSelect?: boolean) => void;
  onDelete?: () => void;
  isProcessing?: boolean;
}> = ({
  scene,
  isSelected,
  isDragging,
  onSelect,
  onDelete,
  isProcessing,
}) => {
  // Calculate duration in seconds
  const range = scene.trimmedRange || scene.frameRange;
  const durationFrames = range.end - range.start + 1;
  const durationSeconds = (durationFrames / 30).toFixed(1);

  // Determine status visuals
  const isLoading = scene.status === 'generating' || scene.status === 'regenerating' || scene.status === 'rendering';
  const hasError = scene.status === 'error';

  // Handle click
  const handleClick = (e: React.MouseEvent) => {
    if (!onSelect) return;
    const multiSelect = e.ctrlKey || e.metaKey;
    onSelect(multiSelect);
  };

  // Handle delete
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.();
  };

  return (
    <div
      onClick={handleClick}
      className={`
        relative w-32 h-24 rounded-lg overflow-hidden transition-all shrink-0
        border-2 group
        ${isDragging ? 'cursor-grabbing shadow-2xl scale-105 opacity-90' : 'cursor-pointer'}
        ${isSelected
          ? 'border-purple-500 ring-2 ring-purple-500/30'
          : 'border-zinc-700 hover:border-zinc-500'
        }
        ${isLoading ? 'animate-pulse' : ''}
        ${hasError ? 'border-red-500' : ''}
      `}
    >
      {/* Thumbnail or placeholder */}
      <div className="absolute inset-0 bg-zinc-800">
        {scene.previewUrl ? (
          <video
            src={scene.previewUrl}
            className="w-full h-full object-cover"
            muted
            loop
            autoPlay={isSelected && !isDragging}
            playsInline
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-600">
            <span className="text-2xl font-bold">{scene.sceneNumber}</span>
          </div>
        )}
      </div>

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

      {/* Drag handle indicator */}
      <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical size={14} className="text-zinc-400" />
      </div>

      {/* Status indicator */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-purple-400" />
        </div>
      )}

      {hasError && (
        <div className="absolute inset-0 bg-red-950/50 flex items-center justify-center">
          <AlertCircle size={24} className="text-red-400" />
        </div>
      )}

      {/* Scene info */}
      <div className="absolute bottom-0 left-0 right-0 p-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-white">Scene {scene.sceneNumber}</span>
          <span className="text-[10px] text-zinc-400">{durationSeconds}s</span>
        </div>
      </div>

      {/* Delete button (visible on hover) */}
      {onDelete && (
        <button
          onClick={handleDelete}
          disabled={isProcessing}
          className="absolute top-1 right-1 p-1 rounded bg-red-500/80 hover:bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
          title="Delete scene"
        >
          <Trash2 size={12} />
        </button>
      )}

      {/* Version indicator */}
      {scene.versions.length > 1 && (
        <div className="absolute top-1 left-6 px-1.5 py-0.5 rounded bg-zinc-800/80 text-[10px] text-zinc-400">
          v{scene.versions.length}
        </div>
      )}
    </div>
  );
};

/**
 * Sortable scene card wrapper
 */
export const SortableSceneCard: React.FC<SceneTimelineCardProps> = ({
  scene,
  isSelected,
  onSelect,
  onDelete,
  isProcessing,
  isDragging,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: scene.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <SceneCardContent
        scene={scene}
        isSelected={isSelected}
        onSelect={onSelect}
        onDelete={onDelete}
        isProcessing={isProcessing}
        isDragging={isDragging || isSortableDragging}
      />
    </div>
  );
};

/**
 * Legacy export for backward compatibility
 */
export const SceneTimelineCard = SortableSceneCard;
