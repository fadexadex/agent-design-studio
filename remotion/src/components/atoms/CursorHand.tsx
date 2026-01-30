import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { CursorHandProps } from '../../types/schema';

export const CursorHand: React.FC<CursorHandProps> = ({
    startPos,
    endPos,
    clickAtFrame,
    visible = true,
}) => {
    const frame = useCurrentFrame();
    const { fps, durationInFrames } = useVideoConfig();

    if (!visible) return null;

    // Movement Logic
    // Assuming movement takes around 60 frames or acts within the scene duration
    // We'll standardise movement to happen in the first 'N' frames or use interpolate across scene
    // For simplicity, let's say movement happens from frame 0 to clickAtFrame (or end if no click)
    const moveEndFrame = clickAtFrame ? Math.max(0, clickAtFrame - 10) : durationInFrames - 30;

    const x = interpolate(
        frame,
        [0, moveEndFrame],
        [startPos.x, endPos.x],
        { extrapolateRight: 'clamp' }
    );

    const y = interpolate(
        frame,
        [0, moveEndFrame],
        [startPos.y, endPos.y],
        { extrapolateRight: 'clamp' }
    );

    // Click Animation
    let scale = 1;
    if (clickAtFrame && frame >= clickAtFrame) {
        const clickProgress = spring({
            frame: frame - clickAtFrame,
            fps,
            config: { damping: 10, stiffness: 200 },
            durationInFrames: 10,
        });

        scale = interpolate(clickProgress, [0, 0.5, 1], [1, 0.8, 1]);
    }

    return (
        <div
            style={{
                position: 'absolute',
                left: 0,
                top: 0,
                transform: `translate(${x}px, ${y}px) scale(${scale})`,
                zIndex: 1000,
                pointerEvents: 'none',
            }}
        >
            <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}
            >
                <path
                    d="M7 2L29 12L17.5 15.5L14 27L7 2Z"
                    fill="black"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinejoin="round"
                />
            </svg>
        </div>
    );
};
