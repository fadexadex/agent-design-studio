import React, { useState } from 'react';
import { NodeProps, Node as FlowNode } from '@xyflow/react';
import { Clock, ChevronDown, ChevronUp, Sparkles, Zap, Camera, Type } from 'lucide-react';
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
    // Additional scene details
    visualStyle?: string;
    energyLevel?: 'high' | 'medium' | 'low';
    textOverlay?: string[];
    cameraMovement?: string;
};

export const SceneNode: React.FC<NodeProps<FlowNode<SceneNodeData>>> = ({ data, selected }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    // Energy level color mapping
    const energyColor = {
        high: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
        medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
        low: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    };

    // Visual style display name
    const styleDisplayName = data.visualStyle?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

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
                            <span className="flex items-center gap-2 flex-wrap">
                                <span className="flex items-center gap-1">
                                    <Clock size={10} className="text-zinc-600" />
                                    Scene {data.index + 1} &middot; {data.duration}s
                                </span>
                                {data.energyLevel && (
                                    <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] border ${energyColor[data.energyLevel]}`}>
                                        <Zap size={8} />
                                        {data.energyLevel}
                                    </span>
                                )}
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
                    <div className="space-y-2">
                        <textarea
                            className="w-full bg-transparent text-xs text-zinc-400 leading-relaxed resize-none focus:outline-none focus:text-zinc-300 focus:bg-white/5 rounded p-1 -m-1 min-h-[48px]"
                            defaultValue={data.description}
                            rows={3}
                            onBlur={(e) => data.onChange?.(data.id, { description: e.target.value })}
                        />
                        
                        {/* Visual style and camera movement */}
                        {(data.visualStyle || data.cameraMovement) && (
                            <div className="flex items-center gap-2 flex-wrap pt-1">
                                {data.visualStyle && (
                                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/10 text-[9px] text-purple-400 border border-purple-500/20">
                                        <Sparkles size={8} />
                                        {styleDisplayName}
                                    </span>
                                )}
                                {data.cameraMovement && (
                                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-500/10 text-[9px] text-cyan-400 border border-cyan-500/20">
                                        <Camera size={8} />
                                        {data.cameraMovement}
                                    </span>
                                )}
                            </div>
                        )}
                        
                        {/* Text overlays */}
                        {data.textOverlay && data.textOverlay.length > 0 && (
                            <div className="pt-1">
                                <div className="flex items-center gap-1 text-[9px] text-zinc-500 mb-1">
                                    <Type size={8} />
                                    <span>Text Overlays</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {data.textOverlay.map((text, i) => (
                                        <span
                                            key={i}
                                            className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-[9px] text-emerald-400 border border-emerald-500/20"
                                        >
                                            "{text}"
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
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
