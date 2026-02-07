/**
 * Agent Trace Timeline
 * 
 * Vertical timeline displaying the agent's thinking process (REASON, ACT, OBSERVE).
 */

import React, { useState } from 'react';
import {
  Brain,
  Zap,
  Eye,
  ChevronDown,
  ChevronUp,
  Code,
  ChevronsUpDown,
} from 'lucide-react';
import type { AgentThought } from '../../types';

interface AgentTraceTimelineProps {
  thoughts: AgentThought[];
}

interface ThoughtItemProps {
  thought: AgentThought;
  isLast: boolean;
}

const thoughtConfig = {
  reason: {
    icon: Brain,
    label: 'REASON',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    lineColor: 'bg-purple-500/30',
  },
  act: {
    icon: Zap,
    label: 'ACT',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    lineColor: 'bg-blue-500/30',
  },
  observe: {
    icon: Eye,
    label: 'OBSERVE',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    lineColor: 'bg-green-500/30',
  },
};

function formatTime(timestamp: string | Date): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

const ThoughtItem: React.FC<ThoughtItemProps> = ({ thought, isLast }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = thoughtConfig[thought.type] || thoughtConfig.reason;
  const Icon = config.icon;

  const hasLongContent = thought.content.length > 150;
  const displayContent = hasLongContent && !isExpanded
    ? thought.content.slice(0, 150) + '...'
    : thought.content;

  return (
    <div className="relative flex gap-3">
      {/* Timeline line */}
      {!isLast && (
        <div
          className={`absolute left-[15px] top-8 bottom-0 w-0.5 ${config.lineColor}`}
        />
      )}

      {/* Icon */}
      <div
        className={`relative z-10 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${config.bgColor} border ${config.borderColor}`}
      >
        <Icon size={14} className={config.color} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-bold ${config.color}`}>
            {config.label}
          </span>
          <span className="text-xs text-zinc-600">
            {formatTime(thought.timestamp)}
          </span>
        </div>

        {/* Content */}
        <div
          className={`p-3 rounded-lg ${config.bgColor} border ${config.borderColor}`}
        >
          <p className="text-sm text-zinc-300 whitespace-pre-wrap break-words">
            {displayContent}
          </p>

          {hasLongContent && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`flex items-center gap-1 mt-2 text-xs ${config.color} hover:underline`}
            >
              {isExpanded ? (
                <>
                  <ChevronUp size={12} />
                  <span>Show less</span>
                </>
              ) : (
                <>
                  <ChevronDown size={12} />
                  <span>Show more</span>
                </>
              )}
            </button>
          )}

          {/* Model thinking (if available) */}
          {thought.modelThinking && (
            <div className="mt-3 pt-3 border-t border-zinc-700/50">
              <p className="text-xs text-zinc-500 mb-1">Model Thinking:</p>
              <p className="text-xs text-zinc-400 italic">
                {thought.modelThinking}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const AgentTraceTimeline: React.FC<AgentTraceTimelineProps> = ({
  thoughts,
}) => {
  const [expandAll, setExpandAll] = useState(false);

  if (!thoughts || thoughts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 p-6 text-center">
        <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mb-3">
          <Brain size={20} className="text-zinc-600" />
        </div>
        <h3 className="text-zinc-400 font-medium mb-1">No Agent Trace</h3>
        <p className="text-zinc-500 text-sm">
          The agent's thinking process will appear here
        </p>
      </div>
    );
  }

  // Group thoughts by type for summary
  const summary = thoughts.reduce(
    (acc, t) => {
      acc[t.type] = (acc[t.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="p-4">
      {/* Summary */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 text-xs">
          {summary.reason && (
            <span className="text-purple-400">{summary.reason} reasons</span>
          )}
          {summary.act && (
            <span className="text-blue-400">{summary.act} actions</span>
          )}
          {summary.observe && (
            <span className="text-green-400">{summary.observe} observations</span>
          )}
        </div>
        <button
          onClick={() => setExpandAll(!expandAll)}
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <ChevronsUpDown size={14} />
          <span>{expandAll ? 'Collapse' : 'Expand'} All</span>
        </button>
      </div>

      {/* Timeline */}
      <div className="space-y-0">
        {thoughts.map((thought, index) => (
          <ThoughtItem
            key={`${thought.type}-${index}`}
            thought={thought}
            isLast={index === thoughts.length - 1}
          />
        ))}
      </div>
    </div>
  );
};
