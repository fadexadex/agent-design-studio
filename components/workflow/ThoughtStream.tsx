import React, { useRef, useEffect, useState } from 'react';
import { AgentThought } from '../../types';
import { Brain, Zap, Eye, Terminal, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

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

/**
 * ThoughtItem displays a single thought with optional model thinking summary.
 */
const ThoughtItem: React.FC<{ thought: AgentThought; index: number; isLast: boolean }> = ({
    thought,
    index,
    isLast
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const Config = thoughtTypeConfig[thought.type] || thoughtTypeConfig.observe;
    const Icon = Config.icon;
    const hasModelThinking = Boolean(thought.modelThinking);

    return (
        <div className="animate-in slide-in-from-left-2 fade-in duration-300">
            <div className="flex items-start gap-2 opacity-80 hover:opacity-100 transition-opacity">
                <Icon size={12} className={`shrink-0 mt-0.5 ${Config.color}`} />
                <div className="flex-1 break-words leading-relaxed text-zinc-300">
                    <span className={`${Config.color} font-bold mr-1`}>[{Config.label}]</span>
                    {thought.content}
                </div>
            </div>

            {/* Model Thinking Summary (when available) */}
            {hasModelThinking && (
                <div className="ml-4 mt-2">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-amber-500/80 hover:text-amber-400 transition-colors"
                    >
                        <Sparkles size={10} />
                        <span>Model Thinking</span>
                        {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                    </button>
                    {isExpanded && (
                        <div className="mt-1.5 p-2 rounded-md bg-amber-500/5 border border-amber-500/20 text-amber-200/80 text-[11px] leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
                            {thought.modelThinking}
                        </div>
                    )}
                </div>
            )}

            {!isLast && <div className="h-2 border-l border-zinc-800 ml-1.5 my-0.5" />}
        </div>
    );
};

export const ThoughtStream: React.FC<ThoughtStreamProps> = ({
    thoughts,
    className = '',
    isCollapsed = false,
    onToggleCollapse
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Count thoughts with model thinking
    const thoughtsWithModelThinking = thoughts.filter(t => t.modelThinking).length;

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
                    {thoughtsWithModelThinking > 0 && (
                        <span className="flex items-center gap-1 text-amber-500/70">
                            <Sparkles size={10} />
                            <span className="text-[10px]">{thoughtsWithModelThinking}</span>
                        </span>
                    )}
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

                {thoughts.map((thought, i) => (
                    <ThoughtItem
                        key={i}
                        thought={thought}
                        index={i}
                        isLast={i === thoughts.length - 1}
                    />
                ))}
            </div>
        </div>
    );
};
