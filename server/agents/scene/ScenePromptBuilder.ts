/**
 * Scene Prompt Builder
 * 
 * Constructs prompts for Gemini to generate individual scene code.
 * Adapts the existing promptBuilder patterns for scene-level generation.
 */

import { BrandContext, SceneDefinition } from '../types.js';
import { SceneGenerationTask } from './SceneTask.js';
import { getSkillsRouter } from '../../core/agent/skills/skillsRouter.js';
import { getComponentsRouter } from '../../core/agent/skills/components/componentsRouter.js';
import { SkillsContext } from '../../core/agent/skills/skillsIndex.js';
import { ComponentsContext } from '../../core/agent/skills/components/componentsRouter.js';

// ============================================================================
// Style Descriptions
// ============================================================================

const STYLE_DESCRIPTIONS: Record<string, string> = {
  minimal: 'Clean, sparse, and elegant. Use lots of whitespace, subtle fade transitions, and refined typography.',
  bold: 'Strong, impactful, and attention-grabbing. Use large typography, high contrast, and powerful animations.',
  elegant: 'Sophisticated and refined. Use subtle animations, serif typography, and graceful transitions.',
  playful: 'Fun, energetic, and vibrant. Use bouncy animations, bright colors, and dynamic movements.',
  corporate: 'Professional and trustworthy. Use clean layouts, structured animations, and business-appropriate styling.',
  dynamic: 'Energetic and fast-paced. Use quick transitions, motion blur effects, and high-energy animations.',
};

const STYLE_CODE_HINTS: Record<string, string> = {
  minimal: `// PREFERRED: Subtle opacity and position shifts
    <Animated animations={[
      Fade({ to: 1, initial: 0, start: 0, duration: 30 }),
      Move({ y: 0, initialY: 20, start: 0, damping: 100, stiffness: 100 })
    ]}>`,
  bold: `// Strong scale and rotation for impact
    <Animated animations={[
      Scale({ by: 1, initial: 0, start: 0, damping: 12, stiffness: 200 }),
    ]}>`,
  elegant: `// Smooth, graceful spring animations
    <Animated animations={[
      Fade({ to: 1, initial: 0, start: 0, duration: 45 }),
      Scale({ by: 1, initial: 0.95, start: 0, damping: 50, stiffness: 80 })
    ]}>`,
  playful: `// Bouncy, energetic animations
    <Animated animations={[
      Scale({ by: 1, initial: 0, start: 0, damping: 8, stiffness: 200 }),
      Move({ y: 0, initialY: 50, start: 0, damping: 8, stiffness: 200 })
    ]}>`,
  corporate: `// Professional, structured animations
    <Animated animations={[
      Fade({ to: 1, initial: 0, start: 0, duration: 30 }),
      Move({ x: 0, initialX: -30, start: 0, damping: 20, stiffness: 100 })
    ]}>`,
  dynamic: `// Fast, energetic transitions
    const progress = interpolate(frame, [0, 0.3 * fps], [0, 1], { extrapolateRight: 'clamp' });
    const scale = spring({ frame, fps, config: { damping: 10, stiffness: 300 } });`,
};

// ============================================================================
// Prompt Building Functions
// ============================================================================

/**
 * Get skills context for scene generation
 */
async function getSkillsContext(task: SceneGenerationTask): Promise<SkillsContext> {
  const router = getSkillsRouter();
  const style = task.brandContext.style || 'dynamic';
  
  const context = await router.getContextForPrompt(task.prompt, style, {
    maxTokens: 3000, // Slightly less than full video to save context
    maxFeatureRules: 4,
  });

  console.log(`[ScenePromptBuilder] Skills: ${context.includedSkills.join(', ')} (~${context.estimatedTokens} tokens)`);
  
  return context;
}

/**
 * Get components context for scene generation
 */
async function getComponentsContext(): Promise<ComponentsContext> {
  const router = getComponentsRouter();
  const context = await router.getFullCatalog();
  
  console.log(`[ScenePromptBuilder] Components: ${context.matchedComponents.length} available (~${context.estimatedTokens} tokens)`);
  
  return context;
}

/**
 * Build scene generation prompt
 */
export async function buildScenePrompt(task: SceneGenerationTask): Promise<string> {
  const { brandContext, sceneIndex, durationFrames = 180, prompt } = task;
  const style = brandContext.style || 'dynamic';
  
  // Get dynamic context
  const [skillsContext, componentsContext] = await Promise.all([
    getSkillsContext(task),
    getComponentsContext(),
  ]);

  const styleDescription = STYLE_DESCRIPTIONS[style] || STYLE_DESCRIPTIONS.dynamic;
  const styleHints = STYLE_CODE_HINTS[style] || STYLE_CODE_HINTS.dynamic;
  
  // Calculate dimensions based on aspect ratio
  const width = brandContext.aspectRatio === '16:9' ? 1920 : 1080;
  const height = brandContext.aspectRatio === '16:9' ? 1080 : 1920;

  // Build scene-specific hints from Director
  const sceneHints = task.styleHints?.length 
    ? `\n## DIRECTOR STYLE HINTS\n${task.styleHints.map(h => `- ${h}`).join('\n')}`
    : '';
    
  const constraints = task.constraints?.length
    ? `\n## CONSTRAINTS\n${task.constraints.map(c => `- ${c}`).join('\n')}`
    : '';

  // Build iteration context if this is a regeneration
  const iterationContext = task.previousCode && task.feedback
    ? `
## ITERATION CONTEXT
This is a regeneration based on feedback. Previous attempt had issues.

### FEEDBACK TO ADDRESS
${task.feedback}

### PREVIOUS CODE (for reference)
\`\`\`tsx
${task.previousCode.substring(0, 2000)}${task.previousCode.length > 2000 ? '\n// ... (truncated)' : ''}
\`\`\`

**IMPORTANT**: ${task.forceNewApproach 
  ? 'Take a COMPLETELY NEW creative approach. Do not reuse the same patterns.'
  : 'Fix the issues mentioned in the feedback while keeping what works.'}
`
    : '';

  return `You are an expert motion graphics designer creating a SINGLE SCENE for a Remotion video composition.

${skillsContext.content}

${componentsContext.relevantDocs}

## YOUR TASK
Create a React component that renders Scene ${sceneIndex + 1} of a brand video.
This scene is ${durationFrames} frames long at 30fps (${(durationFrames / 30).toFixed(1)} seconds).

## BRAND INFORMATION
- Company: "${brandContext.name}"
- Industry: ${brandContext.industry || 'Technology'}
- Tagline: "${brandContext.tagline || ''}"
- Primary Color: ${brandContext.colors.primary}
- Secondary Color: ${brandContext.colors.secondary || brandContext.colors.primary}
- Accent Color: ${brandContext.colors.accent || brandContext.colors.primary}

## SCENE SPECIFICATIONS
- Scene Index: ${sceneIndex} (0-based)
- Duration: ${durationFrames} frames (${(durationFrames / 30).toFixed(1)} seconds)
- Width: ${width}px
- Height: ${height}px
- Style: ${style.toUpperCase()} - ${styleDescription}

## SCENE DESCRIPTION
${prompt}

${sceneHints}
${constraints}
${iterationContext}

## STYLE IMPLEMENTATION
${styleHints}

## REQUIRED CODE STRUCTURE

\`\`\`tsx
import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Sequence } from 'remotion';
// Import from component library as needed
// import { AnimatedText, LayoutGrid } from '@/components/AnimatedText';
// import { Background } from '@/components/Global';

export default function Scene${sceneIndex}() {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Animation logic using fps for timing
  // ALWAYS clamp: { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }

  return (
    <AbsoluteFill style={{ 
      backgroundColor: '${brandContext.colors.primary}',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center'
    }}>
      {/* Scene content - centered by default */}
    </AbsoluteFill>
  );
}
\`\`\`

## AVAILABLE FONTS (Pre-loaded)
**Sans-serif:** "DM Sans", "Inter", "Roboto", "Montserrat", "Poppins", "Space Grotesk", "Sora", "Manrope"
**Display:** "Oswald", "Bebas Neue"
**Serif:** "Instrument Serif", "Playfair Display", "Lora"
**Mono:** "Roboto Mono"

## CRITICAL RULES
1. Use inline styles only (style={{ }})
2. NO CSS animations or Tailwind animate-* classes
3. ALL animations MUST use interpolate() or spring() from Remotion OR component presets
4. ALWAYS use fps for timing: \`[0, 1 * fps]\` not \`[0, 30]\`
5. ALWAYS clamp: \`{ extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }\`
6. Export as default: \`export default function Scene${sceneIndex}()\`
7. The scene is SELF-CONTAINED - assume frame starts at 0 within this scene
8. Make the scene visually complete and impactful within its duration
9. **CENTER ALL CONTENT**: Always center text and main content both horizontally and vertically:
   - Use \`display: 'flex', justifyContent: 'center', alignItems: 'center'\` on containers
   - Use \`textAlign: 'center'\` for text elements
   - Wrap content in a centered flex container within AbsoluteFill

## CRITICAL TEXT POSITIONING RULES (PREVENT OVERLAPPING TEXT)
1. **NEVER animate multiple text elements simultaneously without staggered delays**
   - First text: delay={0}
   - Second text: delay={15} (minimum 15 frames between texts)
   - Third text: delay={30}, etc.
2. **Each text element MUST have unique vertical position**
   - Use flex column layout with gap: \`gap: 24\` or higher
   - OR use explicit y-positions at least 60px apart
3. **Use LayoutGrid for multiple texts** (REQUIRED for 2+ text elements):
   \`\`\`tsx
   <LayoutGrid anchor="center" direction="column" gap={32}>
     <AnimatedText text="Title" preset="fadeBlurIn" delay={0} fontSize={64} />
     <AnimatedText text="Subtitle" preset="slideInUp" delay={15} fontSize={32} />
   </LayoutGrid>
   \`\`\`
4. **NEVER use the same animation start frame for multiple texts**
5. **For raw Remotion code, wrap texts in a flex column**:
   \`\`\`tsx
   <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
     <div style={{ opacity: interpolate(frame, [0, 20], [0, 1], clamp) }}>Title</div>
     <div style={{ opacity: interpolate(frame, [15, 35], [0, 1], clamp) }}>Subtitle</div>
   </div>
   \`\`\`

## ⚠️ CRITICAL API WARNING - READ CAREFULLY ⚠️
The @remotion/animated package uses OBJECT SYNTAX, NOT method chaining.

❌ WRONG (will crash with "Move.y is not a function"):
  Move.y(50)
  Scale.in(0, 1)
  Fade.in()

✅ CORRECT:
  Move({ y: 0, initialY: 50, start: 0 })
  Scale({ by: 1, initial: 0, start: 0 })
  Fade({ to: 1, initial: 0, start: 0, duration: 30 })

REMEMBER: Move, Scale, Fade are FUNCTIONS that take an OPTIONS OBJECT, not chainable methods!

## OUTPUT
Return ONLY the complete TSX code inside a single code block. No explanations before or after.`;
}

/**
 * Build scene correction prompt
 */
export async function buildSceneCorrectionPrompt(
  task: SceneGenerationTask,
  brokenCode: string,
  error: string
): Promise<string> {
  const { brandContext, sceneIndex, durationFrames = 180 } = task;
  const style = brandContext.style || 'dynamic';

  // Get skills context for correction
  const skillsContext = await getSkillsContext(task);
  const componentsContext = await getComponentsContext();

  // Parse error for specifics
  const lineMatch = error.match(/:(\d+):(\d+):\s*ERROR:\s*(.+)/);
  const errorLine = lineMatch ? parseInt(lineMatch[1], 10) : null;
  const errorColumn = lineMatch ? parseInt(lineMatch[2], 10) : null;
  const errorType = lineMatch ? lineMatch[3] : error;

  // Get context around error line
  let errorContext = '';
  if (errorLine) {
    const lines = brokenCode.split('\n');
    const start = Math.max(0, errorLine - 3);
    const end = Math.min(lines.length, errorLine + 2);
    errorContext = lines.slice(start, end)
      .map((line, i) => {
        const lineNum = start + i + 1;
        const marker = lineNum === errorLine ? ' >>> ' : '     ';
        return `${marker}${lineNum}: ${line}`;
      })
      .join('\n');
  }

  return `You are fixing a Remotion scene that has errors.

${skillsContext.content}

${componentsContext.relevantDocs}

## THE ERROR
**Type**: ${errorType}
${errorLine ? `**Location**: Line ${errorLine}, Column ${errorColumn}` : ''}

## ERROR CONTEXT
${errorContext || 'No specific line context available'}

## THE BROKEN CODE
\`\`\`tsx
${brokenCode}
\`\`\`

## YOUR TASK
Fix ONLY the error. Do NOT change the animation logic or visual design unless necessary.

Common fixes needed:
- Remove trailing \`\`\` markdown code fences (NOT valid TypeScript)
- Close unclosed braces, brackets, or parentheses
- Fix unterminated string literals
- Fix malformed JSX
- Fix CSS kebab-case properties (use camelCase: backgroundColor not background-color)
- Ensure component is exported as default

## ⚠️ CRITICAL API FIX - If you see "Move.y is not a function" or similar:
The @remotion/animated package uses OBJECT SYNTAX, NOT method chaining!

❌ WRONG: Move.y(50), Scale.in(0, 1), Fade.in()
✅ CORRECT: Move({ y: 0, initialY: 50 }), Scale({ by: 1, initial: 0 }), Fade({ to: 1, initial: 0 })

## SCENE CONTEXT
- Scene ${sceneIndex + 1}
- Duration: ${durationFrames} frames
- Brand: "${brandContext.name}"
- Style: ${style}

## OUTPUT
Return ONLY the fixed TSX code. No markdown fences, no explanations.
The code must be valid TypeScript/React that compiles without errors.`;
}

/**
 * Build render error correction prompt
 */
export async function buildRenderErrorPrompt(
  task: SceneGenerationTask,
  brokenCode: string,
  renderError: string
): Promise<string> {
  const { brandContext, sceneIndex } = task;

  return `You are fixing a Remotion scene that failed during rendering.

## RENDER ERROR
${renderError}

## THE BROKEN CODE
\`\`\`tsx
${brokenCode}
\`\`\`

## YOUR TASK
Fix the rendering issue. Common problems:
- Invalid color values (use valid hex colors or CSS color names)
- Division by zero in calculations
- NaN values in interpolations
- Invalid transform values
- Missing required props on components
- Infinite loops in animations

## SCENE CONTEXT
- Scene ${sceneIndex + 1}
- Brand: "${brandContext.name}"

## OUTPUT
Return ONLY the fixed TSX code. No markdown fences, no explanations.`;
}
