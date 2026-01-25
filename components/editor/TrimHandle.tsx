/**
 * TrimHandle
 * 
 * Draggable handles for trimming scene duration.
 */

import React, { useState, useCallback, useRef } from 'react';

interface TrimHandleProps {
  /** Current start frame (relative to scene start) */
  trimStart: number;
  /** Current end frame (relative to scene start) */
  trimEnd: number;
  /** Total scene duration in frames */
  totalFrames: number;
  /** Minimum trim duration in frames */
  minFrames?: number;
  /** Callback when trim changes */
  onTrimChange: (start: number, end: number) => void;
  /** Callback when trim is committed */
  onTrimCommit?: (start: number, end: number) => void;
  /** Whether the handle is disabled */
  disabled?: boolean;
}

export const TrimHandle: React.FC<TrimHandleProps> = ({
  trimStart,
  trimEnd,
  totalFrames,
  minFrames = 30, // 1 second minimum
  onTrimChange,
  onTrimCommit,
  disabled = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<'start' | 'end' | null>(null);
  const [localStart, setLocalStart] = useState(trimStart);
  const [localEnd, setLocalEnd] = useState(trimEnd);

  // Calculate percentages
  const startPercent = (localStart / totalFrames) * 100;
  const endPercent = (localEnd / totalFrames) * 100;
  const widthPercent = endPercent - startPercent;

  // Convert mouse position to frame
  const positionToFrame = useCallback(
    (clientX: number): number => {
      if (!containerRef.current) return 0;
      const rect = containerRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return Math.round(percent * totalFrames);
    },
    [totalFrames]
  );

  // Handle mouse down on start handle
  const handleStartMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging('start');
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Handle mouse down on end handle
  const handleEndMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging('end');
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Handle mouse move
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const frame = positionToFrame(e.clientX);

      if (isDragging === 'start') {
        const newStart = Math.max(0, Math.min(frame, localEnd - minFrames));
        setLocalStart(newStart);
        onTrimChange(newStart, localEnd);
      } else if (isDragging === 'end') {
        const newEnd = Math.min(totalFrames, Math.max(frame, localStart + minFrames));
        setLocalEnd(newEnd);
        onTrimChange(localStart, newEnd);
      }
    },
    [isDragging, localStart, localEnd, minFrames, totalFrames, positionToFrame, onTrimChange]
  );

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);

    if (isDragging) {
      onTrimCommit?.(localStart, localEnd);
    }
    setIsDragging(null);
  }, [isDragging, localStart, localEnd, onTrimCommit, handleMouseMove]);

  // Sync props to local state when not dragging
  React.useEffect(() => {
    if (!isDragging) {
      setLocalStart(trimStart);
      setLocalEnd(trimEnd);
    }
  }, [trimStart, trimEnd, isDragging]);

  return (
    <div
      ref={containerRef}
      className={`relative h-8 bg-zinc-800 rounded-lg overflow-hidden ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {/* Background track */}
      <div className="absolute inset-0 bg-zinc-700/50" />

      {/* Trimmed region */}
      <div
        className="absolute top-0 bottom-0 bg-purple-500/30 border-y border-purple-500"
        style={{
          left: `${startPercent}%`,
          width: `${widthPercent}%`,
        }}
      />

      {/* Start handle */}
      <div
        onMouseDown={handleStartMouseDown}
        className={`absolute top-0 bottom-0 w-3 cursor-ew-resize group ${
          disabled ? 'pointer-events-none' : ''
        }`}
        style={{ left: `${startPercent}%`, transform: 'translateX(-50%)' }}
      >
        <div className="absolute inset-y-1 left-1/2 -translate-x-1/2 w-1 bg-purple-500 rounded-full group-hover:bg-purple-400 transition-colors" />
      </div>

      {/* End handle */}
      <div
        onMouseDown={handleEndMouseDown}
        className={`absolute top-0 bottom-0 w-3 cursor-ew-resize group ${
          disabled ? 'pointer-events-none' : ''
        }`}
        style={{ left: `${endPercent}%`, transform: 'translateX(-50%)' }}
      >
        <div className="absolute inset-y-1 left-1/2 -translate-x-1/2 w-1 bg-purple-500 rounded-full group-hover:bg-purple-400 transition-colors" />
      </div>

      {/* Frame markers */}
      <div className="absolute bottom-0 left-0 right-0 h-2 flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 border-l border-zinc-600 first:border-l-0"
          />
        ))}
      </div>

      {/* Duration label */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] text-zinc-300 font-mono pointer-events-none">
        {((localEnd - localStart) / 30).toFixed(1)}s
      </div>
    </div>
  );
};

/**
 * Compact trim slider for use in timeline cards
 */
interface TrimSliderProps {
  trimStart: number;
  trimEnd: number;
  totalFrames: number;
  onChange: (start: number, end: number) => void;
  onCommit: (start: number, end: number) => void;
  disabled?: boolean;
}

export const TrimSlider: React.FC<TrimSliderProps> = ({
  trimStart,
  trimEnd,
  totalFrames,
  onChange,
  onCommit,
  disabled = false,
}) => {
  const startPercent = (trimStart / totalFrames) * 100;
  const endPercent = (trimEnd / totalFrames) * 100;

  return (
    <div className="w-full h-2 bg-zinc-700 rounded-full overflow-hidden relative">
      {/* Active region */}
      <div
        className="absolute top-0 bottom-0 bg-purple-500/60"
        style={{
          left: `${startPercent}%`,
          width: `${endPercent - startPercent}%`,
        }}
      />
    </div>
  );
};
