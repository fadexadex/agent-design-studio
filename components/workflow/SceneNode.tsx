import React, { useState } from 'react';
import { NodeProps, Node as FlowNode } from '@xyflow/react';
import { Clock, ChevronDown, ChevronUp, Type, Trash2 } from 'lucide-react';
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
    onDelete?: (id: string) => void;
    // Preserve backend SceneDescription fields for sync
    sceneNumber?: number;
    frameRange?: { start: number; end: number };
    keyElements?: string[];
    // Additional scene details
    visualStyle?: string;
    energyLevel?: string;
    textOverlay?: string[];
    cameraMovement?: string;
};

export const SceneNode: React.FC<NodeProps<FlowNode<SceneNodeData>>> = ({ data, selected }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (showDeleteConfirm) {
            data.onDelete?.(data.id);
            setShowDeleteConfirm(false);
        } else {
            setShowDeleteConfirm(true);
            // Auto-hide confirmation after 3 seconds
            setTimeout(() => setShowDeleteConfirm(false), 3000);
        }
    };

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
                    <div className="flex items-center gap-1">
                        {/* Delete button */}
                        {data.onDelete && (
                            <button
                                onClick={handleDelete}
                                className={`p-1 rounded transition-colors ${
                                    showDeleteConfirm 
                                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                                        : 'text-zinc-600 hover:text-red-400 hover:bg-zinc-800/50'
                                }`}
                                title={showDeleteConfirm ? 'Click again to confirm delete' : 'Delete scene'}
                            >
                                <Trash2 size={14} />
                            </button>
                        )}
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="text-zinc-600 hover:text-zinc-300 transition-colors p-1 rounded hover:bg-zinc-800/50"
                        >
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                    </div>
                </div>
                {showDeleteConfirm && (
                    <div className="mt-1 text-[10px] text-red-400">
                        Click trash again to delete
                    </div>
                )}
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

            {/* Text Overlay Preview */}
            {isExpanded && data.textOverlay && data.textOverlay.length > 0 && (
                <NodeFooter>
                    <div className="space-y-1">
                        <div className="flex items-center gap-1 text-[10px] text-zinc-500 uppercase tracking-wide">
                            <Type size={10} />
                            Text Overlay
                        </div>
                        <div className="space-y-0.5">
                            {data.textOverlay.map((text, i) => (
                                <p
                                    key={i}
                                    className="text-[11px] text-zinc-300 italic bg-zinc-800/50 rounded px-2 py-1 border-l-2 border-purple-500/50"
                                >
                                    "{text}"
                                </p>
                            ))}
                        </div>
                    </div>
                </NodeFooter>
            )}
        </Node>
    );
};
