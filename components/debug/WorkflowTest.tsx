import React, { useState } from 'react';
import { useWorkflowStream } from '../../hooks/useWorkflowStream';
import { workflowService } from '../../services/WorkflowService';
import { BrandContext, VideoConfig, WorkflowPhase } from '../../types';

export const WorkflowTest: React.FC = () => {
    const [jobId, setJobId] = useState<string | null>(null);
    const { state, isConnected, isError } = useWorkflowStream(jobId);
    const [loading, setLoading] = useState(false);

    const handleStart = async () => {
        setLoading(true);
        try {
            const dummyBrand: BrandContext = {
                name: 'TestBrand',
                industry: 'Tech',
                colors: ['#000000', '#ffffff'],
                tagline: 'Future is now'
            };

            const dummyConfig: VideoConfig = {
                style: 'minimalist',
                aspectRatio: '16:9',
                resolution: '1080p',
                prompt: 'A test video about AI'
            };

            const newJobId = `job-${Date.now()}`;
            await workflowService.startWorkflow(newJobId, dummyBrand, dummyConfig);
            setJobId(newJobId);
        } catch (e) {
            console.error(e);
            alert('Failed to start workflow');
        } finally {
            setLoading(false);
        }
    };

    const handleFeedback = async (action: 'approve' | 'reject') => {
        if (!jobId) return;
        try {
            await workflowService.sendFeedback(jobId, { action });
        } catch (e) {
            console.error(e);
            alert('Failed to send feedback');
        }
    };

    return (
        <div className="p-4 border rounded shadow-lg bg-gray-50">
            <h2 className="text-xl font-bold mb-4">Workflow Service Test</h2>

            {!jobId ? (
                <button
                    onClick={handleStart}
                    disabled={loading}
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                    {loading ? 'Starting...' : 'Start New Workflow'}
                </button>
            ) : (
                <div>
                    <div className="mb-2">
                        <strong>Job ID:</strong> {jobId} <br />
                        <strong>Status:</strong> {isConnected ? 'Connected' : 'Disconnected'} {isError && '(Error)'}
                    </div>

                    {!state ? (
                        <div>Waiting for state...</div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-white p-4 rounded border">
                                <h3 className="font-bold">Current State</h3>
                                <p>Phase: <span className="text-blue-600 font-mono">{state.currentPhase}</span></p>
                                <p>Round: {state.currentRound} / {state.maxRounds}</p>
                                <p>Progress: {state.progress.currentMessage}</p>
                                {state.progress.subStep && <p className="text-sm text-gray-500">{state.progress.subStep}</p>}
                            </div>

                            <div className="bg-white p-4 rounded border h-48 overflow-y-auto">
                                <h3 className="font-bold sticky top-0 bg-white">Thoughts Stream</h3>
                                {state.thoughts.slice().reverse().map((t, i) => (
                                    <div key={i} className="mb-2 text-sm border-b pb-1">
                                        <span className={`font-bold mr-2 ${t.type === 'reason' ? 'text-purple-600' :
                                                t.type === 'act' ? 'text-green-600' : 'text-blue-600'
                                            }`}>
                                            [{t.type.toUpperCase()}]
                                        </span>
                                        <span>{t.content}</span>
                                    </div>
                                ))}
                            </div>

                            {state.currentPhase === WorkflowPhase.AWAITING_FEEDBACK && (
                                <div className="flex gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded">
                                    <p className="font-bold text-yellow-800">Requires Feedback:</p>
                                    <button onClick={() => handleFeedback('approve')} className="bg-green-500 text-white px-3 py-1 rounded">Approve</button>
                                    <button onClick={() => handleFeedback('reject')} className="bg-red-500 text-white px-3 py-1 rounded">Reject</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
