import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { MotionContainerProps } from '../../types/schema';

export const MotionContainer: React.FC<MotionContainerProps> = ({
    children,
    entryAnimation,
    continuousEffect = 'none',
    perspective = 1000,
    rotation = { x: 0, y: 0, z: 0 },
    delay = 0,
    duration = 30, // Default duration for entry animation
    className = '',
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Entry Animation Progress
    const entryProgress = spring({
        frame: frame - delay,
        fps,
        config: { damping: 12, stiffness: 100 },
    });

    // Calculate Entry Transforms
    let entryTransform = '';
    let entryOpacity = 1;

    if (entryAnimation === 'slide-in-right') {
        const x = interpolate(entryProgress, [0, 1], [1000, 0]);
        entryTransform = `translateX(${x}px)`;
        entryOpacity = interpolate(entryProgress, [0, 0.5], [0, 1]);
    } else if (entryAnimation === 'pop-up') {
        const s = interpolate(entryProgress, [0, 1], [0, 1]);
        const y = interpolate(entryProgress, [0, 1], [200, 0]);
        entryTransform = `translateY(${y}px) scale(${s})`;
    } else if (entryAnimation === 'zoom-out') {
        const s = interpolate(entryProgress, [0, 1], [1.5, 1]);
        const o = interpolate(entryProgress, [0, 1], [0, 1]);
        entryTransform = `scale(${s})`;
        entryOpacity = o;
    }

    // Continuous Effect
    const continuousTime = (frame - delay) / fps;
    let continuousTransform = '';

    if (continuousEffect === 'hover-float') {
        const y = Math.sin(continuousTime * 2) * 10; // Float up and down
        continuousTransform = `translateY(${y}px)`;
    } else if (continuousEffect === 'slow-rotate') {
        const r = continuousTime * 5; // 5 degrees per second
        continuousTransform = `rotateY(${r}deg)`;
    }

    // Combine Transforms
    // Order: Perspective container > Static Rotation > Entry Animation > Continuous Effect
    // Note: CSS transform order matters. We'll apply perspective to wrapper.

    const outerStyle: React.CSSProperties = {
        transformStyle: 'preserve-3d',
        transform: `perspective(${perspective}px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) rotateZ(${rotation.z}deg)`,
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    };

    const innerStyle: React.CSSProperties = {
        transform: `${entryTransform} ${continuousTransform}`,
        opacity: entryOpacity,
        transformStyle: 'preserve-3d', // Propagate 3d context
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    };

    return (
        <div style={outerStyle} className={className}>
            <div style={innerStyle}>
                {children}
            </div>
        </div>
    );
};
