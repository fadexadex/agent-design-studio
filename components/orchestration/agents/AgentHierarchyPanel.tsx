/**
 * AgentHierarchyPanel
 * 
 * Left panel showing the Director agent and all spawned scene agents.
 * Shows the agent hierarchy dynamically as agents are spawned.
 */

import { memo, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  DirectorUIState, 
  SpawnedAgentState 
} from '@/types/orchestration';
import { DirectorAgentView } from './DirectorAgentView';
import { SpawnedAgentCard } from './SpawnedAgentCard';
import { 
  ChevronDown, 
  ChevronRight,
  Users,
  Loader2
} from 'lucide-react';

interface AgentHierarchyPanelProps {
  director: DirectorUIState;
  spawnedAgents: Map<string, SpawnedAgentState>;
  selectedAgentId?: string;
  onAgentSelect?: (agentId: string) => void;
  className?: string;
}

export const AgentHierarchyPanel = memo(function AgentHierarchyPanel({
  director,
  spawnedAgents,
  selectedAgentId,
  onAgentSelect,
  className,
}: AgentHierarchyPanelProps) {
  const [showCompleted, setShowCompleted] = useState(true);
  
  // Sort agents: active first, then by scene index
  const sortedAgents = useMemo(() => {
    const agents = Array.from(spawnedAgents.values());
    
    return agents.sort((a, b) => {
      // Active agents first
      const aActive = a.status !== 'completed' && a.status !== 'error';
      const bActive = b.status !== 'completed' && b.status !== 'error';
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;
      
      // Then by scene index
      return a.sceneIndex - b.sceneIndex;
    });
  }, [spawnedAgents]);

  const activeAgents = useMemo(() => 
    sortedAgents.filter(a => a.status !== 'completed' && a.status !== 'error'),
    [sortedAgents]
  );

  const completedAgents = useMemo(() => 
    sortedAgents.filter(a => a.status === 'completed' || a.status === 'error'),
    [sortedAgents]
  );

  const hasAgents = spawnedAgents.size > 0;

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Director Agent - Always at top */}
      <div className="flex-shrink-0 mb-4">
        <DirectorAgentView director={director} />
      </div>

      {/* Spawned Agents Section */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {/* Section header */}
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-zinc-500" />
            <span className="text-sm font-medium text-zinc-300">Scene Agents</span>
            {hasAgents && (
              <span className="text-xs text-zinc-500">
                ({activeAgents.length} active, {completedAgents.length} done)
              </span>
            )}
          </div>
          
          {director.isActive && activeAgents.length === 0 && (
            <div className="flex items-center gap-1 text-xs text-zinc-500">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Spawning...</span>
            </div>
          )}
        </div>

        {/* Agents list - scrollable */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-zinc-700">
          {/* Empty state */}
          {!hasAgents && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users className="w-8 h-8 text-zinc-700 mb-2" />
              <p className="text-sm text-zinc-500">
                {director.isActive 
                  ? 'Waiting for agents to spawn...' 
                  : 'No agents spawned yet'}
              </p>
              <p className="text-xs text-zinc-600 mt-1">
                Agents will appear here as the Director creates them
              </p>
            </div>
          )}

          {/* Active agents */}
          {activeAgents.map((agent) => (
            <SpawnedAgentCard
              key={agent.agentId}
              agent={agent}
              isSelected={selectedAgentId === agent.agentId}
              onClick={() => onAgentSelect?.(agent.agentId)}
            />
          ))}

          {/* Completed agents (collapsible) */}
          {completedAgents.length > 0 && (
            <div className="pt-2 border-t border-zinc-800">
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-2 w-full py-1"
              >
                {showCompleted ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
                <span>Completed ({completedAgents.length})</span>
              </button>
              
              {showCompleted && (
                <div className="space-y-2 opacity-70">
                  {completedAgents.map((agent) => (
                    <SpawnedAgentCard
                      key={agent.agentId}
                      agent={agent}
                      isSelected={selectedAgentId === agent.agentId}
                      onClick={() => onAgentSelect?.(agent.agentId)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default AgentHierarchyPanel;
