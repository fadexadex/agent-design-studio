import React from "react";
import { AbsoluteFill } from "remotion";
import type { SolidLayerConfig } from "../types";
import { SOLID_DEFAULTS } from "../utils/layerDefaults";
import { useAnimationEngine } from "../hooks/useAnimationEngine";

type Props = Omit<SolidLayerConfig, "type">;

export const SolidLayer: React.FC<Props> = ({
  color,
  opacity = SOLID_DEFAULTS.opacity,
  blendMode,
  animated = false,
  animationSpeed = 1,
}) => {
  const { pulse } = useAnimationEngine({ animated, animationSpeed });

  // Gentle opacity breathing when animated
  const currentOpacity = pulse(opacity * 0.92, opacity * 0.08, 400);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: color,
        opacity: currentOpacity,
        mixBlendMode: blendMode,
      }}
    />
  );
};
