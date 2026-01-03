import { v4 as uuidv4 } from 'uuid';
import { BrandContext, VideoConfig } from "../types";

const API_BASE_URL = 'http://localhost:3001/api';

export interface AgentThought {
  type: 'reason' | 'act' | 'observe';
  content: string;
  timestamp: string;
}

export interface AgentProgress {
  stage: 'reasoning' | 'acting' | 'observing' | 'correcting' | 'rendering';
  message: string;
  detail?: string;
  thought?: AgentThought;
  codePreview?: string;
  attempt?: number;
  maxAttempts?: number;
  thoughts?: AgentThought[];
}

interface JobStatus {
  status: 'pending' | 'generating' | 'rendering' | 'complete' | 'error';
  progress: string;
  agentProgress?: AgentProgress;
  videoUrl?: string;
  error?: string;
}

/**
 * Start a workflow generation job
 */
export const startWorkflow = async (
  brand: BrandContext,
  config: VideoConfig
): Promise<string> => {
  const jobId = uuidv4();
  const response = await fetch(`${API_BASE_URL}/workflow/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ jobId, brand, config }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to start generation');
  }

  const data = await response.json();
  return data.jobId;
};

/**
 * Generate a motion video using the AI agent backend
 * @deprecated Use startWorkflow + WorkflowDashboard instead
 */
export const generateMotionVideo = async (
  brand: BrandContext,
  config: VideoConfig,
  onStatusUpdate: (msg: string, agentProgress?: AgentProgress) => void
): Promise<string> => {
  try {
    // Step 1: Start the generation job
    onStatusUpdate("🚀 Connecting to AI agent...", {
      stage: 'reasoning',
      message: 'Initializing connection',
      thought: { type: 'reason', content: 'Starting agent orchestration...', timestamp: new Date().toISOString() }
    });

    const jobId = await startWorkflow(brand, config);

    // Step 2: Poll for status updates
    let lastProgress = '';

    while (true) {
      await new Promise(resolve => setTimeout(resolve, 400)); // Poll every 400ms for smoother updates

      const statusResponse = await fetch(`${API_BASE_URL}/status/${jobId}`);

      if (!statusResponse.ok) {
        throw new Error('Failed to check job status');
      }

      const status: JobStatus = await statusResponse.json();

      // Update progress message if changed
      if (status.progress !== lastProgress) {
        lastProgress = status.progress;
        onStatusUpdate(status.progress, status.agentProgress);
      }

      // Check for completion or error
      if (status.status === 'complete' && status.videoUrl) {
        // Fetch the video and create a blob URL for playback
        const videoResponse = await fetch(`${API_BASE_URL.replace('/api', '')}${status.videoUrl}`);
        if (!videoResponse.ok) {
          throw new Error('Failed to fetch rendered video');
        }

        const videoBlob = await videoResponse.blob();
        return URL.createObjectURL(videoBlob);
      }

      if (status.status === 'error') {
        throw new Error(status.error || 'Generation failed');
      }
    }
  } catch (error: any) {
    console.error("Video Generation Error:", error);

    // Check for network errors (backend not running)
    if (error.message?.includes('fetch') || error.message?.includes('NetworkError') || error.message?.includes('Failed to fetch')) {
      throw new Error("BACKEND_ERROR");
    }

    throw error;
  }
};
