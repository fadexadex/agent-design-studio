import React from "react";
import { AbsoluteFill } from "remotion";
import type { BackgroundProps, BackgroundLayerConfig } from "./types";
import { backgroundPresets, getTypeVariantLayers } from "./presets";
import { SolidLayer } from "./layers/SolidLayer";
import { LinearGradientLayer } from "./layers/LinearGradientLayer";
import { RadialGradientLayer } from "./layers/RadialGradientLayer";
import { MeshGradientLayer } from "./layers/MeshGradientLayer";
import { NoiseLayer } from "./layers/NoiseLayer";
import { BlurLayer } from "./layers/BlurLayer";
import { VignetteLayer } from "./layers/VignetteLayer";
import { GlowLayer } from "./layers/GlowLayer";
import { GridLayer } from "./layers/GridLayer";

/**
 * Composable Background component with three usage patterns:
 *
 * **Pattern 1: Preset-based (simplest)**
 * ```tsx
 * <Background preset="deepPurpleAurora" />
 * <Background preset="midnightOcean" animated />
 * ```
 *
 * **Pattern 2: Type/Variant API (BackgroundRig compatible)**
 * ```tsx
 * <Background type="gradient-mesh" variant="dark" />
 * <Background type="grid-lines" variant="light" />
 * <Background type="blobs" variant="brand" meshColors={{ primary: "#ff0", secondary: "#0ff" }} />
 * ```
 *
 * **Pattern 3: Full layer control (most flexible)**
 * ```tsx
 * <Background
 *   layers={[
 *     { type: 'solid', color: '#0a0a2e' },
 *     { type: 'radial', colors: ['#7b2ff7', 'transparent'], centerX: 50, centerY: 50 },
 *     { type: 'glow', color: '#3b82f6', x: 25, y: 75, radius: 40 },
 *     { type: 'noise', opacity: 0.03 },
 *     { type: 'vignette', intensity: 0.4 },
 *   ]}
 *   animated
 *   animationSpeed={0.8}
 * />
 * ```
 *
 * Priority: preset > type/variant > layers
 */
export const Background: React.FC<BackgroundProps> = ({
  preset,
  type,
  variant = "light",
  meshColors,
  layers: propLayers,
  animated: propAnimated,
  animationSpeed: propAnimationSpeed = 1,
  className,
}) => {
  // Resolve layers based on priority: preset > type/variant > layers
  let layers: BackgroundLayerConfig[];
  let animated: boolean;
  let animationSpeed: number;

  if (preset && backgroundPresets[preset]) {
    // Pattern 1: Use preset
    const presetConfig = backgroundPresets[preset];
    layers = presetConfig.layers;
    animated = propAnimated !== undefined ? propAnimated : (presetConfig.animated ?? false);
    animationSpeed = propAnimationSpeed * (presetConfig.animationSpeed ?? 1);
  } else if (type) {
    // Pattern 2: BackgroundRig-compatible type/variant API
    layers = getTypeVariantLayers(type, variant, meshColors);
    animated = propAnimated !== undefined ? propAnimated : (type !== "grid-lines" && type !== "solid");
    animationSpeed = propAnimationSpeed;
  } else if (propLayers && propLayers.length > 0) {
    // Pattern 3: Full layer control
    layers = propLayers;
    animated = propAnimated ?? false;
    animationSpeed = propAnimationSpeed;
  } else {
    // Fallback: empty background
    layers = [];
    animated = false;
    animationSpeed = 1;
  }

  /**
   * Resolve per-layer animation flags.
   * Layer-level values win; otherwise fall back to the global props.
   */
  const resolveAnimation = (layer: BackgroundLayerConfig) => ({
    animated: layer.animated !== undefined ? layer.animated : animated,
    animationSpeed: (layer.animationSpeed ?? 1) * animationSpeed,
  });

  const renderLayer = (layer: BackgroundLayerConfig, index: number) => {
    const anim = resolveAnimation(layer);

    switch (layer.type) {
      case "solid":
        return (
          <SolidLayer
            key={index}
            color={layer.color}
            opacity={layer.opacity}
            blendMode={layer.blendMode}
            {...anim}
          />
        );

      case "linear":
        return (
          <LinearGradientLayer
            key={index}
            colors={layer.colors}
            angle={layer.angle}
            opacity={layer.opacity}
            blendMode={layer.blendMode}
            {...anim}
          />
        );

      case "radial":
        return (
          <RadialGradientLayer
            key={index}
            colors={layer.colors}
            centerX={layer.centerX}
            centerY={layer.centerY}
            radius={layer.radius}
            shape={layer.shape}
            opacity={layer.opacity}
            blendMode={layer.blendMode}
            {...anim}
          />
        );

      case "mesh":
        return (
          <MeshGradientLayer
            key={index}
            colors={layer.colors}
            points={layer.points}
            spread={layer.spread}
            opacity={layer.opacity}
            blendMode={layer.blendMode}
            {...anim}
          />
        );

      case "noise":
        return (
          <NoiseLayer
            key={index}
            frequency={layer.frequency}
            octaves={layer.octaves}
            opacity={layer.opacity}
            blendMode={layer.blendMode}
          />
        );

      case "blur":
        return (
          <BlurLayer
            key={index}
            amount={layer.amount}
            opacity={layer.opacity}
            blendMode={layer.blendMode}
            {...anim}
          />
        );

      case "vignette":
        return (
          <VignetteLayer
            key={index}
            color={layer.color}
            intensity={layer.intensity}
            radius={layer.radius}
            opacity={layer.opacity}
            blendMode={layer.blendMode}
            {...anim}
          />
        );

      case "glow":
        return (
          <GlowLayer
            key={index}
            color={layer.color}
            x={layer.x}
            y={layer.y}
            radius={layer.radius}
            intensity={layer.intensity}
            opacity={layer.opacity}
            blendMode={layer.blendMode}
            {...anim}
          />
        );

      case "grid":
        return (
          <GridLayer
            key={index}
            color={layer.color}
            size={layer.size}
            strokeWidth={layer.strokeWidth}
            opacity={layer.opacity}
            blendMode={layer.blendMode}
          />
        );

      default:
        return null;
    }
  };

  return (
    <AbsoluteFill
      className={className}
      style={{
        overflow: "hidden",
        zIndex: -1,
      }}
    >
      {layers.map(renderLayer)}
    </AbsoluteFill>
  );
};
