import React from "react";
import { AbsoluteFill } from "remotion";
import type { RadialGradientLayerConfig } from "../types";
import { RADIAL_DEFAULTS } from "../utils/layerDefaults";
import { useAnimationEngine } from "../hooks/useAnimationEngine";

type Props = Omit<RadialGradientLayerConfig, "type">;

export const RadialGradientLayer: React.FC<Props> = ({
  colors,
  centerX = RADIAL_DEFAULTS.centerX,
  centerY = RADIAL_DEFAULTS.centerY,
  radius,
  shape = RADIAL_DEFAULTS.shape,
  opacity = RADIAL_DEFAULTS.opacity,
  blendMode,
  animated = false,
  animationSpeed = 1,
}) => {
  const { drift } = useAnimationEngine({ animated, animationSpeed });

  // Gentle center drift when animated
  const cx = drift(centerX, 8, 500);
  const cy = drift(centerY, 6, 400);

  const sizeHint = radius ? `${radius}%` : "farthest-corner";
  const gradient = `radial-gradient(${shape} ${sizeHint} at ${cx}% ${cy}%, ${colors.join(", ")})`;

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
