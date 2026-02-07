/**
 * Overview Tab
 * 
 * Shows brand context, video config, and workflow progress summary.
 */

import React from 'react';
import {
  Palette,
  Type,
  Building2,
  Monitor,
  CheckCircle,
  Circle,
  AlertCircle,
} from 'lucide-react';
import type { HistorySession } from '../../types/history';
import { WorkflowPhase } from '../../types';

interface OverviewTabProps {
  session: HistorySession;
}

// Workflow phases in order
const workflowPhases = [
  { phase: WorkflowPhase.INITIALIZATION, label: 'Initialization' },
  { phase: WorkflowPhase.QUERY_ENHANCEMENT, label: 'Query Enhancement' },
  { phase: WorkflowPhase.PLANNING, label: 'Planning' },
  { phase: WorkflowPhase.IMPLEMENTATION, label: 'Implementation' },
  { phase: WorkflowPhase.EVALUATION, label: 'Evaluation' },
  { phase: WorkflowPhase.RENDERING, label: 'Rendering' },
  { phase: WorkflowPhase.COMPLETE, label: 'Complete' },
];

function getPhaseStatus(
  currentPhase: WorkflowPhase,
  targetPhase: WorkflowPhase,
  hasError: boolean
): 'complete' | 'current' | 'pending' | 'error' {
  const currentIndex = workflowPhases.findIndex((p) => p.phase === currentPhase);
  const targetIndex = workflowPhases.findIndex((p) => p.phase === targetPhase);

  if (currentPhase === WorkflowPhase.ERROR && targetIndex <= currentIndex) {
    return 'error';
  }
  if (targetIndex < currentIndex) return 'complete';
  if (targetIndex === currentIndex) return hasError ? 'error' : 'current';
  return 'pending';
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ session }) => {
  const { brand, config, workflow } = session;
  const currentPhase = workflow?.currentPhase || WorkflowPhase.INITIALIZATION;
  const hasError = session.status === 'error';

  return (
    <div className="p-4 space-y-6">
      {/* Brand Section */}
      <section>
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
          Brand
        </h3>
        <div className="space-y-3">
          {/* Brand Name */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center">
              <Building2 size={14} className="text-zinc-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-500">Name</p>
              <p className="text-sm text-white font-medium">{brand.name}</p>
            </div>
          </div>

          {/* Industry */}
          {brand.industry && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center">
                <Type size={14} className="text-zinc-400" />
              </div>
              <div>
                <p className="text-xs text-zinc-500">Industry</p>
                <p className="text-sm text-white">{brand.industry}</p>
              </div>
            </div>
          )}

          {/* Tagline */}
          {brand.tagline && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center flex-shrink-0">
                <Type size={14} className="text-zinc-400" />
              </div>
              <div>
                <p className="text-xs text-zinc-500">Tagline</p>
                <p className="text-sm text-white italic">"{brand.tagline}"</p>
              </div>
            </div>
          )}

          {/* Colors */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center">
              <Palette size={14} className="text-zinc-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-1.5">Colors</p>
              <div className="flex gap-1.5">
                {brand.colors.map((color, i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded border border-zinc-700"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Config Section */}
      <section>
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
          Video Config
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-zinc-800/50 rounded-lg">
            <p className="text-xs text-zinc-500 mb-1">Style</p>
            <p className="text-sm text-white capitalize">{config.style}</p>
          </div>
          <div className="p-3 bg-zinc-800/50 rounded-lg">
            <p className="text-xs text-zinc-500 mb-1">Aspect Ratio</p>
            <p className="text-sm text-white">{config.aspectRatio}</p>
          </div>
          <div className="p-3 bg-zinc-800/50 rounded-lg">
            <p className="text-xs text-zinc-500 mb-1">Resolution</p>
            <p className="text-sm text-white">{config.resolution}</p>
          </div>
          <div className="p-3 bg-zinc-800/50 rounded-lg">
            <p className="text-xs text-zinc-500 mb-1">Duration</p>
            <p className="text-sm text-white">{session.summary.duration}</p>
          </div>
        </div>
        {config.prompt && (
          <div className="mt-3 p-3 bg-zinc-800/50 rounded-lg">
            <p className="text-xs text-zinc-500 mb-1">Creative Prompt</p>
            <p className="text-sm text-zinc-300">{config.prompt}</p>
          </div>
        )}
      </section>

      {/* Workflow Progress Section */}
      <section>
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
          Workflow Progress
        </h3>
        <div className="space-y-2">
          {workflowPhases.map(({ phase, label }) => {
            const status = getPhaseStatus(currentPhase, phase, hasError);
            return (
              <div
                key={phase}
                className={`flex items-center gap-3 p-2 rounded-lg ${
                  status === 'current'
                    ? 'bg-purple-500/10 border border-purple-500/30'
                    : ''
                }`}
              >
                {status === 'complete' ? (
                  <CheckCircle size={16} className="text-green-400" />
                ) : status === 'current' ? (
                  <div className="w-4 h-4 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" />
                ) : status === 'error' ? (
                  <AlertCircle size={16} className="text-red-400" />
                ) : (
                  <Circle size={16} className="text-zinc-600" />
                )}
                <span
                  className={`text-sm ${
                    status === 'complete'
                      ? 'text-zinc-400'
                      : status === 'current'
                      ? 'text-white font-medium'
                      : status === 'error'
                      ? 'text-red-400'
                      : 'text-zinc-600'
                  }`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Timestamps */}
      <section className="pt-4 border-t border-zinc-800">
        <div className="flex justify-between text-xs text-zinc-500">
          <span>
            Created:{' '}
            {new Date(session.createdAt).toLocaleString('en-US', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </span>
          <span>
            Updated:{' '}
            {new Date(session.updatedAt).toLocaleString('en-US', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </span>
        </div>
      </section>
    </div>
  );
};
