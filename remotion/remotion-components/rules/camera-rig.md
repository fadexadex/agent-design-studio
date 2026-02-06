---
name: camera-rig
description: CameraRig component for virtual camera effects including zoom, pan, and rotation
metadata:
  tags: camera, zoom, pan, rotation, transform, animation
---

## Overview

CameraRig provides virtual camera controls for 2D Remotion compositions. It wraps content and applies transforms for:

- **Zoom** - Scale the scene in/out
- **Pan** - Move the camera's target point
- **Rotation** - Rotate the view
- **Focus Point** - Control the center of zoom/rotation

## Import

```tsx
import { CameraRig, type CameraRigProps } from "@/components/Camera";
```

## Props

```typescript
interface CameraRigProps {
  /**
   * Current zoom level (1 = default, no zoom).
   * @default 1
   */
  zoom?: number;

  /**
   * Camera X position (target point in the world).
   * @default 0
   */
  x?: number;

  /**
   * Camera Y position (target point in the world).
   * @default 0
   */
  y?: number;

  /**
   * Camera rotation in degrees.
   * @default 0
   */
  rotation?: number;

  /**
   * Transform origin as [x, y] ratios (0-1).
   * The camera will focus on this point during zoom/rotation.
   * @default [0.5, 0.5] (center)
   */
  focusPoint?: [number, number];

  children: React.ReactNode;
}
```

## How It Works

CameraRig applies transforms in this order:

1. **Translate** - Move the world so the target point (x, y) is at the focus point
2. **Rotate** - Rotate around the focus point
3. **Scale** - Zoom from the focus point

The `focusPoint` determines where on screen the camera "looks at":

- `[0.5, 0.5]` = center (default)
- `[0, 0]` = top-left corner
- `[1, 1]` = bottom-right corner

## Usage Examples

### Basic Zoom

```tsx
import { useCurrentFrame, interpolate } from "remotion";

const MyScene = () => {
  const frame = useCurrentFrame();

  // Zoom from 1x to 1.5x over 60 frames
  const zoom = interpolate(frame, [0, 60], [1, 1.5]);

  return (
    <CameraRig zoom={zoom}>
      <MyContent />
    </CameraRig>
  );
};
```

### Pan Across Scene

```tsx
const MyScene = () => {
  const frame = useCurrentFrame();

  // Pan from left side to right side
  const panX = interpolate(frame, [0, 90], [0, 400]);

  return (
    <CameraRig x={panX}>
      <WideContent />
    </CameraRig>
  );
};
```

### Zoom + Pan Combo

```tsx
const MyScene = () => {
  const frame = useCurrentFrame();

  const zoom = interpolate(frame, [0, 60], [1, 1.3]);
  const panX = interpolate(frame, [0, 60], [0, 100]);
  const panY = interpolate(frame, [0, 60], [0, 50]);

  return (
    <CameraRig zoom={zoom} x={panX} y={panY}>
      <Dashboard />
    </CameraRig>
  );
};
```

### Rotation Effect

```tsx
const MyScene = () => {
  const frame = useCurrentFrame();

  // Subtle rotation for dynamic feel
  const rotation = interpolate(frame, [0, 120], [0, 5]);

  return (
    <CameraRig rotation={rotation} zoom={1.1}>
      <HeroSection />
    </CameraRig>
  );
};
```

### Focus on Corner

```tsx
const MyScene = () => {
  const frame = useCurrentFrame();

  // Zoom into top-left corner
  const zoom = interpolate(frame, [0, 45], [1, 2]);

  return (
    <CameraRig
      zoom={zoom}
      focusPoint={[0, 0]} // Top-left
    >
      <GridOfItems />
    </CameraRig>
  );
};
```

### Spring-Based Movement

```tsx
import { spring, useVideoConfig } from "remotion";

const MyScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Smooth, bouncy zoom
  const zoom = spring({
    frame,
    fps,
    from: 1,
    to: 1.4,
    config: { damping: 12, stiffness: 100 },
  });

  return (
    <CameraRig zoom={zoom}>
      <Content />
    </CameraRig>
  );
};
```

## Common Patterns

### Ken Burns Effect (Slow Zoom + Pan)

```tsx
const KenBurnsScene = () => {
  const frame = useCurrentFrame();

  // Very slow zoom over entire duration
  const zoom = interpolate(frame, [0, 150], [1, 1.15], {
    extrapolateRight: "clamp",
  });

  // Gentle pan
  const panX = interpolate(frame, [0, 150], [0, 50]);
  const panY = interpolate(frame, [0, 150], [0, 30]);

  return (
    <CameraRig zoom={zoom} x={panX} y={panY}>
      <Img src="/hero-image.jpg" style={{ width: "100%", height: "100%" }} />
    </CameraRig>
  );
};
```

### Zoom to Element

```tsx
const ZoomToFeature = () => {
  const frame = useCurrentFrame();

  // Start wide, zoom to specific area
  const zoom = interpolate(frame, [30, 60], [1, 2.5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Pan to the feature location (adjust based on your layout)
  const panX = interpolate(frame, [30, 60], [0, 300]);
  const panY = interpolate(frame, [30, 60], [0, 150]);

  return (
    <CameraRig zoom={zoom} x={panX} y={panY}>
      <DashboardWithFeatureHighlight />
    </CameraRig>
  );
};
```

### Dramatic Reveal

```tsx
const DramaticReveal = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Start zoomed in, pull back to reveal
  const zoom = spring({
    frame,
    fps,
    from: 2,
    to: 1,
    config: { damping: 15, stiffness: 80 },
    durationInFrames: 60,
  });

  // Slight rotation for drama
  const rotation = interpolate(frame, [0, 60], [3, 0]);

  return (
    <CameraRig zoom={zoom} rotation={rotation}>
      <ProductShowcase />
    </CameraRig>
  );
};
```

### Multi-Stage Camera Movement

```tsx
const MultiStageCamera = () => {
  const frame = useCurrentFrame();

  // Stage 1: Zoom in (frames 0-30)
  // Stage 2: Pan right (frames 30-60)
  // Stage 3: Zoom out (frames 60-90)

  const zoom = interpolate(frame, [0, 30, 60, 90], [1, 1.5, 1.5, 1], {
    extrapolateRight: "clamp",
  });

  const panX = interpolate(frame, [30, 60], [0, 200], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <CameraRig zoom={zoom} x={panX}>
      <Sequence from={0}>
        <SceneContent />
      </Sequence>
    </CameraRig>
  );
};
```

## Best Practices

1. **Use with `interpolate` or `spring`** - Always animate camera values, don't jump
2. **Keep zoom subtle** - 1.0 to 1.3 is usually enough; beyond 1.5 looks aggressive
3. **Match focus point to content** - Zoom into corners/edges when content is there
4. **Combine sparingly** - Zoom + pan + rotation together can be disorienting
5. **Use easing** - Apply easing to interpolate for smooth start/stop

## Limitations

- CameraRig transforms the entire scene - individual elements can't be excluded
- For element-specific animations, use MockupFrame or MotionContainer instead
- Very high zoom (>3x) may show pixelation on raster content

## See Also

- [MockupFrame](mockup-frame.md) - Has built-in 3D rotation for individual elements
- [MotionContainer](layout.md) - For animating individual containers
- [Remotion interpolate docs](https://www.remotion.dev/docs/interpolate) - Core animation function
