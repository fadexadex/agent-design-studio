import { BrandContext, VideoConfig, MotionStyle } from './types';
import { getSkillsRouter } from './skills/skillsRouter';
import { SkillsContext } from './skills/skillsIndex';

const STYLE_DESCRIPTIONS: Record<MotionStyle, string> = {
  minimalist: 'Clean, sparse, and elegant. Use lots of whitespace, subtle fade transitions, and refined typography. Focus on simplicity and precision. Use thin lines and delicate animations.',
  geometric: 'Sharp shapes, precise movements, and mathematical patterns. Use polygons, grids, rotating squares, and structured animations with linear easing.',
  fluid: 'Organic, flowing, and soft. Use curved paths, smooth easing (spring animations), and morphing transitions. Think liquid and natural movements.',
  brutalist: 'Raw, bold, and industrial. Use heavy sans-serif typography, stark black and white contrasts, glitch effects, and aggressive scale animations.',
  cinematic: 'Dramatic, lighting-focused, and narrative-driven. Use depth effects, slow reveals, fade-to-black transitions, and epic scale with subtle parallax.'
};

const STYLE_CODE_HINTS: Record<MotionStyle, string> = {
  minimalist: `
    // Use subtle opacity fades and gentle position shifts
    const opacity = interpolate(frame, [0, 1 * fps], [0, 1], { extrapolateRight: 'clamp' });
    const slideUp = interpolate(frame, [0, 1.5 * fps], [20, 0], { extrapolateRight: 'clamp' });`,
  geometric: `
    // Use rotation and scale transforms with linear timing
    const rotation = interpolate(frame, [0, 2 * fps], [0, 360]);
    const scale = interpolate(frame, [0, 1 * fps], [0, 1], { extrapolateRight: 'clamp' });`,
  fluid: `
    // Use spring animations for natural motion
    const scale = spring({ frame, fps, config: { damping: 100, stiffness: 200 } });
    const bounceY = spring({ frame: frame - 15, fps, config: { damping: 80 } });`,
  brutalist: `
    // Use hard cuts and bold transforms
    const show = frame > 0.5 * fps ? 1 : 0;
    const glitchX = Math.sin(frame * 0.5) * (frame < 1 * fps ? 5 : 0);`,
  cinematic: `
    // Use slow, dramatic reveals
    const fadeIn = interpolate(frame, [0, 2 * fps], [0, 1], { extrapolateRight: 'clamp' });
    const zoomIn = interpolate(frame, [0, 3 * fps], [1.1, 1], { extrapolateRight: 'clamp' });`
};

// Cache for skills context to avoid re-computing
let cachedSkillsContext: SkillsContext | null = null;
let cachedPromptKey: string | null = null;

/**
 * Get skills context for the given prompt and style.
 * Uses caching to avoid redundant computation.
 */
async function getSkillsContext(prompt: string, style: string): Promise<SkillsContext> {
  const cacheKey = `${prompt}:${style}`;
  
  if (cachedSkillsContext && cachedPromptKey === cacheKey) {
    return cachedSkillsContext;
  }

  const router = getSkillsRouter();
  const context = await router.getContextForPrompt(prompt, style, {
    maxTokens: 4000,
    maxFeatureRules: 5
  });

  cachedSkillsContext = context;
  cachedPromptKey = cacheKey;

  console.log(`[PromptBuilder] Skills context: ${context.includedSkills.join(', ')} (~${context.estimatedTokens} tokens)`);
  
  return context;
}

/**
 * Build the main generation prompt with dynamically selected skills
 */
export async function buildPrompt(brand: BrandContext, config: VideoConfig): Promise<string> {
  const width = config.aspectRatio === '16:9' ? 1920 : 1080;
  const height = config.aspectRatio === '16:9' ? 1080 : 1920;
  const scale = config.resolution === '1080p' ? 1 : 0.667;
  const finalWidth = Math.round(width * scale);
  const finalHeight = Math.round(height * scale);

  // Get dynamically selected skills context
  const skillsContext = await getSkillsContext(config.prompt, config.style);

  return `You are an expert motion graphics designer creating a Remotion video composition.

${skillsContext.content}

## YOUR TASK
Create a React component that renders an animated brand video using Remotion.

## BRAND INFORMATION
- Company: "${brand.name}"
- Industry: ${brand.industry}
- Tagline: "${brand.tagline}"
- Brand Colors: ${brand.colors.map((c, i) => `Color ${i + 1}: ${c}`).join(', ')}

## VIDEO SPECIFICATIONS
- Width: ${finalWidth}px
- Height: ${finalHeight}px
- Duration: 150 frames (5 seconds at 30fps)
- Style: ${config.style.toUpperCase()} - ${STYLE_DESCRIPTIONS[config.style]}

## CREATIVE DIRECTION
${config.prompt}

## REQUIRED CODE STRUCTURE

\`\`\`tsx
import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
} from 'remotion';

export default function BrandVideo() {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Animation calculations using fps for timing (not hardcoded frames!)
  ${STYLE_CODE_HINTS[config.style]}

  return (
    <AbsoluteFill style={{ backgroundColor: '${brand.colors[0] || '#000000'}' }}>
      {/* Your animated content here */}
    </AbsoluteFill>
  );
}
\`\`\`

## DESIGN REQUIREMENTS (for 5-second / 150-frame video)

1. **Opening (frames 0-45)**: Animated intro with brand colors. Shapes or patterns matching ${config.style} style.

2. **Brand Name Reveal (frames 30-90)**: Display "${brand.name}" prominently:
   - Large typography (fontSize: 48-80px)
   - Animated entrance matching ${config.style}
   - Color: '${brand.colors[1] || '#ffffff'}' on '${brand.colors[0] || '#000000'}' background

3. **Tagline (frames 60-120)**: Show "${brand.tagline}":
   - Smaller text (fontSize: 20-32px)
   - Staggered entrance after brand name
   - letterSpacing for elegance

4. **Closing (frames 100-150)**: Memorable outro with all elements converging.

## CRITICAL RULES (Follow the MANDATORY RULES from skills above!)
- Use inline styles only (style={{ }})
- NO CSS animations or Tailwind animate-* classes
- ALL animations MUST use interpolate() or spring() from Remotion
- ALWAYS use fps for timing: \`[0, 1 * fps]\` not \`[0, 30]\`
- ALWAYS clamp: \`{ extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }\`
- Use Sequence components with premountFor for timing sections

## OUTPUT
Return ONLY the complete TSX code inside a single code block. No explanations before or after.
The component MUST be exported as default: \`export default function BrandVideo()\``;
}

/**
 * Build a correction prompt when the initial code fails validation
 */
export async function buildCorrectionPrompt(
  previousCode: string,
  error: string,
  brand: BrandContext,
  config: VideoConfig
): Promise<string> {
  // Get skills context for error correction
  const skillsContext = await getSkillsContext(config.prompt, config.style);

  return `You are fixing a Remotion video composition that has errors.

${skillsContext.content}

## THE ERROR
${error}

## THE BROKEN CODE
\`\`\`tsx
${previousCode}
\`\`\`

## REQUIREMENTS
Fix the code to create a working Remotion composition for "${brand.name}" (${brand.industry}).

The code MUST:
1. Start with these exact imports:
\`\`\`tsx
import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
} from 'remotion';
\`\`\`

2. Export a default function component:
\`\`\`tsx
export default function BrandVideo() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // ALWAYS use fps for timing!
  // ALWAYS clamp extrapolation!
  return (
    <AbsoluteFill style={{ backgroundColor: '${brand.colors[0] || '#000000'}' }}>
      {/* content */}
    </AbsoluteFill>
  );
}
\`\`\`

3. Display the brand name "${brand.name}" and tagline "${brand.tagline}"
4. Use brand colors: ${brand.colors.join(', ')}
5. Have 150 frames of animation (5 seconds at 30fps)
6. Follow ALL the MANDATORY RULES from the skills reference above

## OUTPUT
Return ONLY the corrected TSX code in a single code block. No explanations.`;
}

/**
 * Synchronous version for backward compatibility - wraps the async version
 * @deprecated Use the async buildPrompt instead
 */
export function buildPromptSync(brand: BrandContext, config: VideoConfig): string {
  console.warn('[PromptBuilder] buildPromptSync is deprecated, use async buildPrompt instead');
  
  const width = config.aspectRatio === '16:9' ? 1920 : 1080;
  const height = config.aspectRatio === '16:9' ? 1080 : 1920;
  const scale = config.resolution === '1080p' ? 1 : 0.667;
  const finalWidth = Math.round(width * scale);
  const finalHeight = Math.round(height * scale);

  // Fallback prompt without skills (for sync compatibility)
  return `You are an expert motion graphics designer creating a Remotion video composition.

## YOUR TASK
Create a React component that renders an animated brand video using Remotion.

## BRAND INFORMATION
- Company: "${brand.name}"
- Industry: ${brand.industry}
- Tagline: "${brand.tagline}"
- Brand Colors: ${brand.colors.map((c, i) => `Color ${i + 1}: ${c}`).join(', ')}

## VIDEO SPECIFICATIONS
- Width: ${finalWidth}px
- Height: ${finalHeight}px
- Duration: 150 frames (5 seconds at 30fps)
- Style: ${config.style.toUpperCase()} - ${STYLE_DESCRIPTIONS[config.style]}

## CREATIVE DIRECTION
${config.prompt}

## CRITICAL RULES
- Use inline styles only
- NO CSS animations or Tailwind animate-* classes
- ALL animations MUST use interpolate() or spring()
- ALWAYS use fps: interpolate(frame, [0, 1 * fps], ...)
- ALWAYS clamp: { extrapolateRight: 'clamp' }

## OUTPUT
Return ONLY the complete TSX code. Export as: export default function BrandVideo()`;
}
