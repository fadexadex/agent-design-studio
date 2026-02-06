import type { CSSProperties, ReactNode } from "react";

// ===========================================
// EASING & SPRING TYPES
// ===========================================

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
// DEVICE FRAME TYPES
// ===========================================

// Frame type options
export type FrameType =
  | "browser"
  | "iphone15"
  | "iphone-notch"
  | "card"
  | "plain";

// Theme options
export type ThemeType = "light" | "dark";

// Glass configuration
export interface GlassConfig {
  blur?: number; // backdrop blur amount (default: 20)
  opacity?: number; // background opacity (default: 0.5)
  borderOpacity?: number; // border opacity (default: 0.2)
}

// Browser-specific configuration
export interface BrowserConfig {
  url?: string; // URL to display in address bar
  showButtons?: boolean; // Show traffic light buttons (default: true)
  title?: string; // Optional title in title bar
  borderGradient?: boolean | string; // Optional gradient outline
}

// ===========================================
// ANIMATION TYPES
// ===========================================

// Base animation config shared by all animation types
interface BaseAnimationConfig {
  delay?: number; // frames
  duration?: number; // frames
  easing?: EasingType;
}

// Blur animation config
export interface BlurAnimation extends BaseAnimationConfig {
  from?: number;
  to?: number;
}

// Opacity animation config
export interface OpacityAnimation extends BaseAnimationConfig {
  from?: number;
  to?: number;
}

// Scale animation config
export interface ScaleAnimation extends Omit<BaseAnimationConfig, "easing"> {
  from?: number;
  to?: number;
  easing?: EasingType | SpringConfig;
  origin?: string; // transform-origin
}

// Position animation config
export interface PositionAnimation extends Omit<BaseAnimationConfig, "easing"> {
  fromX?: number;
  toX?: number;
  fromY?: number;
  toY?: number;
  easing?: EasingType | SpringConfig;
}

// 3D Rotate animation config
export interface RotateAnimation extends Omit<BaseAnimationConfig, "easing"> {
  fromX?: number; // X-axis rotation in degrees
  toX?: number;
  fromY?: number; // Y-axis rotation in degrees
  toY?: number;
  fromZ?: number; // Z-axis rotation in degrees
  toZ?: number;
  perspective?: number; // perspective distance (default: 1200)
  easing?: EasingType | SpringConfig;
}

// ===========================================
// ENTRANCE PRESET TYPES
// ===========================================

export type EntrancePresetType =
  | "fadeIn"
  | "springIn"
  | "slideInUp"
  | "slideInDown"
  | "slideInLeft"
  | "slideInRight"
  | "rotateIn"
  | "none";

// Entrance preset definition
export interface EntrancePresetDefinition {
  blur?: BlurAnimation;
  opacity?: OpacityAnimation;
  scale?: ScaleAnimation;
  position?: PositionAnimation;
  rotate?: RotateAnimation;
}

// ===========================================
// EXIT PRESET TYPES
// ===========================================

export type ExitPresetType =
  | "fadeOut"
  | "slideOutLeft"
  | "slideOutRight"
  | "slideOutDown"
  | "slideOutUp"
  | "scaleDown"
  | "none";

// Exit preset definition
export interface ExitPresetDefinition {
  blur?: BlurAnimation;
  opacity?: OpacityAnimation;
  scale?: ScaleAnimation;
  position?: PositionAnimation;
}

// ===========================================
// MOCKUP FRAME PROPS
// ===========================================

export interface MockupFrameProps {
  // Content
  src?: string; // Image/video URL
  children?: ReactNode; // Custom content

  // Frame type
  type?: FrameType;
  theme?: ThemeType;
  glass?: boolean | GlassConfig;
  glare?: boolean; // Screen reflection effect (subtle diagonal light overlay)

  // Browser-specific
  browserConfig?: BrowserConfig;

  // Entrance Animations (Remotion spring-based)
  preset?: EntrancePresetType;
  blur?: BlurAnimation | boolean;
  opacity?: OpacityAnimation | boolean;
  scale?: ScaleAnimation | boolean;
  position?: PositionAnimation | boolean;
  rotate?: RotateAnimation | boolean; // 3D rotation

  // Exit Animations (mirrors entrance logic, triggered near end of duration)
  exitPreset?: ExitPresetType;
  exitStartFrame?: number; // When to start exit animation (frames from start)

  // Sizing & Layering
  width?: number;
  height?: number;
  zIndex?: number; // Escape hatch for manual z-index control (optional)

  // Style escape hatch
  style?: CSSProperties;
  contentStyle?: CSSProperties;
}

// ===========================================
// FRAME SEQUENCE TYPES
// ===========================================

export interface FrameSequenceProps {
  children: ReactNode;
  /**
   * Time in frames between each child's start.
   * Smaller values = more overlap (weaving effect).
   * Default: 15 frames for snappy, overlapping entrances.
   */
  stagger?: number;
  /**
   * Global delay before the entire sequence begins.
   */
  startFrom?: number;
}

// ===========================================
// INTERNAL TYPES
// ===========================================

// Animation values calculated per frame
export interface AnimationValues {
  blur: number;
  opacity: number;
  scale: number;
  translateX: number;
  translateY: number;
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  perspective: number;
}

// Device frame common props
export interface DeviceFrameProps {
  children: ReactNode;
  theme: ThemeType;
  glare?: boolean;
  width?: number;
  height?: number;
  style?: CSSProperties;
}

// Browser frame specific props
export interface BrowserFrameProps extends DeviceFrameProps {
  config?: BrowserConfig;
}

// iPhone frame specific props
export interface IPhoneFrameProps extends DeviceFrameProps {
  variant: "iphone15" | "iphone-notch";
}

// Card frame specific props
export interface CardFrameProps extends DeviceFrameProps {
  glass?: boolean | GlassConfig;
}

// Device specifications
export interface DeviceSpec {
  bezelRadius: number;
  aspectRatio: number;
  defaultWidth: number;
  defaultHeight: number;
}
