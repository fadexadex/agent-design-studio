---
name: animated-text
description: AnimatedText component for text animations with presets, stagger, positioning API, and sub-components (LayoutGrid, TextSequence)
metadata:
  tags: text, animation, remotion, presets, positioning
---

## Overview

AnimatedText is the primary component for animated text in Remotion compositions. It supports:

- **9 animation presets** for common effects
- **4 animation units** (full, word, character, line)
- **Declarative positioning API** with anchor points
- **Stagger animations** for word/character effects
- **Exit animations** for text leaving the screen
- **Gradient text** support
- **Masking** for kinetic slide effects

## Import

```tsx
import {
  AnimatedText,
  LayoutGrid,
  TextSequence,
  type AnimatedTextProps,
  type PresetType,
  type AnimationUnit,
  type AnchorPosition,
} from "@/components/AnimatedText";
```

## AnimatedText Props

```typescript
interface AnimatedTextProps extends PositioningProps {
  // Content
  text: string;

  // Animation config
  animationUnit?: AnimationUnit; // 'full' | 'word' | 'character' | 'line'
  preset?: PresetType; // See presets below

  // Individual animations (can be combined, use boolean for defaults)
  blur?: BlurAnimation | boolean;
  opacity?: OpacityAnimation | boolean;
  scale?: ScaleAnimation | boolean;
  position?: PositionAnimation | boolean;
  typewriter?: TypewriterConfig | boolean;

  // Exit animation
  exit?: ExitAnimation;

  // Stagger for word/character animations
  stagger?: StaggerConfig | number; // number = delay in frames

  // Masking: Creates "kinetic" slide effect
  // Auto-enabled for slide presets, disabled for others
  mask?: boolean;

  // Styling
  color?: string;
  gradient?: GradientConfig;
  fontSize?: number | string;
  fontWeight?: number | string;
  fontFamily?: string;
  letterSpacing?: string;
  lineHeight?: number | string;

  // Layout
  style?: CSSProperties;
  containerStyle?: CSSProperties;

  // Auto-fit text to width
  fitToWidth?: number; // Max width in pixels
  maxFontSize?: number; // Cap font size when fitting
}
```

## Positioning Props

All AnimatedText components support the positioning API:

```typescript
interface PositioningProps {
  // Quick positioning with anchor points
  anchor?: AnchorPosition; // 'center' | 'top' | 'bottom' | 'left' | 'right' |
  // 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

  // Offsets from anchor (pixels or percentage)
  offsetX?: number | string; // e.g., 20, "10%", "-5%"
  offsetY?: number | string;

  // Or explicit coordinates
  x?: number | string; // e.g., "50%", 640
  y?: number | string;

  // Text alignment
  textAlign?: "left" | "center" | "right";

  // Constraints
  maxWidth?: number | string; // e.g., 800, "80%"
  zIndex?: number;

  // Animated positioning (move from one anchor to another)
  anchorAnimation?: AnchorAnimation;
}
```

## Animation Presets

| Preset         | Description                   | Default Unit |
| -------------- | ----------------------------- | ------------ |
| `fadeBlurIn`   | Fade in with blur             | full         |
| `fadeBlurOut`  | Fade out with blur            | full         |
| `scaleIn`      | Scale up from small           | full         |
| `springIn`     | Bouncy scale entrance         | full         |
| `slideInLeft`  | Slide from left               | full         |
| `slideInRight` | Slide from right              | full         |
| `slideInUp`    | Slide from bottom             | full         |
| `slideInDown`  | Slide from top                | full         |
| `typewriter`   | Character-by-character typing | character    |
| `none`         | No animation                  | full         |

## Animation Types

### BlurAnimation

```typescript
interface BlurAnimation {
  from?: number; // Start blur amount (default: 10)
  to?: number; // End blur amount (default: 0)
  delay?: number; // Frames to wait
  duration?: number; // Animation duration in frames
  easing?: EasingType;
}
```

### OpacityAnimation

```typescript
interface OpacityAnimation {
  from?: number; // Start opacity 0-1 (default: 0)
  to?: number; // End opacity 0-1 (default: 1)
  delay?: number;
  duration?: number;
  easing?: EasingType;
}
```

### ScaleAnimation

```typescript
interface ScaleAnimation {
  from?: number; // Start scale (default: 0.8)
  to?: number; // End scale (default: 1)
  delay?: number;
  duration?: number;
  easing?: EasingType | SpringConfig;
  origin?: string; // transform-origin
}
```

### PositionAnimation

```typescript
interface PositionAnimation {
  fromX?: number; // Start X offset in pixels
  toX?: number; // End X offset
  fromY?: number; // Start Y offset
  toY?: number; // End Y offset
  delay?: number;
  duration?: number;
  easing?: EasingType | SpringConfig;
}
```

### TypewriterConfig

```typescript
interface TypewriterConfig {
  cursor?: boolean; // Show blinking cursor (default: true)
  cursorChar?: string; // Cursor character (default: '|')
  cursorBlinkSpeed?: number; // Frames per blink cycle
}
```

### ExitAnimation

```typescript
interface ExitAnimation {
  startFrame?: number; // When to start exit animation
  blur?: BlurAnimation;
  opacity?: OpacityAnimation;
  scale?: ScaleAnimation;
  position?: PositionAnimation;
}
```

### StaggerConfig

```typescript
interface StaggerConfig {
  delay?: number; // Frames between each unit
  reverse?: boolean; // Animate from end to start
}
```

### GradientConfig

```typescript
interface GradientConfig {
  colors: string[]; // Array of color stops
  angle?: number; // Gradient angle in degrees
  type?: "linear" | "radial";
}
```

### EasingType

```typescript
type EasingType =
  | "linear"
  | "easeIn"
  | "easeOut"
  | "easeInOut"
  | "cubicIn"
  | "cubicOut"
  | "cubicInOut"
  | "backIn"
  | "backOut"
  | "backInOut";
```

### SpringConfig

```typescript
interface SpringConfig {
  type: "spring";
  damping?: number; // default: 10, use 200 for no bounce
  stiffness?: number; // default: 100
  mass?: number; // default: 1
}
```

## Usage Examples

### Basic Preset

```tsx
<AnimatedText
  text="Welcome to the show"
  preset="fadeBlurIn"
  anchor="center"
  fontSize={72}
  fontWeight={700}
  color="#FFFFFF"
/>
```

### Word-by-Word Stagger

```tsx
<AnimatedText
  text="Each word animates separately"
  preset="slideInUp"
  animationUnit="word"
  stagger={5} // 5 frame delay between words
  anchor="center"
  fontSize={48}
/>
```

### Character Stagger with Custom Animation

```tsx
<AnimatedText
  text="HELLO"
  animationUnit="character"
  blur={{ from: 20, to: 0, duration: 20 }}
  opacity={{ from: 0, to: 1, duration: 15 }}
  scale={{ from: 0.5, to: 1, easing: { type: "spring", damping: 12 } }}
  stagger={{ delay: 3, reverse: false }}
  anchor="center"
  fontSize={120}
  letterSpacing="0.1em"
/>
```

### Gradient Text

```tsx
<AnimatedText
  text="Gradient Magic"
  preset="scaleIn"
  gradient={{
    colors: ["#FF6B6B", "#4ECDC4", "#45B7D1"],
    angle: 45,
  }}
  anchor="center"
  fontSize={64}
/>
```

### With Exit Animation

```tsx
<AnimatedText
  text="I will fade out"
  preset="fadeBlurIn"
  exit={{
    startFrame: 60, // Start exit at frame 60
    opacity: { from: 1, to: 0, duration: 20 },
    blur: { from: 0, to: 10, duration: 20 },
  }}
  anchor="center"
  fontSize={48}
/>
```

### Animated Positioning

```tsx
<AnimatedText
  text="Moving text"
  preset="fadeBlurIn"
  anchorAnimation={{
    from: "left",
    to: "center",
    delay: 30,
    duration: 45,
    easing: { type: "spring", damping: 15 },
  }}
  fontSize={48}
/>
```

### Typewriter Effect

```tsx
<AnimatedText
  text="Typing this out..."
  preset="typewriter"
  typewriter={{
    cursor: true,
    cursorChar: "_",
    cursorBlinkSpeed: 30,
  }}
  anchor="center"
  fontSize={32}
  fontFamily="monospace"
/>
```

## LayoutGrid

Group multiple AnimatedText elements with flexbox layout:

```typescript
interface LayoutGridProps extends PositioningProps {
  direction?: "row" | "column"; // default: 'column'
  gap?: number | string; // space between items
  align?: "start" | "center" | "end"; // cross-axis
  justify?: "start" | "center" | "end" | "space-between"; // main-axis
  children: ReactNode;
  style?: CSSProperties;
}
```

### LayoutGrid Example

```tsx
<LayoutGrid anchor="center" direction="column" gap={20} align="center">
  <AnimatedText
    text="Main Title"
    preset="fadeBlurIn"
    fontSize={72}
    fontWeight={700}
  />
  <AnimatedText
    text="Subtitle goes here"
    preset="fadeBlurIn"
    blur={{ delay: 10 }}
    opacity={{ delay: 10 }}
    fontSize={32}
    color="#888888"
  />
</LayoutGrid>
```

## TextSequence

Sequential text animations with automatic timing:

```typescript
interface TextSequenceProps {
  mode?: "chain" | "manual"; // 'chain' auto-calculates timing
  overlap?: number; // seconds of overlap in chain mode
  children: ReactNode;
}

interface TextSequenceItemProps {
  text: string;
  duration: number; // seconds this item is visible
  delay?: number; // manual mode: seconds offset
  exitPreset?: PresetType; // auto-apply exit animation
  // ... plus all AnimatedText props
}
```

### TextSequence Chain Mode

```tsx
<TextSequence mode="chain" overlap={0.5}>
  <TextSequence.Item
    text="First, this appears"
    duration={2}
    preset="slideInUp"
    exitPreset="fadeBlurOut"
    anchor="center"
    fontSize={48}
  />
  <TextSequence.Item
    text="Then this takes over"
    duration={2}
    preset="slideInUp"
    exitPreset="fadeBlurOut"
    anchor="center"
    fontSize={48}
  />
  <TextSequence.Item
    text="And finally this"
    duration={3}
    preset="slideInUp"
    anchor="center"
    fontSize={48}
  />
</TextSequence>
```

## Common Patterns

### Hero Text with Staggered Words

```tsx
<LayoutGrid anchor="center" direction="column" gap={0}>
  <AnimatedText
    text="Build Amazing"
    preset="slideInUp"
    animationUnit="word"
    stagger={8}
    fontSize={96}
    fontWeight={800}
  />
  <AnimatedText
    text="Videos with Code"
    preset="slideInUp"
    animationUnit="word"
    stagger={8}
    blur={{ delay: 15 }}
    opacity={{ delay: 15 }}
    position={{ delay: 15 }}
    fontSize={96}
    fontWeight={800}
    gradient={{ colors: ["#6366F1", "#EC4899"] }}
  />
</LayoutGrid>
```

### Quote with Attribution

```tsx
<LayoutGrid anchor="center" direction="column" gap={40} maxWidth={800}>
  <AnimatedText
    text="\"The best way to predict the future is to create it.\""
    preset="fadeBlurIn"
    fontSize={36}
    fontStyle="italic"
    textAlign="center"
    lineHeight={1.6}
  />
  <AnimatedText
    text="— Peter Drucker"
    preset="fadeBlurIn"
    blur={{ delay: 20 }}
    opacity={{ delay: 20 }}
    fontSize={24}
    color="#666666"
  />
</LayoutGrid>
```

## Best Practices

1. **Use presets first** - Only customize animations when presets don't match your needs
2. **Prefer anchor positioning** - Avoid manual x/y pixel values; anchors are responsive
3. **Use LayoutGrid for groups** - Don't manually position related text elements
4. **Keep stagger values small** - 3-8 frames per unit usually looks best
5. **Match exit to entrance** - If using `slideInUp`, consider `slideOutDown` for exit
6. **Use spring for bouncy effects** - `{ type: "spring", damping: 12 }` gives nice bounce

## See Also

- [Full Examples](assets/animated-text-examples.tsx) - Complete code examples
- [Layout](layout.md) - MotionContainer for non-text animations
- [MockupFrame](mockup-frame.md) - Device mockups to pair with text
