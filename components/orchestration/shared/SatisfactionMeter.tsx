/**
 * SatisfactionMeter Component
 * 
 * Circular gauge showing satisfaction/quality score with trend indicator.
 */

import React from 'react';
import { TrendDirection } from '../../../types/orchestration';
import { TrendIndicator } from './TrendIndicator';
import { cn } from '../../../lib/utils';

interface SatisfactionMeterProps {
  score: number;
  trend?: TrendDirection;
  showTrend?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: {
    diameter: 40,
    strokeWidth: 4,
    fontSize: 'text-xs',
    labelSize: 'text-[10px]',
  },
  md: {
    diameter: 56,
    strokeWidth: 5,
    fontSize: 'text-sm',
    labelSize: 'text-xs',
  },
  lg: {
    diameter: 80,
    strokeWidth: 6,
    fontSize: 'text-lg',
    labelSize: 'text-sm',
  },
};

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-yellow-400';
  if (score >= 40) return 'text-orange-400';
  return 'text-red-400';
}

function getStrokeColor(score: number): string {
  if (score >= 80) return 'stroke-green-400';
  if (score >= 60) return 'stroke-yellow-400';
  if (score >= 40) return 'stroke-orange-400';
  return 'stroke-red-400';
}

export function SatisfactionMeter({
  score,
  trend = 'plateau',
  showTrend = true,
  size = 'md',
  showLabel = false,
  className,
}: SatisfactionMeterProps) {
  const config = sizeConfig[size];
  const radius = (config.diameter - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(100, Math.max(0, score));
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative" style={{ width: config.diameter, height: config.diameter }}>
        {/* Background circle */}
        <svg
          className="absolute inset-0 -rotate-90"
          width={config.diameter}
          height={config.diameter}
        >
          <circle
            cx={config.diameter / 2}
            cy={config.diameter / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={config.strokeWidth}
            className="text-white/10"
          />
          <circle
            cx={config.diameter / 2}
            cy={config.diameter / 2}
            r={radius}
            fill="none"
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={cn('transition-all duration-500', getStrokeColor(score))}
          />
        </svg>
        
        {/* Score text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('font-bold', config.fontSize, getScoreColor(score))}>
            {Math.round(score)}
          </span>
        </div>
      </div>

      {/* Label and Trend */}
      <div className="flex flex-col">
        {showLabel && (
          <span className={cn('text-gray-400', config.labelSize)}>Score</span>
        )}
        {showTrend && <TrendIndicator trend={trend} size="sm" />}
      </div>
    </div>
  );
}

export default SatisfactionMeter;
