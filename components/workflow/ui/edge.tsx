import React from 'react';
import { BaseEdge, getBezierPath, type EdgeProps } from '@xyflow/react';

/**
 * Animated edge with a flowing dot along the bezier path.
 * Used for primary/active connections between nodes.
 */
const Animated: React.FC<EdgeProps> = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style,
    markerEnd,
}) => {
    const [edgePath] = getBezierPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourcePosition,
        targetPosition,
    });

    return (
        <>
            <BaseEdge
                id={id}
                path={edgePath}
                markerEnd={markerEnd}
                style={{
                    stroke: '#3b82f6',
                    strokeWidth: 2,
                    ...style,
                }}
            />
            <circle r="3" fill="#60a5fa" opacity="0.8">
                <animateMotion dur="3s" repeatCount="indefinite" path={edgePath} />
            </circle>
        </>
    );
};

/**
 * Temporary/dashed edge for secondary or conditional connections.
 */
const Temporary: React.FC<EdgeProps> = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style,
    markerEnd,
}) => {
    const [edgePath] = getBezierPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourcePosition,
        targetPosition,
    });

    return (
        <BaseEdge
            id={id}
            path={edgePath}
            markerEnd={markerEnd}
            style={{
                stroke: '#52525b',
                strokeWidth: 1.5,
                strokeDasharray: '6 4',
                ...style,
            }}
        />
    );
};

export const Edge = {
    Animated,
    Temporary,
};
