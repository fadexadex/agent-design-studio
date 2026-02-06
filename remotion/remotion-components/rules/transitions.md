---
name: transitions
description: Scene transitions including IrisTransition and TransitionSeries from @remotion/transitions
metadata:
  tags: transition, iris, wipe, fade, scene, remotion
---

## Overview

The Transitions module provides:

- **IrisTransition** - Custom circular wipe effect (enter/exit modes)
- **TransitionSeries** - Re-exported from `@remotion/transitions` for scene-to-scene transitions
- **Timing utilities** - `linearTiming`, `springTiming` for controlling transition speed

## Import

```tsx
import {
  // Custom transition
  IrisTransition,
  type IrisTransitionProps,
  type IrisMode,

  // From @remotion/transitions
  TransitionSeries,
  linearTiming,
  springTiming,
} from "@/components/Transitions";

// Import specific transition presentations directly
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { flip } from "@remotion/transitions/flip";
import { clockWipe } from "@remotion/transitions/clock-wipe";
```

---

## IrisTransition

A circular wipe transition (like classic cartoons closing/opening).

### Props

```typescript
interface IrisTransitionProps {
  /**
   * Mode of the transition.
   * - "exit": Circle grows from center to cover the screen (scene ends)
   * - "enter": Circle shrinks from full to reveal the scene (scene begins)
   */
  mode?: IrisMode; // 'enter' | 'exit'

  /**
   * Color of the iris overlay.
   * @default "#000000"
   */
  color?: string;

  /**
   * Duration of the transition in frames.
   */
  durationInFrames: number;

  /**
   * Delay before the transition starts (in frames).
   * @default 0
   */
  delay?: number;

  /**
   * Custom easing function.
   * @default Easing.inOut(Easing.ease)
   */
  easing?: (t: number) => number;

  /**
   * Center point of the iris as [x, y] percentages (0-100).
   * @default [50, 50] (center)
   */
  center?: [number, number];
}
```

### Exit Mode (Scene Ending)

Circle grows from center to cover the screen:

```tsx
<Sequence from={0} durationInFrames={90}>
  <MyScene />

  {/* Iris closes at frame 60 */}
  <IrisTransition
    mode="exit"
    durationInFrames={30}
    delay={60}
    color="#000000"
  />
</Sequence>
```

### Enter Mode (Scene Beginning)

Circle shrinks from full to reveal content:

```tsx
<Sequence from={0} durationInFrames={90}>
  {/* Iris opens to reveal scene */}
  <IrisTransition mode="enter" durationInFrames={30} color="#000000" />

  <MyScene />
</Sequence>
```

### Custom Center Point

```tsx
// Iris originates from bottom-right corner
<IrisTransition
  mode="exit"
  durationInFrames={25}
  center={[80, 80]} // 80% from left, 80% from top
  color="#1a1a1a"
/>
```

### Custom Easing

```tsx
import { Easing } from "remotion";

<IrisTransition
  mode="exit"
  durationInFrames={40}
  easing={Easing.bezier(0.25, 0.1, 0.25, 1)}
  color="#000"
/>;
```

---

## TransitionSeries

For scene-to-scene transitions, use TransitionSeries from `@remotion/transitions`:

### Basic Usage

```tsx
import { TransitionSeries, linearTiming } from "@/components/Transitions";
import { fade } from "@remotion/transitions/fade";

<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={60}>
    <SceneA />
  </TransitionSeries.Sequence>

  <TransitionSeries.Transition
    presentation={fade()}
    timing={linearTiming({ durationInFrames: 15 })}
  />

  <TransitionSeries.Sequence durationInFrames={60}>
    <SceneB />
  </TransitionSeries.Sequence>
</TransitionSeries>;
```

### Available Presentations

Import from `@remotion/transitions/*`:

| Presentation  | Import                             | Description                  |
| ------------- | ---------------------------------- | ---------------------------- |
| `fade()`      | `@remotion/transitions/fade`       | Crossfade between scenes     |
| `slide()`     | `@remotion/transitions/slide`      | Slide one scene over another |
| `wipe()`      | `@remotion/transitions/wipe`       | Wipe from one side           |
| `flip()`      | `@remotion/transitions/flip`       | 3D flip effect               |
| `clockWipe()` | `@remotion/transitions/clock-wipe` | Clock-style circular wipe    |

### Slide Transition

```tsx
import { slide } from "@remotion/transitions/slide";

<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={60}>
    <SceneA />
  </TransitionSeries.Sequence>

  <TransitionSeries.Transition
    presentation={slide({ direction: "from-right" })}
    timing={springTiming({
      config: { damping: 200 },
      durationInFrames: 30,
    })}
  />

  <TransitionSeries.Sequence durationInFrames={60}>
    <SceneB />
  </TransitionSeries.Sequence>
</TransitionSeries>;
```

### Wipe Transition

```tsx
import { wipe } from "@remotion/transitions/wipe";

<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={60}>
    <SceneA />
  </TransitionSeries.Sequence>

  <TransitionSeries.Transition
    presentation={wipe({ direction: "from-left" })}
    timing={linearTiming({ durationInFrames: 20 })}
  />

  <TransitionSeries.Sequence durationInFrames={60}>
    <SceneB />
  </TransitionSeries.Sequence>
</TransitionSeries>;
```

### Multiple Scenes

```tsx
<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={90}>
    <IntroScene />
  </TransitionSeries.Sequence>

  <TransitionSeries.Transition
    presentation={fade()}
    timing={linearTiming({ durationInFrames: 15 })}
  />

  <TransitionSeries.Sequence durationInFrames={120}>
    <MainScene />
  </TransitionSeries.Sequence>

  <TransitionSeries.Transition
    presentation={slide({ direction: "from-bottom" })}
    timing={springTiming({ durationInFrames: 25 })}
  />

  <TransitionSeries.Sequence durationInFrames={90}>
    <OutroScene />
  </TransitionSeries.Sequence>
</TransitionSeries>
```

---

## Timing Functions

### linearTiming

Constant speed transition:

```tsx
linearTiming({
  durationInFrames: 20,
  easing: Easing.inOut(Easing.ease), // optional
});
```

### springTiming

Spring-based physics:

```tsx
springTiming({
  durationInFrames: 30,
  config: {
    damping: 200, // Higher = less bounce (200 = no bounce)
    stiffness: 100,
    mass: 1,
  },
});
```

---

## Common Patterns

### Intro → Content → Outro

```tsx
const VideoComposition = () => {
  return (
    <TransitionSeries>
      {/* Intro with logo */}
      <TransitionSeries.Sequence durationInFrames={60}>
        <LogoIntro />
      </TransitionSeries.Sequence>

      {/* Fade to main content */}
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 15 })}
      />

      {/* Main content */}
      <TransitionSeries.Sequence durationInFrames={180}>
        <MainContent />
      </TransitionSeries.Sequence>

      {/* Slide to outro */}
      <TransitionSeries.Transition
        presentation={slide({ direction: "from-right" })}
        timing={springTiming({ durationInFrames: 25 })}
      />

      {/* Outro with CTA */}
      <TransitionSeries.Sequence durationInFrames={90}>
        <OutroCTA />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
```

### Iris as Scene Bookends

```tsx
const Scene = () => {
  return (
    <AbsoluteFill>
      {/* Iris opens at start */}
      <IrisTransition mode="enter" durationInFrames={20} color="#000" />

      {/* Scene content */}
      <MainContent />

      {/* Iris closes at end (frame 100) */}
      <IrisTransition
        mode="exit"
        durationInFrames={20}
        delay={100}
        color="#000"
      />
    </AbsoluteFill>
  );
};
```

### Combining IrisTransition with TransitionSeries

```tsx
// Use Iris for the final exit, TransitionSeries for mid-video transitions
<>
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={120}>
      <SceneA />
    </TransitionSeries.Sequence>

    <TransitionSeries.Transition
      presentation={fade()}
      timing={linearTiming({ durationInFrames: 15 })}
    />

    <TransitionSeries.Sequence durationInFrames={120}>
      <SceneB />
      {/* Iris close at end of SceneB */}
      <IrisTransition
        mode="exit"
        durationInFrames={25}
        delay={95}
        color="#000"
      />
    </TransitionSeries.Sequence>
  </TransitionSeries>
</>
```

---

## When to Use What

| Scenario                   | Use                                              |
| -------------------------- | ------------------------------------------------ |
| Scene-to-scene transitions | TransitionSeries                                 |
| Classic cartoon open/close | IrisTransition                                   |
| Fade between scenes        | `fade()` presentation                            |
| Slide/swipe effect         | `slide()` presentation                           |
| Overlay exit effect        | IrisTransition `mode="exit"`                     |
| No transition, just cut    | Don't use TransitionSeries, use regular Sequence |

## Best Practices

1. **Keep transitions short** - 15-30 frames (0.5-1 second at 30fps)
2. **Match energy to content** - Fast content = fast transitions
3. **Use Iris sparingly** - It's attention-grabbing; save for intro/outro
4. **Consistent direction** - If sliding from left, keep that direction throughout
5. **Test at full speed** - Transitions that look good frame-by-frame may feel wrong in motion

## See Also

- [Remotion TransitionSeries docs](https://www.remotion.dev/docs/transitions/transitionseries)
- [MotionContainer](layout.md) - For element-level exit animations
- [MockupFrame](mockup-frame.md) - Has built-in exit presets
