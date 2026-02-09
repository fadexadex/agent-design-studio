/**
 * Director Agent
 * 
 * The main orchestrating agent for video generation.
 * Manages the entire workflow, coordinates scene agents,
 * and makes high-level decisions about iteration and quality.
 * 
 * State is persisted to Redis for durability and crash recovery.
 */

import { getRedisConnection } from '../../queues/redisConnection.js';
import {
  getDirectorQueue,
  getSceneAgentQueue,
  getSceneRenderQueue,
  getSceneEvaluationQueue,
  getGlobalEvaluationQueue,
} from '../../queues/definitions.js';
import { uiEvents } from '../../events/index.js';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { GoogleGenAI } from '@google/genai';
import { rateLimitedCall } from '../../core/agent/rateLimiter.js';
import {
  BrandContext,
  SceneDefinition,
  VideoPlan,
  SceneState,
  createSceneState,
  AgentReflection,
  createReflection,
  DirectorError,
} from '../types.js';
import {
  DirectorState,
  DirectorPhase,
  createDirectorState,
  serializeState,
  deserializeState,
  getStateRedisKey,
  STATE_TTL_SECONDS,
  getScenesInOrder,
  allScenesPassedLocal,
  hasActiveScenes,
} from './DirectorState.js';
import {
  DirectorCommand,
  StartProjectCommand,
  SceneGeneratedCommand,
  SceneRenderedCommand,
  SceneEvaluationCompleteCommand,
  GlobalEvaluationCompleteCommand,
  EscalateSceneCommand,
  CompleteProjectCommand,
  createCommand,
} from './DirectorCommands.js';
import {
  decideAfterSceneEvaluation,
  decideAfterGlobalEvaluation,
  shouldStartGlobalEvaluation,
  checkDirectorSatisfaction,
  Decision,
} from './DirectorDecisions.js';
import { VIDEO_CONFIG } from '../../core/constants/video.constants.js';

// ============================================================================
// AI Client Singleton
// ============================================================================

let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// ============================================================================
// Director Agent Class
// ============================================================================

export class DirectorAgent {
  private state: DirectorState | null = null;
  private redis = getRedisConnection();

  constructor(private readonly projectId: string) {}

  // ==========================================================================
  // State Management
  // ==========================================================================

  /**
   * Load state from Redis
   */
  async loadState(): Promise<DirectorState | null> {
    const key = getStateRedisKey(this.projectId);
    const data = await this.redis.hgetall(key);

    if (!data || Object.keys(data).length === 0) {
      return null;
    }

    this.state = deserializeState(data);
    return this.state;
  }

  /**
   * Save state to Redis
   */
  async saveState(): Promise<void> {
    if (!this.state) {
      throw new DirectorError('No state to save', 'save', false);
    }

    this.state.stateVersion++;
    this.state.updatedAt = Date.now();

    const key = getStateRedisKey(this.projectId);
    const data = serializeState(this.state);

    await this.redis.hset(key, data);
    await this.redis.expire(key, STATE_TTL_SECONDS);
  }

  /**
   * Get current state
   */
  getState(): DirectorState | null {
    return this.state;
  }

  /**
   * Update phase and save
   */
  private async updatePhase(phase: DirectorPhase): Promise<void> {
    if (!this.state) return;
    
    this.state.phase = phase;
    await this.saveState();

    await uiEvents.directorThinking(this.projectId, {
      thought: `Transitioning to phase: ${phase}`,
      phase: this.mapPhaseToUIPhase(phase),
    });
  }

  /**
   * Add reflection to state
   */
  private addReflection(reflection: AgentReflection): void {
    if (!this.state) return;
    
    this.state.reflections.push(reflection);
    
    // Keep last 50 reflections
    if (this.state.reflections.length > 50) {
      this.state.reflections = this.state.reflections.slice(-50);
    }
  }

  // ==========================================================================
  // Command Handlers
  // ==========================================================================

  /**
   * Handle incoming command
   */
  async handleCommand(command: DirectorCommand): Promise<void> {
    console.log(`[Director:${this.projectId}] Handling command: ${command.type}`);

    try {
      switch (command.type) {
        case 'START_PROJECT':
          await this.handleStartProject(command);
          break;
        case 'RESUME_PROJECT':
          await this.handleResumeProject();
          break;
        case 'SCENE_GENERATED':
          await this.handleSceneGenerated(command);
          break;
        case 'SCENE_RENDERED':
          await this.handleSceneRendered(command);
          break;
        case 'SCENE_EVALUATION_COMPLETE':
          await this.handleSceneEvaluationComplete(command);
          break;
        case 'GLOBAL_EVALUATION_COMPLETE':
          await this.handleGlobalEvaluationComplete(command);
          break;
        case 'ESCALATE_SCENE':
          await this.handleEscalateScene(command);
          break;
        case 'COMPLETE_PROJECT':
          await this.handleCompleteProject(command);
          break;
        case 'FAIL_PROJECT':
          await this.handleFailProject(command);
          break;
        default:
          console.warn(`[Director:${this.projectId}] Unknown command: ${(command as DirectorCommand).type}`);
      }
    } catch (error) {
      console.error(`[Director:${this.projectId}] Error handling command:`, error);
      await this.handleError(error as Error, command.type);
    }
  }

  /**
   * Start a new project
   */
  private async handleStartProject(command: StartProjectCommand): Promise<void> {
    const { brandContext, options } = command.payload;

    // Create initial state
    this.state = createDirectorState({
      projectId: this.projectId,
      brandContext,
      maxGlobalIterations: options?.maxGlobalIterations ?? 5,
    });

    await this.saveState();

    await uiEvents.directorStarted(this.projectId, {
      totalScenes: 0, // Will be updated after planning
      config: {
        maxGlobalIterations: this.state.maxGlobalIterations,
        targetScore: options?.targetScore,
      },
    });

    this.addReflection(createReflection(
      `Starting project for brand "${brandContext.name}"`,
      `Industry: ${brandContext.industry}, Style: ${brandContext.style}, Aspect: ${brandContext.aspectRatio}`,
      'Proceeding to video planning phase',
      0.9
    ));

    // Transition to planning
    await this.updatePhase('planning');
    await this.createVideoPlan();
  }

  /**
   * Resume an existing project
   */
  private async handleResumeProject(): Promise<void> {
    const state = await this.loadState();
    
    if (!state) {
      throw new DirectorError('No state found to resume', 'resume', false);
    }

    this.addReflection(createReflection(
      `Resuming project from phase: ${state.phase}`,
      `Global iteration: ${state.globalIteration}, Scenes: ${Object.keys(state.scenes).length}`,
      'Continuing from last checkpoint',
      0.85
    ));

    // Resume based on current phase
    switch (state.phase) {
      case 'planning':
        await this.createVideoPlan();
        break;
      case 'generating':
        await this.checkAndContinueGeneration();
        break;
      case 'evaluating_local':
        await this.checkAndContinueLocalEvaluation();
        break;
      case 'evaluating_global':
        await this.runGlobalEvaluation();
        break;
      case 'rendering_final':
        await this.renderFinalVideo();
        break;
      default:
        console.log(`[Director:${this.projectId}] No action needed for phase: ${state.phase}`);
    }
  }

  /**
   * Handle scene generated event
   */
  private async handleSceneGenerated(command: SceneGeneratedCommand): Promise<void> {
    if (!this.state) {
      await this.loadState();
      if (!this.state) throw new DirectorError('State not found', 'scene_generated', false);
    }

    const { sceneId, version, code, generationTimeMs } = command.payload;
    const scene = this.state.scenes[sceneId];

    if (!scene) {
      console.warn(`[Director:${this.projectId}] Unknown scene: ${sceneId}`);
      return;
    }

    // Update scene state
    scene.code = code;
    scene.version = version;
    scene.status = 'generated';
    scene.updatedAt = Date.now();

    await this.saveState();

    await uiEvents.sceneGenerated(this.projectId, {
      sceneId,
      sceneIndex: scene.definition.index,
      sceneNumber: scene.definition.index + 1,
      version,
      durationMs: generationTimeMs,
      codeLength: code.length,
    });

    // Queue for rendering
    await this.queueSceneRender(sceneId);
  }

  /**
   * Handle scene rendered event
   */
  private async handleSceneRendered(command: SceneRenderedCommand): Promise<void> {
    if (!this.state) {
      await this.loadState();
      if (!this.state) throw new DirectorError('State not found', 'scene_rendered', false);
    }

    const { sceneId, version, videoPath, renderTimeMs } = command.payload;
    const scene = this.state.scenes[sceneId];

    // DEBUG: Log the videoPath received from SCENE_RENDERED command
    console.log(`[Director:${this.projectId}] SCENE_RENDERED received:`, {
      sceneId,
      version,
      videoPath,
      isAbsolute: videoPath?.startsWith('/'),
      isApiUrl: videoPath?.startsWith('/api'),
    });

    if (!scene) {
      console.warn(`[Director:${this.projectId}] Unknown scene: ${sceneId}`);
      return;
    }

    // Update scene state
    scene.videoPath = videoPath;
    scene.status = 'rendered';
    scene.updatedAt = Date.now();

    await this.saveState();

    await uiEvents.sceneRendered(this.projectId, {
      sceneId,
      sceneIndex: scene.definition.index,
      sceneNumber: scene.definition.index + 1,
      version,
      durationMs: renderTimeMs,
      videoPath,
    });

    // Queue for evaluation
    await this.queueSceneEvaluation(sceneId);
  }

  /**
   * Handle scene evaluation complete
   */
  private async handleSceneEvaluationComplete(
    command: SceneEvaluationCompleteCommand
  ): Promise<void> {
    if (!this.state) {
      await this.loadState();
      if (!this.state) throw new DirectorError('State not found', 'scene_eval', false);
    }

    const { sceneId, evaluatedVersion, score, passed, feedback, details } = command.payload;
    const scene = this.state.scenes[sceneId];

    if (!scene) {
      console.warn(`[Director:${this.projectId}] Unknown scene: ${sceneId}`);
      return;
    }

    // Update scene state
    scene.scoreHistory.push(score);
    scene.lastFeedback = feedback;
    scene.lastEvaluationDetails = details;
    scene.localAttempts++;
    scene.totalAttempts++;
    scene.status = passed ? 'passed' : 'failed';
    scene.updatedAt = Date.now();

    await this.saveState();

    await uiEvents.evaluationCompleted(this.projectId, {
      tier: 1,
      sceneId,
      sceneIndex: scene.definition.index,
      sceneNumber: scene.definition.index + 1,
      evaluatedVersion,
      score,
      passed,
      feedback,
      details,
    });

    // Make decision
    const decision = decideAfterSceneEvaluation(
      this.state,
      sceneId,
      evaluatedVersion,
      score,
      feedback
    );

    await this.executeDecision(decision);
  }

  /**
   * Handle global evaluation complete
   */
  private async handleGlobalEvaluationComplete(
    command: GlobalEvaluationCompleteCommand
  ): Promise<void> {
    if (!this.state) {
      await this.loadState();
      if (!this.state) throw new DirectorError('State not found', 'global_eval', false);
    }

    const {
      globalScore,
      passed,
      narrativeCohesion,
      brandConsistency,
      feedback,
      sceneVersionSnapshot,
      sceneSpecificFeedback,
    } = command.payload;

    // Update global evaluation
    this.state.globalEvaluation = {
      score: globalScore,
      narrativeCohesion,
      brandConsistency,
      feedback,
      sceneVersionSnapshot,
      timestamp: Date.now(),
    };

    await this.saveState();

    await uiEvents.evaluationCompleted(this.projectId, {
      tier: 2,
      score: globalScore,
      passed,
      feedback,
      details: { narrativeCohesion, brandConsistency },
    });

    // Make decision
    const decision = decideAfterGlobalEvaluation(
      this.state,
      globalScore,
      narrativeCohesion,
      brandConsistency,
      feedback,
      sceneSpecificFeedback
    );

    await this.executeDecision(decision);
  }

  /**
   * Handle scene escalation
   */
  private async handleEscalateScene(command: EscalateSceneCommand): Promise<void> {
    if (!this.state) {
      await this.loadState();
      if (!this.state) throw new DirectorError('State not found', 'escalate', false);
    }

    const { sceneId, reason, attempts, lastScore, scoreHistory } = command.payload;
    const scene = this.state.scenes[sceneId];

    if (!scene) {
      console.warn(`[Director:${this.projectId}] Unknown scene: ${sceneId}`);
      return;
    }

    scene.status = 'escalated';
    scene.localAttempts = 0; // Reset for new approach
    scene.updatedAt = Date.now();

    await this.saveState();

    await uiEvents.evaluationEscalated(this.projectId, {
      sceneId,
      sceneIndex: scene.definition.index,
      sceneNumber: scene.definition.index + 1,
      reason,
      attempts,
      lastScore,
    });

    this.addReflection(createReflection(
      `Scene ${sceneId} escalated: ${reason}`,
      `After ${attempts} attempts, best score was ${Math.max(...scoreHistory).toFixed(2)}`,
      'Analyzing scene for strategic intervention',
      0.85
    ));

    // Director intervention - create new prompt/approach
    await this.interventOnScene(sceneId);
  }

  /**
   * Handle project completion
   */
  private async handleCompleteProject(command: DirectorCommand): Promise<void> {
    if (!this.state) {
      await this.loadState();
      if (!this.state) throw new DirectorError('State not found', 'complete', false);
    }

    const { outputPath, finalScore, summary } = (command as any).payload;

    this.state.phase = 'completed';
    this.state.outputPath = outputPath;
    this.state.directorSatisfied = true;
    this.state.completedAt = Date.now();

    await this.saveState();

    await uiEvents.directorCompleted(this.projectId, {
      success: true,
      totalDurationMs: Date.now() - this.state.createdAt,
      finalScore,
      summary,
    });
  }

  /**
   * Handle project failure
   */
  private async handleFailProject(command: DirectorCommand): Promise<void> {
    if (!this.state) {
      await this.loadState();
    }

    const { error, code, phase, recoverable } = (command as any).payload;

    if (this.state) {
      this.state.phase = 'failed';
      this.state.error = {
        message: error,
        code,
        phase: phase as DirectorPhase,
        recoverable,
        timestamp: Date.now(),
      };
      this.state.completedAt = Date.now();

      await this.saveState();
    }

    await uiEvents.directorError(this.projectId, {
      error,
      recoverable,
      phase,
    });
  }

  // ==========================================================================
  // Core Workflow Methods
  // ==========================================================================

  /**
   * Create video plan from brand context using Gemini
   */
  private async createVideoPlan(): Promise<void> {
    if (!this.state) return;

    await uiEvents.directorThinking(this.projectId, {
      thought: 'Analyzing brand context and creating video plan with AI...',
      phase: 'planning',
    });

    const { brandContext } = this.state;

    try {
      // Build the planning prompt
      const planningPrompt = this.buildPlanningPrompt(brandContext);

      // Call Gemini for video plan generation
      const ai = getAIClient();
      const response = await rateLimitedCall(() =>
        ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: planningPrompt,
          config: {
            // Gemini 3 best practice: use default temperature of 1.0
            temperature: 1.0,
            maxOutputTokens: 4096,
            // Use medium thinking for balanced planning
            thinkingConfig: {
              thinkingLevel: 'medium' as any,
            },
          },
        })
      );

      const responseText = response.text || '';
      const generatedPlan = this.parseVideoPlanResponse(responseText, brandContext);

      if (generatedPlan) {
        this.state.videoPlan = generatedPlan;
      } else {
        // Fall back to default plan if parsing fails
        console.warn(`[Director:${this.projectId}] Failed to parse AI plan, using default`);
        this.state.videoPlan = this.createDefaultPlan(brandContext);
      }
    } catch (error) {
      console.error(`[Director:${this.projectId}] AI planning failed:`, error);
      // Fall back to default plan on error
      this.state.videoPlan = this.createDefaultPlan(brandContext);
    }

    // Initialize scene states
    for (const sceneDef of this.state.videoPlan.scenes) {
      this.state.scenes[sceneDef.id] = createSceneState(sceneDef);
    }

    await this.saveState();

    await uiEvents.directorDecision(this.projectId, {
      decision: 'Video plan created',
      reasoning: `Created ${this.state.videoPlan.scenes.length}-scene plan based on brand context`,
      affectedScenes: this.state.videoPlan.scenes.map(s => s.id),
    });

    // Start generation
    await this.updatePhase('generating');
    await this.queueAllSceneGeneration();
  }

  /**
   * Build the prompt for video planning
   */
  private buildPlanningPrompt(brandContext: BrandContext): string {
    const styleDescriptions: Record<string, string> = {
      minimal: 'clean, sparse, elegant with plenty of whitespace',
      bold: 'strong, impactful, high contrast with bold typography',
      elegant: 'sophisticated, refined, subtle animations',
      playful: 'fun, energetic, bouncy animations with vibrant colors',
      corporate: 'professional, trustworthy, structured layouts',
      dynamic: 'energetic, fast-paced, with smooth transitions',
    };

    const styleHint = brandContext.style 
      ? styleDescriptions[brandContext.style] || brandContext.style 
      : 'dynamic and engaging';

    return `You are a motion graphics director creating a ${VIDEO_CONFIG.DURATION_SECONDS}-second (${VIDEO_CONFIG.TOTAL_FRAMES} frames @ ${VIDEO_CONFIG.FPS}fps) brand video.

## Brand Context
- Brand Name: ${brandContext.name}
- Industry: ${brandContext.industry || 'Not specified'}
- Tagline: ${brandContext.tagline || 'None'}
- Primary Color: ${brandContext.colors.primary}
- Secondary Color: ${brandContext.colors.secondary || 'N/A'}
- Accent Color: ${brandContext.colors.accent || 'N/A'}
- Style: ${brandContext.style || 'dynamic'} (${styleHint})
- Aspect Ratio: ${brandContext.aspectRatio}

## Creative Direction (User's Prompt)
${brandContext.prompt}

## CRITICAL: Scene Planning Rules

**Analyze the Creative Direction above for workflow steps or sequential elements.**

1. **If the prompt contains numbered steps, bullet points, or a workflow sequence:**
   - Create ONE scene for EACH step/item in the workflow
   - Example: If the prompt says "Step 1: Show logo, Step 2: Display tagline, Step 3: Show product", create exactly 3 scenes
   - Example: If the prompt lists "5 features to highlight", create 5 scenes (one per feature)

2. **If the prompt describes a sequential process or flow:**
   - Identify each distinct phase or action
   - Create one scene per phase
   - Example: "User signs up, gets verified, starts using the app" = 3 scenes

3. **If no clear steps are provided:**
   - Create 4-6 scenes that tell a logical story
   - Opening → Build-up → Demonstration → Climax → Brand Reveal

## Requirements
- Total duration: exactly ${VIDEO_CONFIG.TOTAL_FRAMES} frames (${VIDEO_CONFIG.DURATION_SECONDS} seconds at ${VIDEO_CONFIG.FPS}fps)
- Scene count: Match the number of steps/items in the workflow (minimum 3, maximum 8 scenes)
- Distribute frames proportionally across scenes (aim for ${Math.round(VIDEO_CONFIG.TOTAL_FRAMES / 5)}-${Math.round(VIDEO_CONFIG.TOTAL_FRAMES / 3)} frames per scene)
- Each scene needs: title, description (for AI code generation), duration in frames
- Scenes should match the brand style and industry

## Response Format
Return ONLY a JSON object (no markdown, no code blocks):
{
  "scenes": [
    {
      "title": "Scene Title",
      "description": "Detailed description of what happens visually in this scene. Include specific elements, animations, and how brand colors should be used. This description will be used by another AI to generate Remotion React code.",
      "durationFrames": ${Math.round(VIDEO_CONFIG.TOTAL_FRAMES / 5)}
    }
  ]
}

Based on the Creative Direction above, create a video plan now:`;
  }

  /**
   * Parse Gemini's video plan response
   */
  private parseVideoPlanResponse(response: string, brandContext: BrandContext): VideoPlan | null {
    try {
      // Try to extract JSON from the response
      let jsonStr = response.trim();
      
      // Remove markdown code blocks if present
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```json?\s*/g, '').replace(/```\s*$/g, '');
      }

      // Try to find JSON object
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn(`[Director:${this.projectId}] No JSON found in response`);
        return null;
      }

      const parsed = JSON.parse(jsonMatch[0]);

      if (!parsed.scenes || !Array.isArray(parsed.scenes) || parsed.scenes.length === 0) {
        console.warn(`[Director:${this.projectId}] Invalid scenes array in response`);
        return null;
      }

      // Validate and normalize scenes
      const scenes: SceneDefinition[] = [];
      let currentFrame = 0;
      let totalFrames = 0;

      for (let i = 0; i < parsed.scenes.length; i++) {
        const scene = parsed.scenes[i];
        if (!scene.title || !scene.description || !scene.durationFrames) {
          console.warn(`[Director:${this.projectId}] Invalid scene at index ${i}`);
          continue;
        }

        // Allow minimum 60 frames (2s) per scene, max 300 frames (10s) for 30-second videos
        // This supports 3-15 scenes (900/60 = 15, 900/300 = 3)
        const durationFrames = Math.max(60, Math.min(300, Number(scene.durationFrames)));

        scenes.push({
          id: `scene-${i}`,
          index: i,
          title: String(scene.title),
          description: String(scene.description),
          durationFrames,
          startFrame: currentFrame,
        });

        currentFrame += durationFrames;
        totalFrames += durationFrames;
      }

      if (scenes.length < 3) {
        console.warn(`[Director:${this.projectId}] Too few valid scenes`);
        return null;
      }

      // Adjust to exactly TOTAL_FRAMES if needed
      const frameDiff = VIDEO_CONFIG.TOTAL_FRAMES - totalFrames;
      if (frameDiff !== 0) {
        // Distribute difference across scenes
        const adjustment = Math.floor(frameDiff / scenes.length);
        let remainder = frameDiff % scenes.length;
        
        for (const scene of scenes) {
          scene.durationFrames += adjustment;
          if (remainder > 0) {
            scene.durationFrames++;
            remainder--;
          } else if (remainder < 0) {
            scene.durationFrames--;
            remainder++;
          }
        }

        // Recalculate start frames
        currentFrame = 0;
        for (const scene of scenes) {
          scene.startFrame = currentFrame;
          currentFrame += scene.durationFrames;
        }
      }

      return {
        totalFrames: VIDEO_CONFIG.TOTAL_FRAMES,
        fps: VIDEO_CONFIG.FPS,
        width: brandContext.aspectRatio === '16:9' ? 1920 : 1080,
        height: brandContext.aspectRatio === '16:9' ? 1080 : 1920,
        scenes,
        aspectRatio: brandContext.aspectRatio,
      };
    } catch (error) {
      console.error(`[Director:${this.projectId}] Error parsing video plan:`, error);
      return null;
    }
  }

  /**
   * Create a default video plan as fallback
   */
  private createDefaultPlan(brandContext: BrandContext): VideoPlan {
    // For 30-second video (900 frames), create 5 scenes of ~180 frames each
    const framesPerScene = Math.round(VIDEO_CONFIG.TOTAL_FRAMES / 5);
    
    return {
      totalFrames: VIDEO_CONFIG.TOTAL_FRAMES,
      fps: VIDEO_CONFIG.FPS,
      width: brandContext.aspectRatio === '16:9' ? 1920 : 1080,
      height: brandContext.aspectRatio === '16:9' ? 1080 : 1920,
      aspectRatio: brandContext.aspectRatio,
      scenes: [
        {
          id: 'scene-0',
          index: 0,
          title: 'Hook',
          description: `Opening hook that grabs attention. Establish the problem or need that ${brandContext.name} solves. Use dynamic, attention-grabbing animations with ${brandContext.colors.primary}.`,
          durationFrames: framesPerScene,
          startFrame: 0,
        },
        {
          id: 'scene-1',
          index: 1,
          title: 'Solution Introduction',
          description: `Introduce ${brandContext.name} as the solution. Show simplicity and ease of use. Use ${brandContext.style || 'dynamic'} style animations with ${brandContext.colors.secondary || brandContext.colors.primary} accents.`,
          durationFrames: framesPerScene,
          startFrame: framesPerScene,
        },
        {
          id: 'scene-2',
          index: 2,
          title: 'Key Feature',
          description: `Showcase the main differentiating feature or capability. Use kinetic typography to highlight "${brandContext.tagline || 'the key benefit'}".`,
          durationFrames: framesPerScene,
          startFrame: framesPerScene * 2,
        },
        {
          id: 'scene-3',
          index: 3,
          title: 'Result/Outcome',
          description: `Show the positive outcome or result of using ${brandContext.name}. Visual representation of success and satisfaction.`,
          durationFrames: framesPerScene,
          startFrame: framesPerScene * 3,
        },
        {
          id: 'scene-4',
          index: 4,
          title: 'Brand Reveal & CTA',
          description: `Final brand reveal with ${brandContext.name} logo/name prominent. Include tagline "${brandContext.tagline || ''}". Memorable closing animation with call to action.`,
          durationFrames: VIDEO_CONFIG.TOTAL_FRAMES - (framesPerScene * 4), // Remaining frames
          startFrame: framesPerScene * 4,
        },
      ],
    };
  }

  /**
   * Queue all scenes for generation
   */
  private async queueAllSceneGeneration(): Promise<void> {
    if (!this.state?.videoPlan) return;

    const queue = getSceneAgentQueue();

    for (const scene of this.state.videoPlan.scenes) {
      const sceneState = this.state.scenes[scene.id];
      sceneState.status = 'generating';
      sceneState.version++;
      sceneState.updatedAt = Date.now();

      await queue.add(`generate-${scene.id}`, {
        projectId: this.projectId,
        sceneId: scene.id,
        sceneIndex: scene.index,
        version: sceneState.version,
        prompt: this.buildScenePrompt(scene),
        brandContext: this.state.brandContext,
      });

      await uiEvents.sceneQueued(this.projectId, {
        sceneId: scene.id,
        sceneIndex: scene.index,
        sceneNumber: scene.index + 1,
        version: sceneState.version,
      });
    }

    await this.saveState();
  }

  /**
   * Queue single scene for rendering
   */
  private async queueSceneRender(sceneId: string): Promise<void> {
    if (!this.state) return;

    const scene = this.state.scenes[sceneId];
    if (!scene?.code) return;

    scene.status = 'rendering';
    scene.updatedAt = Date.now();
    await this.saveState();

    await uiEvents.sceneRendering(this.projectId, {
      sceneId,
      sceneIndex: scene.definition.index,
      sceneNumber: scene.definition.index + 1,
      version: scene.version,
    });

    // Get code path for the scene
    const codePath = `remotion/src/generated/scenes/${this.projectId}/scene-${scene.definition.index}_v${scene.version}.tsx`;

    // Queue to scene render worker
    const queue = getSceneRenderQueue();
    await queue.add(`render-${sceneId}-v${scene.version}`, {
      projectId: this.projectId,
      sceneId,
      sceneIndex: scene.definition.index,
      version: scene.version,
      codePath,
      durationFrames: scene.definition.durationFrames,
      aspectRatio: this.state.videoPlan?.aspectRatio || '16:9',
    });

    console.log(`[Director:${this.projectId}] Queued render for scene ${scene.definition.index} v${scene.version}`);
  }

  /**
   * Queue scene for evaluation
   */
  private async queueSceneEvaluation(sceneId: string): Promise<void> {
    if (!this.state) return;

    const scene = this.state.scenes[sceneId];
    if (!scene?.videoPath) return;

    scene.status = 'evaluating';
    scene.updatedAt = Date.now();
    await this.saveState();

    await uiEvents.evaluationStarted(this.projectId, {
      tier: 1,
      sceneId,
      sceneIndex: scene.definition.index,
      sceneNumber: scene.definition.index + 1,
      version: scene.version,
    });

    const queue = getSceneEvaluationQueue();
    await queue.add(`evaluate-${sceneId}`, {
      projectId: this.projectId,
      sceneId,
      sceneIndex: scene.definition.index,
      version: scene.version,
      code: scene.code,
      videoPath: scene.videoPath,
      brandContext: this.state.brandContext,
    });
  }

  /**
   * Run global evaluation
   */
  private async runGlobalEvaluation(): Promise<void> {
    if (!this.state) return;

    await this.updatePhase('evaluating_global');

    await uiEvents.evaluationStarted(this.projectId, {
      tier: 2,
    });

    const scenes = getScenesInOrder(this.state);
    const queue = getGlobalEvaluationQueue();

    await queue.add(`global-eval-${this.projectId}`, {
      projectId: this.projectId,
      scenes: scenes.map(s => ({
        sceneId: s.definition.id,
        sceneIndex: s.definition.index,
        version: s.version,
        score: s.scoreHistory[s.scoreHistory.length - 1] || 0,
        code: s.code || '',
        videoPath: s.videoPath!,
      })),
      brandContext: this.state.brandContext,
      iterationNumber: this.state.globalIteration,
      previousGlobalScore: this.state.globalEvaluation?.score,
    });
  }

  /**
   * Render final video
   */
  private async renderFinalVideo(): Promise<void> {
    if (!this.state) return;

    await this.updatePhase('rendering_final');

    await uiEvents.renderStarted(this.projectId, {
      phase: 'final',
    });

    try {
      // Get all scenes in order with their video paths
      const scenes = getScenesInOrder(this.state);
      const scenePaths: string[] = [];

      // DEBUG: Log all scene videoPaths before concatenation
      console.log(`[Director:${this.projectId}] renderFinalVideo - Scene video paths:`);
      for (const scene of scenes) {
        console.log(`  - ${scene.definition.id}: ${scene.videoPath} (exists: ${scene.videoPath ? existsSync(scene.videoPath) : false})`);
      }

      for (const scene of scenes) {
        if (!scene.videoPath || !existsSync(scene.videoPath)) {
          throw new Error(`Scene ${scene.definition.id} video not found: ${scene.videoPath}`);
        }
        scenePaths.push(scene.videoPath);
      }

      if (scenePaths.length === 0) {
        throw new Error('No scene videos available for final composition');
      }

      // Create output directory
      const outputDir = path.join(process.cwd(), 'output', 'final', this.projectId);
      await fs.mkdir(outputDir, { recursive: true });

      const outputPath = path.join(outputDir, 'video.mp4');

      await uiEvents.directorThinking(this.projectId, {
        thought: `Composing ${scenePaths.length} scenes into final video...`,
        phase: 'coordinating',
      });

      // Concatenate videos using ffmpeg
      await this.concatenateVideos(scenePaths, outputPath);

      // Calculate final score
      const globalScore = this.state.globalEvaluation?.score || 0;
      const sceneScores = scenes.map(s => 
        s.scoreHistory.length > 0 ? s.scoreHistory[s.scoreHistory.length - 1] : 0
      );
      const avgSceneScore = sceneScores.reduce((a, b) => a + b, 0) / sceneScores.length;
      const finalScore = (globalScore * 0.4) + (avgSceneScore * 0.6);

      await uiEvents.renderCompleted(this.projectId, {
        phase: 'final',
        durationMs: Date.now() - this.state.updatedAt,
        outputPath,
        fileSizeBytes: (await fs.stat(outputPath)).size,
      });

      // Send COMPLETE_PROJECT command
      const command = createCommand<CompleteProjectCommand>(
        'COMPLETE_PROJECT',
        this.projectId,
        {
          outputPath,
          finalScore,
          summary: `Video generated with ${scenes.length} scenes. Global score: ${globalScore.toFixed(2)}, Average scene score: ${avgSceneScore.toFixed(2)}`,
        }
      );

      await getDirectorQueue().add('COMPLETE_PROJECT', command);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[Director:${this.projectId}] Final render failed:`, error);

      await uiEvents.renderError(this.projectId, {
        phase: 'final',
        error: errorMessage,
      });

      await this.handleError(new Error(errorMessage), 'rendering_final');
    }
  }

  /**
   * Concatenate video files using ffmpeg
   */
  private async concatenateVideos(inputPaths: string[], outputPath: string): Promise<void> {
    const listPath = path.join(path.dirname(outputPath), 'concat_list.txt');
    
    try {
      // Create a temporary file list for ffmpeg concat demuxer
      const listContent = inputPaths.map(p => `file '${p}'`).join('\n');
      await fs.writeFile(listPath, listContent);

      console.log(`[Director:${this.projectId}] Concatenating ${inputPaths.length} videos to ${outputPath}`);

      return new Promise((resolve, reject) => {
        // Use ffmpeg concat demuxer (fast, no re-encoding)
        const ffmpeg = spawn('ffmpeg', [
          '-y',                           // Overwrite output
          '-f', 'concat',                 // Use concat demuxer
          '-safe', '0',                   // Allow absolute paths
          '-i', listPath,                 // Input file list
          '-c', 'copy',                   // Copy streams (no re-encoding)
          outputPath
        ]);

        let stderr = '';

        ffmpeg.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        ffmpeg.on('close', async (code) => {
          // Clean up the temp file
          await fs.unlink(listPath).catch(() => {});

          if (code === 0) {
            console.log(`[Director:${this.projectId}] Video concatenation complete`);
            resolve();
          } else {
            console.error(`[Director:${this.projectId}] ffmpeg failed with code ${code}:`, stderr);
            reject(new Error(`ffmpeg failed with code ${code}: ${stderr.slice(-500)}`));
          }
        });

        ffmpeg.on('error', async (err) => {
          await fs.unlink(listPath).catch(() => {});
          reject(new Error(`Failed to spawn ffmpeg: ${err.message}. Is ffmpeg installed?`));
        });
      });
    } catch (error) {
       // Clean up if we failed before spawning or during setup
       await fs.unlink(listPath).catch(() => {});
       throw error;
    }
  }

  /**
   * Director intervention on a problematic scene
   */
  private async interventOnScene(sceneId: string): Promise<void> {
    if (!this.state) return;

    const scene = this.state.scenes[sceneId];
    if (!scene) return;

    await uiEvents.directorThinking(this.projectId, {
      thought: `Analyzing scene "${scene.definition.title}" for intervention...`,
      phase: 'coordinating',
    });

    // TODO: Use Gemini to analyze failures and create new approach
    // For now, regenerate with modified prompt

    scene.status = 'pending';
    scene.localAttempts = 0;
    scene.version++;
    scene.updatedAt = Date.now();

    await this.saveState();

    // Regenerate with new approach
    const queue = getSceneAgentQueue();
    await queue.add(`generate-${sceneId}`, {
      projectId: this.projectId,
      sceneId,
      sceneIndex: scene.definition.index,
      version: scene.version,
      prompt: this.buildScenePrompt(scene.definition, true),
      brandContext: this.state.brandContext,
      previousCode: scene.code,
      feedback: scene.lastFeedback,
    });

    await uiEvents.directorDecision(this.projectId, {
      decision: 'Scene intervention started',
      reasoning: `Applying new creative approach after escalation`,
      affectedScenes: [sceneId],
    });
  }

  // ==========================================================================
  // Decision Execution
  // ==========================================================================

  /**
   * Execute a decision
   */
  private async executeDecision(decision: Decision): Promise<void> {
    this.addReflection(decision.reflection);
    await this.saveState();

    console.log(`[Director:${this.projectId}] Decision: ${decision.type} - ${decision.reasoning}`);

    // Execute commands
    for (const command of decision.commands) {
      const queue = getDirectorQueue();
      await queue.add(command.type, command);
    }

    // Handle state transitions
    switch (decision.type) {
      case 'continue_local':
        await this.checkIfReadyForGlobal();
        break;
      case 'start_global':
        await this.runGlobalEvaluation();
        break;
      case 'accept_output':
        await this.renderFinalVideo();
        break;
      case 'global_iterate':
        if (this.state) {
          this.state.globalIteration++;
          await this.saveState();
        }
        break;
    }
  }

  /**
   * Check if all scenes passed and ready for global evaluation
   */
  private async checkIfReadyForGlobal(): Promise<void> {
    if (!this.state) return;

    const { ready, reason } = shouldStartGlobalEvaluation(this.state);

    if (ready) {
      await uiEvents.directorDecision(this.projectId, {
        decision: 'Starting global evaluation',
        reasoning: reason,
        affectedScenes: Object.keys(this.state.scenes),
      });

      await this.runGlobalEvaluation();
    }
  }

  // ==========================================================================
  // Helpers
  // ==========================================================================

  /**
   * Build scene generation prompt
   */
  private buildScenePrompt(scene: SceneDefinition, newApproach: boolean = false): string {
    let prompt = `Create scene "${scene.title}": ${scene.description}`;
    
    if (newApproach) {
      prompt += '\n\nIMPORTANT: Try a completely different visual approach than before.';
    }

    return prompt;
  }

  /**
   * Check and continue generation
   */
  private async checkAndContinueGeneration(): Promise<void> {
    if (!this.state) return;

    const pendingScenes = Object.values(this.state.scenes).filter(
      s => s.status === 'pending' || s.status === 'generating'
    );

    if (pendingScenes.length > 0) {
      console.log(`[Director:${this.projectId}] ${pendingScenes.length} scenes still generating`);
    }
  }

  /**
   * Check and continue local evaluation
   */
  private async checkAndContinueLocalEvaluation(): Promise<void> {
    await this.checkIfReadyForGlobal();
  }

  /**
   * Handle errors
   */
  private async handleError(error: Error, context: string): Promise<void> {
    console.error(`[Director:${this.projectId}] Error in ${context}:`, error);

    if (this.state) {
      this.state.phase = 'failed';
      this.state.error = {
        message: error.message,
        code: 'DIRECTOR_ERROR',
        phase: this.state.phase,
        recoverable: false,
        timestamp: Date.now(),
      };
      await this.saveState();
    }

    await uiEvents.directorError(this.projectId, {
      error: error.message,
      recoverable: false,
      phase: context,
    });
  }

  /**
   * Map internal phase to UI phase
   */
  private mapPhaseToUIPhase(phase: DirectorPhase): 'planning' | 'coordinating' | 'evaluating' | 'deciding' {
    switch (phase) {
      case 'planning':
        return 'planning';
      case 'generating':
      case 'iterating':
        return 'coordinating';
      case 'evaluating_local':
      case 'evaluating_global':
        return 'evaluating';
      default:
        return 'deciding';
    }
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create or load a Director agent for a project
 */
export async function getDirectorAgent(projectId: string): Promise<DirectorAgent> {
  const agent = new DirectorAgent(projectId);
  await agent.loadState();
  return agent;
}

/**
 * Start a new project with Director
 */
export async function startProject(
  projectId: string,
  brandContext: BrandContext,
  options?: { maxGlobalIterations?: number; targetScore?: number }
): Promise<DirectorAgent> {
  const agent = new DirectorAgent(projectId);
  
  await agent.handleCommand(
    createCommand<StartProjectCommand>('START_PROJECT', projectId, {
      brandContext,
      options,
    })
  );

  return agent;
}
