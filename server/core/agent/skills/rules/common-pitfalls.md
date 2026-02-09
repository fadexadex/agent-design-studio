---
name: common-pitfalls
description: Critical rules to avoid common Remotion mistakes. ALWAYS follow these.
metadata:
  tags: pitfalls, errors, mistakes, forbidden, rules
---

## FORBIDDEN PATTERNS (Will Break Your Video)

### 0. remotion-animated API - Functions, NOT Methods
`Move`, `Scale`, `Fade`, `Rotate` from `remotion-animated` are **functions** that take options objects.
They do NOT have `.y()`, `.x()`, `.in()`, `.out()` methods!

```tsx
// ❌ FATAL ERROR - These methods don't exist!
Move.y(50)           // TypeError: Move.y is not a function
Move.x(100)          // TypeError: Move.x is not a function
Scale.in(1)          // TypeError: Scale.in is not a function
Scale.out(0)         // TypeError: Scale.out is not a function
Fade.in()            // TypeError: Fade.in is not a function
Rotate.in(90)        // TypeError: Rotate.in is not a function

// ✅ CORRECT - Pass options object
Move({ y: 0, initialY: 50, start: 0 })
Scale({ by: 1, initial: 0.5, start: 0 })
Fade({ to: 1, initial: 0, start: 0, duration: 15 })
Rotate({ degrees: 360, initial: 0, start: 0 })
```

### 1. NO CSS Animations
CSS transitions, animations, and keyframes do NOT work in Remotion.
They will appear frozen or skip to the end state.

```tsx
// ❌ FORBIDDEN - Will not animate
<div style={{ transition: 'opacity 1s' }} />
<div className="animate-fade-in" />
<div style={{ animation: 'spin 2s linear infinite' }} />

// ✅ CORRECT - Use frame-based animation
const opacity = interpolate(frame, [0, 30], [0, 1]);
<div style={{ opacity }} />
```

### 2. NO Tailwind Animation Classes
Tailwind's animation utilities (`animate-*`) will NOT work.

```tsx
// ❌ FORBIDDEN
<div className="animate-bounce animate-pulse animate-spin" />

// ✅ CORRECT
const bounce = spring({ frame, fps, config: { damping: 8 } });
<div style={{ transform: `translateY(${(1 - bounce) * -20}px)` }} />
```

### 3. ALWAYS Clamp Interpolation
Without clamping, values will extrapolate beyond your intended range.

```tsx
// ❌ DANGEROUS - opacity can go negative or above 1
const opacity = interpolate(frame, [0, 30], [0, 1]);

// ✅ CORRECT - values stay within bounds
const opacity = interpolate(frame, [0, 30], [0, 1], {
  extrapolateLeft: 'clamp',
  extrapolateRight: 'clamp',
});
```

### 4. ALWAYS Use fps for Timing
Hardcoding frame numbers makes animations break at different frame rates.

```tsx
// ❌ FRAGILE - breaks if fps changes
const opacity = interpolate(frame, [0, 30], [0, 1]); // assumes 30fps

// ✅ CORRECT - works at any frame rate
const { fps } = useVideoConfig();
const opacity = interpolate(frame, [0, 1 * fps], [0, 1], {
  extrapolateRight: 'clamp',
});
```

### 5. NO setTimeout/setInterval
Timers do not work in Remotion - the video is rendered frame by frame.

```tsx
// ❌ FORBIDDEN - will not work
useEffect(() => {
  setTimeout(() => setVisible(true), 1000);
}, []);

// ✅ CORRECT - use frame-based logic
const { fps } = useVideoConfig();
const visible = frame >= 1 * fps; // visible after 1 second
```

### 6. NO useState for Animation State
React state does not persist between frame renders.

```tsx
// ❌ FORBIDDEN - state resets every frame
const [count, setCount] = useState(0);
useEffect(() => setCount(c => c + 1), [frame]);

// ✅ CORRECT - derive from frame
const count = Math.floor(frame / 10);
```

### 7. Sequences Reset Frame Counter
Inside a `<Sequence>`, `useCurrentFrame()` returns local frames starting from 0.

```tsx
<Sequence from={60} durationInFrames={30}>
  <MyComponent />
  {/* Inside MyComponent, frame goes 0-29, NOT 60-89 */}
</Sequence>
```

### 8. ALWAYS Premount Sequences
Without premounting, components may flash or load incorrectly.

```tsx
// ❌ MISSING premount
<Sequence from={30}>
  <HeavyComponent />
</Sequence>

// ✅ CORRECT - premount for smooth appearance
const { fps } = useVideoConfig();
<Sequence from={30} premountFor={1 * fps}>
  <HeavyComponent />
</Sequence>
```

### 9. Use spring() for Natural Motion
`interpolate()` with linear timing looks robotic. Use `spring()` for organic movement.

```tsx
// ⚠️ OKAY but mechanical
const scale = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });

// ✅ BETTER - natural motion
const scale = spring({ frame, fps, config: { damping: 200 } });

// ✅ BOUNCY - playful
const scale = spring({ frame, fps, config: { damping: 8 } });
```

### 10. Inline Styles Only
External stylesheets and CSS modules may not work reliably.

```tsx
// ❌ AVOID
import styles from './styles.module.css';
<div className={styles.container} />

// ✅ CORRECT
<div style={{
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#000',
}} />
```

## PERFORMANCE TIPS

### 1. Avoid Heavy Calculations in Render
Move expensive calculations outside the component or memoize them.

```tsx
// ❌ SLOW - recalculates every frame
const points = Array.from({ length: 1000 }, (_, i) => computePoint(i));

// ✅ FAST - calculate once
const points = useMemo(
  () => Array.from({ length: 1000 }, (_, i) => computePoint(i)),
  []
);
```

### 2. Use AbsoluteFill as Root
Always wrap your composition in `<AbsoluteFill>` for proper sizing.

```tsx
export default function MyVideo() {
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {/* Your content */}
    </AbsoluteFill>
  );
}
```
