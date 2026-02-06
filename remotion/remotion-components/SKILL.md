---
name: remotion-components
description: Reusable Remotion components for building video compositions with animated text, device mockups, camera controls, layouts, transitions, cursors, and backgrounds.
metadata:
  tags: remotion, components, video, animation, react, typescript
---

## When to use

Use this skill when:

- Creating new Remotion video compositions
- Building animated scenes with text, mockups, or UI elements
- Needing camera movements, transitions, or cursor animations
- Composing multiple visual elements together
- Working with the LangEase video component library

## Agent Instructions

**PREFER existing components** over creating new ones:

1. **Check components first** - Always check if a component exists here before writing custom animation code
2. **Use presets** - Most components have presets (e.g., `preset="fadeBlurIn"`) that handle common animation patterns
3. **Combine components** - Build complex scenes by composing existing components rather than creating new primitives
4. **Use the Positioning API** - AnimatedText has a declarative positioning system (`anchor`, `offsetX/Y`) instead of manual CSS transforms
5. **Spring animations** - All components use Remotion's `spring()` for natural motion by default

**NEVER do these:**

- Don't use CSS transitions or `@keyframes` animations - they won't render correctly in Remotion
- Don't create custom animation wrappers when MotionContainer exists
- Don't manually position text with absolute pixel values when anchor positions are available

## Component Overview

| Component        | Import Path                  | Purpose                                               |
| ---------------- | ---------------------------- | ----------------------------------------------------- |
| AnimatedText     | `@/components/AnimatedText`  | Text with entrance/exit animations, positioning API   |
| LayoutGrid       | `@/components/AnimatedText`  | Flexbox grouping for multiple AnimatedText elements   |
| TextSequence     | `@/components/AnimatedText`  | Sequential text animations with chain mode            |
| MockupFrame      | `@/components/MockupFrame`   | Device frames (browser, iPhone, card) with animations |
| FrameSequence    | `@/components/MockupFrame`   | Staggered entrance for multiple frames                |
| CameraRig        | `@/components/Camera`        | Virtual camera (zoom, pan, rotate)                    |
| MotionContainer  | `@/components/Layout`        | Generic animation wrapper with entry/exit states      |
| BentoGrid        | `@/components/Layout`        | Animated CSS grid layout with stagger                 |
| BentoItem        | `@/components/Layout`        | Grid cell with span control                           |
| DynamicCursor    | `@/components/DynamicCursor` | Animated cursor with variants                         |
| CursorPath       | `@/components/DynamicCursor` | Cursor movement along a path                          |
| **Background**   | `@/components/Global`        | Composable backgrounds with presets, layers, effects  |
| BackgroundRig    | `@/components/Global`        | *(Deprecated)* Use Background instead                 |
| IrisTransition   | `@/components/Transitions`   | Circular wipe transition                              |
| TransitionSeries | `@/components/Transitions`   | Re-export from @remotion/transitions                  |

## Common Import Pattern

```tsx
// Text animations
import {
  AnimatedText,
  LayoutGrid,
  TextSequence,
} from "@/components/AnimatedText";

// Device mockups
import { MockupFrame, FrameSequence } from "@/components/MockupFrame";

// Camera
import { CameraRig } from "@/components/Camera";

// Layout
import { MotionContainer, BentoGrid, BentoItem } from "@/components/Layout";

// Cursor
import { DynamicCursor, CursorPath } from "@/components/DynamicCursor";

// Background (recommended)
import { Background, backgroundPresets, getBackgroundPreset } from "@/components/Global";

// BackgroundRig (deprecated - use Background instead)
import { BackgroundRig } from "@/components/Global";

// Transitions
import {
  IrisTransition,
  TransitionSeries,
  linearTiming,
} from "@/components/Transitions";
```

## How to use

Read these rule files for detailed documentation on each component:

- [AnimatedText](rules/animated-text.md) - Text animations with 9 presets, stagger, and positioning API
- [MockupFrame](rules/mockup-frame.md) - Device mockups with glass effects, glare, and 3D rotation
- [CameraRig](rules/camera-rig.md) - Virtual camera for zoom, pan, and rotate effects
- [Layout](rules/layout.md) - MotionContainer and BentoGrid for animated layouts
- [Transitions](rules/transitions.md) - Scene transitions (IrisTransition, TransitionSeries)
- [DynamicCursor](rules/dynamic-cursor.md) - Cursor animations and path following
- [Background](rules/background.md) - Composable backgrounds with presets, layers, and effects
- [BackgroundRig](rules/background-rig.md) - *(Deprecated)* Use Background instead

## Quick Examples

### Basic Text Animation

```tsx
<AnimatedText
  text="Hello World"
  preset="fadeBlurIn"
  anchor="center"
  fontSize={64}
/>
```

### Device Mockup with Animation

```tsx
<MockupFrame
  type="browser"
  src="/screenshot.png"
  preset="springIn"
  browserConfig={{ url: "https://example.com" }}
/>
```

### Animated Layout

```tsx
<BentoGrid columns={3} staggerDelay={5}>
  <BentoItem colSpan={2}>
    <LargeCard />
  </BentoItem>
  <BentoItem>
    <SmallCard />
  </BentoItem>
</BentoGrid>
```

See [Full Scene Example](rules/assets/full-scene-example.tsx) for a complete composition using multiple components together.
