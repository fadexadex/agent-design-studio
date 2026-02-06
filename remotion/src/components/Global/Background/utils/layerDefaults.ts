/**
 * Central place for every layer type's default values.
 * Layer components import from here so defaults stay consistent.
 */

export const SOLID_DEFAULTS = {
  opacity: 1,
} as const;

export const LINEAR_DEFAULTS = {
  angle: 135,
  opacity: 1,
} as const;

export const RADIAL_DEFAULTS = {
  centerX: 50,
  centerY: 50,
  radius: undefined, // uses CSS default (farthest-corner)
  shape: "ellipse" as const,
  opacity: 1,
} as const;

export const MESH_DEFAULTS = {
  spread: 50,
  opacity: 1,
  points: [
    { x: 20, y: 30 },
    { x: 80, y: 25 },
    { x: 50, y: 70 },
    { x: 15, y: 85 },
  ],
} as const;

export const NOISE_DEFAULTS = {
  frequency: 0.9,
  octaves: 4,
  opacity: 0.03,
} as const;

export const BLUR_DEFAULTS = {
  amount: 40,
  opacity: 1,
} as const;

export const VIGNETTE_DEFAULTS = {
  color: "#000000",
  intensity: 0.5,
  radius: 40,
  opacity: 1,
} as const;

export const GLOW_DEFAULTS = {
  x: 50,
  y: 50,
  radius: 30,
  intensity: 0.6,
  opacity: 1,
} as const;

export const GRID_DEFAULTS = {
  color: "rgba(255,255,255,0.05)",
  size: 60,
  strokeWidth: 1,
  opacity: 1,
} as const;
