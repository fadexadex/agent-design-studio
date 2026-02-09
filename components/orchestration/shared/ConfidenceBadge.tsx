/**
 * ConfidenceBadge Component
 * 
 * Shows agent confidence level with visual indicator.
 */

import React from 'react';
import { Shield, ShieldAlert, ShieldCheck, ShieldQuestion } from 'lucide-react';
import { cn } from '../../../lib/utils';

type ConfidenceLevel = 'high' | 'medium' | 'low' | 'unknown';

interface ConfidenceBadgeProps {
  confidence: number | ConfidenceLevel;
  showLabel?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

function getConfidenceLevel(value: number | ConfidenceLevel): ConfidenceLevel {
  if (typeof value === 'string') return value;
  if (value >= 80) return 'high';
  if (value >= 50) return 'medium';
  if (value > 0) return 'low';
  return 'unknown';
}

const levelConfig: Record<ConfidenceLevel, {
  icon: typeof Shield;
  color: string;
  bgColor: string;
  label: string;
}> = {
  high: {
    icon: ShieldCheck,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    label: 'High Confidence',
  },
  medium: {
    icon: Shield,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    label: 'Medium Confidence',
  },
  low: {
    icon: ShieldAlert,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    label: 'Low Confidence',
  },
  unknown: {
    icon: ShieldQuestion,
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/20',
    label: 'Unknown',
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
};

export function ConfidenceBadge({
  confidence,
  showLabel = false,
  size = 'sm',
  className,
}: ConfidenceBadgeProps) {
  const level = getConfidenceLevel(confidence);
  const config = levelConfig[level];
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
      title={config.label}
    >
      <Icon className={cn(sizes.icon, config.color)} />
      {showLabel && (
        <span className={cn(sizes.text, config.color, 'font-medium')}>
          {typeof confidence === 'number' ? `${Math.round(confidence)}%` : config.label}
        </span>
      )}
    </div>
  );
}

export default ConfidenceBadge;
