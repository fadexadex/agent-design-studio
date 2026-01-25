/**
 * PromptPanel
 * 
 * Input panel for sending edit prompts to the AI.
 */

import React, { useState, useRef, useEffect } from 'react';
import { EditorScene } from '../../services/editorService';
import { Send, Loader2, Sparkles, Info } from 'lucide-react';

interface PromptPanelProps {
  selectedScenes: EditorScene[];
  onSubmit: (prompt: string) => void;
  isProcessing: boolean;
  thinkingMessage: string | null;
  thinkingDetail: string | null;
}

// Suggested prompts for inspiration
const SUGGESTED_PROMPTS = [
  'Make the animation faster',
  'Add a subtle glow effect',
  'Make the colors more vibrant',
  'Add a smooth fade transition',
  'Make the text larger',
  'Add some particle effects',
  'Make it more dynamic',
  'Simplify the motion',
];

export const PromptPanel: React.FC<PromptPanelProps> = ({
  selectedScenes,
  onSubmit,
  isProcessing,
  thinkingMessage,
  thinkingDetail,
}) => {
  const [prompt, setPrompt] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [prompt]);

  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isProcessing || selectedScenes.length === 0) return;
    onSubmit(prompt.trim());
    setPrompt('');
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion);
    textareaRef.current?.focus();
  };

  // Handle keyboard shortcut
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e);
    }
  };

  const hasSelection = selectedScenes.length > 0;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <h3 className="font-heading font-bold text-lg flex items-center gap-2">
          <Sparkles size={18} className="text-purple-400" />
          Edit with AI
        </h3>
        <p className="text-xs text-zinc-500 mt-1">
          {hasSelection
            ? `Editing ${selectedScenes.length} scene${selectedScenes.length > 1 ? 's' : ''}`
            : 'Select scene(s) to edit'}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Selected scenes indicator */}
        {hasSelection && (
          <div className="flex flex-wrap gap-2">
            {selectedScenes.map((scene) => (
              <span
                key={scene.id}
                className="px-2 py-1 text-xs bg-purple-500/20 text-purple-300 rounded-full"
              >
                Scene {scene.sceneNumber}
              </span>
            ))}
          </div>
        )}

        {/* Thinking indicator */}
        {isProcessing && thinkingMessage && (
          <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-purple-300">
              <Loader2 size={14} className="animate-spin" />
              <span className="text-sm font-medium">{thinkingMessage}</span>
            </div>
            {thinkingDetail && (
              <p className="mt-2 text-xs text-zinc-400">{thinkingDetail}</p>
            )}
          </div>
        )}

        {/* Suggestions */}
        {!isProcessing && hasSelection && (
          <div className="space-y-2">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">Suggestions</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS.slice(0, 6).map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-2 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Help text */}
        {!hasSelection && (
          <div className="flex items-start gap-2 p-3 bg-zinc-800/50 rounded-lg">
            <Info size={14} className="text-zinc-500 mt-0.5 shrink-0" />
            <div className="text-xs text-zinc-500">
              <p className="font-medium text-zinc-400">How to use:</p>
              <ul className="mt-1 space-y-1 list-disc list-inside">
                <li>Click a scene to select it</li>
                <li>Hold Ctrl/Cmd to select multiple</li>
                <li>Describe what you want to change</li>
                <li>The AI will update the selected scene(s)</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-zinc-800">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              hasSelection
                ? "Describe your edit..."
                : "Select a scene first..."
            }
            disabled={!hasSelection || isProcessing}
            className="w-full resize-none bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 pr-12 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 min-h-[80px] max-h-40"
            rows={3}
          />
          <button
            type="submit"
            disabled={!prompt.trim() || !hasSelection || isProcessing}
            className="absolute right-2 bottom-2 p-2 rounded-lg bg-purple-500 hover:bg-purple-400 disabled:bg-zinc-700 disabled:text-zinc-500 transition-colors"
          >
            {isProcessing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
        <p className="mt-2 text-[10px] text-zinc-600 text-right">
          {navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl'} + Enter to send
        </p>
      </form>
    </div>
  );
};
