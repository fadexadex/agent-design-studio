import { GoogleGenAI } from '@google/genai';
import { AI_MODELS } from '../agent/models';
import { rateLimitedCall } from '../agent/rateLimiter';
import { BrandContext, VideoConfig } from '../agent/types';
import { VIDEO_CONFIG, STORY_PHASES } from '../constants/video.constants';
import {
    StoryScript,
    Scene,
    Moment,
    TextElement,
    StoryPhase,
    LegacyVideoScript,
    storyScriptToLegacy,
} from '../types/script.types';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getStyleDescription(style: string): string {
    const descriptions: Record<string, string> = {
        minimalist: 'Clean, sparse, elegant with lots of whitespace and subtle animations. Think Apple or Stripe.',
        geometric: 'Sharp shapes, precise movements, mathematical patterns. Angular and structured.',
        fluid: 'Organic, flowing, soft with curved paths and smooth transitions. Like water or silk.',
        brutalist: 'Raw, bold, industrial with heavy typography and stark contrasts. Unapologetically direct.',
        cinematic: 'Dramatic, lighting-focused, narrative-driven with epic scale. Film-like quality.'
    };
    return descriptions[style] || 'Modern motion design';
}

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

// ============================================================================
// TIMING CALCULATION
// ============================================================================

interface TimingPhase {
    name: string;
    intensityCurve: 'intro' | 'build' | 'peak' | 'sustain' | 'release';
    frameAllocation: number;
}

const NARRATIVE_PACING: TimingPhase[] = [
    { name: 'problem', intensityCurve: 'intro', frameAllocation: 0.17 },      // 0-5s
    { name: 'solution', intensityCurve: 'build', frameAllocation: 0.17 },    // 5-10s
    { name: 'magic', intensityCurve: 'peak', frameAllocation: 0.20 },        // 10-16s
    { name: 'result', intensityCurve: 'sustain', frameAllocation: 0.16 },    // 16-21s
    { name: 'brand-reveal', intensityCurve: 'release', frameAllocation: 0.30 } // 21-30s
];

function calculateMomentTiming(
    moments: Moment[],
    sceneStartFrame: number,
    sceneDuration: number,
    fps: number
): Moment[] {
    const totalSuggestedMs = moments.reduce(
        (sum, m) => sum + (m.timing?.durationMs || 1000),
        0
    );

    let currentFrame = sceneStartFrame;

    return moments.map((moment, idx) => {
        const weight = (moment.timing?.durationMs || 1000) / totalSuggestedMs;
        const momentFrames = Math.floor(sceneDuration * weight);

        const frameDuration = idx === moments.length - 1
            ? (sceneStartFrame + sceneDuration - currentFrame)
            : momentFrames;

        const timedMoment = {
            ...moment,
            timing: {
                startFrame: currentFrame,
                endFrame: currentFrame + frameDuration - 1,
                durationMs: (frameDuration / fps) * 1000
            }
        };

        currentFrame += frameDuration;
        return timedMoment;
    });
}

function calculateDynamicTiming(
    scenes: Scene[],
    totalFrames: number,
    fps: number
): Scene[] {
    // Group scenes by story phase and calculate timing
    const phaseFrames: Record<string, number> = {};
    NARRATIVE_PACING.forEach(phase => {
        phaseFrames[phase.name] = Math.floor(totalFrames * phase.frameAllocation);
    });

    // Count scenes per phase
    const scenesByPhase: Record<string, Scene[]> = {};
    scenes.forEach(scene => {
        if (!scenesByPhase[scene.storyPhase]) {
            scenesByPhase[scene.storyPhase] = [];
        }
        scenesByPhase[scene.storyPhase].push(scene);
    });

    let currentFrame = 0;

    return scenes.map((scene) => {
        const phaseScenes = scenesByPhase[scene.storyPhase] || [scene];
        const phaseIndex = phaseScenes.indexOf(scene);
        const totalPhaseFrames = phaseFrames[scene.storyPhase] || 150;
        const scenesInPhase = phaseScenes.length;

        // Distribute phase frames among scenes in that phase
        const sceneDuration = Math.floor(totalPhaseFrames / scenesInPhase);

        const sceneWithTiming = {
            ...scene,
            frameRange: {
                start: currentFrame,
                end: currentFrame + sceneDuration - 1
            },
            moments: calculateMomentTiming(scene.moments, currentFrame, sceneDuration, fps)
        };

        currentFrame += sceneDuration;
        return sceneWithTiming;
    });
}

// ============================================================================
// STORY-DRIVEN PROMPT BUILDER
// ============================================================================

function buildStoryDrivenPrompt(brand: BrandContext, config: VideoConfig): string {
    return `You are an expert motion design storyteller creating kinetic typography-driven videos. Think like a choreographer where TEXT is the lead dancer, not just a label.

## BRAND & CONTEXT
- Product Name: "${brand.name}"
- What it does: ${brand.tagline || 'N/A'}
- Industry: ${brand.industry}
- Brand Colors: ${brand.colors?.join(', ') || 'Not specified'}
- Visual Style: ${config.style} (${getStyleDescription(config.style)})
- Creative Direction: ${config.prompt}
- Target Duration: ${VIDEO_CONFIG.DURATION_SECONDS} seconds at ${VIDEO_CONFIG.FPS}fps = ${VIDEO_CONFIG.TOTAL_FRAMES} total frames

## CRITICAL PHILOSOPHY: TEXT IS THE STORY

In great motion design (like Apple, Stripe, or modern SaaS ads), TEXT isn't decoration - it's the PRIMARY visual character. Visual elements (icons, shapes, UI) SUPPORT the text, not the other way around.

**Your entire video must be text-driven:**
- Every moment MUST have text elements
- Text should dance, bounce, slide, catch-up, replace, morph
- Text tells the story, visuals reinforce it
- Sound syncs with text entrances

## CRITICAL: STORY-DRIVEN STRUCTURE (Not Feature List!)

**DO NOT start with the brand name!** Tell a STORY that leads to the brand reveal at the END.

Your script must follow this NARRATIVE ARC:

**Problem Phase (0-5s / ~0-17%):**
- Show the user's situation or need
- Use text to ask a question or establish context
- Visual: Simple object or scene representing the problem
- Example: "Got stuff you don't need?" with unused textbook
- NO BRAND YET!

**Solution Phase (5-10s / ~17-33%):**
- Show how easy it is to use the product
- Text-driven instructions: "Just [action]"
- Visual: Phone, upload, simple interaction
- Example: "Just snap and post" with camera click → Done!
- STILL NO BRAND!

**Magic Phase (10-16s / ~33-53%):**
- Reveal what makes this special/powerful
- Show the transformation or connection happening
- Text reveals capability: "Students on campus see it"
- Visual: Network visualization, multiplication, distribution
- BRAND STILL HIDDEN!

**Result Phase (16-21s / ~53-70%):**
- Show the successful outcome
- Text summarizes value: "Meet. Exchange. Done."
- Visual: Two parties connecting, transaction completing
- WAITING FOR BRAND...

**Brand Reveal Phase (21-30s / ~70-100%):**
- Bouncing/rhythmic text summary of core values
- Text: "[Verb 1]. [Verb 2]. [Verb 3]." (3 verbs representing core value props)
- These morph/converge into brand logo
- Brand name appears FOR THE FIRST TIME
- Tagline appears below
- Example: Dot bounces → 3 words appear → merge into "${brand.name}"

**THIS IS CRUCIAL:** The brand name "${brand.name}" should ONLY appear in scenes with storyPhase "brand-reveal". Before that, you're telling a story about the user's journey.

## SCENE COUNT IS FLEXIBLE

- The 5-phase structure is the NARRATIVE FRAMEWORK
- You can have multiple scenes per phase (e.g., 2 scenes in the "magic" phase)
- Typical video has 5-8 scenes total
- Each scene must be tagged with its storyPhase
- Total duration must fit within ${VIDEO_CONFIG.DURATION_SECONDS} seconds

## TEXT CHOREOGRAPHY PATTERNS (Use at least 3)

### Pattern 1: Catch-Up Animation
"Turn" enters first, moves upward
"Books" appears delayed, animates to catch up
Final: "Turn Books" (aligned)

### Pattern 2: Text Replacement Cycle
"Sell" appears → slides left → exits
"Find" enters from right → same position → exits
"Connect" replaces "Find"

### Pattern 3: Bounce Sequence
Ball/star bounces from top
Bounce 1: "[Verb 1]." appears
Bounce 2: "[Verb 2]." appears
Bounce 3: "[Verb 3]." appears

### Pattern 4: Text Makes Space
"Any language" appears center
"Any language" slides LEFT
Icon appears RIGHT (simultaneously)

### Pattern 5: Text Morphs to Element
"Upload" text appears
"Upload" morphs into upload icon/button

### Pattern 6: Word-by-Word Build
"Just" enters
"drop" enters
"and go" enters
All three exist simultaneously

## TEXT ANIMATION VOCABULARY

**Entrances:** slide-up, slide-down, slide-left, slide-right, catch-up, bounce, word-by-word, letter-by-letter, fade, fade-scale, morph, pop

**Holds:** static, breathe, float, pulse

**Exits:** slide-left, slide-right, slide-up, slide-down, fade, morph-into, scale-down

## OUTPUT FORMAT

Return ONLY valid JSON (no markdown, no explanations) with this structure:

{
  "title": "Brief title for this video",
  "totalDuration": ${VIDEO_CONFIG.DURATION_SECONDS},
  "totalFrames": ${VIDEO_CONFIG.TOTAL_FRAMES},
  "fps": ${VIDEO_CONFIG.FPS},
  "narrative": {
    "hook": "One sentence describing the opening moment",
    "journey": "2-3 sentences describing the transformation arc",
    "resolution": "One sentence describing how it concludes with brand reveal"
  },
  "textNarrative": {
    "openingMessage": "What text says in opening (e.g., 'Got stuff you don't need?')",
    "coreFeatures": ["Verb 1", "Verb 2", "Verb 3"],
    "closingMessage": "Tagline (e.g., 'Your campus economy')"
  },
  "scenes": [
    {
      "id": "scene-1",
      "sceneNumber": 1,
      "title": "Short evocative title",
      "purpose": "What this scene accomplishes",
      "storyPhase": "problem",
      "visualTheme": "Description of visual approach",
      "textTheme": "Description of text choreography pattern used",
      "dominantColor": "#hexcolor",
      "moments": [
        {
          "id": "moment-1",
          "sequence": 1,
          "timing": {
            "startFrame": 0,
            "endFrame": 0,
            "durationMs": 2000
          },
          "narrative": "What's happening in this beat",
          "visualAction": "Specific description of the motion/animation",
          "storyPurpose": "hook",
          "textElements": [
            {
              "id": "text-1",
              "sequence": 1,
              "content": "The actual text that appears",
              "typography": {
                "size": 64,
                "weight": 700,
                "color": "#hexcolor",
                "font": "sans-serif",
                "letterSpacing": "0.02em"
              },
              "choreography": {
                "entrance": {
                  "type": "slide-up",
                  "duration": 600,
                  "easing": "ease-out",
                  "startPosition": { "x": 0, "y": 100 },
                  "endPosition": { "x": 0, "y": 0 }
                },
                "hold": {
                  "duration": 1000,
                  "animation": "breathe"
                },
                "exit": {
                  "type": "slide-left",
                  "duration": 400,
                  "easing": "ease-in",
                  "endPosition": { "x": -200, "y": 0 }
                }
              },
              "position": { "x": 0, "y": 0, "align": "center" },
              "layer": 3,
              "personality": "playful",
              "purpose": "headline",
              "interactions": []
            }
          ],
          "visualElements": [
            {
              "id": "element-1",
              "name": "element_name",
              "type": "icon",
              "state": "entering",
              "properties": {}
            }
          ],
          "sound": [
            {
              "type": "effect",
              "description": "slide whoosh",
              "timing": "on-text-entrance",
              "syncWith": "text-1"
            }
          ],
          "energyLevel": "intro",
          "emotionalTone": "calm"
        }
      ],
      "frameRange": { "start": 0, "end": 0 }
    }
  ],
  "recurringMotifs": ["kinetic_typography", "brand_color_accent"],
  "colorJourney": ["#ffffff", "${brand.colors?.[0] || '#2563eb'}"],
  "audioNarrative": "Sound design approach description"
}

## CRITICAL REQUIREMENTS

1. **Brand name "${brand.name}" appears ONLY in scenes with storyPhase "brand-reveal"**
2. **Every moment has textElements array (NEVER empty)**
3. **Text choreography must be complete: entrance required, hold and exit optional**
4. **Text has personality**: playful/bold/calm/energetic/subtle
5. **Text has purpose**: headline/feature/instruction/value-prop/brand/tagline
6. **storyPhase must be one of**: "problem", "solution", "magic", "result", "brand-reveal"
7. **Aim for 5-8 scenes total**, flexible distribution across phases
8. **Total duration: ${VIDEO_CONFIG.DURATION_SECONDS} seconds exactly**

Create a script where typography PERFORMS, not just appears.

Return ONLY the JSON object, nothing else.`;
}

// ============================================================================
// TEXT TRANSFORM PROMPT (for user uploads)
// ============================================================================

function buildTransformPrompt(plainText: string, brand: BrandContext, config: VideoConfig): string {
    return `You are an expert motion design storyteller. Transform the following user-provided text/idea into a professional 30-second story-driven video script.

## USER'S INPUT
"${plainText}"

## BRAND CONTEXT
- Product Name: "${brand.name}"
- Industry: ${brand.industry}
- Tagline: "${brand.tagline || 'N/A'}"
- Brand Colors: ${brand.colors?.join(', ') || 'Not specified'}
- Visual Style: ${config.style}

## YOUR TASK
Transform the user's input into a complete story-driven script following the 5-phase narrative arc:

1. **Problem Phase** (0-5s): Establish the user need - NO BRAND
2. **Solution Phase** (5-10s): Show ease of use - NO BRAND
3. **Magic Phase** (10-16s): Reveal special capability - NO BRAND
4. **Result Phase** (16-21s): Show successful outcome - NO BRAND
5. **Brand Reveal Phase** (21-30s): Value summary → Brand name "${brand.name}" → Tagline

## RULES
- Extract the core story/message from the user's text
- Structure it into the 5-phase narrative arc
- Brand name "${brand.name}" appears ONLY in brand-reveal phase
- Every moment needs text with choreography
- Total duration: 30 seconds (900 frames at 30fps)

${buildStoryDrivenPrompt(brand, config).split('## OUTPUT FORMAT')[1]}`;
}

// ============================================================================
// MAIN GENERATION FUNCTIONS
// ============================================================================

/**
 * Generate a story-driven video script using AI
 * Duration is fixed at 30 seconds (900 frames @ 30fps)
 */
export async function generateStoryScript(
    brand: BrandContext,
    config: VideoConfig
): Promise<StoryScript> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY not configured');
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = buildStoryDrivenPrompt(brand, config);

    console.log('[Script Generation] Generating story script for:', brand.name);
    console.log('[Script Generation] Fixed duration:', VIDEO_CONFIG.DURATION_SECONDS, 'seconds');

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

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        console.error('[Script Generation] No JSON found in response');
        throw new Error('AI response was not in expected format. Please try again.');
    }

    let scriptData: StoryScript;
    const jsonString = jsonMatch[0];

    try {
        scriptData = JSON.parse(jsonString);
    } catch (firstError) {
        console.log('[Script Generation] Initial parse failed, attempting repair...');
        const repairedJson = repairJSON(jsonString);

        try {
            scriptData = JSON.parse(repairedJson);
            console.log('[Script Generation] JSON repair successful');
        } catch (secondError) {
            console.error('[Script Generation] Failed to parse:', firstError);
            console.error('[Script Generation] Raw response:', responseText);
            throw new Error('Failed to parse AI response. Please try again.');
        }
    }

    // Validate structure
    if (!scriptData.scenes || !Array.isArray(scriptData.scenes) || scriptData.scenes.length === 0) {
        console.error('[Script Generation] Invalid scenes structure');
        throw new Error('AI did not generate valid scenes. Please try again.');
    }

    // Validate each scene has moments with text
    for (const scene of scriptData.scenes) {
        if (!scene.moments || !Array.isArray(scene.moments) || scene.moments.length === 0) {
            console.error('[Script Generation] Scene missing moments:', scene.id);
            throw new Error(`Scene ${scene.id} has no moments. Please try again.`);
        }

        // Ensure storyPhase is set
        if (!scene.storyPhase) {
            scene.storyPhase = 'problem'; // Default fallback
        }

        // Validate moments have text elements
        for (const moment of scene.moments) {
            if (!moment.textElements || moment.textElements.length === 0) {
                console.warn('[Script Generation] Moment missing text elements:', moment.id);
                // Add placeholder text element if missing
                moment.textElements = [{
                    id: `${moment.id}-text-1`,
                    sequence: 1,
                    content: moment.narrative || 'Text',
                    typography: { size: 64, weight: 700, color: brand.colors?.[0] || '#000000' },
                    choreography: { entrance: { type: 'fade', duration: 500 } },
                    position: { x: 0, y: 0, align: 'center' },
                    layer: 1,
                    personality: 'bold',
                    purpose: 'headline'
                }] as TextElement[];
            }
        }
    }

    // Apply dynamic timing based on story phases
    scriptData.scenes = calculateDynamicTiming(
        scriptData.scenes,
        VIDEO_CONFIG.TOTAL_FRAMES,
        VIDEO_CONFIG.FPS
    );

    // Ensure correct totals
    scriptData.totalDuration = VIDEO_CONFIG.DURATION_SECONDS;
    scriptData.totalFrames = VIDEO_CONFIG.TOTAL_FRAMES;
    scriptData.fps = VIDEO_CONFIG.FPS;

    // Calculate stats
    const totalMoments = scriptData.scenes.reduce((sum, scene) => sum + scene.moments.length, 0);

    console.log('[Script Generation] Successfully generated:');
    console.log(`  - ${scriptData.scenes.length} scenes`);
    console.log(`  - ${totalMoments} total moments`);
    console.log(`  - Duration: ${scriptData.totalDuration}s`);
    console.log(`  - Frames: ${scriptData.totalFrames}`);
    console.log('[Script Generation] Script data:', JSON.stringify(scriptData, null, 2));

    return scriptData;
}

/**
 * Transform user-provided plain text into a story-driven script
 */
export async function transformTextToStoryScript(
    plainText: string,
    brand: BrandContext,
    config: VideoConfig
): Promise<StoryScript> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY not configured');
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = buildTransformPrompt(plainText, brand, config);

    console.log('[Script Transform] Transforming user text to story script');
    console.log('[Script Transform] Input length:', plainText.length, 'characters');

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

    // Extract and parse JSON (same as generateStoryScript)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error('AI response was not in expected format. Please try again.');
    }

    let scriptData: StoryScript;
    const jsonString = jsonMatch[0];

    try {
        scriptData = JSON.parse(jsonString);
    } catch (firstError) {
        const repairedJson = repairJSON(jsonString);
        try {
            scriptData = JSON.parse(repairedJson);
        } catch (secondError) {
            throw new Error('Failed to parse AI response. Please try again.');
        }
    }

    // Validate and apply timing (same as generateStoryScript)
    if (!scriptData.scenes || scriptData.scenes.length === 0) {
        throw new Error('AI did not generate valid scenes. Please try again.');
    }

    scriptData.scenes = calculateDynamicTiming(
        scriptData.scenes,
        VIDEO_CONFIG.TOTAL_FRAMES,
        VIDEO_CONFIG.FPS
    );

    scriptData.totalDuration = VIDEO_CONFIG.DURATION_SECONDS;
    scriptData.totalFrames = VIDEO_CONFIG.TOTAL_FRAMES;
    scriptData.fps = VIDEO_CONFIG.FPS;

    console.log('[Script Transform] Successfully transformed to', scriptData.scenes.length, 'scenes');

    return scriptData;
}

// ============================================================================
// LEGACY COMPATIBILITY
// ============================================================================

/**
 * Legacy function for backward compatibility
 * Generates a story script and converts to legacy format
 * @deprecated Use generateStoryScript instead
 */
export async function generateScriptFromAI(
    brand: BrandContext,
    config: VideoConfig,
    _targetDuration?: number // Ignored - always uses 30 seconds
): Promise<LegacyVideoScript> {
    console.log('[Script Generation] Using legacy API - converting to story format');
    
    // Generate new story format
    const storyScript = await generateStoryScript(brand, config);

    // Convert to legacy format
    return storyScriptToLegacy(storyScript);
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
    StoryScript,
    Scene,
    Moment,
    TextElement,
    StoryPhase,
    LegacyVideoScript,
};

export { storyScriptToLegacy };
