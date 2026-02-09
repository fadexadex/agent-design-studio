/**
 * CollapsedEventGroup Component
 * 
 * Quiet Mode: Collapsed group of repeated events.
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Repeat } from 'lucide-react';
import { 
  CollapsedEventGroup as CollapsedEventGroupType, 
  formatRelativeTime,
  UIEvent
} from '../../../types/orchestration';
import { TimelineEvent } from './TimelineEvent';
import { cn } from '@/lib/utils';

interface CollapsedEventGroupProps {
  group: CollapsedEventGroupType;
  className?: string;
}

export function CollapsedEventGroup({
  group,
  className,
}: CollapsedEventGroupProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Parse the event type for display
  const typeLabel = group.type.replace(':', ' ').replace(/_/g, ' ');

  if (isExpanded) {
    return (
      <div className={cn('space-y-2', className)}>
        <button
          onClick={() => setIsExpanded(false)}
          className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-300 transition-colors"
        >
          <ChevronDown className="h-3 w-3" />
          <span>Collapse {group.count} events</span>
        </button>
        
        {/* Show first and last events */}
        <TimelineEvent event={group.firstEvent} />
        
        {group.count > 2 && (
          <div className="text-center text-xs text-gray-500 py-1">
            ... {group.count - 2} more events ...
          </div>
        )}
        
        {group.count > 1 && (
          <TimelineEvent event={group.lastEvent} />
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsExpanded(true)}
      className={cn(
        'flex items-center gap-3 w-full p-3 rounded-lg border border-white/10 bg-white/5',
        'hover:bg-white/10 transition-colors text-left',
        className
      )}
    >
      <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
      <Repeat className="h-4 w-4 text-blue-400 flex-shrink-0" />
      
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-300">
          <span className="font-medium capitalize">{typeLabel}</span>
          <span className="text-gray-500"> × {group.count}</span>
        </p>
        <span className="text-xs text-gray-500">
          {formatRelativeTime(group.firstEvent.timestamp)} - {formatRelativeTime(group.lastEvent.timestamp)}
        </span>
      </div>
    </button>
  );
}

export default CollapsedEventGroup;
