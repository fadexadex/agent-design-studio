import { useState, useEffect } from 'react';
import { WorkflowState, AgentThought } from '../types';

export function useWorkflowStream(jobId: string | null) {
    const [state, setState] = useState<WorkflowState | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        if (!jobId) {
            setState(null);
            setIsConnected(false);
            return;
        }

        // Connect to SSE endpoint
        const eventSource = new EventSource(`/api/workflow/${jobId}/stream`);

        eventSource.onopen = () => {
            console.log(`[SSE] Connected to workflow ${jobId}`);
            setIsConnected(true);
            setIsError(false);
        };

        eventSource.onerror = (err) => {
            console.error(`[SSE] Error connecting to workflow ${jobId}`, err);
            setIsError(true);
            // EventSource will automatically try to reconnect, so we don't strictly need to close it unless we want to stop retrying.
        };

        // Listen for full state updates
        eventSource.addEventListener('stateUpdate', (event) => {
            try {
                const newState = JSON.parse((event as MessageEvent).data);
                setState(newState);
            } catch (e) {
                console.error('[SSE] Failed to parse stateUpdate', e);
            }
        });

        // Listen for incremental thought updates
        eventSource.addEventListener('thought', (event) => {
            try {
                const thought: AgentThought = JSON.parse((event as MessageEvent).data);
                setState(currentState => {
                    if (!currentState) return null;
                    return {
                        ...currentState,
                        thoughts: [...currentState.thoughts, thought]
                    };
                });
            } catch (e) {
                console.error('[SSE] Failed to parse thought', e);
            }
        });

        // Listen for progress updates
        eventSource.addEventListener('progress', (event) => {
            try {
                const { message, detail } = JSON.parse((event as MessageEvent).data);
                setState(currentState => {
                    if (!currentState) return null;
                    return {
                        ...currentState,
                        progress: {
                            ...currentState.progress,
                            currentMessage: message,
                            subStep: detail
                        }
                    };
                });
            } catch (e) {
                console.error('[SSE] Failed to parse progress', e);
            }
        });

        // Listen for phaseStart (optional, can just rely on stateUpdate)
        // Listen for phaseComplete (optional)

        // Listen for completion
        eventSource.addEventListener('complete', (event) => {
            console.log('[SSE] Workflow complete');
            try {
                // Final state update usually accompanies complete, but just in case
                const finalState = JSON.parse((event as MessageEvent).data);
                setState(finalState);
                eventSource.close();
                setIsConnected(false);
            } catch (e) {
                eventSource.close();
                setIsConnected(false);
            }
        });

        // Listen for error event from server
        eventSource.addEventListener('error', (event) => {
            try {
                const { message } = JSON.parse((event as MessageEvent).data);
                console.error('[SSE] Workflow reported error:', message);
                // We could update state.progress or a separate error field if we had one in local state
            } catch (e) {
                // ignore
            }
        });

        return () => {
            console.log(`[SSE] Closing connection to ${jobId}`);
            eventSource.close();
            setIsConnected(false);
        };
    }, [jobId]);

    return { state, isConnected, isError };
}
