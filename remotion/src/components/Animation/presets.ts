/**
 * Animation Presets
 *
 * Pre-configured animation combinations for common motion patterns.
 * These use remotion-animated's Move, Scale, Fade, and Rotate builders.
 *
 * @example
 * ```tsx
 * import { Animated, PRESETS } from '@/components/Animation';
 *
 * <Animated animations={PRESETS.slideUp()}>
 *   <Content />
 * </Animated>
 *
 * // With custom options
 * <Animated animations={PRESETS.slideUp({ distance: 60, duration: 20 })}>
 *   <Content />
 * </Animated>
 * ```
 */

import { Move, Scale, Fade, Rotate } from 'remotion-animated';
import type { Animation } from 'remotion-animated';

// ============================================
// Types
// ============================================

export interface PresetOptions {
  /** Animation start frame (default: 0) */
  start?: number;
  /** Animation duration in frames */
  duration?: number;
  /** Spring damping (lower = more bounce) */
  damping?: number;
  /** Spring stiffness (higher = faster) */
  stiffness?: number;
  /** Spring mass */
  mass?: number;
}

export interface SlideOptions extends PresetOptions {
  /** Distance to slide in pixels (default: 40) */
  distance?: number;
}

export interface ScaleOptions extends PresetOptions {
  /** Initial scale factor (default: 0) */
  initialScale?: number;
  /** Final scale factor (default: 1) */
  finalScale?: number;
}

export interface RotateOptions extends PresetOptions {
  /** Initial rotation in degrees */
  initialDegrees?: number;
  /** Final rotation in degrees (default: 0) */
  finalDegrees?: number;
}

// ============================================
// Preset Definitions
// ============================================

/**
 * Animation presets for common motion patterns.
 * Each preset returns an array of Animation objects.
 */
export const PRESETS = {
  // ============================================
  // Fade Animations
  // ============================================

  /**
   * Simple fade in from transparent to opaque.
   */
  fadeIn: (options: PresetOptions = {}): Animation[] => [
    Fade({
      to: 1,
      initial: 0,
      start: options.start,
      duration: options.duration,
      damping: options.damping ?? 100,
      stiffness: options.stiffness,
      mass: options.mass,
    }),
  ],

  /**
   * Simple fade out from opaque to transparent.
   */
  fadeOut: (options: PresetOptions = {}): Animation[] => [
    Fade({
      to: 0,
      initial: 1,
      start: options.start,
      duration: options.duration,
      damping: options.damping ?? 100,
      stiffness: options.stiffness,
      mass: options.mass,
    }),
  ],

  // ============================================
  // Slide Animations
  // ============================================

  /**
   * Slide up from below with fade.
   */
  slideUp: (options: SlideOptions = {}): Animation[] => [
    Move({
      y: 0,
      initialY: options.distance ?? 40,
      start: options.start,
      duration: options.duration,
      damping: options.damping ?? 18,
      stiffness: options.stiffness ?? 220,
      mass: options.mass,
    }),
    Fade({
      to: 1,
      initial: 0,
      start: options.start,
      duration: options.duration ?? 12,
    }),
  ],

  /**
   * Slide down from above with fade.
   */
  slideDown: (options: SlideOptions = {}): Animation[] => [
    Move({
      y: 0,
      initialY: -(options.distance ?? 40),
      start: options.start,
      duration: options.duration,
      damping: options.damping ?? 18,
      stiffness: options.stiffness ?? 220,
      mass: options.mass,
    }),
    Fade({
      to: 1,
      initial: 0,
      start: options.start,
      duration: options.duration ?? 12,
    }),
  ],

  /**
   * Slide in from the left with fade.
   */
  slideLeft: (options: SlideOptions = {}): Animation[] => [
    Move({
      x: 0,
      initialX: -(options.distance ?? 50),
      start: options.start,
      duration: options.duration,
      damping: options.damping ?? 18,
      stiffness: options.stiffness ?? 220,
      mass: options.mass,
    }),
    Fade({
      to: 1,
      initial: 0,
      start: options.start,
      duration: options.duration ?? 12,
    }),
  ],

  /**
   * Slide in from the right with fade.
   */
  slideRight: (options: SlideOptions = {}): Animation[] => [
    Move({
      x: 0,
      initialX: options.distance ?? 50,
      start: options.start,
      duration: options.duration,
      damping: options.damping ?? 18,
      stiffness: options.stiffness ?? 220,
      mass: options.mass,
    }),
    Fade({
      to: 1,
      initial: 0,
      start: options.start,
      duration: options.duration ?? 12,
    }),
  ],

  // ============================================
  // Scale Animations
  // ============================================

  /**
   * Scale in from small to normal size with fade.
   */
  scaleIn: (options: ScaleOptions = {}): Animation[] => [
    Scale({
      by: options.finalScale ?? 1,
      initial: options.initialScale ?? 0.8,
      start: options.start,
      duration: options.duration,
      damping: options.damping ?? 15,
      stiffness: options.stiffness ?? 100,
      mass: options.mass,
    }),
    Fade({
      to: 1,
      initial: 0,
      start: options.start,
      duration: options.duration ?? 15,
    }),
  ],

  /**
   * Scale out from normal to small size with fade.
   */
  scaleOut: (options: ScaleOptions = {}): Animation[] => [
    Scale({
      by: options.finalScale ?? 0.8,
      initial: options.initialScale ?? 1,
      start: options.start,
      duration: options.duration,
      damping: options.damping ?? 15,
      stiffness: options.stiffness ?? 100,
      mass: options.mass,
    }),
    Fade({
      to: 0,
      initial: 1,
      start: options.start,
      duration: options.duration ?? 15,
    }),
  ],

  /**
   * Bouncy scale in from zero (attention-grabbing).
   */
  bounceIn: (options: ScaleOptions = {}): Animation[] => [
    Scale({
      by: options.finalScale ?? 1,
      initial: options.initialScale ?? 0,
      start: options.start,
      duration: options.duration,
      damping: options.damping ?? 8,
      stiffness: options.stiffness ?? 150,
      mass: options.mass,
    }),
    Fade({
      to: 1,
      initial: 0,
      start: options.start,
      duration: 8,
    }),
  ],

  /**
   * Pop in with slight overshoot.
   */
  popIn: (options: ScaleOptions = {}): Animation[] => [
    Scale({
      by: options.finalScale ?? 1,
      initial: options.initialScale ?? 0,
      start: options.start,
      duration: options.duration,
      damping: options.damping ?? 12,
      stiffness: options.stiffness ?? 200,
      mass: options.mass,
      overshootClamping: false,
    }),
    Fade({
      to: 1,
      initial: 0,
      start: options.start,
      duration: 10,
    }),
  ],

  // ============================================
  // Combined Animations
  // ============================================

  /**
   * Fade and blur in (mimics the fadeBlurIn preset).
   * Note: Blur requires custom implementation as remotion-animated doesn't support blur.
   */
  fadeBlurIn: (options: PresetOptions = {}): Animation[] => [
    Fade({
      to: 1,
      initial: 0,
      start: options.start,
      duration: options.duration ?? 15,
      damping: options.damping ?? 100,
    }),
    Scale({
      by: 1,
      initial: 0.95,
      start: options.start,
      duration: options.duration ?? 15,
      damping: options.damping ?? 100,
    }),
  ],

  /**
   * Slide up with scale for dramatic entrance.
   */
  riseUp: (options: SlideOptions = {}): Animation[] => [
    Move({
      y: 0,
      initialY: options.distance ?? 60,
      start: options.start,
      duration: options.duration,
      damping: options.damping ?? 15,
      stiffness: options.stiffness ?? 100,
      mass: options.mass,
    }),
    Scale({
      by: 1,
      initial: 0.9,
      start: options.start,
      duration: options.duration,
      damping: options.damping ?? 15,
      stiffness: options.stiffness ?? 100,
    }),
    Fade({
      to: 1,
      initial: 0,
      start: options.start,
      duration: options.duration ?? 20,
    }),
  ],

  /**
   * Rotate in with scale (playful entrance).
   */
  spinIn: (options: RotateOptions = {}): Animation[] => [
    Rotate({
      degrees: options.finalDegrees ?? 0,
      initial: options.initialDegrees ?? -180,
      start: options.start,
      duration: options.duration,
      damping: options.damping ?? 12,
      stiffness: options.stiffness ?? 100,
      mass: options.mass,
    }),
    Scale({
      by: 1,
      initial: 0,
      start: options.start,
      duration: options.duration,
      damping: options.damping ?? 12,
      stiffness: options.stiffness ?? 100,
    }),
    Fade({
      to: 1,
      initial: 0,
      start: options.start,
      duration: 10,
    }),
  ],

  // ============================================
  // Exit Animations
  // ============================================

  /**
   * Slide out downward with fade.
   */
  slideOutDown: (options: SlideOptions = {}): Animation[] => [
    Move({
      y: options.distance ?? 40,
      initialY: 0,
      start: options.start,
      duration: options.duration,
      damping: options.damping ?? 20,
      stiffness: options.stiffness ?? 200,
      mass: options.mass,
    }),
    Fade({
      to: 0,
      initial: 1,
      start: options.start,
      duration: options.duration ?? 15,
    }),
  ],

  /**
   * Slide out upward with fade.
   */
  slideOutUp: (options: SlideOptions = {}): Animation[] => [
    Move({
      y: -(options.distance ?? 40),
      initialY: 0,
      start: options.start,
      duration: options.duration,
      damping: options.damping ?? 20,
      stiffness: options.stiffness ?? 200,
      mass: options.mass,
    }),
    Fade({
      to: 0,
      initial: 1,
      start: options.start,
      duration: options.duration ?? 15,
    }),
  ],
} as const;

export type PresetName = keyof typeof PRESETS;
