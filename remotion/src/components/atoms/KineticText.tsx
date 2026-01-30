import React, { useMemo } from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { KineticTextProps } from '../../types/schema';

export const KineticText: React.FC<KineticTextProps> = ({
    text,
    style,
    animationType,
    enterDelay = 0,
    color = 'black',
    className = '',
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Split text based on animation type
    const items = useMemo(() => {
        if (animationType === 'letter-slide') {
            return text.split('');
        }
        return text.split(' ');
    }, [text, animationType]);

    const fontSize = style === 'h1' ? 80 : style === 'h2' ? 50 : 30;
    const fontWeight = style === 'h1' ? 'bold' : 'normal';

    // Base styles map
    const baseStyles: React.CSSProperties = {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        gap: animationType === 'letter-slide' ? '0px' : '15px',
        width: '100%',
        fontFamily: 'Inter, sans-serif', // Assuming Inter is available or fallback
        fontSize,
        fontWeight,
        color,
        lineHeight: 1.2,
    };

    return (
        <div style={baseStyles} className={className}>
            {items.map((item, index) => {
                // Calculate delay for this specific item
                // Stagger by 5 frames per item usually looks good
                const staggerDelay = index * 5;
                const startFrame = enterDelay + staggerDelay;

                // Spring configuration
                const progress = spring({
                    frame: frame - startFrame,
                    fps,
                    config: {
                        damping: 12,
                        stiffness: 200,
                    },
                });

                // Animations based on type
                const translateY = interpolate(
                    progress,
                    [0, 1],
                    [50, 0] // Slide up 50px
                );

                const opacity = interpolate(progress, [0, 1], [0, 1]);

                const scale = interpolate(progress, [0, 1], [0.8, 1]);

                const itemStyle: React.CSSProperties = {
                    display: 'inline-block',
                    opacity,
                    transform: `translateY(${translateY}px) scale(${animationType === 'word-stagger' ? scale : 1})`,
                };

                // Handle space for letter-slide split
                if (animationType === 'letter-slide' && item === ' ') {
                    return <span key={index} style={{ width: fontSize / 4 }} />;
                }

                return (
                    <span key={index} style={itemStyle}>
                        {item}
                    </span>
                );
            })}
        </div>
    );
};
