---
name: scene-pacing
description: Guidelines for dynamic scene pacing to avoid mechanical, robotic timing in motion design videos.
metadata:
  tags: pacing, timing, rhythm, scenes, acts, duration
---

## Dynamic Scene Pacing

Avoid mechanical, equal-duration scenes. Good motion design has rhythm and variation.

### The Problem with Equal Timing

```tsx
// ❌ ROBOTIC - Every scene is exactly 30 frames (1 second)
<Sequence from={0} durationInFrames={30}>   {/* Scene 1 */}
<Sequence from={30} durationInFrames={30}>  {/* Scene 2 */}
<Sequence from={60} durationInFrames={30}>  {/* Scene 3 */}
<Sequence from={90} durationInFrames={30}>  {/* Scene 4 */}
<Sequence from={120} durationInFrames={30}> {/* Scene 5 */}
```

This creates a predictable, boring cadence. It feels like a slideshow, not motion design.

### Percentage-Based Guidelines (Not Rigid Rules)

For a 30-second video (900 frames at 30fps), use these approximate percentages:

| Act | Purpose | Approximate % | Frame Range | Feel |
|-----|---------|---------------|-------------|------|
| 1. Problem | Hook the viewer | 15-20% | 0-150 | Quick, punchy |
| 2. Solution | Show simplicity | 15-20% | 150-300 | Calm, clear |
| 3. Magic | Build excitement | 20-25% | 300-480 | Crescendo |
| 4. Result | Payoff | 15-20% | 480-630 | Satisfying |
| 5. Brand | Reveal + linger | 25-35% | 630-900 | Triumphant, breathing room |

### Key Pacing Principles

1. **Opening hook should be quick** - Grab attention in first 2-3 seconds
2. **Give important moments room to breathe** - Don't rush the magic or reveal
3. **Brand reveal needs the most time** - It's the climax, let it land
4. **Vary transition speeds** - Not every cut needs the same timing

### Dynamic Pacing Example

```tsx
const { fps } = useVideoConfig();

// Variable timing based on content importance
const TIMING = {
  problem: { start: 0, duration: 4.5 * fps },           // 4.5s - Quick hook
  solution: { start: 4.5 * fps, duration: 5 * fps },    // 5s - Clear explanation  
  magic: { start: 9.5 * fps, duration: 6 * fps },       // 6s - Build excitement
  result: { start: 15.5 * fps, duration: 5.5 * fps },   // 5.5s - Payoff
  reveal: { start: 21 * fps, duration: 9 * fps },       // 9s - Brand + breathing room
};

// Use the timing
<Sequence from={TIMING.problem.start} durationInFrames={TIMING.problem.duration}>
  <ProblemScene />
</Sequence>

<Sequence from={TIMING.solution.start} durationInFrames={TIMING.solution.duration}>
  <SolutionScene />
</Sequence>

// etc.
```

### Within-Scene Pacing

Elements within a scene should also have varied timing:

```tsx
// ❌ ROBOTIC - Everything appears at exact same intervals
<AnimatedText text="Line 1" blur={{ delay: 0 }} />
<AnimatedText text="Line 2" blur={{ delay: 15 }} />
<AnimatedText text="Line 3" blur={{ delay: 30 }} />
<AnimatedText text="Line 4" blur={{ delay: 45 }} />

// ✅ DYNAMIC - Varied intervals create rhythm
<AnimatedText text="Line 1" blur={{ delay: 0 }} />   // Immediate
<AnimatedText text="Line 2" blur={{ delay: 12 }} />  // Quick follow
<AnimatedText text="Line 3" blur={{ delay: 35 }} />  // Pause for emphasis
<AnimatedText text="Line 4" blur={{ delay: 42 }} />  // Fast finish
```

### Stagger Variation

```tsx
// ❌ MECHANICAL - Fixed stagger
animationUnit="word"
stagger={5}  // Every word at exactly 5 frames

// ✅ ORGANIC - Use spring animations that naturally vary
preset="springIn"  // Spring physics create natural variation
// Or use stagger with overlap for more organic feel
stagger={{ delay: 4, reverse: false }}
```

### Breathing Room for Key Moments

Some moments need extra time:

```tsx
// Brand reveal - give it space
<Sequence from={21 * fps} durationInFrames={9 * fps}>
  {/* Brand name appears with delay for impact */}
  <AnimatedText 
    text={brandName}
    preset="springIn"
    blur={{ delay: 0 }}
  />
  
  {/* Generous pause before tagline */}
  <AnimatedText 
    text={tagline}
    preset="softFadeIn"
    blur={{ delay: 45 }}  // 1.5 second pause after brand name
  />
  
  {/* Let it sit for 3+ seconds before video ends */}
</Sequence>
```

### Quick Reference: Timing Adjustments

| Situation | Timing Adjustment |
|-----------|-------------------|
| Hook/opening | Make it quick (2-4s) |
| Complex explanation | Slow down slightly |
| Emotional moment | Add breathing room |
| Brand reveal | Longest pause, let it land |
| Multiple text lines | Vary delays, don't make uniform |
| Transition between acts | Can be instant or slow depending on mood |
