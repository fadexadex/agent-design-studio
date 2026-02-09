import type { CSSProperties, ReactNode } from "react";

// Easing types - maps to Remotion's Easing module
export type EasingType =
  | "linear"
  | "easeIn"
  | "easeOut"
  | "easeInOut"
  | "cubicIn"
  | "cubicOut"
  | "cubicInOut"
  | "backIn"
  | "backOut"
  | "backInOut";

// Spring config - uses Remotion's spring() function
export interface SpringConfig {
  type: "spring";
  damping?: number; // default: 10, use 200 for no bounce
  stiffness?: number; // default: 100
  mass?: number; // default: 1
}

// ===========================================
// POSITIONING API TYPES
// ===========================================

// Semantic anchor positions
export type AnchorPosition =
  | "center"
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

// Animated positioning: Move from one position to another
export interface AnchorAnimation {
  from: AnchorPosition;
  to: AnchorPosition;
  fromOffsetX?: number | string;
  fromOffsetY?: number | string;
  toOffsetX?: number | string;
  toOffsetY?: number | string;
  delay?: number; // frames
  duration?: number; // frames
  easing?: EasingType | SpringConfig;
}

// Positioning props for declarative, AI-friendly positioning
export interface PositioningProps {
  // Quick positioning with anchor points
  anchor?: AnchorPosition; // default: undefined (inherits from parent)

  // Offsets from anchor (pixels or percentage)
  offsetX?: number | string; // e.g., 20, "10%", "-5%"
  offsetY?: number | string;

  // Or explicit coordinates (percentage or pixels)
  x?: number | string; // e.g., "50%", 640
  y?: number | string;

  // Alignment within the positioned element
  textAlign?: "left" | "center" | "right";

  // Max width constraint (useful for wrapping)
  maxWidth?: number | string; // e.g., 800, "80%"

  // Z-index for layering
  zIndex?: number;

  // Animated positioning: Move from one position to another
  anchorAnimation?: AnchorAnimation;
}

// LayoutGrid props for grouped elements
export interface LayoutGridProps extends PositioningProps {
  direction?: "row" | "column"; // default: 'column'
  gap?: number | string; // space between items (px or %)
  align?: "start" | "center" | "end"; // cross-axis alignment
  justify?: "start" | "center" | "end" | "space-between"; // main-axis
  children: ReactNode;
  style?: CSSProperties; // Escape hatch for custom styles (backgroundColor, padding, etc.)
}

// TextSequence props for flow control
export interface TextSequenceProps {
  mode?: "chain" | "manual"; // 'chain' auto-calculates timing (AI-friendly!)
  overlap?: number; // seconds of overlap between items in chain mode
  children: ReactNode;
}

// TextSequence.Item props
export interface TextSequenceItemProps {
  text: string;
  duration: number; // seconds this item is visible
  delay?: number; // manual mode: seconds to offset from calculated start
  exitPreset?: PresetType; // auto-apply exit animation
  // Include all AnimatedText props
  [key: string]: unknown;
}

// Positioning hook return type
export interface PositioningResult {
  positionTransform: string;
  centerTransform: string;
  isPositioned: boolean;
}

// Base animation config shared by all animation types
interface BaseAnimationConfig {
  delay?: number; // frames
  duration?: number; // frames
  easing?: EasingType;
}

// Individual animation configs
export interface BlurAnimation extends BaseAnimationConfig {
  from?: number;
  to?: number;
}

export interface OpacityAnimation extends BaseAnimationConfig {
  from?: number;
  to?: number;
}

export interface ScaleAnimation extends Omit<BaseAnimationConfig, "easing"> {
  from?: number;
  to?: number;
  easing?: EasingType | SpringConfig;
  origin?: string;
}

export interface PositionAnimation extends Omit<BaseAnimationConfig, "easing"> {
  fromX?: number;
  toX?: number;
  fromY?: number;
  toY?: number;
  easing?: EasingType | SpringConfig;
}

export interface TypewriterConfig {
  cursor?: boolean;
  cursorChar?: string; // default: '|'
  cursorBlinkSpeed?: number; // frames per blink cycle
}

export interface ExitAnimation {
  startFrame?: number;
  blur?: BlurAnimation;
  opacity?: OpacityAnimation;
  scale?: ScaleAnimation;
  position?: PositionAnimation;
}

export interface StaggerConfig {
  delay?: number;
  reverse?: boolean;
}

export interface GradientConfig {
  colors: string[];
  angle?: number;
  type?: "linear" | "radial";
}

// Animation presets
export type PresetType =
  | "fadeBlurIn"
  | "fadeBlurOut"
  | "softFadeIn"
  | "softFadeOut"
  | "scaleIn"
  | "springIn"
  | "slideInLeft"
  | "slideInRight"
  | "slideInUp"
  | "slideInDown"
  | "maskSlideUp"
  | "maskSlideDown"
  | "maskSlideLeft"
  | "maskSlideRight"
  | "glitchReveal"
  | "typewriter"
  | "none";

export type AnimationUnit = "word" | "character" | "line" | "full";

// Main component props
export interface AnimatedTextProps extends PositioningProps {
  // Content
  text: string;

  // Animation config
  animationUnit?: AnimationUnit;
  preset?: PresetType;
  
  // Global delay offset (frames) - delays the start of ALL animations
  // This is a convenience prop that adds to any individual animation delays
  delay?: number;

  // Individual animations (can be combined)
  blur?: BlurAnimation | boolean;
  opacity?: OpacityAnimation | boolean;
  scale?: ScaleAnimation | boolean;
  position?: PositionAnimation | boolean;
  typewriter?: TypewriterConfig | boolean;

  // Exit animation
  exit?: ExitAnimation;

  // Stagger for word/character animations
  stagger?: StaggerConfig | number;

  // Masking: Creates "kinetic" slide effect by clipping text inside overflow:hidden wrapper
  // Smart default: auto-enabled for slide presets, disabled for others (preserves glows/shadows)
  mask?: boolean;

  // Styling
  color?: string;
  gradient?: GradientConfig;
  fontSize?: number | string;
  fontWeight?: number | string;
  fontFamily?: string;
  letterSpacing?: string;
  lineHeight?: number | string;

  // Layout
  style?: CSSProperties;
  containerStyle?: CSSProperties;

  // Advanced: Auto-fit text to width
  fitToWidth?: number; // Max width in pixels
  maxFontSize?: number; // Cap font size when fitting
}

// Internal types for animation calculation
export interface AnimationValues {
  blur: number;
  opacity: number;
  scale: number;
  translateX: number;
  translateY: number;
}

export interface TextUnit {
  text: string;
  index: number;
  isSpace?: boolean;
}

// Preset definition structure
export interface PresetDefinition {
  blur?: BlurAnimation;
  opacity?: OpacityAnimation;
  scale?: ScaleAnimation;
  position?: PositionAnimation;
  typewriter?: TypewriterConfig;
  animationUnit?: AnimationUnit;
}
