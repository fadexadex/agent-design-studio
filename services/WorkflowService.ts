import {
    BrandContext,
    VideoConfig,
    WorkflowState,
    ImplementationPlan,
    WorkflowPhase
} from '../types';

// Define UserFeedback interface locally if it's not exported from types
// (It wasn't in the list I appended, so I will define it here or add it to types.ts)
// Wait, I missed UserFeedback in types.ts. I should add it there or here.
// I'll add it here for now to avoid another edit step to types.ts effectively.

export interface UserFeedbackPayload {
    action: 'approve' | 'reject' | 'modify';
    message?: string;
    targetPhase?: WorkflowPhase;
    modifications?: {
        plan?: Partial<ImplementationPlan>;
        scenes?: string[];
    };
}

const API_BASE = '/api/workflow';

class WorkflowService {
    /**
     * Start a new workflow
     */
    async startWorkflow(
        jobId: string,
        brand: BrandContext,
        config: VideoConfig
    ): Promise<{ jobId: string, status: string }> {
        const response = await fetch(`${API_BASE}/start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jobId,
                brand,
                config
            }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(error.error || 'Failed to start workflow');
        }

        return response.json();
    }

    /**
     * Send user feedback (approve, reject, modify)
     */
    async sendFeedback(jobId: string, feedback: UserFeedbackPayload): Promise<{ success: true, message: string }> {
        const response = await fetch(`${API_BASE}/${jobId}/feedback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(feedback),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(error.error || 'Failed to send feedback');
        }

        return response.json();
    }

    /**
     * Update the implementation plan directly
     * This is specialized feedback that modifies the plan
     */
    async updatePlan(jobId: string, newPlan: ImplementationPlan): Promise<{ success: true, message: string }> {
        // We treat plan updates as 'modify' feedback
        return this.sendFeedback(jobId, {
            action: 'modify',
            message: 'User updated the implementation plan',
            targetPhase: WorkflowPhase.IMPLEMENTATION, // Or PLANNING? Usually we want to re-implement with new plan
            modifications: {
                plan: newPlan
            }
        });
    }

    /**
     * Restore a checkpoint
     */
    async restoreCheckpoint(jobId: string, checkpointId: string): Promise<{ success: true }> {
        const response = await fetch(`${API_BASE}/${jobId}/checkpoint/${checkpointId}/restore`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(error.error || 'Failed to restore checkpoint');
        }

        return response.json();
    }

    /**
     * Get list of checkpoints
     */
    async getCheckpoints(jobId: string): Promise<any[]> {
        const response = await fetch(`${API_BASE}/${jobId}/checkpoints`);
        if (!response.ok) {
            throw new Error('Failed to fetch checkpoints');
        }
        return response.json();
    }

    /**
     * Resume workflow if paused (generic)
     */
    async continue(jobId: string): Promise<void> {
        const response = await fetch(`${API_BASE}/${jobId}/continue`, {
            method: 'POST'
        });
        if (!response.ok) {
            throw new Error('Failed to continue workflow');
        }
    }
}

export const workflowService = new WorkflowService();
