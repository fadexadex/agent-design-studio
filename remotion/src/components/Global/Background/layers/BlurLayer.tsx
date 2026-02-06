import React from "react";
import { AbsoluteFill } from "remotion";
import type { BlurLayerConfig } from "../types";
import { BLUR_DEFAULTS } from "../utils/layerDefaults";
import { useAnimationEngine } from "../hooks/useAnimationEngine";

type Props = Omit<BlurLayerConfig, "type">;

export const BlurLayer: React.FC<Props> = ({
  amount = BLUR_DEFAULTS.amount,
  opacity = BLUR_DEFAULTS.opacity,
  blendMode,
  animated = false,
  animationSpeed = 1,
}) => {
  const { pulse } = useAnimationEngine({ animated, animationSpeed });

  // Slight blur pulsing when animated
  const currentBlur = pulse(amount * 0.85, amount * 0.15, 500);

  return (
    <AbsoluteFill
      style={{
        backdropFilter: `blur(${currentBlur}px)`,
        WebkitBackdropFilter: `blur(${currentBlur}px)`,
        opacity,
        mixBlendMode: blendMode,
      }}
    />
  );
};
