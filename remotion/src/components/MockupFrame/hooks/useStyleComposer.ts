import type { CSSProperties } from "react";
import type {
  AnimationValues,
  ScaleAnimation,
  RotateAnimation,
} from "../types";

/**
 * Compose animation values into CSS styles for MockupFrame
 */
export const useStyleComposer = () => {
  /**
   * Create CSS styles from animation values
   */
  const composeStyles = (
    values: AnimationValues,
    scaleOrigin?: string,
  ): CSSProperties => {
    const {
      blur,
      opacity,
      scale,
      translateX,
      translateY,
      rotateX,
      rotateY,
      rotateZ,
      perspective,
    } = values;

    // Build transform string
    const transforms: string[] = [];

    // Add perspective for 3D transforms
    if (rotateX !== 0 || rotateY !== 0) {
      transforms.push(`perspective(${perspective}px)`);
    }

    // Translations
    if (translateX !== 0 || translateY !== 0) {
      transforms.push(`translate3d(${translateX}px, ${translateY}px, 0)`);
    }

    // Scale
    if (scale !== 1) {
      transforms.push(`scale(${scale})`);
    }

    // Rotations (3D)
    if (rotateX !== 0) {
      transforms.push(`rotateX(${rotateX}deg)`);
    }
    if (rotateY !== 0) {
      transforms.push(`rotateY(${rotateY}deg)`);
    }
    if (rotateZ !== 0) {
      transforms.push(`rotateZ(${rotateZ}deg)`);
    }

    const styles: CSSProperties = {
      opacity,
    };

    if (blur > 0) {
      styles.filter = `blur(${blur}px)`;
    }

    if (transforms.length > 0) {
      styles.transform = transforms.join(" ");
    }

    if (scaleOrigin && scale !== 1) {
      styles.transformOrigin = scaleOrigin;
    }

    // Preserve 3D context for child elements
    if (rotateX !== 0 || rotateY !== 0) {
      styles.transformStyle = "preserve-3d";
    }

    return styles;
  };

  /**
   * Get transform string only (for external composition)
   */
  const getTransformString = (values: AnimationValues): string => {
    const {
      scale,
      translateX,
      translateY,
      rotateX,
      rotateY,
      rotateZ,
      perspective,
    } = values;

    const transforms: string[] = [];

    if (rotateX !== 0 || rotateY !== 0) {
      transforms.push(`perspective(${perspective}px)`);
    }

    if (translateX !== 0 || translateY !== 0) {
      transforms.push(`translate3d(${translateX}px, ${translateY}px, 0)`);
    }

    if (scale !== 1) {
      transforms.push(`scale(${scale})`);
    }

    if (rotateX !== 0) {
      transforms.push(`rotateX(${rotateX}deg)`);
    }
    if (rotateY !== 0) {
      transforms.push(`rotateY(${rotateY}deg)`);
    }
    if (rotateZ !== 0) {
      transforms.push(`rotateZ(${rotateZ}deg)`);
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

/**
 * Extract perspective from rotate config
 */
export const getPerspective = (
  rotateConfig: RotateAnimation | boolean | undefined,
): number => {
  if (typeof rotateConfig === "object" && rotateConfig.perspective) {
    return rotateConfig.perspective;
  }
  return 1200;
};
