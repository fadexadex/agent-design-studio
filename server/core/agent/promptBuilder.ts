import { BrandContext, VideoConfig, MotionStyle } from './types';
import { getSkillsRouter } from './skills/skillsRouter';
import { SkillsContext } from './skills/skillsIndex';
import { getComponentsRouter, ComponentsContext, resetComponentsRouter } from './skills/components/componentsRouter';

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
let cachedSkillsKey: string | null = null;

// Cache for components context
let cachedComponentsContext: ComponentsContext | null = null;
let cachedComponentsKey: string | null = null;

/**
 * Get skills context for the given prompt and style.
 * Uses caching to avoid redundant computation.
 */
async function getSkillsContext(prompt: string, style: string): Promise<SkillsContext> {
  const cacheKey = `skills:${prompt}:${style}`;
  
  if (cachedSkillsContext && cachedSkillsKey === cacheKey) {
    return cachedSkillsContext;
  }

  const router = getSkillsRouter();
  const context = await router.getContextForPrompt(prompt, style, {
    maxTokens: 4000,
    maxFeatureRules: 5
  });

  cachedSkillsContext = context;
  cachedSkillsKey = cacheKey;

  console.log(`[PromptBuilder] Skills context: ${context.includedSkills.join(', ')} (~${context.estimatedTokens} tokens)`);
  
  return context;
}

/**
 * Get components context for the given prompt and style.
 * 
 * Uses model-driven selection: the AI receives the full component catalog
 * and decides which components are useful for its creative vision,
 * rather than relying on keyword pattern matching.
 */
async function getComponentsContext(prompt: string, style: string): Promise<ComponentsContext> {
  // Cache key is just "fullcatalog" since we're not filtering by prompt
  const cacheKey = `components:fullcatalog`;
  
  if (cachedComponentsContext && cachedComponentsKey === cacheKey) {
    return cachedComponentsContext;
  }

  const router = getComponentsRouter();
  // Use full catalog for model-driven selection instead of keyword matching
  const context = await router.getFullCatalog();

  cachedComponentsContext = context;
  cachedComponentsKey = cacheKey;

  console.log(`[PromptBuilder] Components catalog: ${context.matchedComponents.length} components available (~${context.estimatedTokens} tokens)`);
  
  return context;
}

/**
 * Build the main generation prompt with dynamically selected skills and components
 */
export async function buildPrompt(brand: BrandContext, config: VideoConfig): Promise<string> {
  const width = config.aspectRatio === '16:9' ? 1920 : 1080;
  const height = config.aspectRatio === '16:9' ? 1080 : 1920;
  const scale = config.resolution === '1080p' ? 1 : 0.667;
  const finalWidth = Math.round(width * scale);
  const finalHeight = Math.round(height * scale);

  // Get dynamically selected skills context (Remotion fundamentals)
  const skillsContext = await getSkillsContext(config.prompt, config.style);
  
  // Get dynamically selected components context (reusable library)
  const componentsContext = await getComponentsContext(config.prompt, config.style);

  // Build component-aware code hints
  const componentHints = componentsContext.matchedComponents.length > 0
    ? `\n// Consider using these components: ${componentsContext.matchedComponents.join(', ')}`
    : '';

  return `You are an expert motion graphics designer creating a Remotion video composition.

${skillsContext.content}

${componentsContext.relevantDocs}

## YOUR TASK
Create a React component that renders an animated brand video using Remotion.

**COMPONENT SELECTION**: Review the Component Library above and decide which components (if any) help achieve your creative vision. Use components when they fit naturally, use raw Remotion code when you need custom effects.

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

You can use EITHER the component library OR raw Remotion code (or mix both):

### Option A: Using Component Library (PREFERRED for text, mockups, layouts)
\`\`\`tsx
import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, Sequence } from 'remotion';
import { AnimatedText, LayoutGrid } from '@/components/AnimatedText';
import { BackgroundRig } from '@/components/Global';

export default function BrandVideo() {
  return (
    <AbsoluteFill>
      <BackgroundRig type="gradient-mesh" colors={['${brand.colors[0] || '#000000'}', '${brand.colors[1] || '#333333'}']} />
      <LayoutGrid anchor="center" direction="column" gap={20}>
        <AnimatedText text="${brand.name}" preset="fadeBlurIn" fontSize={72} fontWeight={700} />
        <AnimatedText text="${brand.tagline}" preset="fadeBlurIn" blur={{ delay: 15 }} fontSize={32} />
      </LayoutGrid>
    </AbsoluteFill>
  );
}
\`\`\`

### Option B: Raw Remotion Code (for custom effects)
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
  ${STYLE_CODE_HINTS[config.style]}${componentHints}

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
- ALL animations MUST use interpolate() or spring() from Remotion OR component presets
- ALWAYS use fps for timing: \`[0, 1 * fps]\` not \`[0, 30]\`
- ALWAYS clamp: \`{ extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }\`
- Use Sequence components with premountFor for timing sections
- **PREFER component library** when components can achieve the effect

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
  
  // Get components context for error correction
  const componentsContext = await getComponentsContext(config.prompt, config.style);

  return `You are fixing a Remotion video composition that has errors.

${skillsContext.content}

${componentsContext.relevantDocs}

## THE ERROR
${error}

## THE BROKEN CODE
\`\`\`tsx
${previousCode}
\`\`\`

## REQUIREMENTS
Fix the code to create a working Remotion composition for "${brand.name}" (${brand.industry}).

The code MUST:
1. Have valid imports. You can use:
   - \`remotion\` for core Remotion hooks and components
   - \`@/components/AnimatedText\` for AnimatedText, LayoutGrid, TextSequence
   - \`@/components/MockupFrame\` for MockupFrame, FrameSequence
   - \`@/components/Camera\` for CameraRig
   - \`@/components/Layout\` for MotionContainer, BentoGrid, BentoItem
   - \`@/components/Global\` for BackgroundRig
   - \`@/components/DynamicCursor\` for DynamicCursor, CursorPath
   - \`@/components/Transitions\` for IrisTransition, TransitionSeries

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
7. **PREFER components** from the library when fixing - they handle animations correctly

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

// ============================================
// Component Creation Prompt
// ============================================

export interface ComponentSpec {
  /** PascalCase component name */
  name: string;
  /** What the component does */
  purpose: string;
  /** Key features / behaviors it should support */
  features: string[];
  /** Code snippet that inspired this component (from a generated video) */
  sourceCode?: string;
  /** Animation style hints */
  style?: MotionStyle;
}

/**
 * Build a prompt for Gemini to create a new reusable Remotion component.
 * 
 * This is used when the orchestrator detects that the AI wrote a novel
 * animation pattern worth extracting into a reusable component.
 */
export async function buildComponentCreationPrompt(
  spec: ComponentSpec,
  existingComponents: string[]
): Promise<string> {
  return `You are creating a NEW reusable Remotion component for the LangEase motion design component library.

## EXISTING COMPONENTS (DO NOT DUPLICATE)
The library already has these components — do NOT recreate their functionality:
${existingComponents.map(c => `- ${c}`).join('\n')}

## NEW COMPONENT REQUIREMENTS
- **Name**: ${spec.name}
- **Purpose**: ${spec.purpose}
- **Features**: ${spec.features.join(', ')}
${spec.style ? `- **Style Affinity**: ${spec.style}` : ''}

${spec.sourceCode ? `## SOURCE INSPIRATION
This component is being extracted from the following generated video code.
Generalize the pattern into a reusable, configurable component:

\`\`\`tsx
${spec.sourceCode}
\`\`\`
` : ''}

## COMPONENT TEMPLATE
Follow this exact structure:

\`\`\`tsx
import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

// ============================================
// Types
// ============================================

export interface ${spec.name}Props {
  /** (required props with JSDoc comments) */
  // ...
  /** Animation delay in frames (default: 0) */
  delay?: number;
  /** Animation duration in frames. Uses fps-based default if omitted */
  duration?: number;
}

// ============================================
// Presets
// ============================================

export const ${spec.name.charAt(0).toLowerCase() + spec.name.slice(1)}Presets = {
  default: {
    // sensible defaults
  },
  // 2-4 more presets for common use cases
} as const;

export type ${spec.name}Preset = keyof typeof ${spec.name.charAt(0).toLowerCase() + spec.name.slice(1)}Presets;

// ============================================
// Component
// ============================================

export function ${spec.name}({
  delay = 0,
  duration,
  ...props
}: ${spec.name}Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const effectiveDuration = duration ?? Math.round(1 * fps);
  const localFrame = frame - delay;

  // Animation logic using interpolate() and spring()
  // ALWAYS use fps for timing, ALWAYS clamp extrapolation

  return (
    // JSX output
  );
}
\`\`\`

## STRICT REQUIREMENTS
1. Export the component as a **named export** (NOT default)
2. Define a TypeScript **interface** for all props with JSDoc comments
3. Include a **presets** object with at least 2 presets
4. Support **delay** and **duration** props for timing control
5. Use **fps** for all timing calculations — never hardcode frame numbers
6. Use **interpolate()** or **spring()** for all animations — no CSS animations
7. Always **clamp** extrapolation: \`{ extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }\`
8. Use **inline styles** only (style={{ }})
9. Keep it **self-contained** — only import from \`remotion\` and \`react\`
10. Add a **brief JSDoc** at the component level explaining usage

## OUTPUT
Return ONLY the complete TSX code in a single code block. No explanations before or after.`;
}

/**
 * Build a prompt for Gemini to extract component metadata from generated code.
 * Used to detect reusable patterns in video compositions.
 */
export function buildComponentDetectionPrompt(generatedCode: string, existingComponents: string[]): string {
  return `Analyze this Remotion video composition code and determine if it contains a novel, reusable animation pattern that should be extracted into a component.

## EXISTING COMPONENTS (already available)
${existingComponents.map(c => `- ${c}`).join('\n')}

## GENERATED VIDEO CODE
\`\`\`tsx
${generatedCode}
\`\`\`

## ANALYSIS CRITERIA
A pattern is worth extracting if ALL of these are true:
1. It creates a **visual effect** that is NOT already covered by the existing components
2. It is **generic enough** to be useful in other videos (not brand-specific)
3. It uses **at least 15 lines** of non-trivial animation logic
4. It could be parameterized with props (colors, sizes, timing, etc.)

## RESPONSE FORMAT
Respond with ONLY a JSON object (no code fences, no explanation):

If a reusable pattern exists:
{
  "found": true,
  "name": "PascalCaseName",
  "purpose": "One sentence describing what it does",
  "features": ["feature1", "feature2", "feature3"],
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "sourceLines": "The relevant code snippet to extract (just the animation logic, not brand-specific parts)"
}

If no reusable pattern exists:
{
  "found": false,
  "reason": "Brief explanation of why (e.g., 'Uses only existing AnimatedText component')"
}`;
}

/**
 * Build a prompt for Gemini to generate documentation for a new component.
 */
export function buildComponentDocPrompt(
  componentName: string,
  componentCode: string
): string {
  return `Generate concise Markdown documentation for this Remotion component.

## COMPONENT CODE
\`\`\`tsx
${componentCode}
\`\`\`

## DOCUMENTATION FORMAT
Write documentation following this exact structure (no YAML frontmatter, no extra sections):

# ${componentName}

One-paragraph description of what this component does and when to use it.

## Import

\\\`\\\`\\\`tsx
import { ${componentName} } from '@/components/Generated';
\\\`\\\`\\\`

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| ... | ... | ... | ... |

## Presets

Brief description of each preset.

## Quick Example

\\\`\\\`\\\`tsx
// Minimal usage
<${componentName} />

// With preset
<${componentName} preset="..." />
\\\`\\\`\\\`

## OUTPUT
Return ONLY the markdown. No explanations before or after.`;
}

/**
 * Clear all cached contexts (useful for testing or when skills/components change)
 */
export function clearPromptCaches(): void {
  cachedSkillsContext = null;
  cachedSkillsKey = null;
  cachedComponentsContext = null;
  cachedComponentsKey = null;
  // Reset the components router so it reloads generated components on next use
  resetComponentsRouter();
  console.log('[PromptBuilder] Caches cleared');
}
