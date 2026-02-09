/**
 * DirectorAgentView
 * 
 * Displays the Director agent at the top of the agent hierarchy:
 * - Director status and phase
 * - Streaming thoughts with enhanced evaluation visualization
 * - Frame scanning animation during review
 * - Recent decisions
 */

import { memo, useMemo, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { DirectorUIState, DirectorPhase } from '@/types/orchestration';
import { 
  Brain, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Loader2,
  Crown,
  ScanLine,
  Film,
  Eye,
  ThumbsUp,
  ThumbsDown,
  RotateCcw
} from 'lucide-react';
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible';

interface DirectorAgentViewProps {
  director: DirectorUIState;
  className?: string;
}

// Phase configuration with more refined colors
const phaseConfig: Record<DirectorPhase, { 
  label: string; 
  color: string; 
  bgColor: string;
  borderColor: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  planning: { 
    label: 'Planning', 
    color: 'text-sky-400', 
    bgColor: 'bg-sky-500/10',
    borderColor: 'border-sky-500/30',
    icon: Brain
  },
  coordinating: { 
    label: 'Coordinating', 
    color: 'text-violet-400', 
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/30',
    icon: Film
  },
  evaluating: { 
    label: 'Reviewing', 
    color: 'text-amber-400', 
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    icon: Eye
  },
  deciding: { 
    label: 'Deciding', 
    color: 'text-emerald-400', 
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    icon: CheckCircle
  },
};

// Frame scanning visualization component
const FrameScanner = memo(function FrameScanner() {
  const [scanPosition, setScanPosition] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setScanPosition(prev => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="relative h-16 rounded-lg overflow-hidden bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 border border-amber-500/20">
      {/* Fake frame thumbnails */}
      <div className="absolute inset-0 flex items-center justify-around px-2 opacity-40">
        {[...Array(8)].map((_, i) => (
          <div 
            key={i}
            className="w-8 h-10 bg-zinc-700 rounded-sm border border-zinc-600"
          />
        ))}
      </div>
      
      {/* Scanning line */}
      <div 
        className="absolute top-0 h-full w-0.5 bg-gradient-to-b from-amber-400 via-amber-300 to-amber-400 shadow-lg shadow-amber-500/50 transition-transform"
        style={{ 
          left: `${scanPosition}%`,
          boxShadow: '0 0 20px rgba(251, 191, 36, 0.5)'
        }}
      />
      
      {/* Scanning glow effect */}
      <div 
        className="absolute top-0 h-full w-8 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent transition-transform"
        style={{ left: `calc(${scanPosition}% - 16px)` }}
      />
      
      {/* Label */}
      <div className="absolute bottom-1 right-2 text-[10px] text-amber-400/70 font-mono flex items-center gap-1">
        <ScanLine className="w-3 h-3" />
        ANALYZING
      </div>
    </div>
  );
});

export const DirectorAgentView = memo(function DirectorAgentView({
  director,
  className,
}: DirectorAgentViewProps) {
  const [isThoughtsExpanded, setIsThoughtsExpanded] = useState(false);
  const [isDecisionsExpanded, setIsDecisionsExpanded] = useState(false);

  const latestThought = useMemo(() => {
    if (director.thoughts.length === 0) return null;
    return director.thoughts[director.thoughts.length - 1];
  }, [director.thoughts]);

  const latestDecision = useMemo(() => {
    if (director.decisions.length === 0) return null;
    return director.decisions[director.decisions.length - 1];
  }, [director.decisions]);

  const phaseInfo = director.phase ? phaseConfig[director.phase] : null;
  const PhaseIcon = phaseInfo?.icon || Brain;
  const isEvaluating = director.phase === 'evaluating';

  return (
    <div className={cn(
      'rounded-xl border p-4 transition-all duration-300',
      director.isActive 
        ? cn(
            'border-white/20 bg-gradient-to-br from-zinc-900/90 to-zinc-800/90',
            phaseInfo?.borderColor
          )
        : director.error 
          ? 'border-red-500/30 bg-red-950/20'
          : 'border-zinc-700/50 bg-zinc-900/50',
      className
    )}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className={cn(
          'relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300',
          director.isActive 
            ? cn('bg-gradient-to-br from-zinc-700 to-zinc-800', phaseInfo?.bgColor)
            : director.error 
              ? 'bg-red-500/20' 
              : 'bg-zinc-800'
        )}>
          <Crown className={cn(
            'w-5 h-5 transition-colors duration-300',
            director.isActive 
              ? phaseInfo?.color || 'text-white'
              : director.error 
                ? 'text-red-400' 
                : 'text-zinc-500'
          )} />
          {/* Active pulse ring */}
          {director.isActive && (
            <div className={cn(
              'absolute inset-0 rounded-full animate-ping opacity-30',
              phaseInfo?.bgColor
            )} />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white">Director</h3>
            {director.isActive && (
              <PhaseIcon className={cn('w-3.5 h-3.5 animate-pulse', phaseInfo?.color)} />
            )}
          </div>
          
          <div className="flex items-center gap-2 mt-0.5">
            {phaseInfo ? (
              <span className={cn(
                'text-xs px-2 py-0.5 rounded-full font-medium',
                phaseInfo.bgColor,
                phaseInfo.color
              )}>
                {phaseInfo.label}
              </span>
            ) : director.error ? (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 font-medium">
                Error
              </span>
            ) : (
              <span className="text-xs text-zinc-500">
                Standby
              </span>
            )}
            
            {director.totalScenes > 0 && (
              <span className="text-xs text-zinc-500">
                {director.totalScenes} scene{director.totalScenes !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Evaluation Phase: Frame Scanner Visualization */}
      {isEvaluating && director.isActive && (
        <div className="mb-3">
          <FrameScanner />
        </div>
      )}

      {/* Latest thinking (always visible when active) */}
      {latestThought && director.isActive && (
        <div className={cn(
          'mb-3 p-3 rounded-lg border transition-all duration-300',
          isEvaluating 
            ? 'bg-amber-500/5 border-amber-500/20'
            : 'bg-violet-500/5 border-violet-500/20'
        )}>
          <div className={cn(
            'flex items-center gap-1.5 mb-1.5',
            isEvaluating ? 'text-amber-400' : 'text-violet-400'
          )}>
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">
              {isEvaluating ? 'Analyzing' : 'Thinking'}
            </span>
            <span className="animate-pulse">...</span>
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed">
            {latestThought.thought}
          </p>
        </div>
      )}

      {/* Error display */}
      {director.error && (
        <div className="mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-1.5 mb-1 text-red-400">
            <AlertCircle className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">
              {director.isRecoverable ? 'Recoverable Error' : 'Error'}
            </span>
          </div>
          <p className="text-sm text-red-300">
            {director.error}
          </p>
        </div>
      )}

      {/* Thought history (collapsible) */}
      {director.thoughts.length > 1 && (
        <Collapsible 
          open={isThoughtsExpanded} 
          onOpenChange={setIsThoughtsExpanded}
          className="mb-2"
        >
          <CollapsibleTrigger className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors w-full py-1">
            {isThoughtsExpanded ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
            <Brain className="w-3 h-3" />
            <span>{director.thoughts.length} thoughts</span>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 space-y-2 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700">
              {director.thoughts.slice().reverse().slice(1).map((thought) => (
                <div 
                  key={thought.id}
                  className="text-xs text-zinc-400 p-2 rounded bg-zinc-800/50 border border-zinc-700/50"
                >
                  <div className="flex items-center gap-1 mb-1 text-zinc-500">
                    <span className="capitalize">{thought.phase}</span>
                    <span className="text-zinc-600">·</span>
                    <span>{new Date(thought.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-zinc-300 leading-relaxed">{thought.thought}</p>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Latest decision with better styling */}
      {latestDecision && (
        <Collapsible 
          open={isDecisionsExpanded} 
          onOpenChange={setIsDecisionsExpanded}
        >
          <CollapsibleTrigger className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors w-full py-1">
            {isDecisionsExpanded ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
            <CheckCircle className="w-3 h-3 text-emerald-500" />
            <span>{director.decisions.length} decision{director.decisions.length !== 1 ? 's' : ''}</span>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 space-y-2">
              {director.decisions.slice().reverse().map((decision) => {
                // Determine decision type for icon
                const isPass = decision.decision.toLowerCase().includes('pass') || 
                               decision.decision.toLowerCase().includes('approve');
                const isRefine = decision.decision.toLowerCase().includes('refine') ||
                                 decision.decision.toLowerCase().includes('retry');
                
                return (
                  <div 
                    key={decision.id}
                    className={cn(
                      'text-xs p-3 rounded-lg border',
                      isPass 
                        ? 'bg-emerald-500/5 border-emerald-500/20' 
                        : isRefine
                          ? 'bg-amber-500/5 border-amber-500/20'
                          : 'bg-zinc-800/50 border-zinc-700/50'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {isPass ? (
                        <ThumbsUp className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                      ) : isRefine ? (
                        <RotateCcw className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                      ) : (
                        <ThumbsDown className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'font-medium mb-1',
                          isPass ? 'text-emerald-300' : isRefine ? 'text-amber-300' : 'text-zinc-300'
                        )}>
                          {decision.decision}
                        </p>
                        <p className="text-zinc-400 leading-relaxed">
                          {decision.reasoning}
                        </p>
                        {decision.affectedScenes.length > 0 && (
                          <div className="mt-2 text-zinc-500 flex items-center gap-1">
                            <Film className="w-3 h-3" />
                            {decision.affectedScenes.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
});

export default DirectorAgentView;
