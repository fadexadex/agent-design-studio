import React from "react";
import { AbsoluteFill } from "remotion";
import type { LinearGradientLayerConfig } from "../types";
import { LINEAR_DEFAULTS } from "../utils/layerDefaults";
import { useAnimationEngine } from "../hooks/useAnimationEngine";

type Props = Omit<LinearGradientLayerConfig, "type">;

export const LinearGradientLayer: React.FC<Props> = ({
  colors,
  angle = LINEAR_DEFAULTS.angle,
  opacity = LINEAR_DEFAULTS.opacity,
  blendMode,
  animated = false,
  animationSpeed = 1,
}) => {
  const { rotate } = useAnimationEngine({ animated, animationSpeed });

  // Slow rotation when animated
  const currentAngle = rotate(angle, 600);

  const gradient = `linear-gradient(${currentAngle}deg, ${colors.join(", ")})`;

  return (
    <AbsoluteFill
      style={{
        background: gradient,
        opacity,
        mixBlendMode: blendMode,
      }}
    />
  );
};
