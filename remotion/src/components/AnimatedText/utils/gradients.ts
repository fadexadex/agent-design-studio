import type { CSSProperties } from 'react';
import type { GradientConfig } from '../types';

/**
 * Generate CSS styles for gradient text
 */
export const getGradientStyles = (gradient: GradientConfig): CSSProperties => {
  const { colors, angle = 135, type = 'linear' } = gradient;

  if (colors.length < 2) {
    return { color: colors[0] || 'inherit' };
  }

  const colorStops = colors
    .map((color, index) => {
      const percentage = (index / (colors.length - 1)) * 100;
      return `${color} ${percentage}%`;
    })
    .join(', ');

  const gradientValue =
    type === 'radial'
      ? `radial-gradient(circle, ${colorStops})`
      : `linear-gradient(${angle}deg, ${colorStops})`;

  return {
    background: gradientValue,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  };
};
