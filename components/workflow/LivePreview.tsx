import React, { useState } from 'react';
import { Layers, Check, AlertCircle, Sparkles, Film, Play, X, Maximize2 } from 'lucide-react';
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
 * ScenePreviewCard - Individual scene card with video player
 */
interface ScenePreviewCardProps {
    scene: SceneNodeData;
    status?: SceneRenderStatus;
    isActive: boolean;
    onSelect: () => void;
    onExpand: () => void;
}

const ScenePreviewCard: React.FC<ScenePreviewCardProps> = ({
    scene,
    status,
    isActive,
    onSelect,
    onExpand
}) => {
    const hasPreview = status?.previewUrl && status.status === 'complete';

    const getStatusIcon = () => {
        if (!status) return null;
        switch (status.status) {
            case 'generating':
                return <Sparkles size={12} className="animate-pulse text-purple-400" />;
            case 'rendering':
                return <Film size={12} className="animate-pulse text-blue-400" />;
            case 'complete':
                return <Check size={12} className="text-green-400" />;
            case 'error':
                return <AlertCircle size={12} className="text-red-400" />;
            default:
                return null;
        }
    };

    const getCardStyles = () => {
        if (isActive) {
            return 'ring-2 ring-purple-500 border-purple-500';
        }
        switch (status?.status) {
            case 'generating':
                return 'border-purple-500/30 bg-purple-500/5';
            case 'rendering':
                return 'border-blue-500/30 bg-blue-500/5';
            case 'complete':
                return 'border-green-500/30 hover:border-green-500/50';
            case 'error':
                return 'border-red-500/30';
            default:
                return 'border-zinc-800';
        }
    };

    return (
        <div
            className={`
                relative rounded-lg border overflow-hidden transition-all cursor-pointer
                ${getCardStyles()}
            `}
            onClick={onSelect}
        >
            {/* Scene Header */}
            <div className="px-3 py-2 bg-zinc-900/80 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="w-5 h-5 flex items-center justify-center rounded-full bg-zinc-700/50 text-[10px] font-bold text-zinc-300">
                        {scene.index + 1}
                    </span>
                    <span className="text-xs font-medium text-zinc-300 truncate max-w-[120px]">
                        {scene.title}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {getStatusIcon()}
                    {(status?.status === 'generating' || status?.status === 'rendering') && (
                        <span className="text-[10px] text-zinc-400">{status.progress}%</span>
                    )}
                    {hasPreview && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onExpand(); }}
                            className="p-1 hover:bg-zinc-700 rounded transition-colors"
                            title="Expand preview"
                        >
                            <Maximize2 size={12} className="text-zinc-400" />
                        </button>
                    )}
                </div>
            </div>

            {/* Video Preview Area */}
            <div className="aspect-video bg-black flex items-center justify-center relative">
                {hasPreview ? (
                    <video
                        src={status.previewUrl}
                        controls
                        loop
                        muted
                        className="w-full h-full object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                ) : status?.status === 'generating' ? (
                    <div className="flex flex-col items-center gap-2">
                        <div className="relative w-12 h-12">
                            <div className="absolute inset-0 rounded-full border-2 border-purple-500/20 animate-pulse" />
                            <div className="absolute inset-1 rounded-full border-2 border-transparent border-t-purple-500 animate-spin" />
                            <div className="absolute inset-3 rounded-full bg-purple-500/20 flex items-center justify-center">
                                <Sparkles size={14} className="text-purple-400" />
                            </div>
                        </div>
                        <span className="text-xs text-purple-300">Generating...</span>
                        <div className="w-20 h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-purple-500 transition-all duration-300"
                                style={{ width: `${status.progress}%` }}
                            />
                        </div>
                    </div>
                ) : status?.status === 'rendering' ? (
                    <div className="flex flex-col items-center gap-2">
                        <div className="relative w-12 h-12">
                            <div className="absolute inset-0 rounded-full border-2 border-blue-500/20" />
                            <div className="absolute inset-1 rounded-full border-2 border-transparent border-t-blue-500 animate-spin" />
                            <div className="absolute inset-3 rounded-full bg-blue-500/20 flex items-center justify-center">
                                <Film size={14} className="text-blue-400" />
                            </div>
                        </div>
                        <span className="text-xs text-blue-300">Rendering...</span>
                        <div className="w-20 h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 transition-all duration-300"
                                style={{ width: `${status.progress}%` }}
                            />
                        </div>
                    </div>
                ) : status?.status === 'complete' && !status.previewUrl ? (
                    <div className="flex flex-col items-center gap-2 text-zinc-500">
                        <Check size={20} className="text-green-400" />
                        <span className="text-xs">Preview unavailable</span>
                    </div>
                ) : status?.status === 'error' ? (
                    <div className="flex flex-col items-center gap-2 text-red-400 px-4">
                        <AlertCircle size={20} />
                        <span className="text-xs text-center">{status.error || 'Error'}</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2 text-zinc-600">
                        <Play size={20} />
                        <span className="text-xs">Waiting...</span>
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * ExpandedPreviewModal - Full-screen preview modal
 */
interface ExpandedPreviewModalProps {
    scene: SceneNodeData;
    status: SceneRenderStatus;
    onClose: () => void;
}

const ExpandedPreviewModal: React.FC<ExpandedPreviewModalProps> = ({
    scene,
    status,
    onClose
}) => {
    if (!status.previewUrl) return null;

    return (
        <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-8"
            onClick={onClose}
        >
            <div
                className="relative max-w-5xl w-full bg-zinc-900 rounded-xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-4 py-3 bg-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="w-6 h-6 flex items-center justify-center rounded-full bg-purple-500/20 text-xs font-bold text-purple-300">
                            {scene.index + 1}
                        </span>
                        <span className="font-medium text-white">{scene.title}</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-zinc-400" />
                    </button>
                </div>

                {/* Video */}
                <div className="aspect-video bg-black">
                    <video
                        src={status.previewUrl}
                        controls
                        autoPlay
                        loop
                        className="w-full h-full object-contain"
                    />
                </div>
            </div>
        </div>
    );
};

/**
 * LivePreview - Video preview component with scene status visualization
 * Shows a grid of scene preview cards with individual video players
 */
export const LivePreview: React.FC<LivePreviewProps> = ({
    videoUrl,
    scenes,
    sceneStatuses = [],
    activeSceneId,
    onSceneSelect,
    renderProgress = 0
}) => {
    const [expandedScene, setExpandedScene] = useState<{ scene: SceneNodeData; status: SceneRenderStatus } | null>(null);

    // Get status for a specific scene
    const getSceneStatus = (sceneId: string): SceneRenderStatus | undefined => {
        const scene = scenes.find(s => s.id === sceneId);
        if (!scene) return undefined;
        return sceneStatuses.find(ss => ss.sceneId === sceneId || ss.sceneNumber === (scene.index + 1));
    };

    // Check status counts
    const completedScenes = sceneStatuses.filter(s => s.status === 'complete').length;
    const totalScenes = sceneStatuses.length || scenes.length;
    const hasAnyPreviews = sceneStatuses.some(s => s.previewUrl);
    const isGenerating = sceneStatuses.some(s => s.status === 'generating' || s.status === 'rendering');
    const allComplete = sceneStatuses.length > 0 && sceneStatuses.every(s => s.status === 'complete');

    // Get status icon for scene button in header
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

    // Get button styles for header scene tabs
    const getSceneButtonStyles = (sceneId: string, isActive: boolean) => {
        const status = getSceneStatus(sceneId);
        if (isActive) {
            return 'bg-white text-black ring-2 ring-purple-500/50';
        }
        switch (status?.status) {
            case 'generating':
                return 'bg-purple-500/20 text-purple-300 border border-purple-500/30';
            case 'rendering':
                return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
            case 'complete':
                return 'bg-green-500/10 text-green-300 border border-green-500/30 hover:bg-green-500/20 cursor-pointer';
            case 'error':
                return 'bg-red-500/10 text-red-300 border border-red-500/30 hover:bg-red-500/20 cursor-pointer';
            default:
                return 'bg-zinc-800/50 text-zinc-500 border border-zinc-700';
        }
    };

    return (
        <div className="flex flex-col h-full bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800">
            {/* Expanded Preview Modal */}
            {expandedScene && (
                <ExpandedPreviewModal
                    scene={expandedScene.scene}
                    status={expandedScene.status}
                    onClose={() => setExpandedScene(null)}
                />
            )}

            {/* Top Bar / Scene Selector */}
            <div className="h-14 border-b border-zinc-800 bg-zinc-900/50 flex items-center px-4 gap-4 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest mr-4 shrink-0">
                    <Layers size={14} />
                    <span>Scenes</span>
                    {totalScenes > 0 && (
                        <span className="text-purple-400">
                            {completedScenes}/{totalScenes}
                        </span>
                    )}
                </div>

                {scenes.map((scene, idx) => {
                    const status = getSceneStatus(scene.id);
                    const isActive = activeSceneId === scene.id;

                    return (
                        <button
                            key={scene.id}
                            onClick={() => onSceneSelect(scene.id)}
                            className={`
                                relative flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all
                                ${getSceneButtonStyles(scene.id, isActive)}
                            `}
                        >
                            <span className={`
                                w-4 h-4 flex items-center justify-center rounded-full text-[9px] font-bold
                                ${isActive ? 'bg-black text-white' : 'bg-zinc-700/50 text-zinc-300'}
                            `}>
                                {idx + 1}
                            </span>
                            {scene.title}
                            {getSceneStatusIcon(status)}
                            {(status?.status === 'generating' || status?.status === 'rendering') && (
                                <span className="text-[10px] opacity-70">{status.progress}%</span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-h-0 overflow-auto p-4">
                {/* Scene Preview Grid */}
                {(hasAnyPreviews || isGenerating || scenes.length > 0) && sceneStatuses.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        {scenes.map((scene) => {
                            const status = getSceneStatus(scene.id);
                            return (
                                <ScenePreviewCard
                                    key={scene.id}
                                    scene={scene}
                                    status={status}
                                    isActive={activeSceneId === scene.id}
                                    onSelect={() => onSceneSelect(scene.id)}
                                    onExpand={() => status && setExpandedScene({ scene, status })}
                                />
                            );
                        })}
                    </div>
                ) : (
                    /* Initial waiting state */
                    <div className="h-full flex flex-col items-center justify-center gap-4 text-zinc-600">
                        <div className="w-16 h-16 rounded-full border-2 border-zinc-800 flex items-center justify-center">
                            <Play size={24} className="text-zinc-600 ml-1" />
                        </div>
                        <p className="font-mono text-sm">Waiting for generation to start...</p>
                    </div>
                )}

                {/* Final Video Section */}
                {(videoUrl || (allComplete && renderProgress > 0)) && (
                    <div className="mt-4 border-t border-zinc-800 pt-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">
                            <Film size={14} />
                            Final Rendered Video
                            {renderProgress > 0 && renderProgress < 100 && (
                                <span className="text-blue-400 normal-case font-medium">
                                    Rendering: {renderProgress}%
                                </span>
                            )}
                        </div>

                        {videoUrl ? (
                            <div className="rounded-lg overflow-hidden border border-zinc-800 bg-black">
                                <video
                                    src={videoUrl}
                                    controls
                                    autoPlay
                                    loop
                                    className="w-full max-h-[400px] object-contain"
                                />
                            </div>
                        ) : (
                            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-8 flex flex-col items-center gap-4">
                                <div className="relative w-16 h-16">
                                    <div className="absolute inset-0 rounded-full border-2 border-blue-500/20" />
                                    <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-blue-500 animate-spin" />
                                    <div className="absolute inset-4 rounded-full bg-blue-500/20 flex items-center justify-center">
                                        <Film size={20} className="text-blue-400" />
                                    </div>
                                </div>
                                <p className="text-sm text-zinc-400">
                                    Rendering final video... {renderProgress}%
                                </p>
                                <div className="w-48 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300"
                                        style={{ width: `${renderProgress}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
