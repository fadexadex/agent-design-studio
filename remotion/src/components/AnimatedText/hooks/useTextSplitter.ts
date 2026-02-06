import { useMemo } from 'react';
import type { AnimationUnit, TextUnit } from '../types';

/**
 * Split text into animatable units (words, characters, or lines)
 */
export const useTextSplitter = (
  text: string,
  unit: AnimationUnit
): TextUnit[] => {
  return useMemo(() => {
    if (unit === 'full') {
      return [{ text, index: 0 }];
    }

    if (unit === 'line') {
      return text.split('\n').map((line, index) => ({
        text: line,
        index,
      }));
    }

    if (unit === 'word') {
      const units: TextUnit[] = [];
      let index = 0;

      // Split by spaces but preserve spaces as separate units for layout
      const parts = text.split(/(\s+)/);

      parts.forEach((part) => {
        if (part.length === 0) return;

        if (/^\s+$/.test(part)) {
          // This is whitespace - render as a space
          units.push({ text: part, index: index++, isSpace: true });
        } else {
          // This is a word
          units.push({ text: part, index: index++ });
        }
      });

      return units;
    }

    if (unit === 'character') {
      return text.split('').map((char, index) => ({
        text: char,
        index,
        isSpace: char === ' ',
      }));
    }

    return [{ text, index: 0 }];
  }, [text, unit]);
};

/**
 * Get total count of non-space units for stagger calculations
 */
export const useAnimatableUnitCount = (units: TextUnit[]): number => {
  return useMemo(() => {
    return units.filter((u) => !u.isSpace).length;
  }, [units]);
};
