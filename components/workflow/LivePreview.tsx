import React from 'react';
import { Layers, Check, AlertCircle, Sparkles, Film, Play } from 'lucide-react';
import { SceneNodeData } from './SceneNode';
import { SceneRenderStatus } from '../../types';

interface LivePreviewProps {
    videoUrl?: string;
    scenes: SceneNodeData[];
    sceneStatuses?: SceneRenderStatus[];
    activeSceneId?: string;
    onSceneSelect: (id: string) => void;
    renderProgress?: number;
}

/**
 * LivePreview - Video preview component with scene status visualization
 * Shows beautiful loading animations while scenes generate, and video playback when complete
 */
export const LivePreview: React.FC<LivePreviewProps> = ({
    videoUrl,
    scenes,
    sceneStatuses = [],
    activeSceneId,
    onSceneSelect,
    renderProgress = 0
}) => {
    // Get status for a specific scene
    const getSceneStatus = (sceneId: string): SceneRenderStatus | undefined => {
        const scene = scenes.find(s => s.id === sceneId);
        if (!scene) return undefined;
        return sceneStatuses.find(ss => ss.sceneId === sceneId || ss.sceneNumber === (scene.index + 1));
    };

    // Check if any scene is currently generating or rendering
    const isGenerating = sceneStatuses.some(s => s.status === 'generating' || s.status === 'rendering');
    const allComplete = sceneStatuses.length > 0 && sceneStatuses.every(s => s.status === 'complete');
    const hasErrors = sceneStatuses.some(s => s.status === 'error');

    // Get status icon for scene button
    const getSceneStatusIcon = (status?: SceneRenderStatus) => {
        if (!status) return null;

        switch (status.status) {
            case 'generating':
                return <Sparkles size={10} className="animate-pulse text-purple-400" />;
            case 'rendering':
                return <Film size={10} className="animate-pulse text-blue-400" />;
            case 'complete':
                return <Check size={10} className="text-green-400" />;
            case 'error':
                return <AlertCircle size={10} className="text-red-400" />;
            default:
                return null;
        }
    };

    // Get button styles based on scene status
    const getSceneButtonStyles = (sceneId: string, isActive: boolean) => {
        const status = getSceneStatus(sceneId);

        if (isActive) {
            return 'bg-white text-black ring-2 ring-purple-500/50';
        }

        switch (status?.status) {
            case 'generating':
                return 'bg-purple-500/20 text-purple-300 border border-purple-500/30 scene-button-generating';
            case 'rendering':
                return 'bg-blue-500/20 text-blue-300 border border-blue-500/30 scene-button-rendering';
            case 'complete':
                return 'bg-green-500/10 text-green-300 border border-green-500/30 hover:bg-green-500/20 cursor-pointer';
            case 'error':
                return 'bg-red-500/10 text-red-300 border border-red-500/30 hover:bg-red-500/20 cursor-pointer';
            case 'pending':
            default:
                return 'bg-zinc-800/50 text-zinc-500 border border-zinc-700 cursor-not-allowed';
        }
    };

    const isSceneClickable = (sceneId: string) => {
        const status = getSceneStatus(sceneId);
        return status?.status === 'complete' || status?.status === 'error';
    };

    return (
        <div className="flex flex-col h-full bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800">

            {/* Top Bar / Scene Selector */}
            <div className="h-14 border-b border-zinc-800 bg-zinc-900/50 flex items-center px-4 gap-4 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest mr-4 shrink-0">
                    <Layers size={14} /> Scenes
                </div>

                {scenes.map((scene, idx) => {
                    const status = getSceneStatus(scene.id);
                    const isActive = activeSceneId === scene.id;
                    const clickable = isSceneClickable(scene.id);

                    return (
                        <button
                            key={scene.id}
                            onClick={() => clickable && onSceneSelect(scene.id)}
                            disabled={!clickable}
                            className={`
                                relative flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all
                                ${getSceneButtonStyles(scene.id, isActive)}
                            `}
                        >
                            {/* Scene Number Badge */}
                            <span className={`
                                w-4 h-4 flex items-center justify-center rounded-full text-[9px] font-bold
                                ${isActive ? 'bg-black text-white' : 'bg-zinc-700/50 text-zinc-300'}
                            `}>
                                {idx + 1}
                            </span>

                            {/* Scene Title */}
                            {scene.title}

                            {/* Status Icon */}
                            {getSceneStatusIcon(status)}

                            {/* Progress indicator for generating scenes */}
                            {(status?.status === 'generating' || status?.status === 'rendering') && (
                                <span className="text-[10px] opacity-70">{status.progress}%</span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-h-0 flex flex-col">
                <div className="flex-1 flex flex-col min-h-0 relative">
                    <div className="flex-1 bg-black flex items-center justify-center overflow-hidden">
                        {/* Show video when available */}
                        {videoUrl ? (
                            <video
                                src={videoUrl}
                                controls
                                autoPlay
                                loop
                                className="max-h-full max-w-full w-auto h-auto object-contain"
                            />
                        ) : isGenerating ? (
                            /* Beautiful generating animation */
                            <div className="flex flex-col items-center gap-6 p-8">
                                <div className="relative w-24 h-24">
                                    {/* Outer ring */}
                                    <div className="absolute inset-0 rounded-full border-2 border-purple-500/20 animate-pulse" />
                                    {/* Spinning ring */}
                                    <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-purple-500 border-r-purple-400 animate-spin" />
                                    {/* Inner glow */}
                                    <div className="absolute inset-4 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                                        <Sparkles size={24} className="text-purple-400 animate-pulse" />
                                    </div>
                                </div>

                                <div className="text-center">
                                    <p className="text-lg font-medium bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                                        Generating Scenes...
                                    </p>
                                    <p className="text-sm text-zinc-500 mt-1">
                                        {sceneStatuses.filter(s => s.status === 'complete').length} of {sceneStatuses.length} scenes complete
                                    </p>
                                </div>

                                {/* Progress bar */}
                                <div className="w-64 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 transition-all duration-500"
                                        style={{
                                            width: `${sceneStatuses.length > 0
                                                ? Math.round(sceneStatuses.reduce((sum, s) => sum + s.progress, 0) / sceneStatuses.length)
                                                : 0}%`
                                        }}
                                    />
                                </div>
                            </div>
                        ) : renderProgress > 0 && renderProgress < 100 ? (
                            /* Rendering animation */
                            <div className="flex flex-col items-center gap-6 p-8">
                                <div className="relative w-24 h-24">
                                    <div className="absolute inset-0 rounded-full border-2 border-blue-500/20" />
                                    <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-blue-500 border-r-cyan-400 animate-spin" />
                                    <div className="absolute inset-4 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                                        <Film size={24} className="text-blue-400 animate-pulse" />
                                    </div>
                                </div>

                                <div className="text-center">
                                    <p className="text-lg font-medium bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                                        Rendering Video...
                                    </p>
                                    <p className="text-sm text-zinc-500 mt-1">
                                        {renderProgress}% complete
                                    </p>
                                </div>

                                <div className="w-64 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300"
                                        style={{ width: `${renderProgress}%` }}
                                    />
                                </div>
                            </div>
                        ) : allComplete && !videoUrl ? (
                            /* All scenes complete, waiting for render */
                            <div className="flex flex-col items-center gap-4 p-8">
                                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <Check size={32} className="text-green-400" />
                                </div>
                                <p className="text-lg font-medium text-green-400">All Scenes Generated</p>
                                <p className="text-sm text-zinc-500">Preparing to render final video...</p>
                            </div>
                        ) : hasErrors ? (
                            /* Error state */
                            <div className="flex flex-col items-center gap-4 p-8">
                                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                                    <AlertCircle size={32} className="text-red-400" />
                                </div>
                                <p className="text-lg font-medium text-red-400">Generation Errors</p>
                                <p className="text-sm text-zinc-500 text-center max-w-xs">
                                    Some scenes encountered errors. Check the scene status for details.
                                </p>
                            </div>
                        ) : (
                            /* Initial waiting state */
                            <div className="flex flex-col items-center gap-4 text-zinc-600">
                                <div className="w-16 h-16 rounded-full border-2 border-zinc-800 flex items-center justify-center">
                                    <Play size={24} className="text-zinc-600 ml-1" />
                                </div>
                                <p className="font-mono text-sm">Waiting for generation to start...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
