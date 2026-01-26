import { AgentOrchestrator, AgentProgress } from '../agent/orchestrator';
import { BrandContext, VideoConfig } from '../agent/types';

// Job storage with detailed progress
export interface JobData {
    status: 'pending' | 'generating' | 'rendering' | 'complete' | 'error';
    progress: string;
    agentProgress?: AgentProgress;
    videoPath?: string;
    error?: string;
    createdAt: Date;
}

export const jobs = new Map<string, JobData>();

/**
 * Generate unique job ID
 */
export function generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get a job by ID
 */
export function getJob(jobId: string): JobData | undefined {
    return jobs.get(jobId);
}

/**
 * Create a new video generation job
 */
export function createJob(jobId: string): JobData {
    const job: JobData = {
        status: 'pending',
        progress: '🚀 Initializing AI agent...',
        agentProgress: {
            stage: 'reasoning',
            message: 'Starting up',
            thought: { type: 'reason', content: 'Initializing agent orchestration...', timestamp: new Date() }
        },
        createdAt: new Date()
    };
    jobs.set(jobId, job);
    return job;
}

/**
 * Start video generation process
 */
export async function startVideoGeneration(
    jobId: string,
    brand: BrandContext,
    config: VideoConfig
): Promise<void> {
    const orchestrator = new AgentOrchestrator();

    // Update progress callback with detailed agent progress including thoughts
    const onProgress = (message: string, status: 'generating' | 'rendering', detail?: AgentProgress) => {
        const job = jobs.get(jobId);
        if (job) {
            job.status = status;
            job.progress = message;
            if (detail) {
                job.agentProgress = detail;
            }
        }
    };

    try {
        const videoPath = await orchestrator.generateVideo(brand, config, onProgress);

        const job = jobs.get(jobId);
        if (job) {
            job.status = 'complete';
            job.progress = '✨ Video ready!';
            job.videoPath = videoPath;
            job.agentProgress = {
                stage: 'observing',
                message: 'Your motion design video is complete',
                thought: { type: 'observe', content: 'Video generation completed successfully!', timestamp: new Date() }
            };
        }
    } catch (error: any) {
        console.error('Generation error:', error);
        const job = jobs.get(jobId);
        if (job) {
            job.status = 'error';
            job.error = error.message || 'Unknown error occurred';
            job.agentProgress = {
                stage: 'observing',
                message: 'Error occurred',
                detail: error.message,
                thought: { type: 'observe', content: `Error: ${error.message}`, timestamp: new Date() }
            };
        }
    }
}

/**
 * Format job status for API response
 */
export function formatJobStatus(job: JobData, jobId: string) {
    // Convert Date objects to ISO strings for JSON serialization
    const agentProgress = job.agentProgress ? {
        ...job.agentProgress,
        thought: job.agentProgress.thought ? {
            ...job.agentProgress.thought,
            timestamp: job.agentProgress.thought.timestamp instanceof Date
                ? job.agentProgress.thought.timestamp.toISOString()
                : job.agentProgress.thought.timestamp
        } : undefined,
        thoughts: job.agentProgress.thoughts?.map(t => ({
            ...t,
            timestamp: t.timestamp instanceof Date ? t.timestamp.toISOString() : t.timestamp
        }))
    } : undefined;

    return {
        status: job.status,
        progress: job.progress,
        agentProgress,
        error: job.error,
        videoUrl: job.videoPath ? `/api/video/${jobId}` : undefined
    };
}
