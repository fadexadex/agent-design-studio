import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { DynamicCursor, CursorVariant } from "./DynamicCursor";

interface Point {
    x: number;
    y: number;
}

export interface CursorPathProps {
    points: Point[]; // Array of keyframe points
    startTime?: number; // Frame to start movement
    duration?: number; // Total duration of movement
    variant?: CursorVariant;
    color?: string;
    label?: string;
    showTrail?: boolean;
    trailLength?: number; // Number of ghost cursors
}

export const CursorPath: React.FC<CursorPathProps> = ({
    points,
    startTime = 0,
    duration = 60,
    variant = "arrow",
    color = "#000000",
    label,
    showTrail = false,
    trailLength = 5,
}) => {
    const frame = useCurrentFrame();
    // const { fps } = useVideoConfig();

    // Simple interpolation between points
    // Logic: Map progress (0-1) to the path segments
    const progress = interpolate(frame - startTime, [0, duration], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.bezier(0.25, 1, 0.5, 1), // Standard cubic-bezier ease
    });

    // Helper to get position at specific progress
    const getPositionAt = (p: number): Point => {
        if (points.length < 2) return points[0] || { x: 0, y: 0 };

        // Scale progress to point indices
        // e.g. 4 points (0,1,2,3) -> 3 segments
        const totalSegments = points.length - 1;
        const scaledP = p * totalSegments;
        const index = Math.floor(scaledP);
        const segmentP = scaledP - index;

        const p1 = points[Math.min(index, totalSegments)];
        const p2 = points[Math.min(index + 1, totalSegments)];

        // Linear interp between points (simplest for now, spline is harder without library)
        return {
            x: p1.x + (p2.x - p1.x) * segmentP,
            y: p1.y + (p2.y - p1.y) * segmentP,
        };
    };

    const currentPos = getPositionAt(progress);

    // Render Ghosts
    const ghosts = [];
    if (showTrail) {
        for (let i = 1; i <= trailLength; i++) {
            // Calculate ghost position slightly behind in time
            // 1 frame delay approx?
            // Actually simply subtract small amount from progress
            const lag = 0.02 * i; // Lag in progress units
            const ghostProgress = Math.max(0, progress - lag);

            // Don't show ghost if it hasn't started or finished completely
            if (ghostProgress > 0 && ghostProgress < 1) {
                const ghostPos = getPositionAt(ghostProgress);
                ghosts.push(
                    <DynamicCursor
                        key={`ghost-${i}`}
                        x={ghostPos.x}
                        y={ghostPos.y}
                        variant={variant}
                        color={color}
                        opacity={0.3 - (i * 0.05)} // Fade out
                        scale={1}
                    // No label for ghosts
                    />
                );
            }
        }
    }

    return (
        <>
            {ghosts}
            <DynamicCursor
                x={currentPos.x}
                y={currentPos.y}
                variant={variant}
                color={color}
                label={label}
            // Could auto-trigger click at end of path?
            />
        </>
    );
};
