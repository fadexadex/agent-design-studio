---
name: remotion-animated
description: Declarative spring-based animations with remotion-animated
metadata:
  tags: animations, spring, declarative, remotion-animated
---

# remotion-animated - Declarative Animations

**PREFERRED APPROACH**: Use `remotion-animated` for cleaner, more declarative animation code.
Instead of manual `interpolate()` calls, wrap elements in `<Animated>` with animation builders.

## ⚠️ COMMON MISTAKE - AVOID THIS ERROR

The animation builders (`Move`, `Scale`, `Fade`, `Rotate`) are **functions**, NOT objects with methods.

```tsx
// ❌ WRONG - Will crash with "Move.y is not a function"
Move.y(50)
Scale.in(1) 
Fade.in()

// ✅ CORRECT - Pass options object to the function
Move({ y: 0, initialY: 50, start: 0 })
Scale({ by: 1, initial: 0, start: 0 })
Fade({ to: 1, initial: 0, start: 0, duration: 15 })
```

## Basic Usage

```tsx
import { Animated, Move, Scale, Fade } from "remotion-animated";

export const MyComponent = () => {
  return (
    <Animated
      animations={[
        Move({ y: 0, initialY: 50, start: 0 }),
        Fade({ to: 1, initial: 0, start: 0, duration: 15 }),
        Scale({ by: 1, initial: 0.8, start: 0 })
      ]}
    >
      <div>Content slides up, fades in, and scales</div>
    </Animated>
  );
};
```

## Animation Builders

### Move - Translate position
```tsx
Move({
  x: 0,           // Final X position
  y: 0,           // Final Y position
  initialX: 50,   // Starting X position
  initialY: 100,  // Starting Y position
  start: 0,       // Start frame
  duration: 30,   // Optional: duration in frames
  damping: 18,    // Spring damping (lower = more bounce)
  stiffness: 220, // Spring stiffness (higher = faster)
  mass: 1         // Spring mass
})
```

### Scale - Size transformations
```tsx
Scale({
  by: 1,          // Final scale
  initial: 0,     // Starting scale
  start: 0,
  damping: 12,
  stiffness: 200
})
```

### Fade - Opacity changes
```tsx
Fade({
  to: 1,          // Final opacity
  initial: 0,     // Starting opacity
  start: 0,
  duration: 15    // Fade uses duration, not spring
})
```

### Rotate - Rotation in degrees
```tsx
Rotate({
  degrees: 0,        // Final rotation
  initial: -180,     // Starting rotation
  start: 0,
  damping: 12
})
```

## Spring Physics Presets

Use consistent spring presets for professional animations:

| Preset | damping | stiffness | Use Case |
|--------|---------|-----------|----------|
| **kinetic** | 18 | 220 | Slides, text reveals, snappy motion |
| **bouncy** | 8 | 150 | Playful entrances, attention-grabbing |
| **snappy** | 20 | 200 | UI elements, quick responses |
| **smooth** | 100 | 100 | Subtle fades, no bounce |
| **elastic** | 6 | 150 | Very bouncy, oscillating |
| **pop** | 12 | 200 | Icon badges, notifications |

## Staggered Animations

For staggered word/element reveals, offset the `start` frame:

```tsx
const words = text.split(" ");

return (
  <div style={{ display: "flex", gap: "0.25em" }}>
    {words.map((word, i) => (
      <Animated
        key={i}
        animations={[
          Move({ y: 0, initialY: 40, start: i * 5, damping: 18, stiffness: 220 }),
          Fade({ to: 1, initial: 0, start: i * 5, duration: 10 })
        ]}
      >
        <span>{word}</span>
      </Animated>
    ))}
  </div>
);
```

## Combining Entrance and Exit

```tsx
<Animated
  animations={[
    // Entrance: slide up and fade in
    Move({ y: 0, initialY: 50, start: 0, damping: 18, stiffness: 220 }),
    Fade({ to: 1, initial: 0, start: 0, duration: 15 }),
    
    // Exit: slide up and fade out (starts at frame 90)
    Move({ y: -50, initialY: 0, start: 90, duration: 20, damping: 100 }),
    Fade({ to: 0, initial: 1, start: 90, duration: 20 })
  ]}
>
  <div>Enters then exits</div>
</Animated>
```

## CRITICAL - Correct API Usage

`Move`, `Scale`, `Fade`, and `Rotate` are **functions that take an options object**. They are NOT objects with methods.

```tsx
// ✅ CORRECT - Functions with options object
Move({ y: 0, initialY: 50, start: 0 })
Scale({ by: 1, initial: 0.8, start: 0 })
Fade({ to: 1, initial: 0, start: 0, duration: 15 })
Rotate({ degrees: 360, initial: 0, start: 0 })

// ❌ WRONG - These do NOT exist!
Move.y(50)           // ERROR: Move.y is not a function
Move.x(100)          // ERROR: Move.x is not a function  
Scale.in(1)          // ERROR: Scale.in is not a function
Scale.out(0)         // ERROR: Scale.out is not a function
Fade.in()            // ERROR: Fade.in is not a function
Fade.out()           // ERROR: Fade.out is not a function
Rotate.in(90)        // ERROR: Rotate.in is not a function
```

**NEVER** use dot notation like `Move.y()`, `Scale.in()`, etc. These methods do not exist and will cause runtime errors.

## DO NOT

- **NEVER** use `Move.y()`, `Move.x()`, `Scale.in()`, `Scale.out()`, `Fade.in()`, `Fade.out()`, `Rotate.in()` - these are INVALID
- Do NOT pass `interpolate()` results directly to animation builders - they handle interpolation internally
- Do NOT use CSS transitions or animation keyframes
- Do NOT use Tailwind animation classes
- Do NOT use `transform` styles directly - let `<Animated>` handle transforms
- Do NOT mix manual `interpolate()` with `<Animated>` on the same element

## Correct Patterns

```tsx
// Moving an element from bottom to center
Move({ y: 0, initialY: 100, start: 0, damping: 18, stiffness: 220 })

// Scaling from small to full size
Scale({ by: 1, initial: 0.5, start: 0, damping: 12, stiffness: 200 })

// Fading in
Fade({ to: 1, initial: 0, start: 0, duration: 15 })

// Rotating 360 degrees
Rotate({ degrees: 360, initial: 0, start: 0, damping: 12 })

// Combined entrance animation
<Animated
  animations={[
    Move({ y: 0, initialY: 50, start: 0, damping: 18 }),
    Scale({ by: 1, initial: 0.8, start: 0, damping: 12 }),
    Fade({ to: 1, initial: 0, start: 0, duration: 15 })
  ]}
>
  <div>Content</div>
</Animated>
```

## Import Statement

```tsx
import { Animated, Move, Scale, Fade, Rotate } from "remotion-animated";
```
