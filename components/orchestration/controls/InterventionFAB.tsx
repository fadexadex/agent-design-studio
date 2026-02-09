/**
 * InterventionFAB Component
 * 
 * Floating action button with intervention controls.
 */

import React, { useState } from 'react';
import { 
  MoreVertical, 
  Square, 
  Pause, 
  Play, 
  CheckCheck,
  X
} from 'lucide-react';
import { InterventionAction } from '../../../types/orchestration';
import { cn } from '@/lib/utils';

interface InterventionFABProps {
  isPaused: boolean;
  hasRunningScenes: boolean;
  canApproveAll: boolean;
  onAction: (action: InterventionAction) => void;
  className?: string;
}

export function InterventionFAB({
  isPaused,
  hasRunningScenes,
  canApproveAll,
  onAction,
  className,
}: InterventionFABProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (action: InterventionAction) => {
    setIsOpen(false);
    onAction(action);
  };

  return (
    <div className={cn('fixed bottom-6 right-6 z-50', className)}>
      {/* Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          
          {/* Menu Items */}
          <div className="absolute bottom-16 right-0 z-50 flex flex-col gap-2 items-end">
            {/* Kill Job */}
            <button
              onClick={() => handleAction('kill')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full',
                'bg-red-500 text-white font-medium text-sm',
                'shadow-lg hover:bg-red-600 transition-colors',
                'animate-in slide-in-from-bottom-2 fade-in duration-200'
              )}
            >
              <Square className="h-4 w-4" />
              Stop Generation
            </button>

            {/* Pause/Resume */}
            {hasRunningScenes && (
              <button
                onClick={() => handleAction(isPaused ? 'resume' : 'pause')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-full',
                  'bg-yellow-500 text-black font-medium text-sm',
                  'shadow-lg hover:bg-yellow-400 transition-colors',
                  'animate-in slide-in-from-bottom-2 fade-in duration-200 delay-75'
                )}
              >
                {isPaused ? (
                  <>
                    <Play className="h-4 w-4" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4" />
                    Pause
                  </>
                )}
              </button>
            )}

            {/* Approve All */}
            {canApproveAll && (
              <button
                onClick={() => handleAction('approve-all')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-full',
                  'bg-green-500 text-white font-medium text-sm',
                  'shadow-lg hover:bg-green-600 transition-colors',
                  'animate-in slide-in-from-bottom-2 fade-in duration-200 delay-100'
                )}
              >
                <CheckCheck className="h-4 w-4" />
                Approve All
              </button>
            )}
          </div>
        </>
      )}

      {/* Main FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center justify-center w-14 h-14 rounded-full',
          'bg-white/10 backdrop-blur-sm border border-white/20',
          'shadow-lg hover:bg-white/20 transition-all',
          isOpen && 'rotate-90'
        )}
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <MoreVertical className="h-6 w-6 text-white" />
        )}
      </button>
    </div>
  );
}

export default InterventionFAB;
