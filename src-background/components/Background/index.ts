// ─── Main Component ─────────────────────────────────────────
export {Background} from './Background';

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
} from './types';

// ─── Presets ────────────────────────────────────────────────
export {
	backgroundPresets,
	getBackgroundPreset,
	getRandomBackgroundPreset,
	listBackgroundPresets,
} from './presets';

// ─── Hooks (for advanced usage / custom layers) ─────────────
export {useAnimationEngine} from './hooks/useAnimationEngine';

// ─── Individual Layers (if someone wants to use them standalone) ──
export {SolidLayer} from './layers/SolidLayer';
export {LinearGradientLayer} from './layers/LinearGradientLayer';
export {RadialGradientLayer} from './layers/RadialGradientLayer';
export {MeshGradientLayer} from './layers/MeshGradientLayer';
export {NoiseLayer} from './layers/NoiseLayer';
export {BlurLayer} from './layers/BlurLayer';
export {VignetteLayer} from './layers/VignetteLayer';
export {GlowLayer} from './layers/GlowLayer';
