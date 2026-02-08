import { useCurrentFrame, useVideoConfig, spring } from 'remotion';
import { useMemo } from 'react';
import { interpolateWithDelay } from '../utils/interpolation';
import { getPreset, DEFAULTS } from '../presets';
import { SPRING_CONFIGS, type SpringConfig as AnimSpringConfig } from '../../Animation/springs';
import type {
  AnimatedTextProps,
  AnimationValues,
  BlurAnimation,
  OpacityAnimation,
  ScaleAnimation,
  PositionAnimation,
  SpringConfig,
  EasingType,
  StaggerConfig,
} from '../types';

interface AnimationCalculatorResult {
  getValuesForUnit: (unitIndex: number, isSpace: boolean) => AnimationValues;
  typewriterVisibleChars: number;
  showCursor: boolean;
}

/**
 * Normalize animation config from boolean or object
 */
const normalizeConfig = <T extends object>(
  config: T | boolean | undefined,
  defaults: T
): T | null => {
  if (config === undefined || config === false) return null;
  if (config === true) return defaults;
  return { ...defaults, ...config };
};

/**
 * Check if easing is a spring config
 */
const isSpringConfig = (
  easing: EasingType | SpringConfig | undefined
): easing is SpringConfig => {
  return typeof easing === 'object' && easing?.type === 'spring';
};

/**
 * Get spring values from config, with fallback to kinetic preset
 */
const getSpringValues = (config: SpringConfig): AnimSpringConfig => {
  return {
    damping: config.damping ?? SPRING_CONFIGS.kinetic.damping,
    stiffness: config.stiffness ?? SPRING_CONFIGS.kinetic.stiffness,
    mass: config.mass ?? SPRING_CONFIGS.kinetic.mass,
  };
};

/**
 * Parse stagger config
 */
const parseStagger = (
  stagger: StaggerConfig | number | undefined
): StaggerConfig => {
  if (typeof stagger === 'number') {
    return { delay: stagger, reverse: false };
  }
  return { ...DEFAULTS.stagger, ...stagger };
};

/**
 * Core animation calculation hook
 */
export const useAnimationCalculator = (
  props: AnimatedTextProps,
  totalUnits: number
): AnimationCalculatorResult => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return useMemo(() => {
    const {
      preset = 'none',
      delay: globalDelay = 0,
      blur: blurProp,
      opacity: opacityProp,
      scale: scaleProp,
      position: positionProp,
      typewriter: typewriterProp,
      stagger: staggerProp,
      exit,
    } = props;

    // Get preset values and merge with props
    const presetValues = getPreset(preset);

    // Normalize animation configs (props override preset)
    const blurConfig = normalizeConfig<BlurAnimation>(
      blurProp ?? presetValues.blur,
      DEFAULTS.blur
    );
    const opacityConfig = normalizeConfig<OpacityAnimation>(
      opacityProp ?? presetValues.opacity,
      DEFAULTS.opacity
    );
    const scaleConfig = normalizeConfig<ScaleAnimation>(
      scaleProp ?? presetValues.scale,
      DEFAULTS.scale
    );
    const positionConfig = normalizeConfig<PositionAnimation>(
      positionProp ?? presetValues.position,
      DEFAULTS.position
    );
    const typewriterConfig = normalizeConfig(
      typewriterProp ?? presetValues.typewriter,
      DEFAULTS.typewriter
    );

    // Parse stagger
    const stagger = parseStagger(staggerProp);

    // Typewriter calculation
    let typewriterVisibleChars = Infinity;
    let showCursor = false;

    if (typewriterConfig && preset === 'typewriter') {
      // For typewriter, calculate visible characters based on frame
      // Respect globalDelay before starting the typewriter effect
      const effectiveFrame = Math.max(0, frame - globalDelay);
      const charsPerFrame = 0.5; // Approximately 2 frames per character
      typewriterVisibleChars = Math.floor(effectiveFrame * charsPerFrame);

      // Cursor blink
      if (typewriterConfig.cursor) {
        const blinkCycle = typewriterConfig.cursorBlinkSpeed || 16;
        showCursor = Math.floor(effectiveFrame / (blinkCycle / 2)) % 2 === 0;
      }
    }

    /**
     * Calculate animation values for a specific unit
     */
    const getValuesForUnit = (
      unitIndex: number,
      isSpace: boolean
    ): AnimationValues => {
      // Spaces don't animate, just return final values
      if (isSpace) {
        return {
          blur: 0,
          opacity: 1,
          scale: 1,
          translateX: 0,
          translateY: 0,
        };
      }

      // Calculate stagger offset for this unit
      // globalDelay is added to ALL animations as a base offset
      const staggerDelay = stagger.reverse
        ? (totalUnits - 1 - unitIndex) * (stagger.delay || 0) + globalDelay
        : unitIndex * (stagger.delay || 0) + globalDelay;

      // Get entrance animation values
      let blur = 0;
      let opacity = 1;
      let scale = 1;
      let translateX = 0;
      let translateY = 0;

      // Calculate blur
      if (blurConfig) {
        const delay = (blurConfig.delay || 0) + staggerDelay;
        blur = interpolateWithDelay(
          frame,
          delay,
          blurConfig.duration || 15,
          blurConfig.from ?? 20,
          blurConfig.to ?? 0,
          blurConfig.easing
        );
      }

      // Calculate opacity
      if (opacityConfig) {
        const delay = (opacityConfig.delay || 0) + staggerDelay;
        opacity = interpolateWithDelay(
          frame,
          delay,
          opacityConfig.duration || 15,
          opacityConfig.from ?? 0,
          opacityConfig.to ?? 1,
          opacityConfig.easing
        );
      }

      // Calculate scale (supports spring)
      if (scaleConfig) {
        const delay = (scaleConfig.delay || 0) + staggerDelay;

        if (isSpringConfig(scaleConfig.easing)) {
          // Use Remotion spring with our preset-based config
          const springValues = getSpringValues(scaleConfig.easing);
          const springValue = spring({
            frame: frame - delay,
            fps,
            config: springValues,
          });
          const from = scaleConfig.from ?? 0;
          const to = scaleConfig.to ?? 1;
          scale = from + springValue * (to - from);
        } else {
          scale = interpolateWithDelay(
            frame,
            delay,
            scaleConfig.duration || 20,
            scaleConfig.from ?? 1,
            scaleConfig.to ?? 1,
            scaleConfig.easing as EasingType
          );
        }
      }

      // Calculate position (supports spring)
      if (positionConfig) {
        const delay = (positionConfig.delay || 0) + staggerDelay;

        if (isSpringConfig(positionConfig.easing)) {
          // Use spring with our preset-based config
          const springValues = getSpringValues(positionConfig.easing);
          const springValue = spring({
            frame: frame - delay,
            fps,
            config: springValues,
          });
          translateX =
            (positionConfig.fromX ?? 0) +
            springValue *
              ((positionConfig.toX ?? 0) - (positionConfig.fromX ?? 0));
          translateY =
            (positionConfig.fromY ?? 0) +
            springValue *
              ((positionConfig.toY ?? 0) - (positionConfig.fromY ?? 0));
        } else {
          translateX = interpolateWithDelay(
            frame,
            delay,
            positionConfig.duration || 20,
            positionConfig.fromX ?? 0,
            positionConfig.toX ?? 0,
            positionConfig.easing as EasingType
          );
          translateY = interpolateWithDelay(
            frame,
            delay,
            positionConfig.duration || 20,
            positionConfig.fromY ?? 0,
            positionConfig.toY ?? 0,
            positionConfig.easing as EasingType
          );
        }
      }

      // Apply exit animation if active
      if (exit && exit.startFrame !== undefined && frame >= exit.startFrame) {
        const exitFrame = frame - exit.startFrame;

        if (exit.blur) {
          blur = interpolateWithDelay(
            exitFrame,
            exit.blur.delay || 0,
            exit.blur.duration || 15,
            exit.blur.from ?? 0,
            exit.blur.to ?? 20,
            exit.blur.easing
          );
        }

        if (exit.opacity) {
          opacity = interpolateWithDelay(
            exitFrame,
            exit.opacity.delay || 0,
            exit.opacity.duration || 15,
            exit.opacity.from ?? 1,
            exit.opacity.to ?? 0,
            exit.opacity.easing
          );
        }

        if (exit.scale) {
          scale = interpolateWithDelay(
            exitFrame,
            exit.scale.delay || 0,
            exit.scale.duration || 20,
            exit.scale.from ?? 1,
            exit.scale.to ?? 0.8,
            exit.scale.easing as EasingType
          );
        }

        if (exit.position) {
          translateX = interpolateWithDelay(
            exitFrame,
            exit.position.delay || 0,
            exit.position.duration || 20,
            exit.position.fromX ?? 0,
            exit.position.toX ?? 0,
            exit.position.easing as EasingType
          );
          translateY = interpolateWithDelay(
            exitFrame,
            exit.position.delay || 0,
            exit.position.duration || 20,
            exit.position.fromY ?? 0,
            exit.position.toY ?? 0,
            exit.position.easing as EasingType
          );
        }
      }

      return { blur, opacity, scale, translateX, translateY };
    };

    return {
      getValuesForUnit,
      typewriterVisibleChars,
      showCursor,
    };
  }, [props, frame, fps, totalUnits]);
};
