import React, { useState, useMemo, useEffect } from 'react';
import { useWorkflowStream } from '../../hooks/useWorkflowStream';
import { useHistorySync } from '../../hooks/useHistorySync';
import { WorkflowPhase, AgentThought } from '../../types';
import { ScriptEditor } from './ScriptEditor';
import { LivePreview } from './LivePreview';
import { ThoughtStream } from './ThoughtStream';
import { FeedbackControls } from './FeedbackControls';
import { SceneNodeData } from './SceneNode';
import { Check, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';

interface WorkflowDashboardProps {
    jobId: string;
    onNavigateToEditor?: (jobId: string) => void;
    onNavigateToVideo?: (jobId: string) => void;
}

const PHASES = [
    { id: WorkflowPhase.PLANNING, label: 'Planning' },
    { id: WorkflowPhase.IMPLEMENTATION, label: 'Implementation' },
    { id: WorkflowPhase.EVALUATION, label: 'Evaluation' },
    { id: WorkflowPhase.COMPLETE, label: 'Final' },
];

export const WorkflowDashboard: React.FC<WorkflowDashboardProps> = ({ jobId, onNavigateToEditor, onNavigateToVideo }) => {
    const { state, isConnected, isError, renderProgress } = useWorkflowStream(jobId);
    
    // Sync workflow state to history localStorage
    useHistorySync(jobId, state, { debounceMs: 2000 });
    
    const [activeSceneId, setActiveSceneId] = useState<string>('');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    // Track if user is actively editing a scene (clicked on a scene node)
    const [isEditingScene, setIsEditingScene] = useState(false);

    // State for local edits to the plan
    const [editedScenes, setEditedScenes] = useState<SceneNodeData[] | null>(null);

    // Sync state plan to local scenes if we haven't edited them yet, or if a new plan arrives (e.g. re-plan)
    // We need to be careful not to overwrite user edits if the stream just sends a keep-alive.
    // So we track the plan generation timestamp or just check if we have scenes.
    // IMPORTANT: Preserve all SceneDescription fields to avoid data loss during round-trip
    const serverScenes = useMemo(() => state?.plan?.sceneBreakdown?.map((s, idx) => ({
        id: s.id,
        title: `Scene ${s.sceneNumber}`,
        description: s.description,
        duration: s.frameRange ? Math.round((s.frameRange.end - s.frameRange.start) / 30) : 9, // Convert frames to seconds (30fps)
        index: idx,
        // Preserve original backend data for sync
        sceneNumber: s.sceneNumber,
        frameRange: s.frameRange,
        keyElements: s.keyElements
    })) || [], [state?.plan]);

    useEffect(() => {
        // If we have no local edits, or if the plan changed significantly (logic could be complex), use server plan.
        // For now, simpler: If we are in planning and don't have local scenes, use server scenes.
        if (!editedScenes && serverScenes.length > 0) {
            setEditedScenes(serverScenes);
        }
        // If server plan changes (e.g. "reject" -> new plan), we should probably reset.
        // But detecting "new plan" vs "same plan refreshed" is hard without IDs or timestamp.
        // Let's assume if the phase is PLANNING, we reset if the server sends a different set.
        // Actually, if feedback loop restarts planning, we want to reset.
    }, [serverScenes, state?.currentPhase]);

    // Current scenes to display: local edits or server fallbacks
    const activeScenes = editedScenes || serverScenes;

    // Logic for video URL
    const videoUrl = state?.outputVideoPath || undefined;

    // Auto-navigate to video viewer when video is ready
    const [hasNavigatedToVideo, setHasNavigatedToVideo] = useState(false);
    useEffect(() => {
        if (
            videoUrl &&
            state?.currentPhase === WorkflowPhase.COMPLETE &&
            onNavigateToVideo &&
            !hasNavigatedToVideo
        ) {
            // Small delay so the user sees the "Complete" state briefly
            const timer = setTimeout(() => {
                setHasNavigatedToVideo(true);
                onNavigateToVideo(jobId);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [videoUrl, state?.currentPhase, onNavigateToVideo, jobId, hasNavigatedToVideo]);

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-red-500 gap-4">
                <AlertCircle size={48} />
                <h2 className="text-xl font-bold">Connection Error</h2>
                <p className="text-zinc-500">Could not connect to workflow stream for Job {jobId}</p>
            </div>
        );
    }

    if (!state && !isConnected) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-zinc-500 gap-4">
                <Loader2 size={32} className="animate-spin text-purple-500" />
                <p>Connecting to Neural Core...</p>
            </div>
        );
    }

    // Determine current active view
    const currentPhase = state?.currentPhase || WorkflowPhase.INITIALIZATION;
    // We are in planning view if explicit planning phase OR awaiting feedback on the plan (no rounds yet)
    const isPlanning = currentPhase === WorkflowPhase.PLANNING ||
        currentPhase === WorkflowPhase.QUERY_ENHANCEMENT ||
        (currentPhase === WorkflowPhase.AWAITING_FEEDBACK && (!state?.rounds || state.rounds.length === 0));

    // Check if any scene is actively being generated or rendered
    const isActivelyRendering = currentPhase === WorkflowPhase.RENDERING || 
        state?.sceneStatuses?.some(s => s.status === 'generating' || s.status === 'rendering');

    const isRefining = !isPlanning && [
        WorkflowPhase.IMPLEMENTATION,
        WorkflowPhase.AWAITING_FEEDBACK,
        WorkflowPhase.ITERATION_DECISION,
        WorkflowPhase.EVALUATION,
        WorkflowPhase.RENDERING,
        WorkflowPhase.COMPLETE  // Keep showing LivePreview in complete phase to avoid view flash
    ].includes(currentPhase);

    const handleFeedbackSubmit = async (text: string) => {
        try {
            // Include edits if we are in planning mode
            // IMPORTANT: Properly reconstruct SceneDescription with all required fields
            const modifications = isPlanning && editedScenes ? {
                plan: {
                    sceneBreakdown: editedScenes.map((s, idx) => {
                        // Calculate frame range: each scene gets equal frames, 30fps * duration
                        const framesPerScene = Math.round(s.duration * 30);
                        const start = idx * framesPerScene;
                        const end = start + framesPerScene;

                        return {
                            id: s.id,
                            sceneNumber: idx + 1,
                            description: s.description,
                            // Use preserved frameRange if available, otherwise calculate from duration/index
                            frameRange: s.frameRange || { start, end },
                            // Use preserved keyElements if available, otherwise provide sensible default
                            keyElements: s.keyElements || ['animated element', 'brand colors']
                        };
                    })
                }
            } : undefined;

            // During planning, stay in awaiting_feedback so user can keep editing.
            // Without targetPhase, the backend defaults to 'implementation' which
            // causes an unwanted jump out of the planning screen.
            const targetPhase = isPlanning
                ? WorkflowPhase.AWAITING_FEEDBACK
                : undefined;

            await fetch(`/api/workflow/${jobId}/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'modify',
                    message: text,
                    targetPhase,
                    modifications
                })
            });
        } catch (e) {
            console.error('Failed to submit feedback:', e);
        }
    };

    const handleApprove = async () => {
        try {
            // Include edits if we are in planning mode
            // IMPORTANT: Properly reconstruct SceneDescription with all required fields
            const modifications = isPlanning && editedScenes ? {
                plan: {
                    sceneBreakdown: editedScenes.map((s, idx) => {
                        // Calculate frame range: each scene gets equal frames, 30fps * duration
                        const framesPerScene = Math.round(s.duration * 30);
                        const start = idx * framesPerScene;
                        const end = start + framesPerScene;

                        return {
                            id: s.id,
                            sceneNumber: idx + 1,
                            description: s.description,
                            // Use preserved frameRange if available, otherwise calculate from duration/index
                            frameRange: s.frameRange || { start, end },
                            // Use preserved keyElements if available, otherwise provide sensible default
                            keyElements: s.keyElements || ['animated element', 'brand colors']
                        };
                    })
                }
            } : undefined;

            await fetch(`/api/workflow/${jobId}/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'approve',
                    modifications
                })
            });
        } catch (e) {
            console.error('Failed to submit approval:', e);
        }
    };

    return (
        <div className="flex flex-nowrap h-screen w-full bg-black text-white font-sans overflow-hidden">

            {/* Left Sidebar: Thought Stream */}
            <div className={`${sidebarCollapsed ? 'w-12' : 'w-80'} shrink-0 transition-all duration-300 z-10 hidden md:block`}>
                <ThoughtStream
                    thoughts={state?.thoughts || []}
                    isCollapsed={sidebarCollapsed}
                    onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 bg-black relative">

                {/* Top Header: Progress */}
                <div className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-900/30 backdrop-blur-sm z-20">
                    <div className="flex items-center gap-2">
                        <h1 className="font-heading font-bold text-lg">{state?.brand?.name || 'Untitled Project'}</h1>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                            {state?.config?.style || 'Motion'} Video
                        </span>
                    </div>

                    <div className="flex items-center gap-1">
                        {PHASES.map((phase, idx) => {
                            // Simple logic to check if phase is past
                            const phasesList = Object.values(WorkflowPhase);
                            const currentIdx = phasesList.indexOf(currentPhase);
                            const phaseIdx = phasesList.indexOf(phase.id);

                            const isActive = currentPhase === phase.id;
                            const isComplete = currentIdx > phaseIdx;

                            return (
                                <React.Fragment key={phase.id}>
                                    {idx > 0 && <div className={`w-8 h-[1px] ${isComplete ? 'bg-purple-500' : 'bg-zinc-800'}`} />}
                                    <div className={`flex items-center gap-2 ${isActive ? 'text-white' : isComplete ? 'text-purple-400' : 'text-zinc-600'}`}>
                                        <div className={`
                         w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border
                         ${isActive ? 'bg-purple-500 border-purple-400 animate-pulse' : isComplete ? 'bg-zinc-900 border-purple-500' : 'bg-zinc-900 border-zinc-800'}
                       `}>
                                            {isComplete ? <Check size={12} /> : idx + 1}
                                        </div>
                                        <span className="text-xs font-medium uppercase tracking-wider hidden lg:block">{phase.label}</span>
                                    </div>
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>

                {/* Workspace Area */}
                <div className="flex-1 overflow-hidden p-6 relative">
                    <div className="w-full h-full relative">

                        {/* View Switching */}
                        {isPlanning && activeScenes.length > 0 ? (
                            <ScriptEditor
                                scenes={activeScenes}
                                onScenesChange={setEditedScenes}
                                onSceneSelect={(sceneId) => {
                                    setActiveSceneId(sceneId || '');
                                    setIsEditingScene(!!sceneId);
                                }}
                            />
                        ) : isPlanning && activeScenes.length === 0 ? (
                            // Planning phase but scenes haven't loaded yet
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center space-y-4 animate-pulse">
                                    <Loader2 size={48} className="mx-auto text-purple-500 animate-spin mb-4" />
                                    <p className="text-zinc-400 font-mono text-sm uppercase">Loading Scenes...</p>
                                    <p className="text-zinc-600 text-xs">Preparing your script for review</p>
                                </div>
                            </div>
                        ) : isRefining ? (
                            <LivePreview
                                videoUrl={videoUrl}
                                scenes={activeScenes}
                                sceneStatuses={state?.sceneStatuses}
                                activeSceneId={activeSceneId}
                                onSceneSelect={setActiveSceneId}
                                renderProgress={renderProgress}
                                onNavigateToEditor={onNavigateToEditor ? () => onNavigateToEditor(jobId) : undefined}
                                isComplete={currentPhase === WorkflowPhase.COMPLETE}
                            />
                        ) : (
                            // Error or Initialization states only (COMPLETE is now handled by isRefining -> LivePreview)
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center space-y-4">
                                    {currentPhase === WorkflowPhase.ERROR ? (
                                        <div className="space-y-4">
                                            <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
                                            <p className="text-red-400 font-mono text-sm uppercase">Workflow Error</p>
                                            <p className="text-zinc-500 text-xs">{state?.progress?.currentMessage || 'An error occurred'}</p>
                                        </div>
                                    ) : (
                                        <div className="animate-pulse">
                                            <Loader2 size={48} className="mx-auto text-zinc-700 animate-spin mb-4" />
                                            <p className="text-zinc-500 font-mono text-sm uppercase">Initializing Workflow...</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Planning Phase: Show Continue button when not editing a scene */}
                        {isPlanning && currentPhase === WorkflowPhase.AWAITING_FEEDBACK && !isEditingScene && (
                            <div className="absolute bottom-6 right-6 z-50">
                                <button
                                    onClick={handleApprove}
                                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold rounded-xl shadow-lg shadow-green-900/30 transition-all duration-300 hover:scale-105"
                                >
                                    <Check size={20} />
                                    Continue to Implementation
                                </button>
                            </div>
                        )}

                        {/* Feedback Controls - Only show during PLANNING phase when editing a scene */}
                        {isPlanning && isEditingScene && currentPhase === WorkflowPhase.AWAITING_FEEDBACK && (
                            <div
                                className="absolute z-50 transition-all duration-500 ease-out bottom-4 right-4"
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <FeedbackControls
                                    status={state?.progress?.subStep === 'processing_feedback' ? 'processing' : 'idle'}
                                    targetLabel={`Scene ${activeScenes.find(s => s.id === activeSceneId)?.index! + 1}`}
                                    onSubmit={handleFeedbackSubmit}
                                    compact={true}
                                />
                            </div>
                        )}

                    </div>
                </div>

            </div>
        </div>
    );
};
