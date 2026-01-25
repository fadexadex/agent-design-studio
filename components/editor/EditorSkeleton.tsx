/**
 * EditorSkeleton
 * 
 * Loading skeleton state for the scene editor.
 */

import React from 'react';

/**
 * Animated skeleton pulse component
 */
const Pulse: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-zinc-800 rounded ${className}`} />
);

/**
 * Scene card skeleton for the timeline
 */
export const SceneCardSkeleton: React.FC = () => (
  <div className="w-32 h-24 rounded-lg overflow-hidden border-2 border-zinc-700 shrink-0">
    <Pulse className="w-full h-full" />
  </div>
);

/**
 * Timeline skeleton
 */
export const TimelineSkeleton: React.FC = () => (
  <div className="h-full flex flex-col">
    {/* Header */}
    <div className="p-4 border-b border-zinc-800">
      <div className="flex items-center justify-between">
        <Pulse className="h-5 w-24" />
        <Pulse className="h-8 w-24 rounded-lg" />
      </div>
    </div>

    {/* Timeline track */}
    <div className="flex-1 flex items-center gap-4 px-4 overflow-x-auto">
      <SceneCardSkeleton />
      <SceneCardSkeleton />
      <SceneCardSkeleton />
      <SceneCardSkeleton />
    </div>
  </div>
);

/**
 * Preview panel skeleton
 */
export const PreviewPanelSkeleton: React.FC = () => (
  <div className="h-full flex flex-col">
    {/* Video player area */}
    <div className="flex-1">
      <Pulse className="w-full h-full rounded-lg" />
    </div>

    {/* Scene info */}
    <div className="mt-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Pulse className="h-6 w-24" />
          <Pulse className="h-4 w-48" />
        </div>
        <div className="space-y-1">
          <Pulse className="h-4 w-12 ml-auto" />
          <Pulse className="h-3 w-16 ml-auto" />
        </div>
      </div>

      {/* Version selector */}
      <Pulse className="h-10 w-full rounded-lg" />

      {/* Code toggle */}
      <Pulse className="h-4 w-20" />

      {/* Brand info */}
      <div className="flex items-center gap-4 pt-2 border-t border-zinc-800">
        <div className="flex items-center gap-1">
          <Pulse className="w-4 h-4 rounded" />
          <Pulse className="w-4 h-4 rounded" />
          <Pulse className="w-4 h-4 rounded" />
        </div>
        <Pulse className="h-3 w-16" />
      </div>
    </div>
  </div>
);

/**
 * Prompt panel skeleton
 */
export const PromptPanelSkeleton: React.FC = () => (
  <div className="h-full flex flex-col p-4">
    {/* Header */}
    <div className="mb-4">
      <Pulse className="h-6 w-32" />
      <Pulse className="h-4 w-48 mt-1" />
    </div>

    {/* Selected scenes */}
    <Pulse className="h-20 w-full rounded-lg mb-4" />

    {/* Prompt input */}
    <Pulse className="h-24 w-full rounded-lg mb-4" />

    {/* Suggestions */}
    <div className="space-y-2">
      <Pulse className="h-4 w-24" />
      <Pulse className="h-8 w-full rounded-lg" />
      <Pulse className="h-8 w-full rounded-lg" />
      <Pulse className="h-8 w-full rounded-lg" />
    </div>
  </div>
);

/**
 * Action bar skeleton
 */
export const ActionBarSkeleton: React.FC = () => (
  <div className="h-14 border-t border-zinc-800 bg-zinc-900/50 backdrop-blur-sm px-4 flex items-center justify-between">
    <div className="flex items-center gap-2">
      <Pulse className="w-10 h-10 rounded-lg" />
      <Pulse className="w-10 h-10 rounded-lg" />
    </div>
    <Pulse className="w-32 h-10 rounded-lg" />
  </div>
);

/**
 * Full editor skeleton layout
 */
export const EditorSkeleton: React.FC = () => (
  <div className="flex flex-col h-screen bg-black text-white overflow-hidden">
    {/* Header */}
    <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-900/50 backdrop-blur-sm shrink-0">
      <div className="flex items-center gap-4">
        <Pulse className="w-8 h-8 rounded-lg" />
        <div>
          <Pulse className="h-5 w-32" />
          <Pulse className="h-3 w-20 mt-1" />
        </div>
      </div>
    </header>

    {/* Main content */}
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Timeline */}
      <div className="h-40 border-b border-zinc-800 shrink-0">
        <TimelineSkeleton />
      </div>

      {/* Preview and Prompt panels */}
      <div className="flex-1 flex overflow-hidden">
        {/* Preview Panel */}
        <div className="flex-1 p-4 overflow-hidden">
          <PreviewPanelSkeleton />
        </div>

        {/* Prompt Panel */}
        <div className="w-96 border-l border-zinc-800 shrink-0">
          <PromptPanelSkeleton />
        </div>
      </div>
    </div>

    {/* Action Bar */}
    <ActionBarSkeleton />
  </div>
);
