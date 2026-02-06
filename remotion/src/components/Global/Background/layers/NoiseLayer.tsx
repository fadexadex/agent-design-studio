import React from "react";
import { AbsoluteFill } from "remotion";
import type { NoiseLayerConfig } from "../types";
import { NOISE_DEFAULTS } from "../utils/layerDefaults";

type Props = Omit<NoiseLayerConfig, "type">;

export const NoiseLayer: React.FC<Props> = ({
  frequency = NOISE_DEFAULTS.frequency,
  octaves = NOISE_DEFAULTS.octaves,
  opacity = NOISE_DEFAULTS.opacity,
  blendMode = "overlay",
}) => {
  // Inline SVG noise texture — works without external assets
  const noiseSvg = `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='${frequency}' numOctaves='${octaves}' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

  return (
    <AbsoluteFill
      style={{
        background: noiseSvg,
        opacity,
        mixBlendMode: blendMode,
      }}
    />
  );
};
