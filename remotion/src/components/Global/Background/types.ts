import type { CSSProperties } from "react";

// ─── Base Layer Config ──────────────────────────────────────
// Every layer type extends this. These are the common knobs.
export interface BaseLayerConfig {
  /** Layer opacity (0-1). Default: 1 */
  opacity?: number;
  /** CSS blend mode for compositing this layer. */
  blendMode?: CSSProperties["mixBlendMode"];
  /** Enable animation for this specific layer (overrides the global flag). */
  animated?: boolean;
  /** Animation speed multiplier for this layer. Default: 1 */
  animationSpeed?: number;
}

// ─── Solid Color ────────────────────────────────────────────
export interface SolidLayerConfig extends BaseLayerConfig {
  type: "solid";
  /** Solid fill color (any CSS color). */
  color: string;
}

// ─── Linear Gradient ────────────────────────────────────────
export interface LinearGradientLayerConfig extends BaseLayerConfig {
  type: "linear";
  /** Gradient color stops (at least 2). */
  colors: string[];
  /** Angle in degrees. Default: 135 */
  angle?: number;
}

// ─── Radial Gradient ────────────────────────────────────────
export interface RadialGradientLayerConfig extends BaseLayerConfig {
  type: "radial";
  /** Gradient color stops (at least 2). */
  colors: string[];
  /** Center X position as percentage (0-100). Default: 50 */
  centerX?: number;
  /** Center Y position as percentage (0-100). Default: 50 */
  centerY?: number;
  /** Gradient radius keyword or percentage. Default: 'farthest-corner' */
  radius?: number;
  /** Shape. Default: 'ellipse' */
  shape?: "circle" | "ellipse";
}

// ─── Mesh Gradient (multi-point radial blobs) ───────────────
export interface MeshGradientLayerConfig extends BaseLayerConfig {
  type: "mesh";
  /** Colors for each mesh blob. */
  colors: string[];
  /** Custom positions for each blob ({x, y} in 0-100 range). */
  points?: Array<{ x: number; y: number }>;
  /** Spread / size of each blob as a percentage. Default: 50 */
  spread?: number;
}

// ─── Noise Texture ──────────────────────────────────────────
export interface NoiseLayerConfig extends BaseLayerConfig {
  type: "noise";
  /** SVG feTurbulence base frequency. Default: 0.9 */
  frequency?: number;
  /** Number of octaves. Default: 4 */
  octaves?: number;
}

// ─── Blur (backdrop-filter) ─────────────────────────────────
export interface BlurLayerConfig extends BaseLayerConfig {
  type: "blur";
  /** Blur amount in pixels. Default: 40 */
  amount?: number;
}

// ─── Vignette ───────────────────────────────────────────────
export interface VignetteLayerConfig extends BaseLayerConfig {
  type: "vignette";
  /** Vignette shadow color. Default: '#000000' */
  color?: string;
  /** Intensity of the vignette (0-1). Default: 0.5 */
  intensity?: number;
  /** Inner radius where vignette starts fading (0-100). Default: 40 */
  radius?: number;
}

// ─── Glow (soft light blob) ─────────────────────────────────
export interface GlowLayerConfig extends BaseLayerConfig {
  type: "glow";
  /** Glow color. */
  color: string;
  /** X position as percentage (0-100). Default: 50 */
  x?: number;
  /** Y position as percentage (0-100). Default: 50 */
  y?: number;
  /** Glow size as percentage. Default: 30 */
  radius?: number;
  /** Glow intensity (0-1). Default: 0.6 */
  intensity?: number;
}

// ─── Grid Lines ─────────────────────────────────────────────
export interface GridLayerConfig extends BaseLayerConfig {
  type: "grid";
  /** Grid line color. Default: 'rgba(255,255,255,0.05)' */
  color?: string;
  /** Grid cell size in pixels. Default: 60 */
  size?: number;
  /** Line stroke width. Default: 1 */
  strokeWidth?: number;
}

// ─── Union Type ─────────────────────────────────────────────
export type BackgroundLayerConfig =
  | SolidLayerConfig
  | LinearGradientLayerConfig
  | RadialGradientLayerConfig
  | MeshGradientLayerConfig
  | NoiseLayerConfig
  | BlurLayerConfig
  | VignetteLayerConfig
  | GlowLayerConfig
  | GridLayerConfig;

// ─── BackgroundRig-style Type/Variant API ───────────────────
export type BackgroundType =
  | "gradient-mesh"
  | "grid-lines"
  | "blobs"
  | "solid";
export type BackgroundVariant = "dark" | "light" | "brand";

// ─── Main Background Props ─────────────────────────────────
export interface BackgroundProps {
  /**
   * Pattern 1: Use a preset by name.
   * This takes precedence over layers/type/variant.
   */
  preset?: string;

  /**
   * Pattern 2: Simple type/variant API (BackgroundRig compatibility).
   * Use these for quick backgrounds without defining layers.
   */
  type?: BackgroundType;
  variant?: BackgroundVariant;
  /** Custom gradient colors for mesh/blob backgrounds (BackgroundRig compat). */
  meshColors?: {
    primary?: string;
    secondary?: string;
  };

  /**
   * Pattern 3: Full layer control.
   * Ordered array of layers (rendered bottom → top).
   */
  layers?: BackgroundLayerConfig[];

  /** Enable animation globally for all layers. Default: false */
  animated?: boolean;
  /** Global animation speed multiplier. Default: 1 */
  animationSpeed?: number;
  /** Additional CSS class name. */
  className?: string;
}

// ─── Preset ─────────────────────────────────────────────────
export interface BackgroundPreset {
  name: string;
  description: string;
  layers: BackgroundLayerConfig[];
  animated?: boolean;
  animationSpeed?: number;
}
