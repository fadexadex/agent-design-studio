/**
 * TimelineEvent Component
 * 
 * Single event display with category-specific styling.
 */

import React from 'react';
import { 
  Brain, 
  Film, 
  CheckCircle, 
  Play, 
  Settings,
  AlertCircle,
  Info,
  User,
  Eye
} from 'lucide-react';
import { 
  UIEvent, 
  EventCategory, 
  formatRelativeTime,
  getCategoryColor 
} from '../../../types/orchestration';
import { cn } from '@/lib/utils';

interface TimelineEventProps {
  event: UIEvent;
  showTimestamp?: boolean;
  className?: string;
}

const categoryIcons: Record<EventCategory, typeof Brain> = {
  director: Brain,
  scene: Film,
  evaluation: CheckCircle,
  render: Play,
  system: Settings,
  agent: User,
  preview: Eye,
};

function getEventMessage(event: UIEvent): string {
  switch (event.type) {
    // Director events
    case 'director:started':
      return `Director started with ${event.data.totalScenes} scenes`;
    case 'director:thinking':
      return event.data.thought;
    case 'director:decision':
      return event.data.decision;
    case 'director:completed':
      return `Completed with score ${event.data.finalScore}%`;
    case 'director:error':
      return event.data.error;

    // Scene events
    case 'scene:queued':
      return `Scene ${event.data.sceneNumber} queued (v${event.data.version})`;
    case 'scene:generating':
      return `Generating Scene ${event.data.sceneNumber} (attempt ${event.data.attempt})`;
    case 'scene:generated':
      return `Scene ${event.data.sceneNumber} generated in ${Math.round(event.data.durationMs / 1000)}s`;
    case 'scene:rendering':
      return `Rendering Scene ${event.data.sceneNumber}`;
    case 'scene:rendered':
      return `Scene ${event.data.sceneNumber} rendered`;
    case 'scene:error':
      return `Scene ${event.data.sceneNumber} error: ${event.data.error}`;

    // Evaluation events
    case 'evaluation:started':
      return event.data.sceneId 
        ? `Evaluating Scene ${event.data.sceneNumber}`
        : 'Starting global evaluation';
    case 'evaluation:progress':
      return `Evaluation ${event.data.progress}%: ${event.data.step}`;
    case 'evaluation:completed':
      return event.data.sceneId
        ? `Scene ${event.data.sceneNumber}: ${event.data.passed ? 'Passed' : 'Needs refinement'} (${event.data.score}%)`
        : `Global evaluation: ${event.data.score}%`;
    case 'evaluation:escalated':
      return `Scene ${event.data.sceneNumber} escalated: ${event.data.reason}`;

    // Render events
    case 'render:started':
      return event.data.phase === 'final' 
        ? 'Starting final video render'
        : `Starting render for scene`;
    case 'render:progress':
      return `Rendering: ${event.data.framesRendered}/${event.data.totalFrames} frames`;
    case 'render:completed':
      return event.data.phase === 'final'
        ? 'Final video rendered'
        : 'Scene rendered';
    case 'render:error':
      return `Render error: ${event.data.error}`;

    // System events
    case 'system:health':
      return `System health: Redis ${event.data.redis}`;
    case 'system:error':
      return `System error: ${event.data.error}`;

    default:
      return event.type;
  }
}

function getEventVariant(event: UIEvent): 'default' | 'success' | 'warning' | 'error' {
  if (event.type.includes('error')) return 'error';
  if (event.type.includes('completed') || event.type.includes('passed')) return 'success';
  if (event.type.includes('escalated')) return 'warning';
  return 'default';
}

const variantStyles = {
  default: 'border-white/10 bg-white/5',
  success: 'border-green-500/30 bg-green-500/10',
  warning: 'border-yellow-500/30 bg-yellow-500/10',
  error: 'border-red-500/30 bg-red-500/10',
};

export function TimelineEvent({
  event,
  showTimestamp = true,
  className,
}: TimelineEventProps) {
  const Icon = categoryIcons[event.category];
  const variant = getEventVariant(event);
  const message = getEventMessage(event);

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border',
        variantStyles[variant],
        className
      )}
    >
      <Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', getCategoryColor(event.category))} />
      
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-200 break-words">
          {message}
        </p>
        
        {showTimestamp && (
          <span className="text-xs text-gray-500 mt-1 block">
            {formatRelativeTime(event.timestamp)}
          </span>
        )}
      </div>
    </div>
  );
}

export default TimelineEvent;
