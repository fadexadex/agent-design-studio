import React from 'react';
import {
    ReactFlow,
    Background,
    BackgroundVariant,
    Controls,
    type Node,
    type Edge,
    type NodeTypes,
    type EdgeTypes,
    type OnNodesChange,
    type OnEdgesChange,
    type OnConnect,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface CanvasProps {
    nodes: Node[];
    edges: Edge[];
    nodeTypes: NodeTypes;
    edgeTypes?: EdgeTypes;
    fitView?: boolean;
    onNodesChange?: OnNodesChange;
    onEdgesChange?: OnEdgesChange;
    onConnect?: OnConnect;
    onSelectionChange?: (params: { nodes: Node[]; edges: Edge[] }) => void;
    children?: React.ReactNode;
}

/**
 * Canvas wraps ReactFlow with a consistent dark theme.
 * Must be rendered inside a ReactFlowProvider context.
 */
export const Canvas: React.FC<CanvasProps> = ({
    nodes,
    edges,
    nodeTypes,
    edgeTypes,
    fitView = true,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onSelectionChange,
    children,
}) => (
    <div className="w-full h-full min-h-[500px] bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800/40">
        <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onSelectionChange={onSelectionChange}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView={fitView}
            fitViewOptions={{ padding: 0.3, maxZoom: 1 }}
            proOptions={{ hideAttribution: true }}
            defaultEdgeOptions={{ type: 'animated' }}
        >
            <Background
                variant={BackgroundVariant.Dots}
                gap={24}
                size={1}
                color="#27272a"
            />
            <Controls
                className="bg-zinc-900! border-zinc-700/40! rounded-lg! shadow-xl! [&>button]:bg-zinc-800! [&>button]:border-zinc-700/40! [&>button]:text-zinc-400! [&>button:hover]:bg-zinc-700! [&>button]:rounded-md!"
                showInteractive={false}
            />
            {children}
        </ReactFlow>
    </div>
);
