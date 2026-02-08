/**
 * Animation Module
 *
 * Re-exports from remotion-animated, remotion-time, and remotion-animate-text
 * for a unified, declarative animation API.
 *
 * @example Basic usage
 * ```tsx
 * import { Animated, Move, Scale, Fade } from '@/components/Animation';
 *
 * <Animated animations={[
 *   Fade({ to: 1, initial: 0 }),
 *   Move({ y: 0, initialY: 40 }),
 *   Scale({ by: 1, initial: 0.8 })
 * ]}>
 *   <Content />
 * </Animated>
 * ```
 *
 * @example With presets
 * ```tsx
 * import { Animated, PRESETS } from '@/components/Animation';
 *
 * <Animated animations={PRESETS.slideUp()}>
 *   <Content />
 * </Animated>
 * ```
 */

// ============================================
// Core Animated Component & Animation Builders
// ============================================
export { Animated, Move, Scale, Fade, Rotate, Size } from 'remotion-animated';
export type { Animation } from 'remotion-animated';

// ============================================
// Time-based Utilities
// ============================================
export { useTime, useTimeConfig, useInterpolate } from './timeUtils';

// ============================================
// Text Animation Component
// ============================================
export { AnimatedText as TextAnimator } from 'remotion-animate-text';

// ============================================
// Animation Presets
// ============================================
export { PRESETS, type PresetName } from './presets';

// ============================================
// Spring Configurations
// ============================================
export { SPRING_CONFIGS, getSpringConfig, type SpringPreset } from './springs';
