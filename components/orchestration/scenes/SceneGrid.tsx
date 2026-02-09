/**
 * SceneGrid Component
 * 
 * Grid layout for all scene cards.
 */

import React from 'react';
import { SceneUIState } from '../../../types/orchestration';
import { SceneCard } from './SceneCard';
import { ApprovedSceneCard } from './ApprovedSceneCard';
import { cn } from '../../../lib/utils';

interface SceneGridProps {
  scenes: Map<string, SceneUIState>;
  onSceneClick?: (sceneId: string) => void;
  onScenePreview?: (sceneId: string) => void;
  maxAttempts?: number;
  className?: string;
}

export function SceneGrid({
  scenes,
  onSceneClick,
  onScenePreview,
  maxAttempts = 5,
  className,
}: SceneGridProps) {
  // Convert Map to array and sort by scene index
  const sortedScenes = Array.from(scenes.values()).sort(
    (a, b) => a.sceneIndex - b.sceneIndex
  );

  if (sortedScenes.length === 0) {
    return (
      <div className={cn(
        'flex items-center justify-center p-8 rounded-xl border border-dashed border-white/10',
        className
      )}>
        <p className="text-sm text-gray-500">No scenes yet</p>
      </div>
    );
  }

  return (
    <div className={cn(
      'grid gap-5',
      // Reduced columns: max 3 on xl, 2 on lg, 1 on smaller
      'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
      // Ensure rows size to their content (prevents overlap)
      'auto-rows-auto',
      // Minimum card width for consistency
      '[&>*]:min-w-[280px]',
      className
    )}>
      {sortedScenes.map((scene) => (
        scene.isLocked ? (
          <ApprovedSceneCard
            key={scene.sceneId}
            scene={scene}
            onPreview={() => onScenePreview?.(scene.sceneId)}
          />
        ) : (
          <SceneCard
            key={scene.sceneId}
            scene={scene}
            onClick={() => onSceneClick?.(scene.sceneId)}
            onPreview={() => onScenePreview?.(scene.sceneId)}
            maxAttempts={maxAttempts}
          />
        )
      ))}
    </div>
  );
}

export default SceneGrid;
