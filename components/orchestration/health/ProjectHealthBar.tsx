/**
 * ProjectHealthBar Component
 * 
 * Top-level quality indicator showing overall progress and score.
 * Uses refined color palette for professional appearance.
 */

import React from 'react';
import { CheckCircle2, Clock, Zap } from 'lucide-react';
import { TrendDirection } from '../../../types/orchestration';
import { TrendIndicator } from '../shared/TrendIndicator';
import { cn } from '../../../lib/utils';

interface ProjectHealthBarProps {
  overallScore: number;
  trend: TrendDirection;
  passedScenes: number;
  totalScenes: number;
  isComplete: boolean;
  className?: string;
}

export function ProjectHealthBar({
  overallScore,
  trend,
  passedScenes,
  totalScenes,
  isComplete,
  className,
}: ProjectHealthBarProps) {
  const progress = totalScenes > 0 ? (passedScenes / totalScenes) * 100 : 0;
  
  return (
    <div className={cn(
      'rounded-xl border border-zinc-700/50 bg-zinc-900/80 backdrop-blur-sm p-4',
      className
    )}>
      <div className="flex items-center justify-between mb-3">
        {/* Left: Status and Score */}
        <div className="flex items-center gap-4">
          {/* Status Icon */}
          {isComplete ? (
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-medium">Complete</span>
            </div>
          ) : totalScenes > 0 ? (
            <div className="flex items-center gap-2 text-violet-400">
              <span className="text-sm font-medium">Processing</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-zinc-500">
              <Clock className="h-5 w-5" />
              <span className="text-sm font-medium">Waiting</span>
            </div>
          )}

          {/* Score */}
          {overallScore > 0 && (
            <div className="flex items-center gap-2">
              <span className={cn(
                'text-2xl font-bold font-mono',
                overallScore >= 80 ? 'text-emerald-400' :
                overallScore >= 60 ? 'text-amber-400' :
                'text-red-400'
              )}>
                {Math.round(overallScore)}%
              </span>
              <TrendIndicator trend={trend} size="md" />
            </div>
          )}
        </div>

        {/* Right: Scene Count */}
        <div className="flex items-center gap-2 text-zinc-300">
          <span className="text-lg font-semibold font-mono">{passedScenes}</span>
          <span className="text-zinc-600">/</span>
          <span className="text-zinc-500 font-mono">{totalScenes}</span>
          <span className="text-xs text-zinc-500 ml-1">approved</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            isComplete ? 'bg-emerald-500' : 'bg-violet-500'
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export default ProjectHealthBar;
