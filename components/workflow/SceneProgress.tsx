import React from 'react';
import { Check, AlertCircle, Loader2, Sparkles, Film } from 'lucide-react';
import { SceneRenderStatus } from '../../types';

interface SceneProgressProps {
    scenes: SceneRenderStatus[];
    activeSceneNumber?: number;
    onSceneClick?: (sceneNumber: number) => void;
}

/**
 * SceneProgress - Beautiful animated progress visualization for scene generation
 * Shows individual scene status with smooth animations and progress indicators
 */
export const SceneProgress: React.FC<SceneProgressProps> = ({
    scenes,
    activeSceneNumber,
    onSceneClick
}) => {
    // Calculate overall progress
    const overallProgress = scenes.length > 0
        ? Math.round(scenes.reduce((sum, s) => sum + s.progress, 0) / scenes.length)
        : 0;

    const completedCount = scenes.filter(s => s.status === 'complete').length;
    const hasErrors = scenes.some(s => s.status === 'error');

    return (
        <div className="scene-progress-container">
            {/* Overall Progress Bar */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                        Scene Generation
                    </span>
                    <span className="text-xs font-mono text-zinc-500">
                        {completedCount}/{scenes.length} complete
                    </span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 transition-all duration-500 ease-out"
                        style={{ width: `${overallProgress}%` }}
                    />
                </div>
            </div>

            {/* Scene Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {scenes.map((scene) => (
                    <SceneCard
                        key={scene.sceneNumber}
                        scene={scene}
                        isActive={activeSceneNumber === scene.sceneNumber}
                        onClick={() => onSceneClick?.(scene.sceneNumber)}
                    />
                ))}
            </div>

            {/* Error Summary */}
            {hasErrors && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <div className="flex items-center gap-2 text-red-400 text-sm">
                        <AlertCircle size={16} />
                        <span>Some scenes encountered errors. You can retry or continue with completed scenes.</span>
                    </div>
                </div>
            )}
        </div>
    );
};

interface SceneCardProps {
    scene: SceneRenderStatus;
    isActive: boolean;
    onClick?: () => void;
}

const SceneCard: React.FC<SceneCardProps> = ({ scene, isActive, onClick }) => {
    const isClickable = scene.status === 'complete' || scene.status === 'error';

    const getStatusStyles = () => {
        switch (scene.status) {
            case 'pending':
                return 'border-zinc-700 bg-zinc-900/50 text-zinc-500';
            case 'generating':
                return 'border-purple-500/50 bg-purple-500/10 text-purple-300 scene-card-generating';
            case 'rendering':
                return 'border-blue-500/50 bg-blue-500/10 text-blue-300 scene-card-rendering';
            case 'complete':
                return 'border-green-500/50 bg-green-500/10 text-green-300 hover:border-green-400 cursor-pointer';
            case 'error':
                return 'border-red-500/50 bg-red-500/10 text-red-300 hover:border-red-400 cursor-pointer';
            default:
                return 'border-zinc-700 bg-zinc-900/50';
        }
    };

    const getStatusIcon = () => {
        switch (scene.status) {
            case 'pending':
                return <div className="w-5 h-5 rounded-full border-2 border-zinc-600" />;
            case 'generating':
                return (
                    <div className="relative">
                        <Sparkles size={20} className="animate-pulse text-purple-400" />
                        <div className="absolute inset-0 animate-ping">
                            <Sparkles size={20} className="text-purple-400 opacity-50" />
                        </div>
                    </div>
                );
            case 'rendering':
                return <Film size={20} className="animate-pulse text-blue-400" />;
            case 'complete':
                return (
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                        <Check size={12} className="text-white" />
                    </div>
                );
            case 'error':
                return <AlertCircle size={20} className="text-red-400" />;
            default:
                return null;
        }
    };

    const getStatusLabel = () => {
        switch (scene.status) {
            case 'pending':
                return 'Waiting...';
            case 'generating':
                return `Generating ${scene.progress}%`;
            case 'rendering':
                return `Rendering ${scene.progress}%`;
            case 'complete':
                return 'Complete';
            case 'error':
                return 'Error';
            default:
                return '';
        }
    };

    return (
        <div
            className={`
                relative p-4 rounded-xl border transition-all duration-300
                ${getStatusStyles()}
                ${isActive ? 'ring-2 ring-white/20 scale-[1.02]' : ''}
                ${isClickable ? '' : 'pointer-events-none'}
            `}
            onClick={isClickable ? onClick : undefined}
        >
            {/* Progress Ring Background */}
            {(scene.status === 'generating' || scene.status === 'rendering') && (
                <div className="absolute inset-0 rounded-xl overflow-hidden">
                    <div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"
                        style={{ backgroundSize: '200% 100%' }}
                    />
                </div>
            )}

            <div className="relative flex items-start gap-3">
                {/* Status Icon */}
                <div className="flex-shrink-0 mt-0.5">
                    {getStatusIcon()}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">Scene {scene.sceneNumber}</span>
                        {scene.status === 'complete' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 uppercase font-medium">
                                Ready
                            </span>
                        )}
                    </div>

                    <div className="text-xs opacity-70 truncate">
                        {scene.message || getStatusLabel()}
                    </div>

                    {/* Progress Bar for generating/rendering */}
                    {(scene.status === 'generating' || scene.status === 'rendering') && (
                        <div className="mt-2 h-1 bg-black/30 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-300 rounded-full ${scene.status === 'generating'
                                        ? 'bg-gradient-to-r from-purple-500 to-purple-400'
                                        : 'bg-gradient-to-r from-blue-500 to-blue-400'
                                    }`}
                                style={{ width: `${scene.progress}%` }}
                            />
                        </div>
                    )}

                    {/* Error Message */}
                    {scene.status === 'error' && scene.error && (
                        <div className="mt-2 text-xs text-red-400/80 truncate">
                            {scene.error}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SceneProgress;
