import { v4 as uuidv4 } from 'uuid';
import { BrandContext, VideoConfig, VideoScript } from "../types";

const API_BASE_URL = 'http://localhost:3001/api';

export interface AgentThought {
  type: 'reason' | 'act' | 'observe';
  content: string;
  timestamp: string;
  /**
   * The model's actual thinking summary from Gemini (when includeThoughts is enabled).
   * This is the human-readable summary of the model's internal reasoning process.
   */
  modelThinking?: string;
  /**
   * Opaque thought signature from Gemini for maintaining reasoning context across turns.
   * This should be passed back to the API but not displayed to users.
   */
  thoughtSignature?: string;
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
 * @param brand - Brand context for video generation
 * @param config - Video configuration
 * @param script - Required script with narrative and scenes
 */
export const startWorkflow = async (
  brand: BrandContext,
  config: VideoConfig,
  script: VideoScript
): Promise<string> => {
  // Validate script is provided
  if (!script || !script.scenes || script.scenes.length === 0) {
    throw new Error('Script with scenes is required. Please generate or upload a script first.');
  }

  const jobId = uuidv4();
  const response = await fetch(`${API_BASE_URL}/workflow/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ jobId, brand, config, script }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to start generation');
  }

  const data = await response.json();
  return data.jobId;
};
