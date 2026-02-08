# Text Choreography Components

Advanced text animation patterns that go beyond simple entrance/exit animations.
These components implement specific choreography patterns commonly seen in professional motion design.

## Available Components

Import from `@/components/TextChoreography`:

```tsx
import { 
  CatchUpText, 
  TextCycle, 
  BounceReveal, 
  TextMakesSpace, 
  MorphText 
} from '@/components/TextChoreography';
```

---

## CatchUpText

Words animate sequentially, with later words moving faster to "catch up" and land together.

**Use when:** Script specifies "catch-up" animation or you want words to build momentum.

```tsx
<CatchUpText 
  text="Build faster with AI"
  startFrame={0}
  convergenceFrame={30}  // All words land by frame 30
  direction="up"         // "up" | "down" | "left" | "right"
  distance={40}          // pixels
  springConfig={{ damping: 15, stiffness: 150 }}
  fontSize={64}
  fontWeight={600}
  color="#FFFFFF"
/>
```

**Props:**
- `text`: string - Text to animate (split by spaces)
- `startFrame`: number - When animation begins (default: 0)
- `convergenceFrame`: number - When all words settle (default: startFrame + 30)
- `direction`: "up" | "down" | "left" | "right" (default: "up")
- `distance`: number - Travel distance in pixels (default: 40)
- `springConfig`: { damping, stiffness } - Spring physics
- Typography: `fontSize`, `fontWeight`, `fontFamily`, `color`, `letterSpacing`, `lineHeight`
- `style`: CSSProperties - Container style

---

## TextCycle

Words replace each other at the same position. Great for listing features or options.

**Use when:** Script has "replacement cycle" or you need cycling text in place.

```tsx
<TextCycle 
  items={["Simple", "Fast", "Powerful"]}
  // or with colors:
  items={[
    { text: "Simple", color: "#4CAF50" },
    { text: "Fast", color: "#2196F3" },
    { text: "Powerful", color: "#FF9800" }
  ]}
  holdDuration={30}       // frames each word stays
  transitionDuration={15} // overlap between words
  enterFrom="up"          // entrance direction
  exitTo="up"             // exit direction
  fontSize={72}
  loop={true}             // loop back to first item
/>
```

**Props:**
- `items`: (string | { text: string, color?: string })[] - Words to cycle
- `holdDuration`: number - Frames each word is visible (default: 30)
- `transitionDuration`: number - Overlap between exit/enter (default: 15)
- `enterFrom` / `exitTo`: "up" | "down" | "left" | "right" | "fade" | "scale"
- `distance`: number - Slide distance (default: 30)
- `loop`: boolean - Loop back to start (default: false)
- Typography: `fontSize`, `fontWeight`, `fontFamily`, `color`, `textAlign`

---

## BounceReveal

Words bounce into view with spring physics. Playful and energetic.

**Use when:** Script has "bounce" animation or you want energetic, fun reveals.

```tsx
<BounceReveal 
  text="Hello World"
  // or array for custom grouping:
  text={["Hello", "World"]}
  startFrame={0}
  staggerFrames={8}      // delay between words
  direction="up"         // "up" | "down"
  bounceHeight={60}      // pixels
  overshoot={0.2}        // scale overshoot (0-1)
  springConfig={{ 
    damping: 10,         // lower = more bounce
    stiffness: 180       // higher = faster
  }}
  fontSize={64}
/>
```

**Props:**
- `text`: string | string[] - Text to animate
- `startFrame`: number (default: 0)
- `staggerFrames`: number - Delay between word bounces (default: 8)
- `direction`: "up" | "down" (default: "up")
- `bounceHeight`: number - How high words bounce in pixels (default: 60)
- `overshoot`: number - Scale overshoot 0-1 (default: 0.2)
- `springConfig`: { damping, stiffness, mass } - Spring physics
- Typography: `fontSize`, `fontWeight`, `fontFamily`, `color`

---

## TextMakesSpace

Text slides aside to reveal another element. Classic "Introducing" → Product pattern.

**Use when:** Script has "makes-space-for" interaction or text needs to move for content.

```tsx
<TextMakesSpace 
  text="Introducing"
  textEnterFrame={0}
  textHoldDuration={30}    // how long text stays centered
  slideDirection="left"    // where text slides to
  slideDistance="40%"      // how far (px or %)
  textEnterFrom="up"       // entrance animation
  revealDelay={10}         // delay before reveal element appears
>
  {/* Element revealed when text moves aside */}
  <YourProductUI />
</TextMakesSpace>
```

**Props:**
- `text`: string - Text that makes space
- `children`: ReactNode - Element revealed when text moves
- `textEnterFrame`: number (default: 0)
- `textHoldDuration`: number - How long text stays centered (default: 30)
- `makeSpaceFrame`: number - When text starts sliding (default: textEnterFrame + textHoldDuration)
- `revealDelay`: number - Delay before reveal element appears (default: 10)
- `slideDirection`: "left" | "right" | "up" | "down" (default: "left")
- `slideDistance`: number | string (default: "40%")
- `textEnterFrom`: "up" | "down" | "left" | "right" | "fade" (default: "up")
- Typography: `fontSize`, `fontWeight`, `fontFamily`, `color`

---

## MorphText

Text transforms/morphs into another element (icon, logo, image).

**Use when:** Script has "morph" or "morphs-into" interaction.

```tsx
<MorphText 
  text="Your Brand"
  morphTo={<img src="/logo.png" style={{ width: 120 }} />}
  startFrame={0}
  holdDuration={30}      // how long text shows
  morphDuration={20}     // transition duration
  morphType="all"        // "fade" | "scale" | "blur" | "all"
  scaleRange={[1.2, 0.8]} // [textEndScale, morphStartScale]
/>
```

**Props:**
- `text`: string - Starting text
- `morphTo`: ReactNode - Element to morph into
- `startFrame`: number (default: 0)
- `holdDuration`: number - How long text shows (default: 30)
- `morphDuration`: number - Morph transition duration (default: 20)
- `morphType`: "fade" | "scale" | "blur" | "all" (default: "all")
- `scaleRange`: [number, number] - [textEndScale, morphStartScale] (default: [1.2, 0.8])
- Typography: `fontSize`, `fontWeight`, `fontFamily`, `color`
- Styling: `textStyle`, `morphStyle` - Custom styles for each element

---

## When to Use Each Component

| Script Animation Type | Component |
|-----------------------|-----------|
| "catch-up" | CatchUpText |
| "replacement cycle", cycling text | TextCycle |
| "bounce", playful reveals | BounceReveal |
| "makes-space-for" interaction | TextMakesSpace |
| "morph", "morphs-into" | MorphText |
| Simple entrance/exit | AnimatedText (from @/components/AnimatedText) |

## Combining with Other Components

```tsx
import { AbsoluteFill } from 'remotion';
import { Background } from '@/components/Global';
import { CatchUpText, TextCycle } from '@/components/TextChoreography';
import { CameraRig } from '@/components/Camera';

export const Scene1: React.FC = () => {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [0, 60], [1, 1.1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill>
      <Background preset="midnightOcean" />
      <CameraRig zoom={zoom}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 40 }}>
          <CatchUpText 
            text="Welcome to the future"
            startFrame={0}
            convergenceFrame={25}
            fontSize={72}
            color="#FFFFFF"
          />
          <TextCycle 
            items={["Simple", "Fast", "Powerful"]}
            startFrame={30}
            fontSize={48}
            color="#AAAAAA"
          />
        </div>
      </CameraRig>
    </AbsoluteFill>
  );
};
```
