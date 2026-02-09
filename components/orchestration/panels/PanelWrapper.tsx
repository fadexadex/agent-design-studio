/**
 * PanelWrapper Component
 * 
 * Shared panel chrome with title, status indicator, and collapse functionality.
 */

import React, { useState, ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface PanelWrapperProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  status?: 'idle' | 'active' | 'success' | 'error';
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  children: ReactNode;
  headerAction?: ReactNode;
  className?: string;
}

const statusColors = {
  idle: 'bg-gray-500',
  active: 'bg-blue-500 animate-pulse',
  success: 'bg-green-500',
  error: 'bg-red-500',
};

export function PanelWrapper({
  title,
  subtitle,
  icon,
  status = 'idle',
  collapsible = false,
  defaultCollapsed = false,
  children,
  headerAction,
  className,
}: PanelWrapperProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const handleToggle = () => {
    if (collapsible) {
      setIsCollapsed(!isCollapsed);
    }
  };

  return (
    <div className={cn(
      'rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm overflow-hidden',
      className
    )}>
      {/* Header */}
      <div
        className={cn(
          'flex items-center justify-between px-4 py-3 border-b border-white/5',
          collapsible && 'cursor-pointer hover:bg-white/5 transition-colors'
        )}
        onClick={handleToggle}
      >
        <div className="flex items-center gap-3">
          {collapsible && (
            isCollapsed ? (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )
          )}
          
          {/* Status indicator */}
          <div className={cn('h-2 w-2 rounded-full', statusColors[status])} />
          
          {/* Icon */}
          {icon && (
            <span className="text-gray-400">{icon}</span>
          )}
          
          {/* Title and subtitle */}
          <div className="flex flex-col">
            <h3 className="text-sm font-medium text-gray-200">{title}</h3>
            {subtitle && (
              <span className="text-xs text-gray-400">{subtitle}</span>
            )}
          </div>
        </div>

        {/* Header action */}
        {headerAction && !isCollapsed && (
          <div onClick={(e) => e.stopPropagation()}>
            {headerAction}
          </div>
        )}
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="p-4">
          {children}
        </div>
      )}
    </div>
  );
}

export default PanelWrapper;
