import React, { useState, useMemo } from 'react';
import {
  StoryScript,
  StoryScene,
  StoryPhase,
  groupScenesByPhase,
  getTotalStoryMoments,
  StoryPhaseInfo,
} from '../types';

interface ScriptPreviewProps {
  script: StoryScript | null;
  isLoading: boolean;
  onRegenerate: () => void;
  error?: string;
}

const PHASE_COLORS: Record<StoryPhase, string> = {
  'problem': '#f59e0b', // amber
  'solution': '#10b981', // emerald
  'magic': '#8b5cf6', // violet
  'result': '#3b82f6', // blue
  'brand-reveal': '#ec4899', // pink
};

const PHASE_ICONS: Record<StoryPhase, string> = {
  'problem': '?',
  'solution': '!',
  'magic': '*',
  'result': '~',
  'brand-reveal': 'logo',
};

export const ScriptPreview: React.FC<ScriptPreviewProps> = ({
  script,
  isLoading,
  onRegenerate,
  error,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const phaseGroups = useMemo(() => {
    if (!script?.scenes) return [];
    return groupScenesByPhase(script.scenes);
  }, [script?.scenes]);

  const totalMoments = useMemo(() => {
    if (!script) return 0;
    return getTotalStoryMoments(script);
  }, [script]);

  if (isLoading) {
    return (
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
          <span className="text-zinc-300">Generating story script...</span>
        </div>
        <p className="text-zinc-500 text-sm mt-2">
          Creating a 30-second story-driven narrative with text choreography...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-zinc-900 border border-red-800 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-red-400 font-medium">Generation Failed</h3>
            <p className="text-zinc-400 text-sm mt-1">{error}</p>
          </div>
          <button
            onClick={onRegenerate}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!script) {
    return (
      <div className="bg-zinc-900 border border-zinc-700 border-dashed rounded-lg p-6 text-center">
        <p className="text-zinc-400">
          No script generated yet. Click "Generate with AI" to create a story-driven script.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-medium flex items-center gap-2">
            <span className="text-lg">📖</span> Story Preview
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
              {script.totalDuration}s
            </span>
            <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
              {script.scenes.length} scenes
            </span>
            <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
              {totalMoments} moments
            </span>
          </div>
        </div>
      </div>

      {/* Collapsed View - Narrative Summary */}
      <div className="p-4 space-y-3">
        <div className="space-y-2">
          <div className="flex gap-2">
            <span className="text-zinc-500 text-sm font-medium w-20 flex-shrink-0">Hook:</span>
            <p className="text-zinc-300 text-sm">{script.narrative.hook}</p>
          </div>
          <div className="flex gap-2">
            <span className="text-zinc-500 text-sm font-medium w-20 flex-shrink-0">Journey:</span>
            <p className="text-zinc-300 text-sm">{script.narrative.journey}</p>
          </div>
          <div className="flex gap-2">
            <span className="text-zinc-500 text-sm font-medium w-20 flex-shrink-0">Resolution:</span>
            <p className="text-zinc-300 text-sm">{script.narrative.resolution}</p>
          </div>
        </div>

        {/* Core Text Narrative */}
        {script.textNarrative && (
          <div className="mt-3 pt-3 border-t border-zinc-800">
            <div className="flex flex-wrap gap-2">
              <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded">
                "{script.textNarrative.openingMessage}"
              </span>
              <span className="text-zinc-600">→</span>
              {script.textNarrative.coreFeatures.map((feature, idx) => (
                <React.Fragment key={idx}>
                  <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded">
                    {feature}
                  </span>
                  {idx < script.textNarrative.coreFeatures.length - 1 && (
                    <span className="text-zinc-600">·</span>
                  )}
                </React.Fragment>
              ))}
              <span className="text-zinc-600">→</span>
              <span className="text-xs bg-pink-900/50 text-pink-300 px-2 py-1 rounded">
                "{script.textNarrative.closingMessage}"
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Expand/Collapse Button */}
      <div className="px-4 pb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-center gap-2 py-2 text-sm text-zinc-400 hover:text-zinc-200 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <span>{isExpanded ? '▲ Collapse' : '▼ View Story Arc'}</span>
        </button>
      </div>

      {/* Expanded View - Full Story Arc */}
      {isExpanded && (
        <div className="border-t border-zinc-800 p-4 space-y-4">
          {phaseGroups.map((phase) => (
            <PhaseSection key={phase.id} phase={phase} />
          ))}
        </div>
      )}

      {/* Footer Actions */}
      <div className="px-4 pb-4 flex justify-end">
        <button
          onClick={onRegenerate}
          className="px-4 py-2 text-sm text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors flex items-center gap-2"
        >
          <span>🔄</span> Regenerate
        </button>
      </div>
    </div>
  );
};

// Phase Section Component
const PhaseSection: React.FC<{ phase: StoryPhaseInfo }> = ({ phase }) => {
  if (phase.scenes.length === 0) return null;

  const color = PHASE_COLORS[phase.id];

  return (
    <div className="space-y-2">
      {/* Phase Header */}
      <div className="flex items-center gap-2">
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="text-zinc-300 font-medium text-sm">
          {phase.name}
        </span>
        <span className="text-zinc-600 text-xs">
          ({phase.timing.start}-{phase.timing.end}s)
        </span>
        {phase.id !== 'brand-reveal' && (
          <span className="text-zinc-600 text-xs italic">No brand</span>
        )}
        {phase.id === 'brand-reveal' && (
          <span className="text-pink-400 text-xs font-medium">Brand appears here!</span>
        )}
      </div>

      {/* Scenes in this phase */}
      <div className="ml-4 space-y-2">
        {phase.scenes.map((scene) => (
          <SceneCard key={scene.id} scene={scene} phaseColor={color} />
        ))}
      </div>
    </div>
  );
};

// Scene Card Component
const SceneCard: React.FC<{ scene: StoryScene; phaseColor: string }> = ({
  scene,
  phaseColor,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  // Get primary text from first moment
  const primaryText = scene.moments[0]?.textElements[0]?.content || '';
  const emotionalTone = scene.moments[0]?.emotionalTone || 'calm';

  return (
    <div
      className="bg-zinc-800/50 rounded-lg p-3 border-l-2"
      style={{ borderLeftColor: phaseColor }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 text-xs">Scene {scene.sceneNumber}</span>
            <span className="text-zinc-600">·</span>
            <span className="text-zinc-300 text-sm font-medium">{scene.title}</span>
          </div>
          
          {/* Primary Text */}
          {primaryText && (
            <div className="mt-1">
              <span className="text-blue-400 text-sm">"{primaryText}"</span>
            </div>
          )}

          {/* Scene info */}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-zinc-500">
              {scene.moments.length} moment{scene.moments.length !== 1 ? 's' : ''}
            </span>
            <span className="text-zinc-600">·</span>
            <span className="text-zinc-500 capitalize">{emotionalTone} tone</span>
            {scene.visualTheme && (
              <>
                <span className="text-zinc-600">·</span>
                <span className="text-zinc-500">{scene.visualTheme}</span>
              </>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-zinc-500 hover:text-zinc-300 text-xs"
        >
          {showDetails ? '−' : '+'}
        </button>
      </div>

      {/* Expanded Scene Details */}
      {showDetails && (
        <div className="mt-3 pt-3 border-t border-zinc-700 space-y-2">
          {scene.moments.map((moment) => (
            <div key={moment.id} className="text-xs space-y-1">
              <div className="text-zinc-400">
                <span className="text-zinc-500">Moment {moment.sequence}:</span>{' '}
                {moment.narrative}
              </div>
              <div className="text-zinc-500 italic ml-4">
                {moment.visualAction}
              </div>
              {/* Text Elements */}
              <div className="ml-4 flex flex-wrap gap-1">
                {moment.textElements.map((text) => (
                  <span
                    key={text.id}
                    className="bg-zinc-700 text-zinc-300 px-1.5 py-0.5 rounded text-xs"
                    title={`${text.choreography.entrance.type} | ${text.personality}`}
                  >
                    "{text.content}"
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ScriptPreview;
