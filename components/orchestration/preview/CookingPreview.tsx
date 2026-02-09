/**
 * CookingPreview
 * 
 * Right panel showing scene previews as they become ready.
 * Features:
 * - "Cooking" animation while scenes render
 * - Grid of scene tiles that fill in as they complete
 * - Version tracking with score history
 * - Play individual scenes or all together
 * - Stop review button to approve current versions
 */

import { memo, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { PreviewState, PreviewSceneState, SceneUIState } from '@/types/orchestration';
import { 
  Play, 
  Loader2, 
  Film,
  CheckCircle,
  ChefHat,
  Eye,
  History,
  TrendingUp,
  TrendingDown,
  Minus,
  Hand,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CookingPreviewProps {
  preview: PreviewState;
  scenes?: Map<string, SceneUIState>;
  totalScenes: number;
  onPlayScene?: (sceneIndex: number, videoPath: string) => void;
  onPlayAll?: (finalVideoPath: string) => void;
  onStopReview?: () => Promise<void>;
  className?: string;
}

// Score badge component with trend indicator
function ScoreBadge({ 
  score, 
  scoreHistory,
  version,
  isLocked 
}: { 
  score?: number; 
  scoreHistory: number[];
  version: number;
  isLocked: boolean;
}) {
  // Calculate trend from score history
  const trend = useMemo(() => {
    if (scoreHistory.length < 2) return 'none';
    const recent = scoreHistory.slice(-2);
    if (recent[1] > recent[0] + 5) return 'up';
    if (recent[1] < recent[0] - 5) return 'down';
    return 'stable';
  }, [scoreHistory]);

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-zinc-400';

  if (score === undefined) return null;

  return (
    <div className="flex items-center gap-1">
      {/* Version badge */}
      <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/50">
        {isLocked ? (
          <Lock className="w-2.5 h-2.5 text-emerald-400" />
        ) : (
          <History className="w-2.5 h-2.5 text-zinc-400" />
        )}
        <span className="text-[10px] text-zinc-400">v{version}</span>
      </div>
      
      {/* Score badge with trend */}
      <div className={cn(
        'flex items-center gap-0.5 px-1.5 py-0.5 rounded border',
        score >= 80 ? 'bg-emerald-500/20 border-emerald-500/30' :
        score >= 60 ? 'bg-amber-500/20 border-amber-500/30' :
        'bg-red-500/20 border-red-500/30'
      )}>
        <span className={cn(
          'text-[10px] font-medium',
          score >= 80 ? 'text-emerald-400' :
          score >= 60 ? 'text-amber-400' :
          'text-red-400'
        )}>
          {Math.round(score)}%
        </span>
        {scoreHistory.length > 1 && (
          <TrendIcon className={cn('w-2.5 h-2.5', trendColor)} />
        )}
      </div>
    </div>
  );
}

// Placeholder scene tile
function PlaceholderTile({ index }: { index: number }) {
  return (
    <div className="relative aspect-video rounded-lg bg-zinc-900/50 border border-dashed border-zinc-700/50 flex flex-col items-center justify-center">
      <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center mb-2">
        <Loader2 className="w-4 h-4 text-zinc-600 animate-spin" />
      </div>
      <span className="text-xs text-zinc-600">Scene {index + 1}</span>
    </div>
  );
}

// Ready scene tile with version info
function SceneTile({ 
  scene,
  sceneState,
  onClick 
}: { 
  scene: PreviewSceneState;
  sceneState?: SceneUIState;
  onClick?: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className={cn(
        'relative aspect-video rounded-lg overflow-hidden cursor-pointer',
        'bg-zinc-900 border border-zinc-700/50',
        'transition-all duration-200',
        isHovered && 'ring-2 ring-violet-500/50 ring-offset-2 ring-offset-zinc-900 scale-[1.02]',
        sceneState?.isLocked && 'ring-1 ring-emerald-500/30'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Video preview */}
      <video 
        src={scene.videoPath}
        className="w-full h-full object-cover"
        muted
        preload="metadata"
        onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
        onMouseLeave={(e) => {
          const video = e.target as HTMLVideoElement;
          video.pause();
          video.currentTime = 0;
        }}
      />
      
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      
      {/* Scene number badge */}
      <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm text-white text-xs font-medium">
        Scene {scene.sceneIndex + 1}
      </div>
      
      {/* Version and Score badges */}
      {sceneState && (
        <div className="absolute top-2 right-2">
          <ScoreBadge 
            score={sceneState.score}
            scoreHistory={sceneState.scoreHistory}
            version={sceneState.version}
            isLocked={sceneState.isLocked}
          />
        </div>
      )}
      
      {/* Ready indicator */}
      {!sceneState && (
        <div className="absolute top-2 right-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
        </div>
      )}
      
      {/* Play overlay on hover */}
      {isHovered && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
            <Play className="w-5 h-5 text-black ml-0.5" />
          </div>
        </div>
      )}
      
      {/* Bottom info bar */}
      <div className="absolute bottom-0 left-0 right-0 p-2 flex items-center justify-between">
        <div className="flex items-center gap-1">
          {sceneState?.isLocked && (
            <span className="text-[10px] text-emerald-400 font-medium">APPROVED</span>
          )}
        </div>
        <span className="px-1.5 py-0.5 rounded bg-black/60 text-white text-xs">
          {scene.durationSeconds}s
        </span>
      </div>
    </div>
  );
}

// Cooking animation
function CookingAnimation() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative mb-4">
        <ChefHat className="w-16 h-16 text-zinc-700" />
        <div className="absolute -top-1 -right-1">
          <div className="flex gap-0.5">
            {[0, 1, 2].map((i) => (
              <div 
                key={i}
                className="w-1.5 h-4 rounded-full bg-amber-500/60 animate-pulse"
                style={{ animationDelay: `${i * 200}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
      <p className="text-sm font-medium text-zinc-400 mb-1">
        Cooking your video...
      </p>
      <p className="text-xs text-zinc-600">
        Scenes will appear as they render
      </p>
    </div>
  );
}

export const CookingPreview = memo(function CookingPreview({
  preview,
  scenes,
  totalScenes,
  onPlayScene,
  onPlayAll,
  onStopReview,
  className,
}: CookingPreviewProps) {
  const [isStoppingReview, setIsStoppingReview] = useState(false);
  
  // Create array of scene slots (ready or placeholder)
  const sceneSlots = useMemo(() => {
    const slots: (PreviewSceneState | null)[] = [];
    
    for (let i = 0; i < totalScenes; i++) {
      const readyScene = preview.readyScenes.find(s => s.sceneIndex === i);
      slots.push(readyScene || null);
    }
    
    return slots;
  }, [preview.readyScenes, totalScenes]);

  // Get scene state by index
  const getSceneState = (sceneIndex: number): SceneUIState | undefined => {
    if (!scenes) return undefined;
    return Array.from(scenes.values()).find(s => s.sceneIndex === sceneIndex);
  };

  const readyCount = preview.readyScenes.length;
  const progress = totalScenes > 0 ? Math.round((readyCount / totalScenes) * 100) : 0;
  
  // Check if any scenes are actively being reviewed (not locked)
  const scenesUnderReview = scenes 
    ? Array.from(scenes.values()).filter(s => !s.isLocked && s.status !== 'failed').length
    : 0;
  const canStopReview = scenesUnderReview > 0 && onStopReview;

  const handleStopReview = async () => {
    if (!onStopReview) return;
    setIsStoppingReview(true);
    try {
      await onStopReview();
    } finally {
      setIsStoppingReview(false);
    }
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-zinc-500" />
          <span className="text-sm font-medium text-zinc-300">Preview</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">
            {readyCount}/{totalScenes} ready
          </span>
          
          {/* Stop Review button */}
          {canStopReview && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleStopReview}
              disabled={isStoppingReview}
              className="h-7 px-3 border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
            >
              {isStoppingReview ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <>
                  <Hand className="w-3 h-3 mr-1" />
                  Approve All
                </>
              )}
            </Button>
          )}
          
          {preview.allComplete && preview.finalVideoPath && (
            <Button
              size="sm"
              onClick={() => onPlayAll?.(preview.finalVideoPath!)}
              className="h-7 px-3 bg-violet-600 hover:bg-violet-500"
            >
              <Play className="w-3 h-3 mr-1" />
              Play All
            </Button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4 flex-shrink-0">
        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className={cn(
              'h-full transition-all duration-500 rounded-full',
              preview.allComplete 
                ? 'bg-emerald-500' 
                : 'bg-violet-500'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700">
        {/* Show cooking animation if nothing ready yet */}
        {readyCount === 0 && totalScenes > 0 && (
          <CookingAnimation />
        )}

        {/* Empty state */}
        {totalScenes === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Film className="w-12 h-12 text-zinc-700 mb-3" />
            <p className="text-sm text-zinc-500">
              No scenes to preview yet
            </p>
            <p className="text-xs text-zinc-600 mt-1">
              Start generation to see previews
            </p>
          </div>
        )}

        {/* Scene grid */}
        {totalScenes > 0 && (
          <div className={cn(
            'grid gap-3',
            totalScenes <= 2 ? 'grid-cols-1' : 'grid-cols-2'
          )}>
            {sceneSlots.map((scene, index) => (
              scene ? (
                <SceneTile 
                  key={scene.sceneId}
                  scene={scene}
                  sceneState={getSceneState(index)}
                  onClick={() => onPlayScene?.(scene.sceneIndex, scene.videoPath)}
                />
              ) : (
                <PlaceholderTile key={index} index={index} />
              )
            ))}
          </div>
        )}

        {/* All complete celebration */}
        {preview.allComplete && (
          <div className="mt-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-emerald-300">
              All scenes ready!
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              Click "Play All" to watch the full video
            </p>
          </div>
        )}

        {/* Error display */}
        {preview.error && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-400">
              {preview.error}
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

export default CookingPreview;
