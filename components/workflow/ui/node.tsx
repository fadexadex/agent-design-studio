import React from 'react';
import { Handle, Position } from '@xyflow/react';

// Types
interface NodeProps {
    handles?: { source?: boolean; target?: boolean };
    children: React.ReactNode;
    className?: string;
    selected?: boolean;
}

interface NodeSectionProps {
    children: React.ReactNode;
    className?: string;
}

/**
 * Root Node container with optional left/right handles.
 * Renders children in a vertically divided card layout.
 */
export const Node: React.FC<NodeProps> = ({ handles, children, className = '', selected }) => (
    <div
        className={`
            relative group min-w-[280px] max-w-[360px] bg-zinc-900/95 rounded-lg border transition-all duration-200
            ${selected
                ? 'border-blue-500/50 shadow-[0_0_24px_rgba(59,130,246,0.12)]'
                : 'border-zinc-700/40 hover:border-zinc-600/60'
            }
            ${className}
        `}
    >
        {handles?.target && (
            <Handle
                type="target"
                position={Position.Left}
                className="w-2.5! h-2.5! bg-blue-500! border-2! border-zinc-900! -left-[6px]!"
            />
        )}

        <div className="flex flex-col divide-y divide-zinc-800/60">
            {children}
        </div>

        {handles?.source && (
            <Handle
                type="source"
                position={Position.Right}
                className="w-2.5! h-2.5! bg-blue-500! border-2! border-zinc-900! -right-[6px]!"
            />
        )}
    </div>
);

/** Header section of the node */
export const NodeHeader: React.FC<NodeSectionProps> = ({ children, className = '' }) => (
    <div className={`px-4 py-3 ${className}`}>
        {children}
    </div>
);

/** Bold title text */
export const NodeTitle: React.FC<NodeSectionProps> = ({ children, className = '' }) => (
    <div className={`text-sm font-bold text-zinc-100 leading-tight ${className}`}>
        {children}
    </div>
);

/** Muted description text below the title */
export const NodeDescription: React.FC<NodeSectionProps> = ({ children, className = '' }) => (
    <div className={`text-[11px] text-zinc-500 mt-0.5 leading-snug ${className}`}>
        {children}
    </div>
);

/** Main content area */
export const NodeContent: React.FC<NodeSectionProps> = ({ children, className = '' }) => (
    <div className={`px-4 py-2.5 text-xs text-zinc-400 ${className}`}>
        {children}
    </div>
);

/** Footer section */
export const NodeFooter: React.FC<NodeSectionProps> = ({ children, className = '' }) => (
    <div className={`px-4 py-2.5 text-xs text-zinc-500 ${className}`}>
        {children}
    </div>
);
