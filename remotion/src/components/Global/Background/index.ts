// ─── Main Component ─────────────────────────────────────────
export { Background } from "./Background";

// ─── Types ──────────────────────────────────────────────────
export type {
  BackgroundProps,
  BackgroundPreset,
  BackgroundLayerConfig,
  BaseLayerConfig,
  SolidLayerConfig,
  LinearGradientLayerConfig,
  RadialGradientLayerConfig,
  MeshGradientLayerConfig,
  NoiseLayerConfig,
  BlurLayerConfig,
  VignetteLayerConfig,
  GlowLayerConfig,
  GridLayerConfig,
  BackgroundType,
  BackgroundVariant,
} from "./types";

// ─── Presets ────────────────────────────────────────────────
export {
  backgroundPresets,
  getBackgroundPreset,
  getRandomBackgroundPreset,
  listBackgroundPresets,
  getTypeVariantLayers,
} from "./presets";

// ─── Hooks (for advanced usage / custom layers) ─────────────
export { useAnimationEngine } from "./hooks/useAnimationEngine";

// ─── Layer Defaults ─────────────────────────────────────────
export {
  SOLID_DEFAULTS,
  LINEAR_DEFAULTS,
  RADIAL_DEFAULTS,
  MESH_DEFAULTS,
  NOISE_DEFAULTS,
  BLUR_DEFAULTS,
  VIGNETTE_DEFAULTS,
  GLOW_DEFAULTS,
  GRID_DEFAULTS,
} from "./utils/layerDefaults";

// ─── Individual Layers (for standalone use) ─────────────────
export { SolidLayer } from "./layers/SolidLayer";
export { LinearGradientLayer } from "./layers/LinearGradientLayer";
export { RadialGradientLayer } from "./layers/RadialGradientLayer";
export { MeshGradientLayer } from "./layers/MeshGradientLayer";
export { NoiseLayer } from "./layers/NoiseLayer";
export { BlurLayer } from "./layers/BlurLayer";
export { VignetteLayer } from "./layers/VignetteLayer";
export { GlowLayer } from "./layers/GlowLayer";
export { GridLayer } from "./layers/GridLayer";

// ─── Test Composition (for Remotion Studio) ─────────────────
export {
  BackgroundTest,
  PresetShowcase,
  TypeVariantTest,
  CustomLayersTest,
  LayerTypesGallery,
  AnimationSpeedTest,
} from "./TestComposition";
