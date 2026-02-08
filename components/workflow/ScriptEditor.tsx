import React, { useCallback, useEffect } from 'react';
import {
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge as FlowEdge,
    Node as FlowNode,
    ReactFlowProvider,
    Panel,
    useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { SceneNode, SceneNodeData } from './SceneNode';
import { Canvas } from './ui/canvas';
import { Edge as CustomEdge } from './ui/edge';
import { Plus, LayoutTemplate } from 'lucide-react';

const nodeTypes = {
    scene: SceneNode,
};

const edgeTypes = {
    animated: CustomEdge.Animated,
    temporary: CustomEdge.Temporary,
};

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 320;
const nodeHeight = 180;

const getLayoutedElements = (nodes: FlowNode<SceneNodeData>[], edges: FlowEdge[], direction = 'LR') => {
    const isHorizontal = direction === 'LR';
    dagreGraph.setGraph({ rankdir: direction, nodesep: 60, ranksep: 120 });

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
            position: {
                x: nodeWithPosition.x - nodeWidth / 2,
                y: nodeWithPosition.y - nodeHeight / 2,
            },
        } as FlowNode<SceneNodeData>;
    });

    return { nodes: layoutedNodes, edges };
};

interface ScriptEditorProps {
    scenes: SceneNodeData[];
    onScenesChange?: (scenes: SceneNodeData[]) => void;
    onAddScene?: () => void;
    onSceneSelect?: (sceneId: string | null) => void;
}

const ScriptEditorInternal: React.FC<ScriptEditorProps> = ({ scenes, onScenesChange, onAddScene, onSceneSelect }) => {
    const { fitView } = useReactFlow();

    // Add new scene handler
    const handleAddScene = () => {
        if (!onScenesChange) return;

        const newSceneIndex = scenes.length;
        const framesPerScene = 270; // ~9 seconds at 30fps
        const startFrame = newSceneIndex * framesPerScene;

        const newScene: SceneNodeData = {
            id: `scene-${Date.now()}`,
            title: `Scene ${newSceneIndex + 1}`,
            description: 'New scene description. Click to edit.',
            duration: 9,
            index: newSceneIndex,
            sceneNumber: newSceneIndex + 1,
            frameRange: { start: startFrame, end: startFrame + framesPerScene },
            keyElements: ['animated element', 'brand colors']
        };

        const updatedScenes = [...scenes, newScene];
        onScenesChange(updatedScenes);

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

    // Transform scenes to Nodes
    const createNodes = (currentScenes: SceneNodeData[]): FlowNode<SceneNodeData>[] => currentScenes.map((scene) => ({
        id: scene.id,
        type: 'scene',
        data: {
            ...scene,
            onChange: onNodeDataChange
        },
        position: { x: 0, y: 0 } // Layouted by dagre
    }));

    // Transform scenes to Edges with animated type
    const createEdges = (currentScenes: SceneNodeData[]): FlowEdge[] => currentScenes.slice(0, -1).map((scene, idx) => ({
        id: `e${scene.id}-${currentScenes[idx + 1].id}`,
        source: scene.id,
        target: currentScenes[idx + 1].id,
        type: 'animated',
    }));

    const [nodes, setNodes, onNodesChangeState] = useNodesState([]);
    const [edges, setEdges, onEdgesChangeState] = useEdgesState([]);

    // Sync props to state
    useEffect(() => {
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
        (params: Connection) => setEdges((eds) => addEdge({ ...params, type: 'animated' }, eds)),
        [setEdges],
    );

    const onLayout = useCallback(
        (direction = 'LR') => {
            const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
                nodes,
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

    // Auto-layout on initial load
    useEffect(() => {
        if (nodes.length > 0 && nodes[0].position.x === 0 && nodes[0].position.y === 0) {
            onLayout();
        }
    }, [nodes.length]);

    // Handle node selection to notify parent
    const onSelectionChange = useCallback(({ nodes: selectedNodes }: { nodes: FlowNode<SceneNodeData>[] }) => {
        if (onSceneSelect) {
            if (selectedNodes.length > 0) {
                onSceneSelect(selectedNodes[0].id);
            } else {
                onSceneSelect(null);
            }
        }
    }, [onSceneSelect]);

    return (
        <Canvas
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChangeState}
            onEdgesChange={onEdgesChangeState}
            onConnect={onConnect}
            onSelectionChange={onSelectionChange}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
        >
            <Panel position="top-right" className="flex gap-2">
                <button
                    onClick={() => onLayout('LR')}
                    className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-md border border-zinc-700/50 transition-colors backdrop-blur-sm"
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
        </Canvas>
    );
};

export const ScriptEditor: React.FC<ScriptEditorProps> = (props) => {
    return (
        <ReactFlowProvider>
            <ScriptEditorInternal {...props} />
        </ReactFlowProvider>
    );
};
