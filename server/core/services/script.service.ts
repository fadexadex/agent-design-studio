import { GoogleGenAI } from '@google/genai';
import { AI_MODELS } from '../agent/models';
import { rateLimitedCall } from '../agent/rateLimiter';
import { BrandContext, VideoConfig } from '../agent/types';

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

    // Fix double closing braces/brackets patterns
    repaired = repaired.replace(/\}\s*\}\s*,/g, '},');
    repaired = repaired.replace(/\]\s*\]\s*,/g, '],');

    // Fix pattern where there's an extra } before a },
    repaired = repaired.replace(/"\s*\}\s*\n(\s*)\},/g, '"\n$1},');
    repaired = repaired.replace(/\]\s*\}\s*\n(\s*)\},/g, ']\n$1},');

    // Fix trailing commas before closing brackets
    repaired = repaired.replace(/,(\s*[}\]])/g, '$1');

    // Fix missing commas between array elements
    repaired = repaired.replace(/\}(\s*)\{/g, '},$1{');
    repaired = repaired.replace(/\](\s*)\[/g, '],$1[');

    // Balance braces
    const openBraces = (repaired.match(/\{/g) || []).length;
    const closeBraces = (repaired.match(/\}/g) || []).length;

    if (closeBraces > openBraces) {
        const extraCount = closeBraces - openBraces;
        for (let i = 0; i < extraCount; i++) {
            repaired = repaired.replace(/\}\s*\n(\s*)\},/, '\n$1},');
        }
    } else if (openBraces > closeBraces) {
        repaired = repaired + '}'.repeat(openBraces - closeBraces);
    }

    // Balance brackets
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

export interface ScriptScene {
    id: string;
    sceneNumber: number;
    description: string;
    frameRange: { start: number; end: number };
    keyElements: string[];
}

export interface ScriptData {
    script: string;
    scenes: ScriptScene[];
}

/**
 * Generate a video script using AI based on brand context and video config
 */
export async function generateScriptFromAI(
    brand: BrandContext,
    config: VideoConfig,
    targetDuration: number = 45
): Promise<ScriptData> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY not configured');
    }

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
        throw new Error('AI returned empty response. Please try again.');
    }

    // Parse the JSON response
    let scriptData: ScriptData;

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        console.error('[Script Generation] No JSON found in response:', responseText);
        throw new Error('AI response was not in the expected format. Please try again.');
    }

    const jsonString = jsonMatch[0];

    try {
        scriptData = JSON.parse(jsonString);
    } catch (firstError) {
        console.log('[Script Generation] Initial parse failed, attempting JSON repair...');
        const repairedJson = repairJSON(jsonString);

        try {
            scriptData = JSON.parse(repairedJson);
            console.log('[Script Generation] JSON repair successful');
        } catch (secondError) {
            console.log('[Script Generation] Standard repair failed, trying aggressive fix...');

            const aggressiveRepair = repairedJson
                .replace(/\}\s*\}\s*\n\s*\}/g, '}\n}')
                .replace(/\]\s*\}\s*\}/g, ']}')
                .replace(/\}\}\s*,/g, '},');

            try {
                scriptData = JSON.parse(aggressiveRepair);
                console.log('[Script Generation] Aggressive JSON repair successful');
            } catch (thirdError) {
                console.error('[Script Generation] Failed to parse response:', firstError);
                console.error('[Script Generation] Raw response:', responseText);
                throw new Error('Failed to parse AI response. Please try again.');
            }
        }
    }

    // Validate the response structure
    if (!scriptData.scenes || !Array.isArray(scriptData.scenes) || scriptData.scenes.length === 0) {
        console.error('[Script Generation] Invalid scenes structure:', scriptData);
        throw new Error('AI did not generate valid scenes. Please try again.');
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
        throw new Error('AI generated incomplete scene descriptions. Please try again.');
    }
    console.log('[Script Generation] Script data:', scriptData);    
    console.log('[Script Generation] Successfully generated', scriptData.scenes.length, 'scenes');

    return scriptData;
}
