import React, { useState } from 'react';
import { NodeProps, Node as FlowNode } from '@xyflow/react';
import { Clock, ChevronDown, ChevronUp } from 'lucide-react';
import {
    Node,
    NodeHeader,
    NodeTitle,
    NodeDescription,
    NodeContent,
    NodeFooter,
} from './ui/node';

export type SceneNodeData = {
    id: string;
    title: string;
    description: string;
    duration: number; // in seconds
    index: number;
    onChange?: (id: string, data: Partial<SceneNodeData>) => void;
    // Preserve backend SceneDescription fields for sync
    sceneNumber?: number;
    frameRange?: { start: number; end: number };
    keyElements?: string[];
};

export const SceneNode: React.FC<NodeProps<FlowNode<SceneNodeData>>> = ({ data, selected }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <Node
            handles={{ source: true, target: true }}
            selected={selected}
        >
            <NodeHeader>
                <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <NodeTitle>
                            <input
                                className="w-full bg-transparent font-bold text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500/40 rounded px-1 -ml-1 truncate"
                                defaultValue={data.title}
                                onBlur={(e) => data.onChange?.(data.id, { title: e.target.value })}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                                }}
                            />
                        </NodeTitle>
                        <NodeDescription>
                            <span className="flex items-center gap-1.5">
                                <Clock size={10} className="text-zinc-600" />
                                Scene {data.index + 1} &middot; {data.duration}s
                            </span>
                        </NodeDescription>
                    </div>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-zinc-600 hover:text-zinc-300 transition-colors p-1 rounded hover:bg-zinc-800/50"
                    >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                </div>
            </NodeHeader>

            <NodeContent>
                {isExpanded ? (
                    <textarea
                        className="w-full bg-transparent text-xs text-zinc-400 leading-relaxed resize-none focus:outline-none focus:text-zinc-300 focus:bg-white/5 rounded p-1 -m-1 min-h-[48px]"
                        defaultValue={data.description}
                        rows={3}
                        onBlur={(e) => data.onChange?.(data.id, { description: e.target.value })}
                    />
                ) : (
                    <p className="text-xs text-zinc-500 truncate">{data.description}</p>
                )}
            </NodeContent>

            {isExpanded && data.keyElements && data.keyElements.length > 0 && (
                <NodeFooter>
                    <div className="flex flex-wrap gap-1">
                        {data.keyElements.map((el, i) => (
                            <span
                                key={i}
                                className="px-1.5 py-0.5 rounded bg-zinc-800/80 text-[10px] text-zinc-500 border border-zinc-700/30"
                            >
                                {el}
                            </span>
                        ))}
                    </div>
                </NodeFooter>
            )}
        </Node>
    );
};
