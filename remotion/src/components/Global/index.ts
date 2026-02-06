// ─── New Background System ──────────────────────────────────
export {
  Background,
  backgroundPresets,
  getBackgroundPreset,
  getRandomBackgroundPreset,
  listBackgroundPresets,
  getTypeVariantLayers,
  useAnimationEngine,
  // Individual layers for standalone use
  SolidLayer,
  LinearGradientLayer,
  RadialGradientLayer,
  MeshGradientLayer,
  NoiseLayer,
  BlurLayer,
  VignetteLayer,
  GlowLayer,
  GridLayer,
  // Layer defaults
  SOLID_DEFAULTS,
  LINEAR_DEFAULTS,
  RADIAL_DEFAULTS,
  MESH_DEFAULTS,
  NOISE_DEFAULTS,
  BLUR_DEFAULTS,
  VIGNETTE_DEFAULTS,
  GLOW_DEFAULTS,
  GRID_DEFAULTS,
} from "./Background";

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
} from "./Background";

// ─── Legacy BackgroundRig (deprecated) ──────────────────────
/** @deprecated Use Background instead - provides the same functionality with more features */
export { BackgroundRig } from "./BackgroundRig";
export type {
  BackgroundRigProps,
  BackgroundType as LegacyBackgroundType,
  BackgroundVariant as LegacyBackgroundVariant,
} from "./BackgroundRig";
