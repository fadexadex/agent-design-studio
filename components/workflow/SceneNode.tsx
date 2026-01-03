import React, { useState } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { Clock, ChevronDown, ChevronUp, GripVertical } from 'lucide-react';

export type SceneNodeData = {
    id: string;
    title: string;
    description: string;
    duration: number; // in seconds
    index: number;
    onChange?: (id: string, data: Partial<SceneNodeData>) => void;
};

// We extend NodeProps to include our specific data type if needed, 
// but generic NodeProps is usually enough if we typecast data.
export const SceneNode: React.FC<NodeProps<Node<SceneNodeData>>> = ({ data, selected }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div
            className={`
        relative group w-80 bg-zinc-900/90 backdrop-blur-md rounded-xl border transition-all duration-300
        ${selected
                    ? 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                    : 'border-zinc-700 hover:border-zinc-500'
                }
      `}
        >
            {/* Input Handle */}
            <Handle
                type="target"
                position={Position.Top}
                className="!bg-zinc-500 !w-3 !h-3 !-top-1.5 transition-colors group-hover:!bg-purple-400"
            />

            {/* Header */}
            <div className="flex items-center gap-3 p-3 border-b border-zinc-800/50 bg-white/5 rounded-t-xl">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-zinc-800 text-xs font-bold text-zinc-400 border border-zinc-700">
                    {data.index + 1}
                </div>

                <div className="flex-1 min-w-0">
                    <input
                        className="w-full bg-transparent text-sm font-semibold text-white focus:outline-none focus:ring-1 focus:ring-purple-500 rounded px-1 -ml-1 truncate"
                        defaultValue={data.title}
                        onBlur={(e) => data.onChange?.(data.id, { title: e.target.value })}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                (e.target as HTMLInputElement).blur();
                            }
                        }}
                    />
                </div>

                <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-500 bg-black/40 px-2 py-1 rounded-full">
                    <Clock size={10} />
                    <span>{data.duration}s</span>
                </div>

                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-zinc-500 hover:text-white transition-colors"
                >
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
            </div>

            {/* Body */}
            {isExpanded && (
                <div className="p-3 text-xs text-zinc-400 leading-relaxed font-mono">
                    <textarea
                        className="w-full bg-transparent text-xs text-zinc-400 leading-relaxed font-mono resize-none focus:outline-none focus:text-zinc-300 focus:bg-white/5 rounded p-1 -m-1"
                        defaultValue={data.description}
                        rows={3}
                        onBlur={(e) => data.onChange?.(data.id, { description: e.target.value })}
                        onKeyDown={(e) => {
                            // Allow line breaks, so don't blur on Enter
                        }}
                    />
                </div>
            )}

            {/* Drag Handle Indicator (Visual only, usually whole node is draggable) */}
            <div className="absolute left-1 top-1/2 -translate-y-1/2 text-zinc-800 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical size={12} />
            </div>

            {/* Output Handle */}
            <Handle
                type="source"
                position={Position.Bottom}
                className="!bg-zinc-500 !w-3 !h-3 !-bottom-1.5 transition-colors group-hover:!bg-purple-400"
            />
        </div>
    );
};
