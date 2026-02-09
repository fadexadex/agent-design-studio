/**
 * ApprovedSceneCard Component
 * 
 * Locked/dimmed variant for passed scenes.
 * Visual de-emphasis signals "this is done, focus elsewhere".
 */

import React from 'react';
import { Lock, CheckCircle2, Eye } from 'lucide-react';
import { SceneUIState } from '../../../types/orchestration';
import { cn } from '../../../lib/utils';

interface ApprovedSceneCardProps {
  scene: SceneUIState;
  onPreview?: () => void;
  className?: string;
}

export function ApprovedSceneCard({
  scene,
  onPreview,
  className,
}: ApprovedSceneCardProps) {
  return (
    <div
      className={cn(
        'relative rounded-xl border border-green-500/20 overflow-hidden',
        'bg-black/40 backdrop-blur-sm',
        // Consistent card layout to match SceneCard
        'flex flex-col',
        'opacity-60 transition-opacity duration-200',
        'hover:opacity-80',
        className
      )}
    >
      {/* Video Preview Area */}
      <div className="relative aspect-video bg-black/60 group">
        {scene.videoPath ? (
          <video
            src={scene.videoPath}
            className="w-full h-full object-cover grayscale-[30%]"
            muted
            loop
            playsInline
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-green-500/50" />
          </div>
        )}

        {/* Locked Overlay */}
        <div className="absolute inset-0 bg-black/20" />

        {/* Lock Icon */}
        <div className="absolute top-2 right-2">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-green-500/20">
            <Lock className="h-3 w-3 text-green-400" />
            <span className="text-xs font-medium text-green-400">Locked</span>
          </div>
        </div>

        {/* Version Badge */}
        <div className="absolute top-2 left-2">
          <span className="px-2 py-0.5 text-xs font-medium bg-black/60 text-gray-400 rounded">
            v{scene.version}
          </span>
        </div>

        {/* Preview button on hover */}
        {scene.videoPath && (
          <button
            onClick={onPreview}
            className={cn(
              'absolute inset-0 flex items-center justify-center',
              'bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity',
              'cursor-pointer'
            )}
          >
            <Eye className="h-8 w-8 text-white/80" />
          </button>
        )}
      </div>

      {/* Info Footer */}
      <div className="p-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-400">
            Scene {scene.sceneNumber}
          </h4>
          
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            <span className="text-xs text-green-400 font-medium">Approved</span>
          </div>
        </div>

        {scene.score !== undefined && (
          <div className="mt-1 text-xs text-gray-500">
            Final score: {Math.round(scene.score)}%
          </div>
        )}
      </div>
    </div>
  );
}

export default ApprovedSceneCard;
