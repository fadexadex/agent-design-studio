/**
 * ChainOfThought Component
 * 
 * Displays a collapsible list of agent thoughts with timestamps.
 * Implements the "disciplined CoT" pattern - collapsed by default.
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Brain } from 'lucide-react';
import { DirectorThought, DirectorPhase, formatRelativeTime } from '../../../types/orchestration';
import { cn } from '../../../lib/utils';

interface ChainOfThoughtProps {
  thoughts: DirectorThought[];
  collapsed?: boolean;
  onToggle?: () => void;
  maxVisible?: number;
  className?: string;
}

const phaseLabels: Record<DirectorPhase, string> = {
  planning: 'Planning',
  coordinating: 'Coordinating',
  evaluating: 'Evaluating',
  deciding: 'Deciding',
};

const phaseColors: Record<DirectorPhase, string> = {
  planning: 'text-blue-400',
  coordinating: 'text-yellow-400',
  evaluating: 'text-purple-400',
  deciding: 'text-green-400',
};

export function ChainOfThought({
  thoughts,
  collapsed = true,
  onToggle,
  maxVisible = 5,
  className,
}: ChainOfThoughtProps) {
  const [isExpanded, setIsExpanded] = useState(!collapsed);
  
  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    onToggle?.();
  };

  if (thoughts.length === 0) {
    return null;
  }

  const visibleThoughts = isExpanded ? thoughts : thoughts.slice(-1);
  const hasMore = thoughts.length > 1;

  return (
    <div className={cn('rounded-lg border border-white/10 bg-white/5', className)}>
      {/* Header */}
      <button
        onClick={handleToggle}
        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-400" />
        )}
        <Brain className="h-4 w-4 text-blue-400" />
        <span className="text-sm font-medium text-gray-200">
          Thinking
        </span>
        {!isExpanded && hasMore && (
          <span className="text-xs text-gray-500">
            ({thoughts.length} thoughts)
          </span>
        )}
      </button>

      {/* Thoughts List */}
      <div className={cn(
        'overflow-hidden transition-all duration-200',
        isExpanded ? 'max-h-96' : 'max-h-20'
      )}>
        <div className="px-3 pb-3 space-y-2">
          {visibleThoughts.map((thought, index) => (
            <div
              key={thought.id}
              className={cn(
                'pl-6 border-l-2 border-white/10',
                index === visibleThoughts.length - 1 && 'border-blue-500/50'
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={cn('text-xs font-medium', phaseColors[thought.phase])}>
                  {phaseLabels[thought.phase]}
                </span>
                <span className="text-xs text-gray-500">
                  {formatRelativeTime(thought.timestamp)}
                </span>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                {thought.thought}
              </p>
            </div>
          ))}
          
          {!isExpanded && hasMore && (
            <button
              onClick={handleToggle}
              className="text-xs text-blue-400 hover:text-blue-300 pl-6"
            >
              Show {thoughts.length - 1} more thoughts...
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChainOfThought;
