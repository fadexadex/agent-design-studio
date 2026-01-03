import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, Easing } from 'remotion';

// Constants for geometric sizing and spacing
const LETTER_WIDTH = 80;
const LETTER_HEIGHT = 100;
const STROKE_WIDTH = 10;
const LETTER_SPACING = 20; // Space between letters

// Off-screen initial positions for elements
const OFF_SCREEN_X = 1000;
const OFF_SCREEN_Y = 1000;

interface SegmentProps {
    frame: number;
    delay: number;
    duration: number;
    initialX: number;
    initialY: number;
    finalX: number;
    finalY: number;
    width: number;
    height: number;
    rotation?: number;
    transformOrigin?: string;
}

const GeometricSegment: React.FC<SegmentProps> = ({
    frame,
    delay,
    duration,
    initialX,
    initialY,
    finalX,
    finalY,
    width,
    height,
    rotation = 0,
    transformOrigin = 'center center',
}) => {
    // Animation progress for each segment
    const progress = spring({
        frame: frame - delay,
        fps: 30, // Assuming 30fps for the composition
        config: {
            damping: 200

export const Scene1 = LETTER_WIDTH;