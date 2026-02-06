import React from "react";
import { AbsoluteFill } from "remotion";
import type { GlowLayerConfig } from "../types";
import { GLOW_DEFAULTS } from "../utils/layerDefaults";
import { useAnimationEngine } from "../hooks/useAnimationEngine";

type Props = Omit<GlowLayerConfig, "type">;

export const GlowLayer: React.FC<Props> = ({
  color,
  x = GLOW_DEFAULTS.x,
  y = GLOW_DEFAULTS.y,
  radius = GLOW_DEFAULTS.radius,
  intensity = GLOW_DEFAULTS.intensity,
  opacity = GLOW_DEFAULTS.opacity,
  blendMode,
  animated = false,
  animationSpeed = 1,
}) => {
  const { drift, pulse } = useAnimationEngine({ animated, animationSpeed });

  // Drift the glow position and pulse its intensity
  const cx = drift(x, 5, 600);
  const cy = drift(y, 4, 500);
  const currentIntensity = pulse(intensity * 0.85, intensity * 0.15, 350);

  const glow = `radial-gradient(circle ${radius}% at ${cx}% ${cy}%, ${color}, transparent)`;

  return (
    <AbsoluteFill
      style={{
        background: glow,
        opacity: currentIntensity * opacity,
        mixBlendMode: blendMode,
      }}
    />
  );
};
