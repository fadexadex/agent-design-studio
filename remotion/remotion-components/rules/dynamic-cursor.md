---
name: dynamic-cursor
description: DynamicCursor and CursorPath components for animated cursors with variants, click effects, and path following
metadata:
  tags: cursor, pointer, animation, click, path, ui-demo
---

## Overview

Cursor components for UI demos and tutorials:

- **DynamicCursor** - Animated cursor with variants, click effects, and labels
- **CursorPath** - Move cursor along a series of points with optional trail

## Import

```tsx
import {
  DynamicCursor,
  CursorPath,
  type DynamicCursorProps,
  type CursorPathProps,
  type CursorVariant,
} from "@/components/DynamicCursor";
```

---

## DynamicCursor

A single cursor at a specific position.

### Props

```typescript
interface DynamicCursorProps {
  x: number; // X position in pixels
  y: number; // Y position in pixels
  variant?: CursorVariant; // Cursor style (default: 'arrow')
  isClicking?: boolean; // Shrink cursor to simulate click
  color?: string; // Cursor color (default: '#000000')
  opacity?: number; // Cursor opacity (default: 1)
  scale?: number; // Scale multiplier (default: 1)
  label?: string; // Co-presence label (e.g., user name)

  /**
   * Frame at which the ripple animation should start.
   * If provided, a ripple effect will animate from this frame.
   */
  rippleStartFrame?: number;

  /**
   * Duration of the ripple animation in frames.
   * @default 30
   */
  rippleDuration?: number;
}
```

### Cursor Variants

| Variant     | Description                 |
| ----------- | --------------------------- |
| `arrow`     | Default pointer arrow       |
| `pointer`   | Hand/finger pointing cursor |
| `text`      | I-beam for text selection   |
| `wait`      | Loading spinner             |
| `crosshair` | Crosshair cursor            |

### Basic Usage

```tsx
<DynamicCursor x={400} y={300} variant="arrow" color="#000000" />
```

### With Click State

```tsx
const ClickDemo = () => {
  const frame = useCurrentFrame();

  // Simulate click at frames 30-35
  const isClicking = frame >= 30 && frame <= 35;

  return (
    <DynamicCursor x={400} y={300} variant="pointer" isClicking={isClicking} />
  );
};
```

### With Ripple Effect

```tsx
// Ripple starts at frame 30, lasts 30 frames
<DynamicCursor
  x={400}
  y={300}
  variant="pointer"
  rippleStartFrame={30}
  rippleDuration={30}
  color="#3B82F6"
/>
```

### With Label (Co-presence)

```tsx
// Shows a name tag next to cursor (like Figma multiplayer)
<DynamicCursor
  x={200}
  y={150}
  variant="arrow"
  label="John Doe"
  color="#6366F1"
/>
```

### Animated Position

```tsx
const MovingCursor = () => {
  const frame = useCurrentFrame();

  const x = interpolate(frame, [0, 60], [100, 500]);
  const y = interpolate(frame, [0, 60], [100, 300]);

  return <DynamicCursor x={x} y={y} variant="arrow" />;
};
```

### Variant Change Mid-Animation

```tsx
const VariantDemo = () => {
  const frame = useCurrentFrame();

  // Arrow until frame 30, then pointer
  const variant = frame < 30 ? "arrow" : "pointer";

  return <DynamicCursor x={400} y={300} variant={variant} />;
};
```

---

## CursorPath

Move a cursor along a series of keyframe points.

### Props

```typescript
interface CursorPathProps {
  points: Point[]; // Array of {x, y} positions
  startTime?: number; // Frame to start movement (default: 0)
  duration?: number; // Total movement duration in frames (default: 60)
  variant?: CursorVariant; // Cursor style
  color?: string; // Cursor color
  label?: string; // Co-presence label
  showTrail?: boolean; // Show ghost trail behind cursor
  trailLength?: number; // Number of ghost cursors (default: 5)
}

interface Point {
  x: number;
  y: number;
}
```

### Basic Path

```tsx
<CursorPath
  points={[
    { x: 100, y: 100 },
    { x: 400, y: 200 },
    { x: 600, y: 150 },
  ]}
  duration={60}
  variant="arrow"
/>
```

### With Trail Effect

```tsx
<CursorPath
  points={[
    { x: 100, y: 100 },
    { x: 300, y: 250 },
    { x: 500, y: 200 },
    { x: 700, y: 300 },
  ]}
  duration={90}
  showTrail
  trailLength={5}
  variant="pointer"
  color="#000000"
/>
```

### Delayed Start

```tsx
// Cursor starts moving at frame 30
<CursorPath
  points={[
    { x: 100, y: 100 },
    { x: 500, y: 300 },
  ]}
  startTime={30}
  duration={45}
  variant="arrow"
/>
```

### UI Navigation Demo

```tsx
// Simulate user navigating a UI
<CursorPath
  points={[
    { x: 50, y: 50 }, // Start at menu
    { x: 150, y: 200 }, // Move to button
    { x: 150, y: 200 }, // Pause at button (same point)
    { x: 400, y: 300 }, // Move to input
    { x: 600, y: 400 }, // Move to submit
  ]}
  duration={120}
  variant="pointer"
  label="Demo User"
  color="#6366F1"
/>
```

---

## Common Patterns

### Button Click Demo

```tsx
const ButtonClickDemo = () => {
  const frame = useCurrentFrame();

  // Move to button, pause, click
  const buttonX = 400;
  const buttonY = 300;

  const x = interpolate(frame, [0, 30], [100, buttonX], {
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame, [0, 30], [100, buttonY], {
    extrapolateRight: "clamp",
  });

  // Click at frames 40-45
  const isClicking = frame >= 40 && frame <= 45;

  return (
    <AbsoluteFill>
      <Button
        style={{ position: "absolute", left: buttonX - 50, top: buttonY - 20 }}
      >
        Click Me
      </Button>

      <DynamicCursor
        x={x}
        y={y}
        variant={frame < 30 ? "arrow" : "pointer"}
        isClicking={isClicking}
        rippleStartFrame={40}
        rippleDuration={25}
      />
    </AbsoluteFill>
  );
};
```

### Form Fill Demo

```tsx
const FormFillDemo = () => {
  return (
    <AbsoluteFill>
      <FormUI />

      <CursorPath
        points={[
          { x: 50, y: 50 }, // Start
          { x: 200, y: 150 }, // Name input
          { x: 200, y: 220 }, // Email input
          { x: 200, y: 290 }, // Password input
          { x: 250, y: 360 }, // Submit button
        ]}
        duration={150}
        variant="text" // Text cursor for inputs
        color="#000"
      />
    </AbsoluteFill>
  );
};
```

### Multi-Cursor Collaboration

```tsx
const CollaborationDemo = () => {
  return (
    <AbsoluteFill>
      <DocumentUI />

      {/* User 1 */}
      <CursorPath
        points={[
          { x: 100, y: 200 },
          { x: 300, y: 250 },
        ]}
        duration={60}
        label="Alice"
        color="#EF4444"
      />

      {/* User 2 */}
      <CursorPath
        points={[
          { x: 500, y: 150 },
          { x: 400, y: 300 },
        ]}
        startTime={15} // Offset start
        duration={60}
        label="Bob"
        color="#3B82F6"
      />
    </AbsoluteFill>
  );
};
```

### Click Sequence with Sequence Component

```tsx
const ClickSequence = () => {
  return (
    <AbsoluteFill>
      <UI />

      {/* First click at frame 0 */}
      <Sequence from={0} durationInFrames={45}>
        <DynamicCursor
          x={200}
          y={150}
          variant="pointer"
          rippleStartFrame={30}
        />
      </Sequence>

      {/* Second click at frame 45 */}
      <Sequence from={45} durationInFrames={45}>
        <DynamicCursor
          x={400}
          y={200}
          variant="pointer"
          rippleStartFrame={30}
        />
      </Sequence>

      {/* Third click at frame 90 */}
      <Sequence from={90} durationInFrames={45}>
        <DynamicCursor
          x={350}
          y={350}
          variant="pointer"
          rippleStartFrame={30}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
```

---

## Hotspot Offsets

Each cursor variant has a different "hotspot" (the actual click point):

| Variant     | Hotspot Position           |
| ----------- | -------------------------- |
| `arrow`     | Top-left of cursor (0, 0)  |
| `pointer`   | Fingertip (offset applied) |
| `text`      | Center of I-beam           |
| `crosshair` | Center of crosshair        |
| `wait`      | Center of spinner          |

The component automatically handles these offsets internally.

---

## Best Practices

1. **Use CursorPath for complex movements** - Don't manually animate x/y with interpolate for multi-point paths
2. **Match variant to action** - Use `pointer` when hovering buttons, `text` when in inputs
3. **Add ripple for clicks** - Makes clicks visually clear
4. **Keep movements smooth** - CursorPath uses eased interpolation automatically
5. **Use labels for tutorials** - Helps viewers follow whose cursor is whose
6. **Coordinate with UI animations** - Cursor should arrive before UI changes

## See Also

- [MockupFrame](mockup-frame.md) - Pair cursor with device mockups for app demos
- [MotionContainer](layout.md) - Animate UI elements cursor interacts with
- [Remotion Sequence docs](https://www.remotion.dev/docs/sequence) - Timing cursor actions
