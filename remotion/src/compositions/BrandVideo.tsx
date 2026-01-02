import React, { useMemo } from 'react';
import {
    AbsoluteFill,
    useCurrentFrame,
    useVideoConfig,
    interpolate,
    spring,
    Sequence,
} from 'remotion';

interface BrandVideoProps {
    compositionPath: string;
}

/**
 * Dynamic BrandVideo composition that loads AI-generated content
 * This serves as a wrapper that can dynamically import the generated composition
 */
export const BrandVideo: React.FC<BrandVideoProps> = ({ compositionPath }) => {
    const frame = useCurrentFrame();
    const { fps, width, height } = useVideoConfig();

    // Fallback animation when no composition is provided
    const opacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });
    const scale = spring({
        frame,
        fps,
        config: {
            damping: 200,
            stiffness: 100,
        },
    });

    const titleY = interpolate(frame, [0, 30], [50, 0], { extrapolateRight: 'clamp' });

    return (
        <AbsoluteFill
            style={{
                background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
                fontFamily: 'Inter, system-ui, sans-serif',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            {/* Animated background grid */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: 0.1,
                    backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
                    backgroundSize: '50px 50px',
                    transform: `translateY(${frame * 0.5}px)`,
                }}
            />

            {/* Main content */}
            <Sequence from={0} durationInFrames={150}>
                <AbsoluteFill
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity,
                    }}
                >
                    {/* Logo placeholder */}
                    <div
                        style={{
                            width: 120,
                            height: 120,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #fff 0%, #ccc 100%)',
                            marginBottom: 40,
                            transform: `scale(${scale})`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <div
                            style={{
                                width: 40,
                                height: 40,
                                background: '#0a0a0a',
                                transform: 'rotate(45deg)',
                            }}
                        />
                    </div>

                    {/* Brand name */}
                    <h1
                        style={{
                            fontSize: 72,
                            fontWeight: 800,
                            color: 'white',
                            margin: 0,
                            letterSpacing: '-2px',
                            transform: `translateY(${titleY}px)`,
                        }}
                    >
                        Agent Design Studio
                    </h1>

                    {/* Tagline */}
                    <Sequence from={30}>
                        <p
                            style={{
                                fontSize: 24,
                                color: 'rgba(255,255,255,0.6)',
                                margin: '20px 0 0 0',
                                letterSpacing: '4px',
                                textTransform: 'uppercase',
                                opacity: interpolate(frame - 30, [0, 20], [0, 1], {
                                    extrapolateRight: 'clamp',
                                    extrapolateLeft: 'clamp',
                                }),
                            }}
                        >
                            AI-Powered Motion Design
                        </p>
                    </Sequence>
                </AbsoluteFill>
            </Sequence>

            {/* Animated accents */}
            <Sequence from={60}>
                <div
                    style={{
                        position: 'absolute',
                        bottom: 100,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        gap: 12,
                    }}
                >
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: 'white',
                                opacity: interpolate(
                                    frame - 60 - i * 10,
                                    [0, 15],
                                    [0, 1],
                                    { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
                                ),
                            }}
                        />
                    ))}
                </div>
            </Sequence>
        </AbsoluteFill>
    );
};
