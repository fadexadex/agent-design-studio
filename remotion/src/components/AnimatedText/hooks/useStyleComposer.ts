import type { CSSProperties } from "react";
import type {
  AnimationValues,
  ScaleAnimation,
  PositioningResult,
} from "../types";

/**
 * Compose animation values into CSS styles
 */
export const useStyleComposer = () => {
  /**
   * Create CSS styles from animation values
   * Optionally combines with positioning transforms for single GPU layer
   */
  const composeStyles = (
    values: AnimationValues,
    scaleOrigin?: string,
    positioning?: PositioningResult,
  ): CSSProperties => {
    const { blur, opacity, scale, translateX, translateY } = values;

    // Build animation transforms
    const animationTransforms: string[] = [];

    if (scale !== 1) {
      animationTransforms.push(`scale(${scale})`);
    }

    if (translateX !== 0) {
      animationTransforms.push(`translateX(${translateX}px)`);
    }

    if (translateY !== 0) {
      animationTransforms.push(`translateY(${translateY}px)`);
    }

    const styles: CSSProperties = {
      display: "inline-block", // Required for transforms on text
      opacity,
    };

    if (blur > 0) {
      styles.filter = `blur(${blur}px)`;
    }

    // Combine positioning and animation transforms (positioning first, then animations)
    // This ensures proper transform composition on a single GPU layer
    if (positioning?.isPositioned) {
      const allTransforms = [
        positioning.positionTransform,
        positioning.centerTransform,
        ...animationTransforms,
      ].filter(Boolean);

      if (allTransforms.length > 0) {
        styles.transform = allTransforms.join(" ");
      }
    } else if (animationTransforms.length > 0) {
      styles.transform = animationTransforms.join(" ");
    }

    if (scaleOrigin && scale !== 1) {
      styles.transformOrigin = scaleOrigin;
    }

    return styles;
  };

  /**
   * Get transform string only (for external composition)
   */
  const getTransformString = (values: AnimationValues): string => {
    const transforms: string[] = [];
    const { scale, translateX, translateY } = values;

    if (scale !== 1) {
      transforms.push(`scale(${scale})`);
    }

    if (translateX !== 0) {
      transforms.push(`translateX(${translateX}px)`);
    }

    if (translateY !== 0) {
      transforms.push(`translateY(${translateY}px)`);
    }

    return transforms.join(" ");
  };

  return { composeStyles, getTransformString };
};

/**
 * Extract scale origin from scale config
 */
export const getScaleOrigin = (
  scaleConfig: ScaleAnimation | boolean | undefined,
): string | undefined => {
  if (typeof scaleConfig === "object" && scaleConfig.origin) {
    return scaleConfig.origin;
  }
  return undefined;
};
