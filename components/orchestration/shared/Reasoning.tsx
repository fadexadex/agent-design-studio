/**
 * Reasoning Component
 * 
 * Displays agent reasoning/decision with expandable details.
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Lightbulb } from 'lucide-react';
import { DirectorDecisionData, formatRelativeTime } from '../../../types/orchestration';
import { cn } from '../../../lib/utils';

interface ReasoningProps {
  decision: DirectorDecisionData;
  expanded?: boolean;
  className?: string;
}

export function Reasoning({
  decision,
  expanded = false,
  className,
}: ReasoningProps) {
  const [isExpanded, setIsExpanded] = useState(expanded);

  return (
    <div className={cn(
      'rounded-lg border border-white/10 bg-white/5 overflow-hidden',
      className
    )}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-start gap-3 px-3 py-3 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex-shrink-0 mt-0.5">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-400" />
          )}
        </div>
        <Lightbulb className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-200">Decision</span>
            <span className="text-xs text-gray-500">
              {formatRelativeTime(decision.timestamp)}
            </span>
          </div>
          <p className="text-sm text-gray-300 line-clamp-2">
            {decision.decision}
          </p>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-3 pb-3 pl-10 space-y-3 border-t border-white/5">
          {/* Reasoning */}
          <div className="pt-3">
            <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">
              Reasoning
            </h4>
            <p className="text-sm text-gray-300 leading-relaxed">
              {decision.reasoning}
            </p>
          </div>

          {/* Affected Scenes */}
          {decision.affectedScenes.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                Affected Scenes
              </h4>
              <div className="flex flex-wrap gap-2">
                {decision.affectedScenes.map((sceneId) => (
                  <span
                    key={sceneId}
                    className="px-2 py-1 text-xs bg-blue-500/20 text-blue-300 rounded"
                  >
                    {sceneId}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Reasoning;
