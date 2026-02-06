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
| Exit Animations | `exit` object for text leaving screen |
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
exit?: {                         // Exit animation (NOT exitPreset!)
  startFrame?: number;           // When exit begins
  opacity?: { from?: number; to?: number; duration?: number };
  blur?: { from?: number; to?: number; duration?: number };
  scale?: { from?: number; to?: number; duration?: number };
  position?: { fromX?: number; toX?: number; fromY?: number; toY?: number };
};
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

// With exit animation (use exit object, NOT exitPreset)
<AnimatedText 
  text="Hello" 
  preset="fadeBlurIn" 
  exit={{
    startFrame: 90,
    opacity: { from: 1, to: 0, duration: 20 },
    blur: { from: 0, to: 10, duration: 20 }
  }}
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

## 2. Background

**Purpose:** Composable backgrounds with presets, type/variant API, and full layer control.

**Import:** `import { Background, backgroundPresets, getBackgroundPreset } from "@/components/Global";`

### Three Usage Patterns

| Pattern | Description | Best For |
|---------|-------------|----------|
| **Preset** | Named preset: `preset="deepPurpleAurora"` | Quick professional backgrounds |
| **Type/Variant** | Simple API: `type="gradient-mesh" variant="dark"` | BackgroundRig compatibility |
| **Layers** | Full control: `layers={[...]}` | Custom compositions |

### Key Props
```typescript
// Pattern 1: Preset
preset?: string;  // Named preset (e.g., "deepPurpleAurora", "midnightOcean", "neonDream")

// Pattern 2: Type/Variant (BackgroundRig compatible)
type?: 'gradient-mesh' | 'grid-lines' | 'blobs' | 'solid';
variant?: 'dark' | 'light' | 'brand';
meshColors?: { primary?: string; secondary?: string };

// Pattern 3: Layers
layers?: BackgroundLayerConfig[];  // Array of layer configs

// Common
animated?: boolean;        // Enable animation (default depends on pattern)
animationSpeed?: number;   // Speed multiplier (default: 1)
```

### Layer Types
| Type | Description |
|------|-------------|
| `solid` | Solid color fill |
| `linear` | Linear gradient with rotation |
| `radial` | Radial gradient with drift |
| `mesh` | Multi-point mesh gradient |
| `noise` | SVG noise texture overlay |
| `blur` | Backdrop blur effect |
| `vignette` | Edge darkening |
| `glow` | Soft glow blob |
| `grid` | Grid lines pattern |

### Presets
| Category | Presets |
|----------|---------|
| Dark & Dramatic | `deepPurpleAurora`, `midnightOcean`, `cosmicNight`, `darkElegance` |
| Warm Tones | `sunsetBlaze`, `warmEmber` |
| Cool Tones | `arcticFrost` |
| Soft / Light | `softLavender`, `frostedGlass` |
| Neon / Bold | `neonDream` |
| Mesh / Organic | `pastelMesh`, `oceanMesh` |
| BackgroundRig-compat | `light-gradient-mesh`, `dark-grid-lines`, etc. |

### Examples
```tsx
// Pattern 1: Preset (simplest)
<Background preset="deepPurpleAurora" />
<Background preset="neonDream" animationSpeed={0.5} />

// Pattern 2: Type/Variant (BackgroundRig compatible)
<Background type="gradient-mesh" variant="dark" animated />
<Background type="grid-lines" variant="light" />
<Background 
  type="blobs" 
  variant="brand"
  meshColors={{ primary: "rgba(255,100,100,0.3)", secondary: "rgba(100,100,255,0.25)" }}
/>

// Pattern 3: Layers (full control)
<Background
  layers={[
    { type: "solid", color: "#0a0a1a" },
    { type: "radial", colors: ["#7c3aed", "#4c1d95", "transparent"], centerX: 50, centerY: 45, radius: 55 },
    { type: "glow", color: "#06b6d4", x: 70, y: 60, radius: 30, intensity: 0.4 },
    { type: "noise", opacity: 0.025 },
    { type: "vignette", intensity: 0.5, radius: 35 },
  ]}
  animated
  animationSpeed={0.5}
/>

// Grid + glow combo
<Background
  layers={[
    { type: "solid", color: "#0F0F11" },
    { type: "glow", color: "#3b82f6", x: 50, y: 50, radius: 60, intensity: 0.3 },
    { type: "grid", color: "rgba(255,255,255,0.05)", size: 60 },
  ]}
  animated
/>
```

### Critical Mistakes
```tsx
// ❌ WRONG - Invalid prop names
<Background animate={true} speed={0.5} />

// ✅ CORRECT
<Background animated={true} animationSpeed={0.5} />

// ❌ WRONG - Invalid layer type
<Background layers={[{ type: "gradient", colors: [...] }]} />

// ✅ CORRECT - Use "linear" or "radial"
<Background layers={[{ type: "linear", colors: [...] }]} />

// ❌ WRONG - Missing required prop
<Background layers={[{ type: "glow", x: 50, y: 50 }]} />

// ✅ CORRECT - "color" is required for glow
<Background layers={[{ type: "glow", color: "#8b5cf6", x: 50, y: 50 }]} />
```

---

## 3. BackgroundRig (Deprecated)

> **DEPRECATED:** Use `Background` instead. BackgroundRig is kept for backwards compatibility.

**Purpose:** Animated backgrounds - gradient meshes, grids, organic blobs.

**Import:** `import { BackgroundRig } from "@/components/Global";`

### Migration to Background
```tsx
// ❌ OLD - BackgroundRig
<BackgroundRig type="gradient-mesh" variant="dark" animate animationSpeed={0.5} />

// ✅ NEW - Background with same API
<Background type="gradient-mesh" variant="dark" animated animationSpeed={0.5} />

// ✅ BETTER - Background with preset
<Background preset="dark-gradient-mesh" />
```

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
meshColors?: {                          // Custom colors for mesh/blobs (NOT colors array!)
  primary?: string;
  secondary?: string;
};
animate?: boolean;                      // Enable/disable animation
animationSpeed?: number;                // Animation speed multiplier (NOT speed!)
```

### Examples
```tsx
// Animated gradient mesh with brand colors
<BackgroundRig 
  type="gradient-mesh" 
  variant="dark" 
  meshColors={{ primary: '#1a1a2e', secondary: '#16213e' }} 
  animationSpeed={0.5} 
/>

// Subtle grid background
<BackgroundRig type="grid-lines" variant="dark" />

// Organic blobs with custom colors
<BackgroundRig 
  type="blobs" 
  variant="light"
  meshColors={{ primary: '#ff6b6b', secondary: '#4ecdc4' }} 
/>

// Simple solid background
<BackgroundRig type="solid" variant="dark" />
```

---

## 4. MockupFrame

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

## 5. CameraRig

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

## 6. MotionContainer

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

## 7. BentoGrid

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

## 8. DynamicCursor

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

## 9. IrisTransition

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

---

## CRITICAL: Common Mistakes to Avoid

### 1. CSS Properties Must Use camelCase
```tsx
// ❌ WRONG - kebab-case will cause errors
style={{ z-index: 10, background-color: '#000', font-size: 24 }}

// ✅ CORRECT - React requires camelCase
style={{ zIndex: 10, backgroundColor: '#000', fontSize: 24 }}
```

### 2. spring() Does NOT Have a delay Parameter
```tsx
// ❌ WRONG - delay is not a valid parameter
spring({ frame, fps, delay: 10, config: { damping: 15 } })

// ✅ CORRECT - subtract delay from frame instead
spring({ frame: frame - 10, fps, config: { damping: 15 } })
```

### 3. BackgroundRig Does NOT Have colors or opacity Props
```tsx
// ❌ WRONG - these props don't exist
<BackgroundRig type="gradient-mesh" colors={['#000', '#111']} opacity={0.5} speed={1} />

// ✅ CORRECT - use meshColors and animationSpeed
<BackgroundRig type="gradient-mesh" variant="dark" meshColors={{ primary: '#000', secondary: '#111' }} animationSpeed={1} />
```

### 4. AnimatedText Does NOT Have exitPreset or exitStartFrame Props
```tsx
// ❌ WRONG - these props don't exist
<AnimatedText text="Hello" exitPreset="fadeOut" exitStartFrame={90} />

// ✅ CORRECT - use the exit object
<AnimatedText 
  text="Hello" 
  exit={{ 
    startFrame: 90, 
    opacity: { from: 1, to: 0 },
    blur: { from: 0, to: 10 }
  }} 
/>
```

### 5. MotionContainer Does NOT Have animate or transition Props
```tsx
// ❌ WRONG - these are Framer Motion props, not Remotion
<MotionContainer animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 1 }}>

// ✅ CORRECT - use initial, delay, duration, exit
<MotionContainer initial="hidden" delay={15} duration={30} exit="fade-out" exitStartFrame={90}>
```

### 6. MotionContainer initial States Use Full Names
```tsx
// ❌ WRONG - abbreviated names
<MotionContainer initial="below">
<MotionContainer initial="above">

// ✅ CORRECT - use full state names
<MotionContainer initial="offscreen-bottom">
<MotionContainer initial="offscreen-top">
```

**Valid initial states:** `hidden`, `offscreen-bottom`, `offscreen-top`, `offscreen-left`, `offscreen-right`, `scale-zero`, `blur`

**Valid exit states:** `fade-out`, `slide-down`, `slide-up`, `slide-left`, `slide-right`, `scale-down`, `blur-out`
