import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { BackgroundRigProps } from '../../types/schema';

export const BackgroundRig: React.FC<BackgroundRigProps> = ({
    type,
    primaryColor = '#ffffff',
    secondaryColor = '#f0f0f0',
    movementSpeed = 1,
    children,
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    let backgroundStyle: React.CSSProperties = {
        backgroundColor: primaryColor,
    };

    const offset = (frame * movementSpeed) % 1000; // Loop every 1000px roughly

    if (type === 'clean-white') {
        backgroundStyle = {
            background: 'white',
        };
    } else if (type === 'brand-gradient') {
        backgroundStyle = {
            background: `linear-gradient(45deg, ${primaryColor}, ${secondaryColor})`,
            backgroundSize: '200% 200%',
            // Simple pan animation for gradient
            backgroundPosition: `${offset / 2}% 50%`,
        };
    } else if (type === 'neon-mesh') {
        // A complex gradient simulating a mesh
        backgroundStyle = {
            background: `
        radial-gradient(at 0% 0%, ${primaryColor} 0px, transparent 50%),
        radial-gradient(at 100% 0%, ${secondaryColor} 0px, transparent 50%),
        radial-gradient(at 100% 100%, ${primaryColor} 0px, transparent 50%),
        radial-gradient(at 0% 100%, ${secondaryColor} 0px, transparent 50%),
        #000
      `,
            backgroundSize: '120% 120%',
            backgroundPosition: `${50 + Math.sin(frame / fps) * 5}% ${50 + Math.cos(frame / fps) * 5}%`,
        };
    }

    return (
        <AbsoluteFill style={{ overflow: 'hidden', ...backgroundStyle }}>
            {/* Optional Grid Overlay */}
            {type === 'clean-white' && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage:
                            'linear-gradient(#e5e5e5 1px, transparent 1px), linear-gradient(90deg, #e5e5e5 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                        opacity: 0.5,
                    }}
                />
            )}

            {/* Content Container */}
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                {children}
            </div>
        </AbsoluteFill>
    );
};
