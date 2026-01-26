/**
 * Editor Prompts
 * 
 * Prompt templates for Gemini to edit and add scenes.
 */

import { BrandContext, GenerationConfig, EditorScene } from './EditorState';

/**
 * Build a prompt for editing existing scenes.
 */
export function buildSceneEditPrompt(
  brand: BrandContext,
  config: GenerationConfig,
  scenes: EditorScene[],
  allSceneCodes: { [key: number]: string },
  userPrompt: string
): string {
  // Build scene code sections
  const targetScenes = scenes.map(s => {
    const code = allSceneCodes[s.sceneNumber] || '';
    return `### Scene ${s.sceneNumber}: ${s.title}
Description: ${s.description}

\`\`\`tsx
${code}
\`\`\``;
  }).join('\n\n');

  // Find adjacent scenes for context
  const allSceneNumbers = Object.keys(allSceneCodes).map(Number).sort((a, b) => a - b);
  const targetNumbers = scenes.map(s => s.sceneNumber);
  
  const adjacentCodes: string[] = [];
  for (const num of targetNumbers) {
    const idx = allSceneNumbers.indexOf(num);
    if (idx > 0) {
      const prevNum = allSceneNumbers[idx - 1];
      if (!targetNumbers.includes(prevNum) && allSceneCodes[prevNum]) {
        adjacentCodes.push(`### Previous Scene ${prevNum} (for context, do not modify):
\`\`\`tsx
${allSceneCodes[prevNum]}
\`\`\``);
      }
    }
    if (idx < allSceneNumbers.length - 1) {
      const nextNum = allSceneNumbers[idx + 1];
      if (!targetNumbers.includes(nextNum) && allSceneCodes[nextNum]) {
        adjacentCodes.push(`### Next Scene ${nextNum} (for context, do not modify):
\`\`\`tsx
${allSceneCodes[nextNum]}
\`\`\``);
      }
    }
  }

  return `You are a senior Remotion developer editing scenes in a motion design video.

## BRAND CONTEXT
- Name: ${brand.name}
- Industry: ${brand.industry}
- Style: ${config.style}
- Colors: ${brand.colors.join(', ')}
- Tagline: ${brand.tagline}

## TARGET SCENES TO EDIT
${targetScenes}

${adjacentCodes.length > 0 ? `## ADJACENT SCENES (for visual continuity reference)
${adjacentCodes.join('\n\n')}` : ''}

## USER REQUEST
${userPrompt}

## INSTRUCTIONS
1. Analyze the user's request carefully
2. Determine which of the target scenes need modification
3. Generate updated code that:
   - Maintains Remotion best practices
   - Uses ONLY these imports: AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Sequence from 'remotion'
   - Keeps brand colors consistent (use the exact hex values provided)
   - Ensures smooth visual continuity with adjacent scenes
   - Preserves the overall style: ${config.style}

## CRITICAL RULES
- Each scene component MUST be a named export (e.g., \`export const Scene1: React.FC = () => { ... }\`)
- Use \`useCurrentFrame()\` for frame-based animations
- Use \`interpolate()\` with \`extrapolateRight: 'clamp'\` for bounded animations
- Use \`spring()\` for physics-based motion
- Do NOT use external animation libraries
- Do NOT change the component name (Scene1 must remain Scene1, etc.)

## OUTPUT FORMAT
Return ONLY valid JSON (no markdown code blocks, no explanations):
{
  "scenesToUpdate": [
    {
      "sceneNumber": <number>,
      "code": "<complete TypeScript/React code for the scene>",
      "summary": "<brief description of changes made>"
    }
  ],
  "reasoning": "<explanation of your approach and changes>"
}

Return ONLY the JSON object, nothing else.`;
}

/**
 * Build a prompt for adding a new scene.
 */
export function buildAddScenePrompt(
  brand: BrandContext,
  config: GenerationConfig,
  existingScenes: EditorScene[],
  afterSceneNumber: number | undefined,
  prevSceneCode: string,
  nextSceneCode: string,
  userPrompt: string
): string {
  // Build existing scenes summary
  const scenesSummary = existingScenes
    .sort((a, b) => a.order - b.order)
    .map(s => `- Scene ${s.sceneNumber}: ${s.title} - ${s.description}`)
    .join('\n');

  // Determine new scene number
  const maxNumber = Math.max(...existingScenes.map(s => s.sceneNumber), 0);
  const newSceneNumber = maxNumber + 1;

  return `You are a senior Remotion developer creating a new scene for a motion design video.

## BRAND CONTEXT
- Name: ${brand.name}
- Industry: ${brand.industry}
- Style: ${config.style}
- Colors: ${brand.colors.join(', ')}
- Tagline: ${brand.tagline}

## EXISTING SCENES
${scenesSummary}

## INSERT POSITION
${afterSceneNumber ? `After Scene ${afterSceneNumber}` : 'At the end of the video'}

## NEW SCENE NUMBER
This will be Scene${newSceneNumber}

${prevSceneCode ? `## PREVIOUS SCENE CODE (for continuity)
\`\`\`tsx
${prevSceneCode}
\`\`\`` : ''}

${nextSceneCode ? `## NEXT SCENE CODE (for continuity)
\`\`\`tsx
${nextSceneCode}
\`\`\`` : ''}

## USER REQUEST
${userPrompt}

## INSTRUCTIONS
Generate a new scene that:
1. Follows the ${config.style} design style
2. Uses brand colors: ${brand.colors.join(', ')}
3. Creates smooth visual transitions from the previous scene
4. Leads naturally into the next scene (if any)
5. Duration: 150-300 frames (5-10 seconds at 30fps)

## CRITICAL RULES
- Export the component as: \`export const Scene${newSceneNumber}: React.FC = () => { ... }\`
- Use ONLY these imports: AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Sequence from 'remotion'
- Use \`useCurrentFrame()\` for frame-based animations
- Use \`interpolate()\` with \`extrapolateRight: 'clamp'\` for bounded animations
- Do NOT use external animation libraries or fonts (unless they're system fonts)

## OUTPUT FORMAT
Return ONLY valid JSON (no markdown code blocks, no explanations):
{
  "code": "<complete TypeScript/React code for the new scene>",
  "title": "<short title for the scene>",
  "description": "<description of what this scene shows>",
  "suggestedDuration": <number of frames, between 150-300>
}

Return ONLY the JSON object, nothing else.`;
}

/**
 * Parse the edit response from Gemini.
 */
export interface EditResponseScene {
  sceneNumber: number;
  code: string;
  summary: string;
}

export interface EditResponse {
  scenesToUpdate: EditResponseScene[];
  reasoning: string;
}

export function parseEditResponse(responseText: string): EditResponse {
  // Try to extract JSON from the response
  let jsonText = responseText.trim();

  // Remove markdown code blocks if present
  const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonText = jsonMatch[1].trim();
  }

  // Try to find JSON object in the response
  const objectMatch = jsonText.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    jsonText = objectMatch[0];
  }

  try {
    const parsed = JSON.parse(jsonText);
    return {
      scenesToUpdate: Array.isArray(parsed.scenesToUpdate) ? parsed.scenesToUpdate : [],
      reasoning: parsed.reasoning || '',
    };
  } catch (error) {
    console.error('Failed to parse edit response:', error);
    console.error('Response text:', responseText.substring(0, 500));
    return {
      scenesToUpdate: [],
      reasoning: 'Failed to parse AI response',
    };
  }
}

/**
 * Parse the add scene response from Gemini.
 */
export interface AddSceneResponse {
  code: string;
  title: string;
  description: string;
  suggestedDuration: number;
}

export function parseAddSceneResponse(responseText: string): AddSceneResponse {
  // Try to extract JSON from the response
  let jsonText = responseText.trim();

  // Remove markdown code blocks if present
  const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonText = jsonMatch[1].trim();
  }

  // Try to find JSON object in the response
  const objectMatch = jsonText.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    jsonText = objectMatch[0];
  }

  try {
    const parsed = JSON.parse(jsonText);
    return {
      code: parsed.code || '',
      title: parsed.title || 'New Scene',
      description: parsed.description || '',
      suggestedDuration: parsed.suggestedDuration || 200,
    };
  } catch (error) {
    console.error('Failed to parse add scene response:', error);
    console.error('Response text:', responseText.substring(0, 500));
    return {
      code: '',
      title: 'New Scene',
      description: '',
      suggestedDuration: 200,
    };
  }
}
