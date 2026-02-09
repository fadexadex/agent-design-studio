/**
 * TrendIndicator Component
 * 
 * Visual trend direction indicator (improving/plateau/regressing).
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { TrendDirection } from '../../../types/orchestration';
import { cn } from '../../../lib/utils';

interface TrendIndicatorProps {
  trend: TrendDirection;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const trendConfig: Record<TrendDirection, {
  icon: typeof TrendingUp;
  color: string;
  bgColor: string;
  label: string;
}> = {
  improving: {
    icon: TrendingUp,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    label: 'Improving',
  },
  plateau: {
    icon: Minus,
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/20',
    label: 'Stable',
  },
  regressing: {
    icon: TrendingDown,
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    label: 'Regressing',
  },
};

const sizeConfig = {
  sm: {
    icon: 'h-3 w-3',
    text: 'text-xs',
    padding: 'px-1.5 py-0.5',
  },
  md: {
    icon: 'h-4 w-4',
    text: 'text-sm',
    padding: 'px-2 py-1',
  },
  lg: {
    icon: 'h-5 w-5',
    text: 'text-base',
    padding: 'px-3 py-1.5',
  },
};

export function TrendIndicator({
  trend,
  showLabel = false,
  size = 'md',
  className,
}: TrendIndicatorProps) {
  const config = trendConfig[trend];
  const sizes = sizeConfig[size];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full',
        config.bgColor,
        sizes.padding,
        className
      )}
    >
      <Icon className={cn(sizes.icon, config.color)} />
      {showLabel && (
        <span className={cn(sizes.text, config.color, 'font-medium')}>
          {config.label}
        </span>
      )}
    </div>
  );
}

export default TrendIndicator;
