import React from "react";
import { AbsoluteFill } from "remotion";
import type { VignetteLayerConfig } from "../types";
import { VIGNETTE_DEFAULTS } from "../utils/layerDefaults";
import { useAnimationEngine } from "../hooks/useAnimationEngine";

type Props = Omit<VignetteLayerConfig, "type">;

export const VignetteLayer: React.FC<Props> = ({
  color = VIGNETTE_DEFAULTS.color,
  intensity = VIGNETTE_DEFAULTS.intensity,
  radius = VIGNETTE_DEFAULTS.radius,
  opacity = VIGNETTE_DEFAULTS.opacity,
  blendMode,
  animated = false,
  animationSpeed = 1,
}) => {
  const { pulse } = useAnimationEngine({ animated, animationSpeed });

  // Subtle intensity breathing
  const currentIntensity = pulse(intensity * 0.9, intensity * 0.1, 500);

  // Vignette as a radial gradient from transparent center → colored edges
  const vignette = `radial-gradient(ellipse at 50% 50%, transparent ${radius}%, ${color} 100%)`;

  return (
    <AbsoluteFill
      style={{
        background: vignette,
        opacity: currentIntensity * opacity,
        mixBlendMode: blendMode,
      }}
    />
  );
};
