/**
 * AgentTimeline Component
 * 
 * Chronological event stream with filtering and quiet mode.
 */

import React, { useState, useRef, useEffect } from 'react';
import { ArrowDown, Filter, Volume2, VolumeX } from 'lucide-react';
import { 
  UIEvent, 
  EventCategory, 
  groupConsecutiveEvents,
  isCollapsedGroup,
  CollapsedEventGroup as CollapsedEventGroupType
} from '../../../types/orchestration';
import { TimelineEvent } from './TimelineEvent';
import { CollapsedEventGroup } from './CollapsedEventGroup';
import { cn } from '@/lib/utils';

interface AgentTimelineProps {
  events: UIEvent[];
  categoryFilter?: EventCategory[];
  className?: string;
}

const categories: { value: EventCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'director', label: 'Director' },
  { value: 'scene', label: 'Scenes' },
  { value: 'evaluation', label: 'Evaluation' },
  { value: 'render', label: 'Render' },
  { value: 'system', label: 'System' },
];

export function AgentTimeline({
  events,
  categoryFilter,
  className,
}: AgentTimelineProps) {
  const [activeCategory, setActiveCategory] = useState<EventCategory | 'all'>('all');
  const [quietMode, setQuietMode] = useState(true);
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Filter events by category
  const filteredEvents = events.filter(event => {
    if (categoryFilter && !categoryFilter.includes(event.category)) {
      return false;
    }
    if (activeCategory !== 'all' && event.category !== activeCategory) {
      return false;
    }
    return true;
  });

  // Apply quiet mode grouping
  const displayItems = quietMode 
    ? groupConsecutiveEvents(filteredEvents)
    : filteredEvents;

  // Auto-scroll to bottom
  useEffect(() => {
    if (isAutoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [displayItems.length, isAutoScroll]);

  // Detect manual scroll
  const handleScroll = () => {
    if (!scrollRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setIsAutoScroll(isAtBottom);
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    setIsAutoScroll(true);
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h3 className="text-sm font-medium text-gray-200">Event Timeline</h3>
        
        <div className="flex items-center gap-2">
          {/* Quiet Mode Toggle */}
          <button
            onClick={() => setQuietMode(!quietMode)}
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded text-xs',
              quietMode 
                ? 'bg-blue-500/20 text-blue-400' 
                : 'bg-white/10 text-gray-400 hover:text-gray-300'
            )}
            title={quietMode ? 'Quiet mode on' : 'Quiet mode off'}
          >
            {quietMode ? (
              <VolumeX className="h-3 w-3" />
            ) : (
              <Volume2 className="h-3 w-3" />
            )}
            <span>Quiet</span>
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1 px-4 py-2 overflow-x-auto border-b border-white/5">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
              activeCategory === cat.value
                ? 'bg-white/10 text-white'
                : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Event List */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-2"
      >
        {displayItems.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">No events yet</p>
          </div>
        ) : (
          displayItems.map((item, index) => (
            isCollapsedGroup(item) ? (
              <CollapsedEventGroup 
                key={`group-${item.firstEvent.id}`} 
                group={item} 
              />
            ) : (
              <TimelineEvent 
                key={item.id} 
                event={item} 
              />
            )
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Jump to Now Button */}
      {!isAutoScroll && (
        <button
          onClick={scrollToBottom}
          className={cn(
            'absolute bottom-4 left-1/2 -translate-x-1/2',
            'flex items-center gap-2 px-3 py-2 rounded-full',
            'bg-blue-500 text-white text-sm font-medium',
            'shadow-lg hover:bg-blue-600 transition-colors'
          )}
        >
          <ArrowDown className="h-4 w-4" />
          Jump to now
        </button>
      )}
    </div>
  );
}

export default AgentTimeline;
