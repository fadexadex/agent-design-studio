import { GoogleGenAI } from '@google/genai';
import { rateLimitedCall } from '../../../core/agent/rateLimiter.js';
import { BrandContext, VideoPlan, SceneDefinition } from '../../types.js';
import { VIDEO_CONFIG } from '../../../core/constants/video.constants.js';

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

export class PlanningService {
  /**
   * Create video plan from brand context using Gemini
   */
  static async createVideoPlan(brandContext: BrandContext): Promise<VideoPlan> {
    try {
      const planningPrompt = this.buildPlanningPrompt(brandContext);

      const ai = getAIClient();
      const response = await rateLimitedCall(() =>
        ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: planningPrompt,
          config: {
            temperature: 1.0,
            maxOutputTokens: 4096,
            thinkingConfig: {
              thinkingLevel: 'medium' as any,
            },
          },
        })
      );

      const responseText = response.text || '';
      const generatedPlan = this.parseVideoPlanResponse(responseText, brandContext);

      if (generatedPlan) {
        return generatedPlan;
      } else {
        console.warn('Failed to parse AI plan, using default');
        return this.createDefaultPlan(brandContext);
      }
    } catch (error) {
      console.error('AI planning failed:', error);
      return this.createDefaultPlan(brandContext);
    }
  }

  private static buildPlanningPrompt(brandContext: BrandContext): string {
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

  private static parseVideoPlanResponse(response: string, brandContext: BrandContext): VideoPlan | null {
    try {
      let jsonStr = response.trim();
      
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```json?\s*/g, '').replace(/```\s*$/g, '');
      }

      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn('No JSON found in response');
        return null;
      }

      const parsed = JSON.parse(jsonMatch[0]);

      if (!parsed.scenes || !Array.isArray(parsed.scenes) || parsed.scenes.length === 0) {
        console.warn('Invalid scenes array in response');
        return null;
      }

      const scenes: SceneDefinition[] = [];
      let currentFrame = 0;
      let totalFrames = 0;

      for (let i = 0; i < parsed.scenes.length; i++) {
        const scene = parsed.scenes[i];
        if (!scene.title || !scene.description || !scene.durationFrames) {
          console.warn(`Invalid scene at index ${i}`);
          continue;
        }

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
        console.warn('Too few valid scenes');
        return null;
      }

      const frameDiff = VIDEO_CONFIG.TOTAL_FRAMES - totalFrames;
      if (frameDiff !== 0) {
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
      console.error('Error parsing video plan:', error);
      return null;
    }
  }

  private static createDefaultPlan(brandContext: BrandContext): VideoPlan {
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
}
