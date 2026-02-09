/**
 * SceneQueuePanel Component
 * 
 * Displays scene queue using ai-elements Queue component.
 */

import React from 'react';
import { ListOrdered, Film, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { SceneUIState } from '../../../types/orchestration';
import { PanelWrapper } from './PanelWrapper';
import { formatErrorMessage } from '../shared/errorUtils';
import {
  Queue,
  QueueSection,
  QueueSectionTrigger,
  QueueSectionLabel,
  QueueSectionContent,
  QueueList,
  QueueItem,
  QueueItemIndicator,
  QueueItemContent,
  QueueItemDescription,
} from '@/components/ai-elements/queue';
import { cn } from '@/lib/utils';

interface SceneQueuePanelProps {
  scenes: Map<string, SceneUIState>;
  className?: string;
}

export function SceneQueuePanel({ scenes, className }: SceneQueuePanelProps) {
  const sceneArray = Array.from(scenes.values()).sort((a, b) => a.sceneIndex - b.sceneIndex);
  
  const pendingScenes = sceneArray.filter(s => s.status === 'pending');
  const activeScenes = sceneArray.filter(s => 
    ['generating', 'rendering', 'evaluating'].includes(s.status)
  );
  const completedScenes = sceneArray.filter(s => s.status === 'passed');
  const failedScenes = sceneArray.filter(s => s.status === 'failed');

  if (sceneArray.length === 0) {
    return (
      <PanelWrapper
        title="Scene Queue"
        icon={<ListOrdered className="h-4 w-4" />}
        status="idle"
        className={className}
      >
        <div className="text-center py-4">
          <ListOrdered className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No scenes in queue</p>
        </div>
      </PanelWrapper>
    );
  }

  return (
    <PanelWrapper
      title="Scene Queue"
      icon={<ListOrdered className="h-4 w-4" />}
      status={activeScenes.length > 0 ? 'active' : 'idle'}
      className={className}
    >
      <Queue>
        {/* Active Scenes */}
        {activeScenes.length > 0 && (
          <QueueSection defaultOpen={true}>
            <QueueSectionTrigger>
              <QueueSectionLabel
                label="In Progress"
                count={activeScenes.length}
                icon={<Loader2 className="h-4 w-4 animate-spin text-blue-400" />}
              />
            </QueueSectionTrigger>
            <QueueSectionContent>
              <QueueList>
                {activeScenes.map((scene) => (
                  <QueueItem key={scene.sceneId}>
                    <div className="flex items-center gap-2">
                      <Film className="h-3 w-3 text-blue-400" />
                      <QueueItemContent>
                        Scene {scene.sceneNumber} - {scene.status}
                      </QueueItemContent>
                    </div>
                    <QueueItemDescription>
                      v{scene.version} | Attempt {scene.attempts}
                    </QueueItemDescription>
                  </QueueItem>
                ))}
              </QueueList>
            </QueueSectionContent>
          </QueueSection>
        )}

        {/* Pending Scenes */}
        {pendingScenes.length > 0 && (
          <QueueSection defaultOpen={true}>
            <QueueSectionTrigger>
              <QueueSectionLabel
                label="Pending"
                count={pendingScenes.length}
                icon={<Film className="h-4 w-4 text-muted-foreground" />}
              />
            </QueueSectionTrigger>
            <QueueSectionContent>
              <QueueList>
                {pendingScenes.map((scene) => (
                  <QueueItem key={scene.sceneId}>
                    <div className="flex items-center gap-2">
                      <QueueItemIndicator completed={false} />
                      <QueueItemContent>
                        Scene {scene.sceneNumber}
                      </QueueItemContent>
                    </div>
                  </QueueItem>
                ))}
              </QueueList>
            </QueueSectionContent>
          </QueueSection>
        )}

        {/* Completed Scenes */}
        {completedScenes.length > 0 && (
          <QueueSection defaultOpen={false}>
            <QueueSectionTrigger>
              <QueueSectionLabel
                label="Completed"
                count={completedScenes.length}
                icon={<CheckCircle className="h-4 w-4 text-green-400" />}
              />
            </QueueSectionTrigger>
            <QueueSectionContent>
              <QueueList>
                {completedScenes.map((scene) => (
                  <QueueItem key={scene.sceneId}>
                    <div className="flex items-center gap-2">
                      <QueueItemIndicator completed={true} />
                      <QueueItemContent completed={true}>
                        Scene {scene.sceneNumber}
                      </QueueItemContent>
                    </div>
                    <QueueItemDescription completed={true}>
                      Score: {scene.score}%
                    </QueueItemDescription>
                  </QueueItem>
                ))}
              </QueueList>
            </QueueSectionContent>
          </QueueSection>
        )}

        {/* Failed Scenes */}
        {failedScenes.length > 0 && (
          <QueueSection defaultOpen={true}>
            <QueueSectionTrigger>
              <QueueSectionLabel
                label="Failed"
                count={failedScenes.length}
                icon={<XCircle className="h-4 w-4 text-red-400" />}
              />
            </QueueSectionTrigger>
            <QueueSectionContent>
              <QueueList>
                {failedScenes.map((scene) => (
                  <QueueItem key={scene.sceneId} title={scene.error || undefined}>
                    <div className="flex items-center gap-2">
                      <XCircle className="h-3 w-3 text-red-400 flex-shrink-0" />
                      <QueueItemContent>
                        Scene {scene.sceneNumber}
                      </QueueItemContent>
                    </div>
                    <QueueItemDescription>
                      <span className="text-red-400/80">
                        {formatErrorMessage(scene.error, 35)}
                      </span>
                    </QueueItemDescription>
                  </QueueItem>
                ))}
              </QueueList>
            </QueueSectionContent>
          </QueueSection>
        )}
      </Queue>
    </PanelWrapper>
  );
}

export default SceneQueuePanel;
