import { GoogleGenAI } from '@google/genai';
import { AI_MODELS } from '../agent/models';
import { rateLimitedCall } from '../agent/rateLimiter';
import { BrandContext, VideoConfig } from '../agent/types';

// ============================================================================
// NEW TYPE DEFINITIONS FOR STORYTELLING-FIRST SCRIPTS
// ============================================================================

interface MomentTiming {
    startFrame: number;
    endFrame: number;
    durationMs: number;
}

interface Transformation {
    type: 'morph' | 'split' | 'merge' | 'flow' | 'ripple' | 'bounce' | 'zoom' | 'bend' | 'rotate';
    from: string;
    to: string;
    easing: 'ease' | 'ease-in' | 'ease-out' | 'bounce' | 'elastic' | 'spring' | 'ease-in-out';
    duration: number; // in frames
}

interface CameraMove {
    type: 'zoom' | 'pan' | 'rotate' | 'dolly' | 'static';
    target?: string;
    intensity: 'subtle' | 'medium' | 'dramatic';
    duration?: number;
}

interface SoundCue {
    type: 'effect' | 'transition' | 'ambient';
    description: string;
    timing: 'start' | 'middle' | 'end';
}

interface ElementState {
    name: string;
    state: 'entering' | 'transforming' | 'static' | 'exiting';
    properties?: Record<string, any>;
}

interface TextContent {
    text: string;
    animation: string;
    emphasis?: 'high' | 'medium' | 'low';
}

export interface Moment {
    id: string;
    sequence: number;
    timing: MomentTiming;
    
    // Storytelling core
    narrative: string;
    visualAction: string;
    
    // Elements
    elements: ElementState[];
    
    // Motion choreography
    transformation?: Transformation;
    camera?: CameraMove;
    sound?: SoundCue[];
    
    // Typography
    textContent?: TextContent;
    
    // Emotional beat
    energyLevel: 'intro' | 'building' | 'peak' | 'sustain' | 'resolution' | 'outro';
    emotionalTone: 'calm' | 'exciting' | 'satisfying' | 'dramatic' | 'playful';
}

export interface Scene {
    id: string;
    sceneNumber: number;
    title: string;
    purpose: string;
    moments: Moment[];
    frameRange: { start: number; end: number };
    dominantColor?: string;
    visualTheme: string;
}

export interface StoryScript {
    title: string;
    totalDuration: number;
    totalFrames: number;
    fps: number;
    
    narrative: {
        hook: string;
        journey: string;
        resolution: string;
    };
    
    scenes: Scene[];
    
    pacingMap?: {
        phase: 'opening' | 'buildup' | 'climax' | 'denouement';
        frames: { start: number; end: number };
        intensity: number;
    }[];
    
    recurringMotifs?: string[];
    colorJourney?: string[];
    audioNarrative?: string;
}

// ============================================================================
// NARRATIVE PACING FRAMEWORK
// ============================================================================

interface TimingPhase {
    name: string;
    intensityCurve: 'intro' | 'build' | 'peak' | 'sustain' | 'release';
    frameAllocation: number;
}

const NARRATIVE_PACING: TimingPhase[] = [
    { name: 'hook', intensityCurve: 'intro', frameAllocation: 0.08 },
    { name: 'establish', intensityCurve: 'build', frameAllocation: 0.15 },
    { name: 'journey', intensityCurve: 'peak', frameAllocation: 0.45 },
    { name: 'impact', intensityCurve: 'sustain', frameAllocation: 0.20 },
    { name: 'resolve', intensityCurve: 'release', frameAllocation: 0.12 }
];

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
    repaired = repaired.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    repaired = repaired.replace(/\}\s*\}\s*,/g, '},');
    repaired = repaired.replace(/\]\s*\]\s*,/g, '],');
    repaired = repaired.replace(/"\s*\}\s*\n(\s*)\},/g, '"\n$1},');
    repaired = repaired.replace(/\]\s*\}\s*\n(\s*)\},/g, ']\n$1},');
    repaired = repaired.replace(/,(\s*[}\]])/g, '$1');
    repaired = repaired.replace(/\}(\s*)\{/g, '},$1{');
    repaired = repaired.replace(/\](\s*)\[/g, '],$1[');
    
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
// DYNAMIC TIMING CALCULATION
// ============================================================================

function determinePhase(scenePurpose: string): string {
    const purposeMap: Record<string, string> = {
        'hook': 'hook',
        'grab attention': 'hook',
        'opening': 'hook',
        'genesis': 'hook',
        'establish': 'establish',
        'introduce': 'establish',
        'context': 'establish',
        'problem': 'establish',
        'show solution': 'journey',
        'demonstrate': 'journey',
        'transformation': 'journey',
        'journey': 'journey',
        'feature': 'journey',
        'impact': 'impact',
        'results': 'impact',
        'outcome': 'impact',
        'brand reveal': 'resolve',
        'call to action': 'resolve',
        'resolution': 'resolve',
        'closing': 'resolve'
    };
    
    const lowerPurpose = scenePurpose.toLowerCase();
    for (const [key, phase] of Object.entries(purposeMap)) {
        if (lowerPurpose.includes(key)) {
            return phase;
        }
    }
    
    return 'journey';
}

function calculateMomentTiming(
    moments: Moment[],
    sceneStartFrame: number,
    sceneDuration: number,
    fps: number
): Moment[] {
    const totalSuggestedMs = moments.reduce(
        (sum, m) => sum + (m.timing.durationMs || 1000),
        0
    );
    
    let currentFrame = sceneStartFrame;
    
    return moments.map((moment, idx) => {
        const weight = (moment.timing.durationMs || 1000) / totalSuggestedMs;
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
    const phaseFrames = NARRATIVE_PACING.map(phase => ({
        ...phase,
        frames: Math.floor(totalFrames * phase.frameAllocation)
    }));
    
    let currentFrame = 0;
    
    return scenes.map((scene) => {
        const phase = determinePhase(scene.purpose);
        const phaseData = phaseFrames.find(p => p.name === phase);
        
        const baseFramesPerMoment = phaseData.intensityCurve === 'peak' ? 100 : 60;
        const sceneDuration = Math.min(
            scene.moments.length * baseFramesPerMoment,
            phaseData.frames
        );
        
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
// AI PROMPT GENERATION
// ============================================================================

function buildStorytellingPrompt(
    brand: BrandContext,
    config: VideoConfig,
    targetDuration: number
): string {
    return `You are an expert motion design storyteller creating kinetic typography-driven videos. Think like a choreographer where TEXT is the lead dancer, not just a label.

## BRAND & CONTEXT
- Product Name: "${brand.name}"
- What it does: ${brand.tagline || 'N/A'}
- Industry: ${brand.industry}
- Brand Colors: ${brand.colors?.join(', ') || 'Not specified'}
- Visual Style: ${config.style} (${getStyleDescription(config.style)})
- Creative Direction: ${config.prompt}
- Target Duration: ${targetDuration} seconds at 30fps = ${targetDuration * 30} total frames

## 🎯 CRITICAL PHILOSOPHY: TEXT IS THE STORY

In great motion design (like Apple, Stripe, or modern SaaS ads), TEXT isn't decoration - it's the PRIMARY visual character. Visual elements (icons, shapes, UI) SUPPORT the text, not the other way around.

**Your entire video must be text-driven:**
- Every moment MUST have text elements
- Text should dance, bounce, slide, catch-up, replace, morph
- Text tells the story, visuals reinforce it
- Sound syncs with text entrances

## 🎬 CRITICAL: STORY-DRIVEN STRUCTURE (Not Feature List!)

**DO NOT start with the brand name!** Tell a STORY that leads to the brand reveal at the END.

Your script must follow this NARRATIVE ARC (like LangEase):

**Act 1: The Problem/Desire (0-15% of duration)**
- Show the user's situation or need
- Use text to ask a question or establish context
- Visual: Simple object or scene representing the problem
- Example: "Got stuff you don't need?" with unused textbook
- NO BRAND YET!

**Act 2: The Simple Solution (15-35% of duration)**
- Show how easy it is to use the product
- Text-driven instructions: "Just [action]"
- Visual: Phone, upload, simple interaction
- Example: "Just snap and post" with camera click → Done!
- STILL NO BRAND!

**Act 3: The Magic/Network Effect (35-60% of duration)**
- Reveal what makes this special/powerful
- Show the transformation or connection happening
- Text reveals capability: "Students on campus see it"
- Visual: Network visualization, multiplication, distribution
- Example: Dots connecting, items flowing, reach expanding
- BRAND STILL HIDDEN!

**Act 4: The Result/Exchange (60-80% of duration)**
- Show the successful outcome
- Text summarizes value: "Meet. Exchange. Done."
- Visual: Two parties connecting, transaction completing
- Example: Item + money exchanging between two students
- WAITING FOR BRAND...

**Act 5: Value Summary + Brand Reveal (80-100% of duration)**
- Bouncing/rhythmic text summary of core values
- Text: "Sell. Find. Connect." (or equivalent 3 verbs)
- These morph/converge into brand logo
- Brand name appears FOR THE FIRST TIME
- Tagline appears below
- Example: Dot bounces → 3 words appear → merge into "Campor"

**THIS IS CRUCIAL:** The brand name should ONLY appear in Act 5. Before that, you're telling a story about the user's journey.

## 📖 STORY STRUCTURE EXAMPLES

### Example 1: Campus Marketplace (Campor)
```
Act 1 (Problem): "Got stuff you don't need?" + unused textbook sitting
Act 2 (Solution): "Just snap and post" + camera click → Done!
Act 3 (Magic): "Students on campus see it" + network connections lighting up
Act 4 (Result): "Meet. Exchange." + two students trading
Act 5 (Brand): "Sell. Find. Connect." bouncing → "Campor" + "Your campus economy"
```

### Example 2: Language Translation (LangEase style)
```
Act 1 (Problem): "Turn Books" catches up to complete thought
Act 2 (Solution): "Just drop and go" + file upload → processing → Done!
Act 3 (Magic): "Multiple Languages" + one video splits into 4 versions
Act 4 (Result): "Distribute To Youtube" + click → published
Act 5 (Brand): "Translate. Dub. Distribute." bouncing → "LangEase" logo
```

### Example 3: Productivity App
```
Act 1 (Problem): "Too many tasks?" + chaotic sticky notes
Act 2 (Solution): "Just write it down" + typing → organized list
Act 3 (Magic): "Automatically prioritized" + items reordering themselves
Act 4 (Result): "Done on time" + checkmarks appearing
Act 5 (Brand): "Write. Organize. Accomplish." → "[AppName]"
```

**Pattern to follow:**
1. Question/Problem (text + simple visual)
2. Simple Action (instruction text + interaction)
3. Transformation/Magic (reveal text + visual multiplication/connection)
4. Success Outcome (result text + completion visual)
5. Value Summary → Brand (3 verbs bouncing → logo reveal)

## 🎨 TEXT CHOREOGRAPHY PATTERNS (REQUIRED)

You MUST use at least 3 of these patterns throughout your story:

### Pattern 1: Catch-Up Animation
```
"Turn" enters first, moves upward
"Books" appears delayed, animates to catch up
Final: "Turn Books" (aligned)
Personality: Playful, energetic
```

### Pattern 2: Text Replacement Cycle
```
"Sell" appears → slides left → exits
"Find" enters from right → same position → exits
"Connect" replaces "Find"
Personality: Building momentum, feature showcase
```

### Pattern 3: Bounce Sequence
```
Ball/star bounces from top
Bounce 1: "Translate." appears
Bounce 2: "Dub." appears  
Bounce 3: "Distribute" appears
Personality: Rhythmic, musical, playful
```

### Pattern 4: Text Makes Space
```
"Any language" appears center
"Any language" slides LEFT
Folder icon appears RIGHT (simultaneously)
Personality: Interactive, inviting
```

### Pattern 5: Text Morphs to Element
```
"Upload" text appears
"Upload" morphs into upload icon/button
Icon integrates into UI
Personality: Transformation, seamless
```

### Pattern 6: Word-by-Word Build
```
"Just" enters
"drop" enters  
"and go" enters
All three exist simultaneously, then morph to next phrase
Personality: Building instruction, clarity
```

## ✅ TEXT REQUIREMENTS (Non-Negotiable)

1. **Every moment needs text**: No "just visuals" moments
2. **Text choreography**: Specify entrance, hold, exit for each text element
3. **Text positioning**: Where does text sit? (not always centered)
4. **Text personality**: Is it playful? Bold? Calm? Energetic?
5. **Text interactions**: Does text make space for icons? Replace other text? Align with elements?
6. **Sound sync**: Text entrances should have sound effects
7. **Multiple layers**: Often 2-3 text elements visible simultaneously
8. **Dynamic sizing**: Headline text (large) + supporting text (small)

## 📝 TEXT ANIMATION VOCABULARY

Use THESE specific animation types for text:

**Entrances:**
- slide-up, slide-down, slide-left, slide-right
- catch-up (delayed entrance that aligns with previous text)
- bounce (enters with bounce physics)
- word-by-word (staggered word entrance)
- letter-by-letter (typewriter effect)
- fade-scale (fades in while scaling from 0.8 to 1.0)
- morph (emerges from another element)

**Holds:**
- static (just sits there)
- breathe (subtle scale pulse)
- float (gentle vertical oscillation)
- pulse (rhythmic scale)

**Exits:**
- slide-left, slide-right, slide-up, slide-down
- fade-out
- morph-into (transforms into next element)
- scale-down (shrinks to point)

## 🎬 VISUAL ELEMENTS (Support Text)

Visual elements should ENHANCE text, not compete:

- **Icons**: Small, simple, appear near text
- **Shapes**: Geometric elements that frame or transition
- **UI Components**: Screenshots/mockups showing product
- **Progress indicators**: Bars, counters, checkmarks
- **Connection lines**: Show relationships between elements

❌ DON'T: Make visuals the hero with text as labels
✅ DO: Make text the hero with visuals as supporting cast

## OUTPUT FORMAT

Return ONLY valid JSON (no markdown, no explanations) with this EXACT structure:

\`\`\`json
{
  "title": "Brief title for this video",
  "totalDuration": ${targetDuration},
  "totalFrames": ${targetDuration * 30},
  "fps": 30,
  "narrative": {
    "hook": "One sentence describing the opening moment",
    "journey": "2-3 sentences describing the transformation arc",
    "resolution": "One sentence describing how it concludes"
  },
  "textNarrative": {
    "openingMessage": "What text says in opening (e.g., 'Turn Books into Audio')",
    "coreFeatures": ["Feature 1 text", "Feature 2 text", "Feature 3 text"],
    "closingMessage": "Final text message (e.g., 'Your campus economy')"
  },
  "scenes": [
    {
      "id": "scene-1",
      "sceneNumber": 1,
      "title": "Short evocative title",
      "purpose": "What this scene accomplishes",
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
                "size": 84,
                "weight": 700,
                "color": "#hexcolor",
                "font": "sans-serif",
                "letterSpacing": "0.05em"
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
              "interactions": [
                {
                  "with": "text-2",
                  "relationship": "makes-space-for",
                  "timing": "on-exit"
                }
              ]
            }
          ],
          
          "visualElements": [
            {
              "id": "element-1",
              "name": "element_name",
              "type": "icon",
              "state": "entering",
              "properties": {
                "size": 60,
                "color": "#hexcolor"
              }
            }
          ],
          
          "transformation": {
            "type": "morph",
            "from": "element_a",
            "to": "element_b",
            "easing": "ease-out",
            "duration": 15
          },
          
          "camera": {
            "type": "zoom",
            "target": "text-1",
            "intensity": "subtle"
          },
          
          "sound": [
            {
              "type": "effect",
              "description": "slide whoosh",
              "timing": "on-text-entrance",
              "syncWith": "text-1"
            }
          ],
          
          "energyLevel": "intro",
          "emotionalTone": "playful"
        }
      ],
      "frameRange": { "start": 0, "end": 0 }
    }
  ],
  "recurringMotifs": ["kinetic_typography", "blue_accent_color"],
  "colorJourney": ["#ffffff", "#2563eb"],
  "audioNarrative": "Sound design approach"
}
\`\`\`

## CRITICAL JSON REQUIREMENTS

1. **textElements is REQUIRED and MUST NOT be empty**: Every moment needs at least one text element
2. **Text choreography MUST be complete**: entrance, hold (optional), exit (optional)
3. **Text must have personality**: Specify playful/bold/calm/energetic/subtle
4. **Text must have purpose**: headline/feature/instruction/value-prop/transition/brand
5. **Position must be specified**: Where does text sit on screen?
6. **Interactions should be noted**: How does text relate to other elements?

## TIMING GUIDELINES

- Aim for 15-25 total moments across ${targetDuration} seconds
- Vary moment durations: some 1s, some 5s+
- Each text element's choreography timing should fit within moment duration
- Text entrance + hold + exit should not exceed moment durationMs

## EXAMPLE TEXT PATTERNS TO USE

**Opening (Catch-Up Pattern):**
```
Moment 1: "Cam" slides up (600ms) + holds (400ms)
Moment 1: "por" catches up (800ms delayed) → "Campor" aligned
```

**Feature Cycle (Replacement Pattern):**
```
Moment 2: "Sell" slides in → holds → slides out left
Moment 3: "Find" slides in from right → same position → slides out
Moment 4: "Connect" replaces "Find"
```

**Value Props (Bounce Pattern):**
```
Moment 5: Ball bounces
         Bounce 1: "Fast" appears
         Bounce 2: "Easy" appears
         Bounce 3: "Local" appears
```

**Brand Reveal (Morph Pattern):**
```
Moment 6: Value props converge center
         Morph into brand logo
         Tagline fades in below
```

## FINAL REMINDERS

1. **TEXT MUST DRIVE EVERY MOMENT** - No moment should be "just visuals"
2. **USE CHOREOGRAPHY PATTERNS** - Catch-up, replacement, bounce, morph
3. **VARY TEXT SIZING** - Headlines (72-96px) + Supporting (18-24px)
4. **TEXT HAS PERSONALITY** - Every text element should feel alive
5. **SOUND SYNCS WITH TEXT** - Text entrances trigger sound effects
6. **MULTIPLE TEXT LAYERS** - Often 2-3 text elements visible at once
7. **TEXT POSITIONING** - Not always centered, responds to other elements

Create a script where typography PERFORMS, not just appears.

Return ONLY the JSON object, nothing else.`;
}

// ============================================================================
// MAIN SCRIPT GENERATION FUNCTION
// ============================================================================

export async function generateStorytellingScript(
    brand: BrandContext,
    config: VideoConfig,
    targetDuration: number = 45
): Promise<StoryScript> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY not configured');
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = buildStorytellingPrompt(brand, config, targetDuration);

    console.log('[Storytelling Script] Generating for:', brand.name);
    console.log('[Storytelling Script] Target duration:', targetDuration, 'seconds');

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
        console.error('[Storytelling Script] No JSON found in response');
        throw new Error('AI response was not in expected format. Please try again.');
    }

    let scriptData: StoryScript;
    const jsonString = jsonMatch[0];

    try {
        scriptData = JSON.parse(jsonString);
    } catch (firstError) {
        console.log('[Storytelling Script] Initial parse failed, attempting repair...');
        const repairedJson = repairJSON(jsonString);

        try {
            scriptData = JSON.parse(repairedJson);
            console.log('[Storytelling Script] JSON repair successful');
        } catch (secondError) {
            console.error('[Storytelling Script] Failed to parse:', firstError);
            console.error('[Storytelling Script] Raw response:', responseText);
            throw new Error('Failed to parse AI response. Please try again.');
        }
    }

    // Validate structure
    if (!scriptData.scenes || !Array.isArray(scriptData.scenes) || scriptData.scenes.length === 0) {
        console.error('[Storytelling Script] Invalid scenes structure');
        throw new Error('AI did not generate valid scenes. Please try again.');
    }

    // Validate each scene has moments
    for (const scene of scriptData.scenes) {
        if (!scene.moments || !Array.isArray(scene.moments) || scene.moments.length === 0) {
            console.error('[Storytelling Script] Scene missing moments:', scene.id);
            throw new Error(`Scene ${scene.id} has no moments. Please try again.`);
        }
    }

    // Apply dynamic timing based on narrative pacing
    scriptData.scenes = calculateDynamicTiming(
        scriptData.scenes,
        scriptData.totalFrames,
        scriptData.fps
    );

    // Calculate total moments
    const totalMoments = scriptData.scenes.reduce((sum, scene) => sum + scene.moments.length, 0);

    console.log('[Storytelling Script] Successfully generated:');
    console.log(`  - ${scriptData.scenes.length} scenes`);
    console.log(`  - ${totalMoments} total moments`);
    console.log(`  - Duration: ${scriptData.totalDuration}s`);
    console.log(`  - Frames: ${scriptData.totalFrames}`);

    return scriptData;
}

// ============================================================================
// BACKWARD COMPATIBILITY WRAPPER (Optional)
// ============================================================================

/**
 * Legacy function for backward compatibility
 * Converts old ScriptScene format to new StoryScript format
 */
export async function generateScriptFromAI(
    brand: BrandContext,
    config: VideoConfig,
    targetDuration: number = 45
): Promise<any> {
    // Generate new format
    const storyScript = await generateStorytellingScript(brand, config, targetDuration);
    
    // Convert to legacy format if needed
    const legacyScenes = storyScript.scenes.map(scene => ({
        id: scene.id,
        sceneNumber: scene.sceneNumber,
        description: scene.moments.map(m => m.visualAction).join(' '),
        frameRange: scene.frameRange,
        keyElements: scene.moments.flatMap(m => m.elements.map(e => e.name)),
        visualStyle: 'abstract_shape', // Default for compatibility
        energyLevel: 'medium',
        suggestedDuration: (scene.frameRange.end - scene.frameRange.start + 1) / 30
    }));

    return {
        script: `${storyScript.narrative.hook} ${storyScript.narrative.journey} ${storyScript.narrative.resolution}`,
        scenes: legacyScenes
    };
}
