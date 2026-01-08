import React, { useCallback, useEffect, useMemo } from 'react';
import {
    ReactFlow,
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge,
    Node,
    ReactFlowProvider,
    Panel,
    useReactFlow,
    BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { SceneNode, SceneNodeData } from './SceneNode';
import { Plus, LayoutTemplate, Save } from 'lucide-react';

const nodeTypes = {
    scene: SceneNode,
};

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 400;
const nodeHeight = 200;

const getLayoutedElements = (nodes: Node<SceneNodeData>[], edges: Edge[], direction = 'TB') => {
    const isHorizontal = direction === 'LR';
    dagreGraph.setGraph({ rankdir: direction });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        return {
            ...node,
            targetPosition: isHorizontal ? 'left' : 'top',
            sourcePosition: isHorizontal ? 'right' : 'bottom',
            // We are shifting the dagre node position (anchor=center center) to the top left
            // so it matches the React Flow node anchor point (top left).
            position: {
                x: nodeWithPosition.x - nodeWidth / 2,
                y: nodeWithPosition.y - nodeHeight / 2,
            },
        } as Node<SceneNodeData>;
    });

    return { nodes: layoutedNodes, edges };
};

interface ScriptEditorProps {
    scenes: SceneNodeData[];
    onScenesChange?: (scenes: SceneNodeData[]) => void;
    onAddScene?: () => void;
}

const ScriptEditorInternal: React.FC<ScriptEditorProps> = ({ scenes, onScenesChange, onAddScene }) => {
    const { fitView } = useReactFlow();

    // Add new scene handler
    const handleAddScene = () => {
        if (!onScenesChange) return;

        const newSceneIndex = scenes.length;
        const newScene: SceneNodeData = {
            id: `scene-${Date.now()}`,
            title: `Scene ${newSceneIndex + 1}`,
            description: 'New scene description. Click to edit.',
            duration: 9, // ~9 seconds per scene for 45s total
            index: newSceneIndex,
        };

        const updatedScenes = [...scenes, newScene];
        onScenesChange(updatedScenes);

        // Trigger re-layout after adding
        window.requestAnimationFrame(() => {
            fitView();
        });
    };

    // Handler for node updates
    const onNodeDataChange = useCallback((id: string, data: Partial<SceneNodeData>) => {
        if (!onScenesChange) return;
        const index = scenes.findIndex(s => s.id === id);
        if (index === -1) return;

        const updatedScenes = [...scenes];
        updatedScenes[index] = { ...updatedScenes[index], ...data };
        onScenesChange(updatedScenes);
    }, [scenes, onScenesChange]);

    // Transform initial scenes to Nodes and Edges
    // We memoize this so we don't recreate it unnecessarily, but we need to update it when scenes change
    const createNodes = (currentScenes: SceneNodeData[]): Node<SceneNodeData>[] => currentScenes.map((scene) => ({
        id: scene.id,
        type: 'scene',
        data: {
            ...scene,
            onChange: onNodeDataChange
        },
        position: { x: 0, y: 0 } // Layouted by dagre
    }));

    const createEdges = (currentScenes: SceneNodeData[]): Edge[] => currentScenes.slice(0, -1).map((scene, idx) => ({
        id: `e${scene.id}-${currentScenes[idx + 1].id}`,
        source: scene.id,
        target: currentScenes[idx + 1].id,
        animated: true,
        style: { stroke: '#64748b' },
        type: 'smoothstep',
    }));

    const [nodes, setNodes, onNodesChangeState] = useNodesState([]);
    const [edges, setEdges, onEdgesChangeState] = useEdgesState([]);

    // Sync props to state
    useEffect(() => {
        // Only update if we have scenes and they are different enough?
        // For now, we trust the parent to not spam updates, or we rely on React diffing.
        // But re-creating nodes resets layout positions if we aren't careful.
        // We really only want to update DATA if IDs match.

        // Simple approach: Re-create all. But we lose positions.
        // Better: Update existing nodes' data.

        setNodes((nds) => {
            const newNodes = createNodes(scenes);

            if (nds.length === 0) return newNodes;

            // Merge positions from existing nodes
            return newNodes.map(n => {
                const existing = nds.find(fn => fn.id === n.id);
                if (existing) {
                    return { ...n, position: existing.position };
                }
                return n;
            });
        });

        setEdges(createEdges(scenes));
    }, [scenes, onNodeDataChange]);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#64748b' } }, eds)),
        [setEdges],
    );

    const onLayout = useCallback(
        (direction = 'TB') => {
            // We use the current nodes from state
            const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
                nodes, // Use current nodes
                edges,
                direction,
            );

            setNodes([...layoutedNodes]);
            setEdges([...layoutedEdges]);

            window.requestAnimationFrame(() => {
                fitView();
            });
        },
        [nodes, edges, fitView, setNodes, setEdges]
    );

    // Auto-layout on initial load (when nodes become populated)
    useEffect(() => {
        if (nodes.length > 0 && nodes[0].position.x === 0 && nodes[0].position.y === 0) {
            onLayout();
        }
    }, [nodes.length]); // Dependency on length so it runs when nodes are added

    return (
        <div className="w-full h-full min-h-[500px] bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChangeState}
                onEdgesChange={onEdgesChangeState}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
            >
                <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#333" />
                <Controls className="!bg-zinc-800 !border-zinc-700 !text-zinc-400 [&>button]:!fill-zinc-400" />

                <Panel position="top-right" className="flex gap-2">
                    <button
                        onClick={() => onLayout('TB')}
                        className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-md border border-zinc-700 transition-colors"
                    >
                        <LayoutTemplate size={14} />
                        Auto Layout
                    </button>

                    <button
                        onClick={handleAddScene}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-md transition-colors shadow-lg shadow-blue-900/20"
                    >
                        <Plus size={14} />
                        Add Scene
                    </button>
                </Panel>
            </ReactFlow>
        </div>
    );
};

export const ScriptEditor: React.FC<ScriptEditorProps> = (props) => {
    return (
        <ReactFlowProvider>
            <ScriptEditorInternal {...props} />
        </ReactFlowProvider>
    );
};
