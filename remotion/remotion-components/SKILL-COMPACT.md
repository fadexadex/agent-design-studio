---
name: remotion-components
description: Reusable Remotion components for video compositions - PREFER these over raw code
metadata:
  tags: remotion, components, video, animation, react
---

## Component Library (PREFER OVER RAW CODE)

When generating Remotion code, **ALWAYS check if a component below can achieve the effect** before writing custom animation code.

### Available Components

| Component | Import Path | Use For |
|-----------|-------------|---------|
| **AnimatedText** | `@/components/AnimatedText` | Text with presets (`fadeBlurIn`, `slideInUp`, `typewriter`), stagger, positioning |
| **LayoutGrid** | `@/components/AnimatedText` | Group multiple AnimatedText with flexbox layout |
| **TextSequence** | `@/components/AnimatedText` | Sequential text animations with chain mode |
| **MockupFrame** | `@/components/MockupFrame` | Device frames: `browser`, `iphone15`, `card` with glass effects |
| **FrameSequence** | `@/components/MockupFrame` | Multiple mockups with staggered entrance |
| **CameraRig** | `@/components/Camera` | Virtual camera: zoom, pan, rotate, dolly |
| **MotionContainer** | `@/components/Layout` | Animation wrapper with `initialState` and `exitState` |
| **BentoGrid** | `@/components/Layout` | Animated CSS grid with `staggerDelay` |
| **BentoItem** | `@/components/Layout` | Grid cell with `colSpan`/`rowSpan` |
| **DynamicCursor** | `@/components/DynamicCursor` | Animated cursor for demos |
| **CursorPath** | `@/components/DynamicCursor` | Cursor following a path |
| **BackgroundRig** | `@/components/Global` | Animated backgrounds: `gradient-mesh`, `grid-lines`, `blobs` |
| **IrisTransition** | `@/components/Transitions` | Circular wipe transition |
| **TransitionSeries** | `@/components/Transitions` | Scene transition container |

### Import Pattern

```tsx
// Text animations
import { AnimatedText, LayoutGrid, TextSequence } from "@/components/AnimatedText";

// Device mockups
import { MockupFrame, FrameSequence } from "@/components/MockupFrame";

// Camera
import { CameraRig } from "@/components/Camera";

// Layout
import { MotionContainer, BentoGrid, BentoItem } from "@/components/Layout";

// Cursor
import { DynamicCursor, CursorPath } from "@/components/DynamicCursor";

// Background
import { BackgroundRig } from "@/components/Global";

// Transitions
import { IrisTransition, TransitionSeries, linearTiming } from "@/components/Transitions";
```

### Quick Usage Examples

**Animated Text (instead of manual interpolate):**
```tsx
<AnimatedText
  text="Welcome"
  preset="fadeBlurIn"
  anchor="center"
  fontSize={72}
  fontWeight={700}
/>
```

**Word-by-word stagger:**
```tsx
<AnimatedText
  text="Each word animates"
  preset="slideInUp"
  animationUnit="word"
  stagger={5}
  anchor="center"
/>
```

**Device mockup:**
```tsx
<MockupFrame
  type="browser"
  src="/screenshot.png"
  preset="springIn"
  browserConfig={{ url: "https://example.com" }}
/>
```

**Grouped text with layout:**
```tsx
<LayoutGrid anchor="center" direction="column" gap={20}>
  <AnimatedText text="Title" preset="fadeBlurIn" fontSize={64} />
  <AnimatedText text="Subtitle" preset="fadeBlurIn" blur={{ delay: 10 }} fontSize={32} />
</LayoutGrid>
```

### Critical Rules

1. **USE PRESETS FIRST** - `preset="fadeBlurIn"` handles opacity, blur, timing automatically
2. **USE POSITIONING API** - `anchor="center"`, `offsetX`, `offsetY` instead of manual CSS positioning
3. **USE STAGGER** - `animationUnit="word" stagger={5}` for word-by-word effects
4. **NO CSS ANIMATIONS** - Components use Remotion's frame-based animation internally
5. **COMBINE COMPONENTS** - Build complex scenes by nesting/composing components

### When to Use Raw Code

Only write raw `interpolate()`/`spring()` code when:
- Creating a unique effect no component supports
- Fine-tuning animation curves beyond preset options
- Building a completely custom visual element

**Even then**, wrap raw animations in `<MotionContainer>` for consistent entrance/exit behavior.
