/**
 * IterationProgress Component
 * 
 * Shows current iteration/attempt within max allowed.
 */

import React from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface IterationProgressProps {
  current: number;
  max: number;
  className?: string;
}

export function IterationProgress({
  current,
  max,
  className,
}: IterationProgressProps) {
  const progress = (current / max) * 100;
  const isWarning = current >= max - 1;
  const isMax = current >= max;

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <RefreshCw className={cn(
        'h-4 w-4',
        isMax ? 'text-red-400' : isWarning ? 'text-yellow-400' : 'text-blue-400'
      )} />
      
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-400">
            Iteration {current}/{max}
          </span>
          {isWarning && !isMax && (
            <span className="text-xs text-yellow-400">Almost at limit</span>
          )}
          {isMax && (
            <span className="text-xs text-red-400">Max reached</span>
          )}
        </div>
        
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              isMax ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-blue-500'
            )}
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default IterationProgress;
