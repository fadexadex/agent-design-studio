import { config } from 'dotenv';

// Load environment variables from .env.local FIRST
config({ path: '.env.local' });

import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import { AgentOrchestrator, AgentProgress, AgentThought } from './agent/orchestrator';
import workflowRoutes from './routes/workflowRoutes';
import { AI_MODELS } from './agent/models';
import { rateLimitedCall } from './agent/rateLimiter';

const app = express();
const PORT = process.env.PORT || 3001;

// Debug: Check if API key is loaded
console.log('🔑 GEMINI_API_KEY loaded:', process.env.GEMINI_API_KEY ? 'Yes (length: ' + process.env.GEMINI_API_KEY.length + ')' : 'No');

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Job storage with detailed progress
interface JobData {
  status: 'pending' | 'generating' | 'rendering' | 'complete' | 'error';
  progress: string;
  agentProgress?: AgentProgress;
  videoPath?: string;
  error?: string;
  createdAt: Date;
}

const jobs = new Map<string, JobData>();

// Generate unique job ID
const generateJobId = () => `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// API Routes
app.use('/api/workflow', workflowRoutes);

/**
 * POST /api/generate-script
 * Generate a video script using AI based on brand context and video config
 */
app.post('/api/generate-script', async (req, res) => {
  const { brand, config, targetDuration = 45 } = req.body;

  if (!brand || !config) {
    return res.status(400).json({ error: 'Missing brand or config data' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are an expert video scriptwriter for motion design videos. Create a comprehensive video script for a ${targetDuration}-second brand motion design video.

## BRAND INFORMATION
- Company Name: "${brand.name}"
- Industry: ${brand.industry}
- Tagline: "${brand.tagline || 'N/A'}"
- Brand Colors: ${brand.colors?.join(', ') || 'Black and White'}

## VIDEO CONFIGURATION
- Style: ${config.style} (${getStyleDescription(config.style)})
- Aspect Ratio: ${config.aspectRatio}
- Creative Direction: ${config.prompt}

## TARGET DURATION
- Total Duration: ${targetDuration} seconds
- FPS: 30 (so ${targetDuration * 30} total frames)
- Create exactly 5-6 distinct scenes

## REQUIREMENTS
Create a detailed video script broken into 5-6 scenes. Each scene should:
1. Have a clear visual description of what's happening
2. Specify any text/typography that should appear
3. Describe the motion/animation style
4. Indicate how it transitions to the next scene

## OUTPUT FORMAT
Return your response as a JSON object with this exact structure:
{
  "script": "Full narrative script as a single text block describing the entire video",
  "scenes": [
    {
      "id": "scene-1",
      "sceneNumber": 1,
      "description": "Detailed description of what happens in this scene, including visuals, text, and motion",
      "frameRange": { "start": 0, "end": 270 },
      "keyElements": ["element1", "element2", "element3"]
    }
  ]
}

Make the scenes flow naturally and tell a cohesive brand story. The script should be engaging, professional, and match the ${config.style} motion style.

IMPORTANT: Return ONLY valid JSON, no additional text, no markdown code blocks, just the raw JSON object.`;

    console.log('[Script Generation] Generating script for:', brand.name);

    const response = await rateLimitedCall(async () => {
      return await ai.models.generateContent({
        model: AI_MODELS.SMART,
        contents: prompt,
      });
    });

    const responseText = response.text || '';

    if (!responseText) {
      return res.status(500).json({ error: 'AI returned empty response. Please try again.' });
    }

    // Parse the JSON response
    let scriptData;
    try {
      // Try to extract JSON from the response (handle potential markdown wrapping)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        let jsonString = jsonMatch[0];

        // First attempt: try parsing directly
        try {
          scriptData = JSON.parse(jsonString);
        } catch (firstError) {
          // Second attempt: repair the JSON and try again
          console.log('[Script Generation] Initial parse failed, attempting JSON repair...');
          const repairedJson = repairJSON(jsonString);

          try {
            scriptData = JSON.parse(repairedJson);
            console.log('[Script Generation] JSON repair successful');
          } catch (secondError) {
            // Third attempt: more aggressive repair - remove all content between }] and the final }
            console.log('[Script Generation] Standard repair failed, trying aggressive fix...');

            // Find the last valid array closing and trim everything after
            const aggressiveRepair = repairedJson
              .replace(/\}\s*\}\s*\n\s*\}/g, '}\n}')  // Fix triple closing braces
              .replace(/\]\s*\}\s*\}/g, ']}')  // Fix }]} -> ]}
              .replace(/\}\}\s*,/g, '},');  // Fix }}, -> },

            try {
              scriptData = JSON.parse(aggressiveRepair);
              console.log('[Script Generation] Aggressive JSON repair successful');
            } catch (thirdError) {
              throw firstError; // Throw the original error for better debugging
            }
          }
        }
      } else {
        console.error('[Script Generation] No JSON found in response:', responseText);
        return res.status(500).json({ error: 'AI response was not in the expected format. Please try again.' });
      }
    } catch (parseError) {
      console.error('[Script Generation] Failed to parse response:', parseError);
      console.error('[Script Generation] Raw response:', responseText);
      return res.status(500).json({ error: 'Failed to parse AI response. Please try again.' });
    }

    // Validate the response structure
    if (!scriptData.scenes || !Array.isArray(scriptData.scenes) || scriptData.scenes.length === 0) {
      console.error('[Script Generation] Invalid scenes structure:', scriptData);
      return res.status(500).json({ error: 'AI did not generate valid scenes. Please try again.' });
    }

    // Ensure proper frame ranges and structure
    const totalFrames = targetDuration * 30;
    const framesPerScene = Math.floor(totalFrames / scriptData.scenes.length);

    scriptData.scenes = scriptData.scenes.map((scene: any, idx: number) => ({
      id: scene.id || `scene-${idx + 1}`,
      sceneNumber: scene.sceneNumber || idx + 1,
      description: scene.description || '',
      frameRange: scene.frameRange || {
        start: idx * framesPerScene,
        end: Math.min((idx + 1) * framesPerScene, totalFrames)
      },
      keyElements: scene.keyElements || []
    }));

    // Validate each scene has a description
    const invalidScenes = scriptData.scenes.filter((s: any) => !s.description || s.description.length < 10);
    if (invalidScenes.length > 0) {
      console.error('[Script Generation] Some scenes have invalid descriptions');
      return res.status(500).json({ error: 'AI generated incomplete scene descriptions. Please try again.' });
    }

    console.log('[Script Generation] Successfully generated', scriptData.scenes.length, 'scenes');

    res.json(scriptData);
  } catch (error: any) {
    console.error('[Script Generation] Error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to generate script. Please try again.'
    });
  }
});

function getStyleDescription(style: string): string {
  const descriptions: Record<string, string> = {
    minimalist: 'Clean, sparse, elegant with lots of whitespace and subtle animations',
    geometric: 'Sharp shapes, precise movements, mathematical patterns',
    fluid: 'Organic, flowing, soft with curved paths and smooth transitions',
    brutalist: 'Raw, bold, industrial with heavy typography and stark contrasts',
    cinematic: 'Dramatic, lighting-focused, narrative-driven with epic scale'
  };
  return descriptions[style] || 'Modern motion design';
}

/**
 * Attempt to repair common JSON issues from AI-generated responses
 */
function repairJSON(jsonString: string): string {
  let repaired = jsonString;

  // Remove any markdown code blocks
  repaired = repaired.replace(/```json\s*/g, '').replace(/```\s*/g, '');

  // Fix double closing braces/brackets patterns like "]}}" or "}]}"
  // These often appear when the AI adds an extra brace
  repaired = repaired.replace(/\}\s*\}\s*,/g, '},');
  repaired = repaired.replace(/\]\s*\]\s*,/g, '],');

  // Fix pattern where there's an extra } before a },
  // e.g., "value"}\n    }, -> "value"\n    },
  repaired = repaired.replace(/"\s*\}\s*\n(\s*)\},/g, '"\n$1},');
  repaired = repaired.replace(/\]\s*\}\s*\n(\s*)\},/g, ']\n$1},');

  // Fix trailing commas before closing brackets (common AI mistake)
  repaired = repaired.replace(/,(\s*[}\]])/g, '$1');

  // Fix missing commas between array elements (look for }{ or ][ patterns)
  repaired = repaired.replace(/\}(\s*)\{/g, '},$1{');
  repaired = repaired.replace(/\](\s*)\[/g, '],$1[');

  // Try to balance braces - count open vs close
  const openBraces = (repaired.match(/\{/g) || []).length;
  const closeBraces = (repaired.match(/\}/g) || []).length;

  if (closeBraces > openBraces) {
    // Too many closing braces - try to remove extras from the middle
    // Find and remove isolated extra } that appear before a },
    const extraCount = closeBraces - openBraces;
    for (let i = 0; i < extraCount; i++) {
      // Look for patterns like "}\n  }," which indicate an extra brace
      repaired = repaired.replace(/\}\s*\n(\s*)\},/, '\n$1},');
    }
  } else if (openBraces > closeBraces) {
    // Missing closing braces - add them at the end
    repaired = repaired + '}'.repeat(openBraces - closeBraces);
  }

  // Balance brackets similarly
  const openBrackets = (repaired.match(/\[/g) || []).length;
  const closeBrackets = (repaired.match(/\]/g) || []).length;

  if (closeBrackets > openBrackets) {
    const extraCount = closeBrackets - openBrackets;
    for (let i = 0; i < extraCount; i++) {
      repaired = repaired.replace(/\]\s*\n(\s*)\],/, '\n$1],');
    }
  } else if (openBrackets > closeBrackets) {
    repaired = repaired + ']'.repeat(openBrackets - closeBrackets);
  }

  return repaired;
}

/**
 * POST /api/generate
 * Start video generation with brand context and video config
 */
app.post('/api/generate', async (req, res) => {
  const { brand, config } = req.body;

  if (!brand || !config) {
    return res.status(400).json({ error: 'Missing brand or config data' });
  }

  const jobId = generateJobId();
  jobs.set(jobId, {
    status: 'pending',
    progress: '🚀 Initializing AI agent...',
    agentProgress: {
      stage: 'reasoning',
      message: 'Starting up',
      thought: { type: 'reason', content: 'Initializing agent orchestration...', timestamp: new Date() }
    },
    createdAt: new Date()
  });

  // Start async generation
  (async () => {
    try {
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
  })();

  res.json({ jobId });
});

/**
 * GET /api/status/:jobId
 * Check the status of a generation job
 */
app.get('/api/status/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

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

  res.json({
    status: job.status,
    progress: job.progress,
    agentProgress,
    error: job.error,
    videoUrl: job.videoPath ? `/api/video/${jobId}` : undefined
  });
});

/**
 * GET /api/video/:jobId
 * Stream the rendered video file
 */
app.get('/api/video/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);

  if (!job || !job.videoPath) {
    return res.status(404).json({ error: 'Video not found' });
  }

  res.sendFile(job.videoPath);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🎬 Agent Design Studio Backend running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
});

export default app;
