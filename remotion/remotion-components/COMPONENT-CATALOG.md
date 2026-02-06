# Remotion Component Library - Full Catalog

You have access to a pre-built component library. **Review each component below and decide which ones help achieve your creative vision.** Only use components that genuinely fit your needs - use raw Remotion code for unique effects not covered here.

---

## 1. AnimatedText

**Purpose:** Text with built-in animations - eliminates manual `interpolate()` for text effects.

**Import:** `import { AnimatedText, LayoutGrid, TextSequence } from "@/components/AnimatedText";`

### Capabilities
| Feature | Description |
|---------|-------------|
| 9 Presets | `fadeBlurIn`, `slideInUp`, `slideInDown`, `slideInLeft`, `slideInRight`, `scaleUp`, `typewriter`, `glitchReveal`, `maskSlideUp` |
| Animation Units | `full` (whole text), `word`, `character`, `line` |
| Stagger | Animate word-by-word or character-by-character with delay between each |
| Positioning | `anchor` prop: `center`, `top-left`, `top-center`, `bottom-right`, etc. + `offsetX`/`offsetY` |
| Exit Animations | `exitPreset` for text leaving screen |
| Gradient Text | `gradient={{ colors: ['#ff0000', '#0000ff'], angle: 90 }}` |

### Key Props
```typescript
text: string;                    // The text content
preset?: PresetType;             // Animation preset (see above)
animationUnit?: 'full' | 'word' | 'character' | 'line';
stagger?: number;                // Frames between each unit (with word/character)
startFrame?: number;             // When animation begins (default: 0)
anchor?: AnchorPosition;         // Positioning anchor point
offsetX?: number;                // Horizontal offset from anchor
offsetY?: number;                // Vertical offset from anchor
fontSize?: number;
fontWeight?: number;
color?: string;
gradient?: { colors: string[], angle?: number };
exitPreset?: ExitPresetType;     // Exit animation
exitStartFrame?: number;         // When exit begins
```

### Examples
```tsx
// Simple centered text with blur-in
<AnimatedText text="Welcome" preset="fadeBlurIn" anchor="center" fontSize={72} />

// Word-by-word stagger from left
<AnimatedText 
  text="Each word animates separately" 
  preset="slideInUp" 
  animationUnit="word" 
  stagger={5} 
  anchor="center" 
/>

// Typewriter effect
<AnimatedText text="Typing..." preset="typewriter" anchor="bottom-center" offsetY={-100} />

// With exit animation
<AnimatedText 
  text="Hello" 
  preset="fadeBlurIn" 
  exitPreset="fadeBlurOut" 
  exitStartFrame={90} 
/>
```

### LayoutGrid (Sub-component)
Groups multiple AnimatedText with flexbox layout:
```tsx
<LayoutGrid anchor="center" direction="column" gap={20}>
  <AnimatedText text="Title" preset="fadeBlurIn" fontSize={64} />
  <AnimatedText text="Subtitle" preset="fadeBlurIn" startFrame={15} fontSize={32} />
</LayoutGrid>
```

### TextSequence (Sub-component)
Sequential text animations with `chain` mode:
```tsx
<TextSequence
  texts={["First", "Then", "Finally"]}
  preset="scaleUp"
  mode="chain"           // Each text waits for previous to finish
  chainOverlap={10}      // Frames of overlap between texts
  anchor="center"
/>
```

---

## 2. BackgroundRig

**Purpose:** Animated backgrounds - gradient meshes, grids, organic blobs.

**Import:** `import { BackgroundRig } from "@/components/Global";`

### Variants
| Variant | Description |
|---------|-------------|
| `gradient-mesh` | Floating gradient blobs with smooth movement |
| `grid-lines` | Subtle animated grid pattern |
| `blobs` | Organic pulsing shapes |
| `solid` | Plain solid color |

### Key Props
```typescript
type: 'gradient-mesh' | 'grid-lines' | 'blobs' | 'solid';
variant?: 'dark' | 'light' | 'brand';  // Color preset
colors?: string[];                      // Custom colors (overrides variant)
animate?: boolean;                      // Enable/disable animation
speed?: number;                         // Animation speed multiplier
opacity?: number;                       // Background opacity
```

### Examples
```tsx
// Animated gradient mesh with brand colors
<BackgroundRig type="gradient-mesh" colors={['#1a1a2e', '#16213e', '#0f3460']} speed={0.5} />

// Subtle grid background
<BackgroundRig type="grid-lines" variant="dark" opacity={0.3} />

// Organic blobs
<BackgroundRig type="blobs" colors={['#ff6b6b', '#4ecdc4']} />
```

---

## 3. MockupFrame

**Purpose:** Device mockups (browser, iPhone, cards) with glass effects and 3D animations.

**Import:** `import { MockupFrame, FrameSequence } from "@/components/MockupFrame";`

### Frame Types
| Type | Description |
|------|-------------|
| `browser` | Browser window with URL bar, traffic lights |
| `iphone15` | iPhone 15 with dynamic island |
| `iphone-notch` | iPhone with notch |
| `card` | Rounded card frame |
| `plain` | No frame, just content with optional glass |

### Key Props
```typescript
type?: FrameType;                       // Frame style
src?: string;                           // Image/video URL
children?: ReactNode;                   // Or custom content
theme?: 'light' | 'dark';
glass?: boolean | GlassConfig;          // Frosted glass effect
glare?: boolean;                        // Screen reflection
preset?: EntrancePresetType;            // 'springIn', 'fadeIn', 'slideUp', etc.
exitPreset?: ExitPresetType;
rotate?: RotateAnimation;               // 3D rotation animation
browserConfig?: { url?: string, title?: string };
width?: number;
height?: number;
```

### Examples
```tsx
// Browser mockup with spring entrance
<MockupFrame
  type="browser"
  src="/screenshot.png"
  preset="springIn"
  browserConfig={{ url: "https://example.com" }}
  glass={{ blur: 12, opacity: 0.1 }}
/>

// iPhone with 3D rotation
<MockupFrame
  type="iphone15"
  src="/app-screen.png"
  rotate={{ 
    startAngle: { x: 15, y: -20 }, 
    endAngle: { x: 0, y: 0 },
    startFrame: 0,
    endFrame: 45 
  }}
/>

// Glass card
<MockupFrame type="card" glass glare theme="dark">
  <div style={{ padding: 40, color: 'white' }}>Custom content</div>
</MockupFrame>
```

### FrameSequence (Sub-component)
Multiple mockups with staggered entrance:
```tsx
<FrameSequence
  frames={[
    { type: 'browser', src: '/img1.png' },
    { type: 'iphone15', src: '/img2.png' },
  ]}
  staggerDelay={15}
  preset="slideUp"
/>
```

---

## 4. CameraRig

**Purpose:** Virtual camera for zoom, pan, and rotation effects on wrapped content.

**Import:** `import { CameraRig } from "@/components/Camera";`

### Key Props
```typescript
zoom?: number;          // Scale (1 = normal, 2 = 2x zoom)
x?: number;             // Camera X position
y?: number;             // Camera Y position
rotation?: number;      // Rotation in degrees
focusPoint?: { x: number, y: number };  // Center of zoom/rotation
children: ReactNode;    // Content to apply camera to
```

### Examples
```tsx
// Zoom into center
const frame = useCurrentFrame();
const zoom = interpolate(frame, [0, 60], [1, 1.5], { extrapolateRight: 'clamp' });

<CameraRig zoom={zoom}>
  <YourScene />
</CameraRig>

// Pan across scene
const x = interpolate(frame, [0, 90], [-200, 200]);
<CameraRig x={x} zoom={1.2}>
  <WideScene />
</CameraRig>

// Cinematic rotation
<CameraRig rotation={interpolate(frame, [0, 150], [0, 360])} zoom={1.1}>
  <Content />
</CameraRig>
```

---

## 5. MotionContainer

**Purpose:** Animation wrapper with entrance/exit states - wrap any content for consistent animation.

**Import:** `import { MotionContainer, BentoGrid, BentoItem } from "@/components/Layout";`

### Initial States (Entrance)
`hidden`, `above`, `below`, `left`, `right`, `scale-down`, `scale-up`

### Exit States
`fade-out`, `scale-down`, `above`, `below`, `left`, `right`

### Key Props
```typescript
initial?: InitialState;      // Starting state
delay?: number;              // Frames before entrance starts
duration?: number;           // Entrance duration (default: 30)
exit?: ExitState;            // Exit animation
exitStartFrame?: number;     // When exit begins
children: ReactNode;
style?: CSSProperties;
```

### Examples
```tsx
// Slide up from below
<MotionContainer initial="below" delay={10} duration={25}>
  <MyComponent />
</MotionContainer>

// With exit
<MotionContainer 
  initial="scale-down" 
  exit="fade-out" 
  exitStartFrame={120}
>
  <Card />
</MotionContainer>
```

---

## 6. BentoGrid

**Purpose:** CSS Grid layout with automatic staggered cell animations.

**Import:** `import { BentoGrid, BentoItem } from "@/components/Layout";`

### Key Props
```typescript
// BentoGrid
columns?: number;            // Grid columns (default: 3)
rows?: number;               // Grid rows (default: 2)
gap?: number;                // Gap between cells
staggerDelay?: number;       // Frames between each cell animation
cellDuration?: number;       // Animation duration per cell
initial?: InitialState;      // Default initial state for all cells

// BentoItem  
colSpan?: number;            // Columns to span
rowSpan?: number;            // Rows to span
initial?: InitialState;      // Override grid's initial state
```

### Examples
```tsx
<BentoGrid columns={3} rows={2} gap={16} staggerDelay={8} initial="scale-down">
  <BentoItem><Card1 /></BentoItem>
  <BentoItem colSpan={2}><WideCard /></BentoItem>
  <BentoItem rowSpan={2}><TallCard /></BentoItem>
  <BentoItem><Card4 /></BentoItem>
  <BentoItem><Card5 /></BentoItem>
</BentoGrid>
```

---

## 7. DynamicCursor

**Purpose:** Animated cursor for UI demos and tutorials.

**Import:** `import { DynamicCursor, CursorPath } from "@/components/DynamicCursor";`

### Cursor Variants
`arrow`, `pointer`, `text`, `grab`, `grabbing`, `crosshair`, `wait`

### Key Props (DynamicCursor)
```typescript
x: number;                   // X position
y: number;                   // Y position
variant?: CursorVariant;     // Cursor style
isClicking?: boolean;        // Shrink for click effect
rippleStartFrame?: number;   // Frame to show click ripple
color?: string;
scale?: number;
label?: string;              // Floating label (e.g., user name)
```

### Key Props (CursorPath)
```typescript
path: Array<{
  x: number;
  y: number;
  frame: number;             // Frame to reach this point
  action?: 'click' | 'double-click';
}>;
showTrail?: boolean;
trailLength?: number;
variant?: CursorVariant;
```

### Examples
```tsx
// Static cursor with click
const frame = useCurrentFrame();
<DynamicCursor 
  x={500} 
  y={300} 
  variant="pointer" 
  isClicking={frame > 30 && frame < 35}
  rippleStartFrame={30}
/>

// Cursor following path
<CursorPath
  path={[
    { x: 100, y: 100, frame: 0 },
    { x: 500, y: 300, frame: 30, action: 'click' },
    { x: 800, y: 200, frame: 60 },
  ]}
  showTrail
/>
```

---

## 8. IrisTransition

**Purpose:** Circular wipe transition (classic cartoon-style).

**Import:** `import { IrisTransition, TransitionSeries, linearTiming } from "@/components/Transitions";`

### Key Props
```typescript
mode?: 'enter' | 'exit';     // Expanding or contracting
color?: string;              // Circle color
startFrame?: number;         // When transition begins
duration?: number;           // Transition duration
```

### Examples
```tsx
// Exit (close)
<IrisTransition mode="exit" startFrame={120} duration={30} color="#000000" />

// Enter (open)
<IrisTransition mode="enter" startFrame={0} duration={30} />
```

### TransitionSeries (for scene-to-scene)
```tsx
import { slide } from "@remotion/transitions/slide";

<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={60}>
    <Scene1 />
  </TransitionSeries.Sequence>
  <TransitionSeries.Transition
    presentation={slide({ direction: 'from-right' })}
    timing={linearTiming({ durationInFrames: 30 })}
  />
  <TransitionSeries.Sequence durationInFrames={60}>
    <Scene2 />
  </TransitionSeries.Sequence>
</TransitionSeries>
```

---

## Decision Guide

**Use Components When:**
- You need text animations (AnimatedText handles 90% of text use cases)
- You want device mockups (MockupFrame saves hundreds of lines)
- You need animated backgrounds (BackgroundRig is production-ready)
- You want consistent entrance/exit animations (MotionContainer)
- You're building grid layouts (BentoGrid with stagger)
- You need cursor demos (DynamicCursor/CursorPath)
- You want scene transitions (IrisTransition, TransitionSeries)

**Use Raw Remotion Code When:**
- Creating unique particle systems or generative art
- Building custom shape morphing animations
- Implementing physics simulations
- Fine-tuning animation curves beyond presets
- Creating effects not covered by any component

**Combining Both:**
You can mix components with raw code. Wrap custom animations in `MotionContainer` for consistent entrance/exit, or use `CameraRig` to add camera movement to any scene.
