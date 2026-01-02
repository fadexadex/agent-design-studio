import { BrandContext, VideoConfig, MotionStyle } from './types';

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
    const opacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });
    const slideUp = interpolate(frame, [0, 45], [20, 0], { extrapolateRight: 'clamp' });`,
  geometric: `
    // Use rotation and scale transforms with linear timing
    const rotation = interpolate(frame, [0, 60], [0, 360]);
    const scale = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });`,
  fluid: `
    // Use spring animations for natural motion
    const scale = spring({ frame, fps, config: { damping: 100, stiffness: 200 } });
    const bounceY = spring({ frame: frame - 15, fps, config: { damping: 80 } });`,
  brutalist: `
    // Use hard cuts and bold transforms
    const show = frame > 15 ? 1 : 0;
    const glitchX = Math.sin(frame * 0.5) * (frame < 30 ? 5 : 0);`,
  cinematic: `
    // Use slow, dramatic reveals
    const fadeIn = interpolate(frame, [0, 60], [0, 1], { extrapolateRight: 'clamp' });
    const zoomIn = interpolate(frame, [0, 90], [1.1, 1], { extrapolateRight: 'clamp' });`
};

export function buildPrompt(brand: BrandContext, config: VideoConfig): string {
  const width = config.aspectRatio === '16:9' ? 1920 : 1080;
  const height = config.aspectRatio === '16:9' ? 1080 : 1920;
  const scale = config.resolution === '1080p' ? 1 : 0.667;
  const finalWidth = Math.round(width * scale);
  const finalHeight = Math.round(height * scale);

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

  // Animation calculations
  ${STYLE_CODE_HINTS[config.style]}

  return (
    <AbsoluteFill style={{ backgroundColor: '${brand.colors[0] || '#000000'}' }}>
      {/* Your animated content here */}
    </AbsoluteFill>
  );
}
\`\`\`

## DESIGN REQUIREMENTS

1. **Opening Scene (frames 0-45)**: Animated intro with brand colors. Can include shapes, patterns, or abstract elements that match the ${config.style} style.

2. **Brand Name Reveal (frames 30-90)**: Display "${brand.name}" prominently using:
   - Large, bold typography (fontSize: 60-100px depending on name length)
   - Animated entrance matching the ${config.style} style
   - Use color: '${brand.colors[1] || '#ffffff'}' for text on ${brand.colors[0] || '#000000'} background

3. **Tagline (frames 60-120)**: Show "${brand.tagline}" with:
   - Smaller text (fontSize: 20-32px)
   - Staggered entrance after brand name
   - letterSpacing for elegance

4. **Closing (frames 100-150)**: Graceful outro that completes the animation loop.

## STYLE RULES
- Use inline styles only (style={{ }})
- Use Google Fonts via fontFamily: 'Inter, system-ui, sans-serif'
- All animations must use interpolate() or spring() from Remotion
- Use Sequence components for timing different sections
- Ensure smooth 30fps animations with extrapolateRight: 'clamp'

## OUTPUT
Return ONLY the complete TSX code inside a single code block. No explanations before or after.
The component MUST be exported as default: \`export default function BrandVideo()\``;
}

/**
 * Build a correction prompt when the initial code fails validation
 */
export function buildCorrectionPrompt(
  previousCode: string,
  error: string,
  brand: BrandContext,
  config: VideoConfig
): string {
  return `You are fixing a Remotion video composition that has errors.

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
  // ... animations
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

## OUTPUT
Return ONLY the corrected TSX code in a single code block. No explanations.`;
}
