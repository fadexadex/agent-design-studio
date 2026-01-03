import React from 'react';
import { Play, Pause, Code, Monitor, Layers } from 'lucide-react';
import { SceneNodeData } from './SceneNode';

interface LivePreviewProps {
    videoUrl?: string;
    currentCode: string;
    scenes: SceneNodeData[];
    activeSceneId?: string;
    onSceneSelect: (id: string) => void;
}

export const LivePreview: React.FC<LivePreviewProps> = ({
    videoUrl,
    currentCode,
    scenes,
    activeSceneId,
    onSceneSelect
}) => {
    const [activeTab, setActiveTab] = React.useState<'preview' | 'code'>('preview');

    return (
        <div className="flex flex-col h-full bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800">

            {/* Top Bar / Scene Selector */}
            <div className="h-14 border-b border-zinc-800 bg-zinc-900/50 flex items-center px-4 gap-4 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest mr-4 shrink-0">
                    <Layers size={14} /> Scenes
                </div>

                {scenes.map((scene, idx) => (
                    <button
                        key={scene.id}
                        onClick={() => onSceneSelect(scene.id)}
                        className={`
              flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all
              ${activeSceneId === scene.id
                                ? 'bg-white text-black ring-2 ring-purple-500/50'
                                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                            }
            `}
                    >
                        <span className={`w-4 h-4 flex items-center justify-center rounded-full text-[9px] font-bold ${activeSceneId === scene.id ? 'bg-black text-white' : 'bg-zinc-700 text-zinc-300'}`}>
                            {idx + 1}
                        </span>
                        {scene.title}
                    </button>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-h-0 flex flex-col md:flex-row">

                {/* Main View (Video or Code) */}
                <div className="flex-1 flex flex-col min-h-0 relative">

                    {/* Tabs */}
                    <div className="absolute top-4 right-4 z-20 flex bg-zinc-900/90 backdrop-blur rounded-lg border border-zinc-800 p-1">
                        <button
                            onClick={() => setActiveTab('preview')}
                            className={`p-2 rounded-md transition-colors ${activeTab === 'preview' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                            title="Preview"
                        >
                            <Monitor size={16} />
                        </button>
                        <button
                            onClick={() => setActiveTab('code')}
                            className={`p-2 rounded-md transition-colors ${activeTab === 'code' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                            title="Code"
                        >
                            <Code size={16} />
                        </button>
                    </div>

                    <div className="flex-1 bg-black flex items-center justify-center overflow-hidden">
                        {activeTab === 'preview' ? (
                            videoUrl ? (
                                <video
                                    src={videoUrl}
                                    controls
                                    className="max-h-full max-w-full w-auto h-auto object-contain"
                                />
                            ) : (
                                <div className="flex flex-col items-center gap-4 text-zinc-600">
                                    <div className="w-16 h-16 rounded-full border-2 border-zinc-800 border-t-zinc-600 animate-spin" />
                                    <p className="font-mono text-sm">Rendering preview...</p>
                                </div>
                            )
                        ) : (
                            <div className="w-full h-full overflow-auto p-4 bg-[#1e1e1e]">
                                <pre className="font-mono text-sm text-zinc-300 leading-relaxed">
                                    <code>{currentCode}</code>
                                </pre>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};
