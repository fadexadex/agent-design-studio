/**
 * SceneCard Component
 * 
 * Individual scene card with status, video preview, and progress indicators.
 */

import React, { useState } from 'react';
import { 
  Play, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Film,
  Eye,
  Info
} from 'lucide-react';
import { SceneUIState, SceneStatus, getStatusColor, getStatusBgColor } from '../../../types/orchestration';
import { SatisfactionMeter } from '../shared/SatisfactionMeter';
import { IterationProgress } from '../health/IterationProgress';
import { formatErrorMessage, getErrorSeverity } from '../shared/errorUtils';
import { cn } from '../../../lib/utils';

interface SceneCardProps {
  scene: SceneUIState;
  onClick?: () => void;
  onPreview?: () => void;
  maxAttempts?: number;
  className?: string;
}

const statusConfig: Record<SceneStatus, {
  icon: typeof Play;
  label: string;
  animate?: boolean;
}> = {
  pending: { icon: Film, label: 'Pending' },
  generating: { icon: Loader2, label: 'Generating', animate: true },
  rendering: { icon: Loader2, label: 'Rendering', animate: true },
  evaluating: { icon: Loader2, label: 'Evaluating', animate: true },
  passed: { icon: CheckCircle2, label: 'Approved' },
  failed: { icon: XCircle, label: 'Failed' },
};

export function SceneCard({
  scene,
  onClick,
  onPreview,
  maxAttempts = 5,
  className,
}: SceneCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const config = statusConfig[scene.status];
  const StatusIcon = config.icon;
  
  const isActive = ['generating', 'rendering', 'evaluating'].includes(scene.status);
  const showProgress = scene.status === 'rendering' && scene.renderProgress !== undefined;
  const showEvalProgress = scene.status === 'evaluating' && scene.evaluationProgress !== undefined;

  return (
    <div
      className={cn(
        'relative rounded-xl border overflow-hidden transition-all duration-200',
        'bg-black/40 backdrop-blur-sm',
        // Consistent card height to prevent grid overlap
        'flex flex-col',
        isActive ? 'border-blue-500/50 shadow-lg shadow-blue-500/10' : 'border-white/10',
        scene.status === 'passed' && 'border-green-500/30',
        scene.status === 'failed' && 'border-red-500/30',
        onClick && 'cursor-pointer hover:border-white/20',
        className
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Video Preview Area */}
      <div className="relative aspect-video bg-black/60">
        {scene.videoPath ? (
          <>
            <video
              src={scene.videoPath}
              className="w-full h-full object-cover"
              muted
              loop
              playsInline
              autoPlay={isHovered}
            />
            {/* Preview overlay on hover */}
            {isHovered && (
              <div 
                className="absolute inset-0 bg-black/40 flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  onPreview?.();
                }}
              >
                <Eye className="h-8 w-8 text-white/80" />
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            {isActive ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
                <span className="text-xs text-gray-400">{config.label}...</span>
              </div>
            ) : (
              <Film className="h-8 w-8 text-gray-600" />
            )}
          </div>
        )}

        {/* Version Badge */}
        <div className="absolute top-2 left-2">
          <span className="px-2 py-0.5 text-xs font-medium bg-black/60 text-gray-300 rounded">
            v{scene.version}
          </span>
        </div>

        {/* Status Badge */}
        <div className={cn(
          'absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 rounded',
          getStatusBgColor(scene.status)
        )}>
          <StatusIcon className={cn(
            'h-3 w-3',
            getStatusColor(scene.status),
            config.animate && 'animate-spin'
          )} />
          <span className={cn('text-xs font-medium', getStatusColor(scene.status))}>
            {config.label}
          </span>
        </div>

        {/* Progress overlay for rendering */}
        {showProgress && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/60">
            <div 
              className="h-full bg-orange-500 transition-all duration-300"
              style={{ width: `${scene.renderProgress}%` }}
            />
          </div>
        )}

        {/* Progress overlay for evaluation */}
        {showEvalProgress && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/60">
            <div 
              className="h-full bg-purple-500 transition-all duration-300"
              style={{ width: `${scene.evaluationProgress}%` }}
            />
          </div>
        )}
      </div>

      {/* Info Footer */}
      <div className="p-4 space-y-3">
        {/* Scene Title */}
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-100">
            Scene {scene.sceneNumber}
          </h4>
          
          {/* Score if available */}
          {scene.score !== undefined && (
            <SatisfactionMeter 
              score={scene.score} 
              trend={scene.scoreHistory.length > 1 ? 
                (scene.scoreHistory[scene.scoreHistory.length - 1] > scene.scoreHistory[scene.scoreHistory.length - 2] ? 'improving' : 'regressing') 
                : 'plateau'
              }
              size="sm"
              showTrend={scene.scoreHistory.length > 1}
            />
          )}
        </div>

        {/* Iteration Progress */}
        {scene.attempts > 0 && scene.status !== 'passed' && (
          <IterationProgress current={scene.attempts} max={maxAttempts} />
        )}

        {/* Feedback */}
        {scene.feedback && scene.status !== 'passed' && (
          <div className="flex items-start gap-2 mt-2 p-2 rounded bg-white/5">
            <AlertTriangle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-400 line-clamp-2">{scene.feedback}</p>
          </div>
        )}

        {/* Error */}
        {scene.error && (
          <div 
            className={cn(
              "flex items-start gap-2 mt-2 p-2 rounded",
              getErrorSeverity(scene.error) === 'critical' ? 'bg-red-500/20' : 'bg-red-500/10'
            )}
            title={scene.error} // Full error on hover
          >
            <XCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-red-300 font-medium">
                {formatErrorMessage(scene.error, 40)}
              </p>
              {scene.attempts > 0 && (
                <p className="text-xs text-red-400/60 mt-0.5">
                  After {scene.attempts} attempt{scene.attempts > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SceneCard;
