/**
 * SceneGeneratorPanel Component
 * 
 * Displays active scene generation using ai-elements Tool component.
 */

import React from 'react';
import { Film, Loader2 } from 'lucide-react';
import { SceneUIState } from '../../../types/orchestration';
import { PanelWrapper } from './PanelWrapper';
import {
  Tool,
  ToolHeader,
  ToolContent,
} from '@/components/ai-elements/tool';
import { cn } from '@/lib/utils';

interface SceneGeneratorPanelProps {
  activeScenes: SceneUIState[];
  className?: string;
}

// Map scene status to tool state
function getToolState(status: SceneUIState['status']): 'input-available' | 'output-available' | 'output-error' {
  switch (status) {
    case 'generating':
    case 'rendering':
    case 'evaluating':
      return 'input-available';
    case 'passed':
      return 'output-available';
    case 'failed':
      return 'output-error';
    default:
      return 'input-available';
  }
}

function getToolTitle(scene: SceneUIState): string {
  switch (scene.status) {
    case 'generating':
      return `Generating Scene ${scene.sceneNumber}`;
    case 'rendering':
      return `Rendering Scene ${scene.sceneNumber}`;
    case 'evaluating':
      return `Evaluating Scene ${scene.sceneNumber}`;
    default:
      return `Scene ${scene.sceneNumber}`;
  }
}

export function SceneGeneratorPanel({ activeScenes, className }: SceneGeneratorPanelProps) {
  const hasActiveScenes = activeScenes.length > 0;
  
  // Generate subtitle based on active scenes
  const getSubtitle = () => {
    if (!hasActiveScenes) return undefined;
    
    const generating = activeScenes.filter(s => s.status === 'generating').length;
    const rendering = activeScenes.filter(s => s.status === 'rendering').length;
    const evaluating = activeScenes.filter(s => s.status === 'evaluating').length;
    
    const parts: string[] = [];
    if (generating > 0) parts.push(`${generating} generating`);
    if (rendering > 0) parts.push(`${rendering} rendering`);
    if (evaluating > 0) parts.push(`${evaluating} evaluating`);
    
    return parts.join(', ');
  };

  return (
    <PanelWrapper
      title="Active Generators"
      subtitle={getSubtitle()}
      icon={<Film className="h-4 w-4" />}
      status={hasActiveScenes ? 'active' : 'idle'}
      className={className}
    >
      {hasActiveScenes ? (
        <div className="space-y-3">
          {activeScenes.map((scene) => (
            <Tool key={scene.sceneId} defaultOpen={true}>
              <ToolHeader
                type="dynamic-tool"
                toolName={`scene-${scene.status}`}
                state={getToolState(scene.status)}
                title={getToolTitle(scene)}
              />
              <ToolContent>
                <div className="space-y-3">
                  {/* Progress */}
                  {scene.status === 'rendering' && scene.renderProgress !== undefined && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Rendering</span>
                        <span>{scene.renderProgress}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-orange-500 transition-all duration-300"
                          style={{ width: `${scene.renderProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {scene.status === 'evaluating' && scene.evaluationProgress !== undefined && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Evaluating</span>
                        <span>{scene.evaluationProgress}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-500 transition-all duration-300"
                          style={{ width: `${scene.evaluationProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Version:</span>{' '}
                      <span className="text-foreground">v{scene.version}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Attempt:</span>{' '}
                      <span className="text-foreground">{scene.attempts}</span>
                    </div>
                  </div>

                  {/* Feedback */}
                  {scene.feedback && (
                    <div className="p-2 rounded bg-muted/50 text-xs text-muted-foreground">
                      {scene.feedback}
                    </div>
                  )}
                </div>
              </ToolContent>
            </Tool>
          ))}
        </div>
      ) : (
        <div className="text-center py-4">
          <Film className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No active generators</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Scenes being generated, rendered, or evaluated appear here
          </p>
        </div>
      )}
    </PanelWrapper>
  );
}

export default SceneGeneratorPanel;
