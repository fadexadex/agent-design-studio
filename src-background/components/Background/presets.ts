import type {BackgroundPreset} from './types';

/**
 * Ready-made background configurations.
 *
 * Each preset is a complete `BackgroundProps` value.
 * Use them directly:
 *   <Background {...backgroundPresets.deepPurpleAurora} />
 *
 * Or as a starting point that an AI can tweak / combine.
 */
export const backgroundPresets: Record<string, BackgroundPreset> = {
	// ─── Dark & Dramatic ────────────────────────────────────

	deepPurpleAurora: {
		name: 'Deep Purple Aurora',
		description: 'Rich purple center fading into deep blue — cinematic, premium feel',
		layers: [
			{type: 'solid', color: '#0a0a1a'},
			{type: 'radial', colors: ['#7c3aed', '#4c1d95', 'transparent'], centerX: 50, centerY: 45, radius: 55},
			{type: 'radial', colors: ['#1e3a8a', 'transparent'], centerX: 20, centerY: 80, radius: 60, opacity: 0.5},
			{type: 'radial', colors: ['#1e40af', 'transparent'], centerX: 85, centerY: 20, radius: 50, opacity: 0.4},
			{type: 'noise', opacity: 0.025},
			{type: 'vignette', intensity: 0.5, radius: 35},
		],
		animated: true,
		animationSpeed: 0.5,
	},

	midnightOcean: {
		name: 'Midnight Ocean',
		description: 'Deep navy with subtle teal glow — calm, techy, professional',
		layers: [
			{type: 'solid', color: '#020617'},
			{type: 'radial', colors: ['#0f172a', '#020617'], centerX: 50, centerY: 50},
			{type: 'glow', color: '#0d9488', x: 60, y: 40, radius: 35, intensity: 0.35},
			{type: 'glow', color: '#1e40af', x: 30, y: 70, radius: 40, intensity: 0.25},
			{type: 'noise', opacity: 0.02},
			{type: 'vignette', intensity: 0.6, radius: 30},
		],
		animated: true,
		animationSpeed: 0.4,
	},

	cosmicNight: {
		name: 'Cosmic Night',
		description: 'Starless deep space with subtle color nebulae',
		layers: [
			{type: 'solid', color: '#030014'},
			{type: 'glow', color: '#581c87', x: 30, y: 35, radius: 40, intensity: 0.4},
			{type: 'glow', color: '#1e3a5f', x: 70, y: 65, radius: 45, intensity: 0.35},
			{type: 'glow', color: '#701a75', x: 55, y: 20, radius: 25, intensity: 0.2},
			{type: 'noise', opacity: 0.03},
			{type: 'vignette', intensity: 0.7, radius: 25},
		],
		animated: true,
		animationSpeed: 0.3,
	},

	darkElegance: {
		name: 'Dark Elegance',
		description: 'Near-black with barely-there warm gradient — ultra-minimal dark mode',
		layers: [
			{type: 'solid', color: '#0c0c0c'},
			{type: 'linear', colors: ['rgba(30,20,40,0.4)', 'rgba(20,15,25,0.2)', 'transparent'], angle: 145},
			{type: 'glow', color: '#1a1a2e', x: 50, y: 50, radius: 60, intensity: 0.3},
			{type: 'noise', opacity: 0.015},
		],
		animated: false,
	},

	// ─── Warm Tones ─────────────────────────────────────────

	sunsetBlaze: {
		name: 'Sunset Blaze',
		description: 'Warm orange-to-purple gradient with golden center glow',
		layers: [
			{type: 'linear', colors: ['#7c2d12', '#581c87'], angle: 135},
			{type: 'glow', color: '#f59e0b', x: 45, y: 40, radius: 35, intensity: 0.5},
			{type: 'glow', color: '#dc2626', x: 70, y: 60, radius: 30, intensity: 0.3},
			{type: 'noise', opacity: 0.02},
			{type: 'vignette', intensity: 0.4, radius: 35},
		],
		animated: true,
		animationSpeed: 0.4,
	},

	warmEmber: {
		name: 'Warm Ember',
		description: 'Cozy dark amber with subtle orange-red glows',
		layers: [
			{type: 'solid', color: '#1c1007'},
			{type: 'glow', color: '#92400e', x: 40, y: 50, radius: 45, intensity: 0.4},
			{type: 'glow', color: '#7f1d1d', x: 65, y: 35, radius: 30, intensity: 0.25},
			{type: 'noise', opacity: 0.025},
			{type: 'vignette', color: '#0a0502', intensity: 0.5, radius: 30},
		],
		animated: true,
		animationSpeed: 0.3,
	},

	// ─── Cool Tones ─────────────────────────────────────────

	arcticFrost: {
		name: 'Arctic Frost',
		description: 'Icy whites and light blues — clean, modern, airy',
		layers: [
			{type: 'linear', colors: ['#f0f9ff', '#e0f2fe', '#dbeafe'], angle: 160},
			{type: 'radial', colors: ['#bae6fd', 'transparent'], centerX: 40, centerY: 45, radius: 50, opacity: 0.5},
			{type: 'glow', color: '#7dd3fc', x: 65, y: 55, radius: 35, intensity: 0.3},
			{type: 'noise', opacity: 0.02},
		],
		animated: true,
		animationSpeed: 0.3,
	},

	// ─── Soft / Light ───────────────────────────────────────

	softLavender: {
		name: 'Soft Lavender',
		description: 'Gentle purple mist — elegant, dreamy, approachable',
		layers: [
			{type: 'linear', colors: ['#faf5ff', '#f3e8ff', '#ede9fe'], angle: 140},
			{type: 'radial', colors: ['#ddd6fe', 'transparent'], centerX: 55, centerY: 45, radius: 50, opacity: 0.6},
			{type: 'glow', color: '#c4b5fd', x: 35, y: 60, radius: 40, intensity: 0.25},
			{type: 'noise', opacity: 0.015},
		],
		animated: true,
		animationSpeed: 0.3,
	},

	frostedGlass: {
		name: 'Frosted Glass',
		description: 'Glassmorphism — blurred, luminous, modern UI feel',
		layers: [
			{type: 'linear', colors: ['#e0e7ff', '#c7d2fe', '#a5b4fc'], angle: 135},
			{type: 'blur', amount: 50},
			{type: 'noise', opacity: 0.03},
		],
		animated: false,
	},

	// ─── Neon / Bold ────────────────────────────────────────

	neonDream: {
		name: 'Neon Dream',
		description: 'Dark base with vibrant colored glows — cyberpunk, energetic',
		layers: [
			{type: 'solid', color: '#0a0a0a'},
			{type: 'glow', color: '#8b5cf6', x: 30, y: 40, radius: 35, intensity: 0.55},
			{type: 'glow', color: '#06b6d4', x: 70, y: 55, radius: 30, intensity: 0.5},
			{type: 'glow', color: '#ec4899', x: 50, y: 75, radius: 25, intensity: 0.35},
			{type: 'noise', opacity: 0.02},
			{type: 'vignette', intensity: 0.5, radius: 30},
		],
		animated: true,
		animationSpeed: 0.5,
	},

	// ─── Mesh / Organic ─────────────────────────────────────

	pastelMesh: {
		name: 'Pastel Mesh',
		description: 'Soft multi-color mesh gradient — playful, creative, fresh',
		layers: [
			{type: 'mesh', colors: ['#c4b5fd', '#93c5fd', '#86efac', '#fde68a'], spread: 55},
			{type: 'noise', opacity: 0.015},
		],
		animated: true,
		animationSpeed: 0.4,
	},

	oceanMesh: {
		name: 'Ocean Mesh',
		description: 'Deep blue-green mesh — fluid, immersive, nature-inspired',
		layers: [
			{type: 'solid', color: '#042f2e'},
			{
				type: 'mesh',
				colors: ['#0d9488', '#0284c7', '#1e40af', '#059669'],
				points: [
					{x: 25, y: 20},
					{x: 75, y: 30},
					{x: 50, y: 75},
					{x: 15, y: 60},
				],
				spread: 50,
				opacity: 0.7,
			},
			{type: 'noise', opacity: 0.02},
			{type: 'vignette', intensity: 0.4, radius: 35},
		],
		animated: true,
		animationSpeed: 0.35,
	},
};

// ─── Helpers ────────────────────────────────────────────────

export const getBackgroundPreset = (name: string): BackgroundPreset | undefined =>
	backgroundPresets[name];

export const getRandomBackgroundPreset = (): BackgroundPreset => {
	const presets = Object.values(backgroundPresets);
	return presets[Math.floor(Math.random() * presets.length)];
};

export const listBackgroundPresets = (): string[] =>
	Object.keys(backgroundPresets);
