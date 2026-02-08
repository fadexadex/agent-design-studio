import { useCurrentFrame, useVideoConfig, spring } from "remotion";
import { useMemo } from "react";
import type {
  MockupFrameProps,
  AnimationValues,
  BlurAnimation,
  OpacityAnimation,
  ScaleAnimation,
  PositionAnimation,
  RotateAnimation,
  SpringConfig,
  EasingType,
  EntrancePresetType,
  ExitPresetType,
} from "../types";
import { getEntrancePreset, getExitPreset, DEFAULTS } from "../presets";
import { interpolateWithDelay } from "./interpolation";
import { SPRING_CONFIGS, type SpringConfig as AnimSpringConfig } from "../../Animation/springs";

interface AnimationCalculatorResult {
  values: AnimationValues;
}

/**
 * Normalize animation config from boolean or object
 */
const normalizeConfig = <T extends object>(
  config: T | boolean | undefined,
  defaults: T,
): T | null => {
  if (config === undefined || config === false) return null;
  if (config === true) return defaults;
  return { ...defaults, ...config };
};

/**
 * Check if easing is a spring config
 */
const isSpringConfig = (
  easing: EasingType | SpringConfig | undefined,
): easing is SpringConfig => {
  return typeof easing === "object" && easing?.type === "spring";
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
 * Core animation calculation hook for MockupFrame
 */
export const useAnimationCalculator = (
  props: MockupFrameProps,
): AnimationCalculatorResult => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return useMemo(() => {
    const {
      preset = "none",
      blur: blurProp,
      opacity: opacityProp,
      scale: scaleProp,
      position: positionProp,
      rotate: rotateProp,
      exitPreset = "none",
      exitStartFrame,
    } = props;

    // Get entrance preset values
    const entrancePresetValues = getEntrancePreset(
      preset as EntrancePresetType,
    );

    // Normalize entrance animation configs (props override preset)
    const blurConfig = normalizeConfig<BlurAnimation>(
      blurProp ?? entrancePresetValues.blur,
      DEFAULTS.blur,
    );
    const opacityConfig = normalizeConfig<OpacityAnimation>(
      opacityProp ?? entrancePresetValues.opacity,
      DEFAULTS.opacity,
    );
    const scaleConfig = normalizeConfig<ScaleAnimation>(
      scaleProp ?? entrancePresetValues.scale,
      DEFAULTS.scale as ScaleAnimation,
    );
    const positionConfig = normalizeConfig<PositionAnimation>(
      positionProp ?? entrancePresetValues.position,
      DEFAULTS.position as PositionAnimation,
    );
    const rotateConfig = normalizeConfig<RotateAnimation>(
      rotateProp ?? entrancePresetValues.rotate,
      DEFAULTS.rotate as RotateAnimation,
    );

    // Get exit preset values
    const exitPresetValues = getExitPreset(exitPreset as ExitPresetType);

    // Initialize animation values
    let blur = 0;
    let opacity = 1;
    let scale = 1;
    let translateX = 0;
    let translateY = 0;
    let rotateX = 0;
    let rotateY = 0;
    let rotateZ = 0;
    let perspective = 1200;

    // Calculate entrance blur
    if (blurConfig) {
      const delay = blurConfig.delay || 0;
      blur = interpolateWithDelay(
        frame,
        delay,
        blurConfig.duration || 20,
        blurConfig.from ?? 10,
        blurConfig.to ?? 0,
        blurConfig.easing,
      );
    }

    // Calculate entrance opacity
    if (opacityConfig) {
      const delay = opacityConfig.delay || 0;
      opacity = interpolateWithDelay(
        frame,
        delay,
        opacityConfig.duration || 20,
        opacityConfig.from ?? 0,
        opacityConfig.to ?? 1,
        opacityConfig.easing,
      );
    }

    // Calculate entrance scale (supports spring)
    if (scaleConfig) {
      const delay = scaleConfig.delay || 0;

      if (isSpringConfig(scaleConfig.easing)) {
        const springValues = getSpringValues(scaleConfig.easing);
        const springValue = spring({
          frame: frame - delay,
          fps,
          config: springValues,
        });
        const from = scaleConfig.from ?? 0.5;
        const to = scaleConfig.to ?? 1;
        scale = from + springValue * (to - from);
      } else {
        scale = interpolateWithDelay(
          frame,
          delay,
          scaleConfig.duration || 20,
          scaleConfig.from ?? 1,
          scaleConfig.to ?? 1,
          scaleConfig.easing as EasingType,
        );
      }
    }

    // Calculate entrance position (supports spring)
    if (positionConfig) {
      const delay = positionConfig.delay || 0;

      if (isSpringConfig(positionConfig.easing)) {
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
          positionConfig.easing as EasingType,
        );
        translateY = interpolateWithDelay(
          frame,
          delay,
          positionConfig.duration || 20,
          positionConfig.fromY ?? 0,
          positionConfig.toY ?? 0,
          positionConfig.easing as EasingType,
        );
      }
    }

    // Calculate entrance rotation (supports spring)
    if (rotateConfig) {
      const delay = rotateConfig.delay || 0;
      perspective = rotateConfig.perspective ?? 1200;

      if (isSpringConfig(rotateConfig.easing)) {
        const springValues = getSpringValues(rotateConfig.easing);
        const springValue = spring({
          frame: frame - delay,
          fps,
          config: springValues,
        });
        rotateX =
          (rotateConfig.fromX ?? 0) +
          springValue * ((rotateConfig.toX ?? 0) - (rotateConfig.fromX ?? 0));
        rotateY =
          (rotateConfig.fromY ?? 0) +
          springValue * ((rotateConfig.toY ?? 0) - (rotateConfig.fromY ?? 0));
        rotateZ =
          (rotateConfig.fromZ ?? 0) +
          springValue * ((rotateConfig.toZ ?? 0) - (rotateConfig.fromZ ?? 0));
      } else {
        rotateX = interpolateWithDelay(
          frame,
          delay,
          rotateConfig.duration || 20,
          rotateConfig.fromX ?? 0,
          rotateConfig.toX ?? 0,
          rotateConfig.easing as EasingType,
        );
        rotateY = interpolateWithDelay(
          frame,
          delay,
          rotateConfig.duration || 20,
          rotateConfig.fromY ?? 0,
          rotateConfig.toY ?? 0,
          rotateConfig.easing as EasingType,
        );
        rotateZ = interpolateWithDelay(
          frame,
          delay,
          rotateConfig.duration || 20,
          rotateConfig.fromZ ?? 0,
          rotateConfig.toZ ?? 0,
          rotateConfig.easing as EasingType,
        );
      }
    }

    // Apply exit animation if active
    if (
      exitPreset !== "none" &&
      exitStartFrame !== undefined &&
      frame >= exitStartFrame
    ) {
      const exitFrame = frame - exitStartFrame;

      if (exitPresetValues.blur) {
        blur = interpolateWithDelay(
          exitFrame,
          exitPresetValues.blur.delay || 0,
          exitPresetValues.blur.duration || 20,
          exitPresetValues.blur.from ?? 0,
          exitPresetValues.blur.to ?? 10,
          exitPresetValues.blur.easing,
        );
      }

      if (exitPresetValues.opacity) {
        opacity = interpolateWithDelay(
          exitFrame,
          exitPresetValues.opacity.delay || 0,
          exitPresetValues.opacity.duration || 20,
          exitPresetValues.opacity.from ?? 1,
          exitPresetValues.opacity.to ?? 0,
          exitPresetValues.opacity.easing,
        );
      }

      if (exitPresetValues.scale) {
        const exitScaleConfig = exitPresetValues.scale;

        if (isSpringConfig(exitScaleConfig.easing)) {
          const springValues = getSpringValues(exitScaleConfig.easing);
          const springValue = spring({
            frame: exitFrame - (exitScaleConfig.delay || 0),
            fps,
            config: { ...springValues, damping: 100 }, // Higher damping for exits
          });
          const from = exitScaleConfig.from ?? 1;
          const to = exitScaleConfig.to ?? 0.8;
          scale = from + springValue * (to - from);
        } else {
          scale = interpolateWithDelay(
            exitFrame,
            exitScaleConfig.delay || 0,
            exitScaleConfig.duration || 20,
            exitScaleConfig.from ?? 1,
            exitScaleConfig.to ?? 0.8,
            exitScaleConfig.easing as EasingType,
          );
        }
      }

      if (exitPresetValues.position) {
        const exitPositionConfig = exitPresetValues.position;

        if (isSpringConfig(exitPositionConfig.easing)) {
          const springValues = getSpringValues(exitPositionConfig.easing);
          const springValue = spring({
            frame: exitFrame - (exitPositionConfig.delay || 0),
            fps,
            config: { ...springValues, damping: 100 }, // Higher damping for exits
          });
          translateX =
            (exitPositionConfig.fromX ?? 0) +
            springValue *
              ((exitPositionConfig.toX ?? 0) - (exitPositionConfig.fromX ?? 0));
          translateY =
            (exitPositionConfig.fromY ?? 0) +
            springValue *
              ((exitPositionConfig.toY ?? 0) - (exitPositionConfig.fromY ?? 0));
        } else {
          translateX = interpolateWithDelay(
            exitFrame,
            exitPositionConfig.delay || 0,
            exitPositionConfig.duration || 20,
            exitPositionConfig.fromX ?? 0,
            exitPositionConfig.toX ?? 0,
            exitPositionConfig.easing as EasingType,
          );
          translateY = interpolateWithDelay(
            exitFrame,
            exitPositionConfig.delay || 0,
            exitPositionConfig.duration || 20,
            exitPositionConfig.fromY ?? 0,
            exitPositionConfig.toY ?? 0,
            exitPositionConfig.easing as EasingType,
          );
        }
      }
    }

    return {
      values: {
        blur,
        opacity,
        scale,
        translateX,
        translateY,
        rotateX,
        rotateY,
        rotateZ,
        perspective,
      },
    };
  }, [props, frame, fps]);
};
