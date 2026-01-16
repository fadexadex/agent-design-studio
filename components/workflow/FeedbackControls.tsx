import React, { useState, useEffect } from 'react';
import { Send, Sparkles, CheckCircle2, Loader2, MessageSquare } from 'lucide-react';

interface FeedbackControlsProps {
    status: 'idle' | 'processing' | 'success';
    targetLabel?: string; // e.g. "Scene 1" or "Global"
    onSubmit: (feedback: string) => void;
    onApprove?: () => void;
    compact?: boolean; // New prop for smaller scene-specific mode
}

const QUICK_ACTIONS = [
    "Make it faster",
    "More dramatic",
    "Fix transition",
    "Change colors",
    "Add more particles"
];

export const FeedbackControls: React.FC<FeedbackControlsProps> = ({
    status = 'idle',
    targetLabel = 'Global',
    onSubmit,
    onApprove,
    compact = false
}) => {
    const [feedback, setFeedback] = useState('');

    const handleSubmit = () => {
        if (!feedback.trim()) return;
        onSubmit(feedback);
        setFeedback('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className={compact ? "w-full max-w-lg" : "w-full max-w-3xl mx-auto"}>
            {/* Floating Island Container */}
            <div className={`bg-zinc-900/80 backdrop-blur-xl border border-zinc-700/50 shadow-2xl ring-1 ring-black/20 ${compact ? 'rounded-xl p-3' : 'rounded-2xl p-4'}`}>

                {/* Header / Context */}
                <div className={`flex items-center justify-between px-1 ${compact ? 'mb-2' : 'mb-3'}`}>
                    <div className={`flex items-center gap-2 font-bold text-zinc-400 uppercase tracking-wider ${compact ? 'text-[10px]' : 'text-xs'}`}>
                        <MessageSquare size={compact ? 10 : 12} className="text-purple-400" />
                        <span>Refining: <span className="text-white">{targetLabel}</span></span>
                    </div>

                    {status === 'processing' && (
                        <div className={`flex items-center gap-2 text-purple-400 animate-pulse ${compact ? 'text-[10px]' : 'text-xs'}`}>
                            <Loader2 size={compact ? 10 : 12} className="animate-spin" />
                            {!compact && 'Processing...'}
                        </div>
                    )}
                    {status === 'success' && (
                        <div className={`flex items-center gap-2 text-green-400 animate-in fade-in slide-in-from-bottom-2 ${compact ? 'text-[10px]' : 'text-xs'}`}>
                            <CheckCircle2 size={compact ? 10 : 12} />
                            {!compact && 'Applied!'}
                        </div>
                    )}
                </div>

                {/* Text Area */}
                <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                    <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={compact ? "Edit this scene..." : "Describe what you want to change..."}
                        className={`relative w-full bg-zinc-950/50 text-white placeholder:text-zinc-600 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-1 focus:ring-purple-500/50 border border-zinc-800 transition-all font-sans ${compact ? 'text-sm min-h-[80px] max-h-[120px]' : 'text-sm min-h-[60px] max-h-[120px]'}`}
                        disabled={status === 'processing'}
                    />

                    <button
                        onClick={handleSubmit}
                        disabled={!feedback.trim() || status === 'processing'}
                        className={`absolute right-3 bottom-3 bg-white text-black rounded-lg hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${compact ? 'p-2' : 'p-2'}`}
                    >
                        {status === 'processing' ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                </div>

                {/* Footer Actions - Hidden in compact mode */}
                {!compact && (
                    <div className="flex items-center justify-between mt-3 px-1">
                        <div className="flex flex-wrap gap-2">
                            <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest pt-1 mr-1 hidden sm:block">Quick Fixes:</div>
                            {QUICK_ACTIONS.map(action => (
                                <button
                                    key={action}
                                    onClick={() => setFeedback(action)}
                                    className="px-2 py-1 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 rounded-full text-[10px] text-zinc-400 hover:text-white transition-colors flex items-center gap-1"
                                >
                                    <Sparkles size={8} />
                                    {action}
                                </button>
                            ))}
                        </div>

                        {onApprove && (
                            <button
                                onClick={onApprove}
                                className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-green-500 transition-colors shadow-lg shadow-green-900/20 flex items-center gap-2"
                            >
                                <CheckCircle2 size={12} />
                                Continue
                            </button>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};
