/**
 * DirectorPanel Component
 * 
 * Displays Director agent state, thinking, and decisions.
 * Uses ai-elements components for consistent UI.
 */

import React from 'react';
import { Brain, Zap, AlertCircle, Sparkles, Target, Search, CheckCircle, Lightbulb } from 'lucide-react';
import { DirectorUIState, DirectorPhase, DirectorDecisionData, formatRelativeTime } from '../../../types/orchestration';
import { PanelWrapper } from './PanelWrapper';
import {
  ChainOfThought,
  ChainOfThoughtHeader,
  ChainOfThoughtContent,
  ChainOfThoughtStep,
} from '@/components/ai-elements/chain-of-thought';
import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
} from '@/components/ai-elements/reasoning';
import { cn } from '@/lib/utils';

interface DirectorPanelProps {
  director: DirectorUIState;
  className?: string;
}

const phaseConfig: Record<DirectorPhase, {
  label: string;
  color: string;
  bgColor: string;
  icon: typeof Brain;
}> = {
  planning: {
    label: 'Planning',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    icon: Target,
  },
  coordinating: {
    label: 'Coordinating',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    icon: Sparkles,
  },
  evaluating: {
    label: 'Evaluating',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    icon: Search,
  },
  deciding: {
    label: 'Deciding',
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    icon: CheckCircle,
  },
};

// Decision card component using ai-elements Reasoning
function DecisionCard({ decision }: { decision: DirectorDecisionData }) {
  // Format the reasoning content for the Reasoning component
  const reasoningContent = `**Decision:** ${decision.decision}\n\n${decision.reasoning}${
    decision.affectedScenes.length > 0 
      ? `\n\n**Affected Scenes:** ${decision.affectedScenes.join(', ')}`
      : ''
  }`;

  return (
    <Reasoning defaultOpen={false}>
      <ReasoningTrigger>
        <Lightbulb className="size-4 text-yellow-400" />
        <span className="flex-1 text-left text-sm">
          {decision.decision.length > 60 
            ? decision.decision.substring(0, 60) + '...' 
            : decision.decision
          }
        </span>
        <span className="text-xs text-muted-foreground">
          {formatRelativeTime(decision.timestamp)}
        </span>
      </ReasoningTrigger>
      <ReasoningContent>
        {reasoningContent}
      </ReasoningContent>
    </Reasoning>
  );
}

export function DirectorPanel({ director, className }: DirectorPanelProps) {
  const { phase, isActive, totalScenes, thoughts, decisions, error, isRecoverable } = director;

  const status = error 
    ? 'error' 
    : isActive 
      ? 'active' 
      : 'idle';

  // Get the latest thought if currently thinking
  const isThinking = isActive && thoughts.length > 0;
  const latestThought = thoughts[thoughts.length - 1];

  return (
    <PanelWrapper
      title="Director Agent"
      icon={<Brain className="h-4 w-4" />}
      status={status}
      className={className}
    >
      <div className="space-y-4">
        {/* Current Phase */}
        {phase && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Phase</span>
            <span className={cn(
              'px-2 py-1 rounded text-xs font-medium',
              phaseConfig[phase].bgColor,
              phaseConfig[phase].color
            )}>
              {phaseConfig[phase].label}
            </span>
          </div>
        )}

        {/* Scene Count */}
        {totalScenes > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Scenes</span>
            <span className="text-sm text-foreground/80">{totalScenes} total</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className={cn(
            'flex items-start gap-3 p-3 rounded-lg',
            isRecoverable ? 'bg-yellow-500/10' : 'bg-red-500/10'
          )}>
            <AlertCircle className={cn(
              'h-5 w-5 flex-shrink-0',
              isRecoverable ? 'text-yellow-400' : 'text-red-400'
            )} />
            <div>
              <p className={cn(
                'text-sm font-medium',
                isRecoverable ? 'text-yellow-300' : 'text-red-300'
              )}>
                {isRecoverable ? 'Recoverable Error' : 'Fatal Error'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Chain of Thought - using ai-elements */}
        {thoughts.length > 0 && (
          <ChainOfThought defaultOpen={false}>
            <ChainOfThoughtHeader>
              {isThinking ? 'Thinking...' : `Thoughts (${thoughts.length})`}
            </ChainOfThoughtHeader>
            <ChainOfThoughtContent>
              {thoughts.map((thought, index) => {
                const PhaseIcon = phaseConfig[thought.phase]?.icon || Brain;
                const isLatest = index === thoughts.length - 1;
                return (
                  <ChainOfThoughtStep
                    key={thought.id}
                    icon={PhaseIcon}
                    label={thought.thought}
                    description={formatRelativeTime(thought.timestamp)}
                    status={isThinking && isLatest ? 'active' : 'complete'}
                  />
                );
              })}
            </ChainOfThoughtContent>
          </ChainOfThought>
        )}

        {/* Recent Decisions - using ai-elements Reasoning */}
        {decisions.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-400" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                Recent Decisions
              </span>
            </div>
            <div className="space-y-2">
              {decisions.slice(-3).map((decision) => (
                <DecisionCard key={decision.id} decision={decision} />
              ))}
            </div>
          </div>
        )}

        {/* Idle State */}
        {!isActive && !error && thoughts.length === 0 && (
          <div className="text-center py-4">
            <Brain className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Director is idle</p>
          </div>
        )}
      </div>
    </PanelWrapper>
  );
}

export default DirectorPanel;
