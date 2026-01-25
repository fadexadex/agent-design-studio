/**
 * EditorTimeline
 * 
 * Horizontal timeline showing all scenes with drag-drop reordering.
 */

import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { EditorScene } from '../../services/editorService';
import { SortableSceneCard, SceneCardContent } from './SceneTimelineCard';
import { Plus, Loader2 } from 'lucide-react';

interface EditorTimelineProps {
  scenes: EditorScene[];
  selectedSceneIds: string[];
  onSceneSelect: (sceneId: string, multiSelect?: boolean) => void;
  onAddScene: (prompt: string, afterSceneId?: string) => void;
  onDeleteScene: (sceneId: string) => void;
  onReorder: (newOrder: string[]) => void;
  isProcessing: boolean;
}

export const EditorTimeline: React.FC<EditorTimelineProps> = ({
  scenes,
  selectedSceneIds,
  onSceneSelect,
  onAddScene,
  onDeleteScene,
  onReorder,
  isProcessing,
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  
  // Sort scenes by order
  const sortedScenes = [...scenes].sort((a, b) => a.order - b.order);

  // Set up sensors for drag-drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = sortedScenes.findIndex((s) => s.id === active.id);
      const newIndex = sortedScenes.findIndex((s) => s.id === over.id);

      const newOrder = arrayMove(sortedScenes, oldIndex, newIndex).map((s) => s.id);
      onReorder(newOrder);
    }
  };

  // Handle add scene click
  const handleAddClick = (afterSceneId?: string) => {
    const prompt = window.prompt('Describe the new scene:');
    if (prompt?.trim()) {
      onAddScene(prompt.trim(), afterSceneId);
    }
  };

  // Calculate total duration in seconds
  const totalDuration = sortedScenes.reduce((sum, scene) => {
    const range = scene.trimmedRange || scene.frameRange;
    return sum + (range.end - range.start + 1);
  }, 0) / 30;

  // Find active scene for drag overlay
  const activeScene = activeId ? sortedScenes.find((s) => s.id === activeId) : null;

  return (
    <div className="h-full flex flex-col bg-zinc-900/50">
      {/* Timeline header */}
      <div className="h-8 px-4 flex items-center justify-between border-b border-zinc-800 text-xs text-zinc-400">
        <span className="font-medium uppercase tracking-wider">Timeline</span>
        <span>
          {sortedScenes.length} scene{sortedScenes.length !== 1 ? 's' : ''} | {totalDuration.toFixed(1)}s total
        </span>
      </div>

      {/* Timeline content */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="h-full flex items-center gap-2 px-4 py-2 min-w-max">
            {/* Add scene button at start */}
            <AddSceneButton
              onClick={() => handleAddClick()}
              disabled={isProcessing}
            />

            <SortableContext
              items={sortedScenes.map((s) => s.id)}
              strategy={horizontalListSortingStrategy}
            >
              {sortedScenes.map((scene) => (
                <React.Fragment key={scene.id}>
                  <SortableSceneCard
                    scene={scene}
                    isSelected={selectedSceneIds.includes(scene.id)}
                    onSelect={(multiSelect) => onSceneSelect(scene.id, multiSelect)}
                    onDelete={() => onDeleteScene(scene.id)}
                    isProcessing={isProcessing}
                    isDragging={activeId === scene.id}
                  />

                  {/* Add scene button after each scene */}
                  <AddSceneButton
                    onClick={() => handleAddClick(scene.id)}
                    disabled={isProcessing}
                  />
                </React.Fragment>
              ))}
            </SortableContext>
          </div>

          {/* Drag overlay */}
          <DragOverlay>
            {activeScene ? (
              <SceneCardContent
                scene={activeScene}
                isSelected={selectedSceneIds.includes(activeScene.id)}
                isDragging={true}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
};

// Add scene button component
interface AddSceneButtonProps {
  onClick: () => void;
  disabled: boolean;
}

const AddSceneButton: React.FC<AddSceneButtonProps> = ({ onClick, disabled }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-8 h-24 flex items-center justify-center rounded-lg border border-dashed border-zinc-700 hover:border-purple-500 hover:bg-purple-500/10 transition-all group disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
      title="Add scene"
    >
      {disabled ? (
        <Loader2 size={14} className="animate-spin text-zinc-500" />
      ) : (
        <Plus size={14} className="text-zinc-500 group-hover:text-purple-400 transition-colors" />
      )}
    </button>
  );
};
