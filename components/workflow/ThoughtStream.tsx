import React, { useRef, useEffect } from 'react';
import { AgentThought } from '../../types';
import { Brain, Zap, Eye, Terminal } from 'lucide-react';

interface ThoughtStreamProps {
    thoughts: AgentThought[];
    className?: string;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
}

const thoughtTypeConfig = {
    reason: { icon: Brain, color: 'text-purple-400', label: 'REASON' },
    act: { icon: Zap, color: 'text-blue-400', label: 'ACT' },
    observe: { icon: Eye, color: 'text-green-400', label: 'OBSERVE' },
};

export const ThoughtStream: React.FC<ThoughtStreamProps> = ({
    thoughts,
    className = '',
    isCollapsed = false,
    onToggleCollapse
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [thoughts]);

    if (isCollapsed) {
        return (
            <button
                onClick={onToggleCollapse}
                className={`h-full w-12 border-r border-zinc-800 bg-zinc-950 flex flex-col items-center py-4 gap-4 hover:bg-zinc-900 transition-colors ${className}`}
            >
                <Terminal size={18} className="text-zinc-500" />
                <div className="writing-vertical-rl text-xs font-mono text-zinc-600 font-bold uppercase tracking-widest rotate-180">
                    Agent Stream
                </div>
            </button>
        );
    }

    return (
        <div className={`flex flex-col bg-zinc-950 border-r border-zinc-800 h-full ${className}`}>
            <div className="flex items-center justify-between p-3 border-b border-zinc-800 bg-zinc-900/50">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    <Terminal size={14} className="text-zinc-500" />
                    <span>Agent Trace</span>
                </div>
                {onToggleCollapse && (
                    <button onClick={onToggleCollapse} className="text-zinc-600 hover:text-zinc-300">
                        <span className="sr-only">Collapse</span>
                        ←
                    </button>
                )}
            </div>

            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-3 space-y-3 font-mono text-xs custom-scrollbar"
            >
                {thoughts.length === 0 && (
                    <div className="text-zinc-700 text-center mt-10 italic">Warming up neural pathways...</div>
                )}

                {thoughts.map((thought, i) => {
                    const Config = thoughtTypeConfig[thought.type] || thoughtTypeConfig.observe;
                    const Icon = Config.icon;

                    return (
                        <div key={i} className="animate-in slide-in-from-left-2 fade-in duration-300">
                            <div className="flex items-start gap-2 opacity-80 hover:opacity-100 transition-opacity">
                                <Icon size={12} className={`shrink-0 mt-0.5 ${Config.color}`} />
                                <div className="flex-1 break-words leading-relaxed text-zinc-300">
                                    <span className={`${Config.color} font-bold mr-1`}>[{Config.label}]</span>
                                    {thought.content}
                                </div>
                            </div>
                            {i < thoughts.length - 1 && <div className="h-2 border-l border-zinc-800 ml-1.5 my-0.5" />}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
