/**
 * SpawnedAgentCard
 * 
 * Displays a spawned scene agent with detailed view:
 * - Agent status and scene name
 * - Streaming thought display
 * - Current action with progress
 * - Elapsed/completion time
 */

import { memo, useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { 
  SpawnedAgentState, 
  AgentStatus, 
  AgentAction 
} from '@/types/orchestration';
import { 
  Loader2, 
  Brain, 
  Code, 
  Play, 
  CheckCircle, 
  XCircle,
  Clock,
  Sparkles
} from 'lucide-react';

interface SpawnedAgentCardProps {
  agent: SpawnedAgentState;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

// Status configuration with refined color palette
const statusConfig: Record<AgentStatus, { 
  color: string; 
  bgColor: string;
  borderColor: string;
  progressColor: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}> = {
  spawning: { 
    color: 'text-zinc-400', 
    bgColor: 'bg-zinc-800', 
    borderColor: 'border-zinc-700/50',
    progressColor: 'bg-zinc-600',
    icon: Loader2, 
    label: 'Starting' 
  },
  thinking: { 
    color: 'text-violet-400', 
    bgColor: 'bg-violet-500/10', 
    borderColor: 'border-violet-500/30',
    progressColor: 'bg-violet-500',
    icon: Brain, 
    label: 'Thinking' 
  },
  generating: { 
    color: 'text-sky-400', 
    bgColor: 'bg-sky-500/10', 
    borderColor: 'border-sky-500/30',
    progressColor: 'bg-sky-500',
    icon: Code, 
    label: 'Generating' 
  },
  rendering: { 
    color: 'text-amber-400', 
    bgColor: 'bg-amber-500/10', 
    borderColor: 'border-amber-500/30',
    progressColor: 'bg-amber-500',
    icon: Play, 
    label: 'Rendering' 
  },
  completed: { 
    color: 'text-emerald-400', 
    bgColor: 'bg-emerald-500/10', 
    borderColor: 'border-emerald-500/30',
    progressColor: 'bg-emerald-500',
    icon: CheckCircle, 
    label: 'Complete' 
  },
  error: { 
    color: 'text-red-400', 
    bgColor: 'bg-red-500/10', 
    borderColor: 'border-red-500/30',
    progressColor: 'bg-red-500',
    icon: XCircle, 
    label: 'Failed' 
  },
};

// Action labels
const actionLabels: Record<AgentAction, string> = {
  planning: 'Planning scene',
  generating_code: 'Writing code',
  validating_code: 'Validating',
  rendering_scene: 'Rendering video',
  reviewing: 'Reviewing output',
  refining: 'Refining code',
};

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function formatElapsedTime(startedAt: number, completedAt?: number): string {
  const endTime = completedAt || Date.now();
  return formatDuration(endTime - startedAt);
}

export const SpawnedAgentCard = memo(function SpawnedAgentCard({
  agent,
  isSelected = false,
  onClick,
  className,
}: SpawnedAgentCardProps) {
  const config = statusConfig[agent.status];
  const StatusIcon = config.icon;
  const thoughtsContainerRef = useRef<HTMLDivElement>(null);
  
  const isActive = agent.status !== 'completed' && agent.status !== 'error';
  
  // Live elapsed time counter - updates every second while agent is active
  const [elapsedTime, setElapsedTime] = useState(() => {
    if (agent.durationMs) return formatDuration(agent.durationMs);
    return formatElapsedTime(agent.startedAt, agent.completedAt);
  });
  
  useEffect(() => {
    // If completed or has final duration, set it once and don't update
    if (agent.durationMs) {
      setElapsedTime(formatDuration(agent.durationMs));
      return;
    }
    if (agent.completedAt) {
      setElapsedTime(formatElapsedTime(agent.startedAt, agent.completedAt));
      return;
    }
    
    // Update immediately
    setElapsedTime(formatElapsedTime(agent.startedAt));
    
    // Only run interval if agent is still active
    if (!isActive) return;
    
    const interval = setInterval(() => {
      setElapsedTime(formatElapsedTime(agent.startedAt));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [agent.startedAt, agent.completedAt, agent.durationMs, isActive]);
  
  // Auto-scroll thoughts container when new thoughts arrive
  useEffect(() => {
    if (thoughtsContainerRef.current) {
      thoughtsContainerRef.current.scrollTop = thoughtsContainerRef.current.scrollHeight;
    }
  }, [agent.currentThought, agent.thoughts.length]);
  
  return (
    <div
      onClick={onClick}
      className={cn(
        'relative rounded-lg border p-3 transition-all duration-200 cursor-pointer',
        'hover:bg-zinc-800/50',
        isSelected 
          ? 'border-violet-500/50 bg-violet-500/5' 
          : 'border-zinc-700/50 bg-zinc-900/50',
        isActive && 'border-l-2',
        isActive && config.borderColor,
        className
      )}
    >
      {/* Header: Scene name + Status */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={cn(
            'flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0 transition-colors',
            config.bgColor
          )}>
            <StatusIcon className={cn(
              'w-3.5 h-3.5',
              config.color,
              agent.status === 'spawning' && 'animate-spin',
              agent.status === 'thinking' && 'animate-pulse'
            )} />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-zinc-200 truncate">
              Scene {agent.sceneIndex + 1}
            </div>
            <div className="text-xs text-zinc-500 truncate">
              {agent.sceneName}
            </div>
          </div>
        </div>
        
        {/* Time badge */}
        <div className="flex items-center gap-1 text-xs text-zinc-500 flex-shrink-0 font-mono">
          <Clock className="w-3 h-3" />
          {elapsedTime}
        </div>
      </div>
      
      {/* Thinking stream (when active) */}
      {(agent.isThinkingStreaming || agent.currentThought || agent.thoughts.length > 0) && (
        <div className={cn(
          'mt-2 p-2 rounded-md text-xs border',
          'bg-violet-500/5 border-violet-500/20'
        )}>
          <div className="flex items-center gap-1.5 mb-1.5 text-violet-400">
            <Sparkles className="w-3 h-3" />
            <span className="font-medium text-[11px] uppercase tracking-wider">Thoughts</span>
            {agent.isThinkingStreaming && (
              <span className="animate-pulse">...</span>
            )}
            <span className="text-zinc-500 ml-auto text-[10px]">
              {agent.thoughts.length}
            </span>
          </div>
          <div 
            ref={thoughtsContainerRef}
            className="max-h-20 overflow-y-auto space-y-1 scroll-smooth scrollbar-thin scrollbar-thumb-zinc-700"
          >
            {/* Previous thoughts */}
            {agent.thoughts.map((thought, idx) => (
              <div 
                key={thought.id || idx} 
                className="text-zinc-500 text-xs py-0.5 border-b border-violet-500/10 last:border-0"
              >
                {thought.thought}
              </div>
            ))}
            {/* Current streaming thought */}
            {agent.currentThought && (
              <div className="text-zinc-300">
                {agent.currentThought}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Current action */}
      {agent.currentAction && isActive && !agent.isThinkingStreaming && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-zinc-400">
              {actionLabels[agent.currentAction]}
            </span>
            {agent.actionProgress !== undefined && (
              <span className={cn('font-mono', config.color)}>
                {Math.round(agent.actionProgress)}%
              </span>
            )}
          </div>
          
          {agent.actionProgress !== undefined && (
            <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className={cn('h-full transition-all duration-300 rounded-full', config.progressColor)}
                style={{ width: `${agent.actionProgress}%` }}
              />
            </div>
          )}
          
          {agent.actionDetails && (
            <div className="mt-1.5 text-[11px] text-zinc-500 truncate">
              {agent.actionDetails}
            </div>
          )}
        </div>
      )}
      
      {/* Completed result */}
      {agent.status === 'completed' && agent.result && (
        <div className="mt-2 text-xs text-zinc-500">
          {agent.result}
        </div>
      )}
      
      {/* Error display */}
      {agent.status === 'error' && agent.error && (
        <div className="mt-2 p-2 rounded-md bg-red-500/10 border border-red-500/20">
          <div className="text-xs text-red-400 line-clamp-2">
            {agent.error}
          </div>
        </div>
      )}
    </div>
  );
});

export default SpawnedAgentCard;
