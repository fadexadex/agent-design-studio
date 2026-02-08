---
name: remotion-time
description: Work with seconds instead of frames using remotion-time
metadata:
  tags: time, seconds, frames, timing
---

# remotion-time - Time-Based Animations

The `remotion-time` package allows you to work with **seconds instead of frames**.
This makes timing more intuitive and readable.

## Basic Usage

```tsx
import { useTime } from "remotion-time";

export const MyComponent = () => {
  const time = useTime(); // Returns current time in seconds
  
  // Animation that lasts 2 seconds
  const opacity = time < 2 ? time / 2 : 1;
  
  return <div style={{ opacity }}>Fades in over 2 seconds</div>;
};
```

## Time Utilities

### useTime()
Returns the current playback time in seconds.

```tsx
const time = useTime();
// At frame 30 with 30fps, time = 1.0
// At frame 45 with 30fps, time = 1.5
```

### useInterpolate() (from remotion-time)
Like Remotion's `interpolate()` but uses seconds:

```tsx
import { useInterpolate } from "remotion-time";

const opacity = useInterpolate(
  [0, 0.5],    // Input range in seconds (0s to 0.5s)
  [0, 1],      // Output range
  { extrapolateRight: 'clamp' }
);
```

## Converting Between Frames and Seconds

```tsx
import { useVideoConfig } from "remotion";

const { fps } = useVideoConfig();

// Seconds to frames
const frames = 2.5 * fps; // 2.5 seconds = 75 frames at 30fps

// Frames to seconds
const seconds = 45 / fps; // 45 frames = 1.5 seconds at 30fps
```

## When to Use Time vs Frames

**Use seconds (remotion-time):**
- Duration specifications (e.g., "animation lasts 1.5 seconds")
- User-facing timing values
- When thinking about real-world timing

**Use frames (default):**
- Precise frame-by-frame control
- Stagger delays between elements
- Synchronizing with audio beats

## DO NOT

- Do NOT use `setTimeout` or `setInterval` - they don't work in Remotion
- Do NOT use `Date.now()` - Remotion rendering is not real-time
- Do NOT assume fps - always get it from `useVideoConfig()`
