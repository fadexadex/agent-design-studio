import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { BrandWizard } from './components/BrandWizard';
import { MotionPreview } from './components/MotionPreview';
import { BrandContext, VideoConfig, GenerationState } from './types';
import { generateMotionVideo, AgentProgress, AgentThought } from './services/geminiService';
import { AlertCircle, Brain, Zap, Eye, Wrench, Film } from 'lucide-react';

// ReAct stage icons mapping
const stageIcons: Record<string, React.ReactNode> = {
  reasoning: <Brain className="animate-pulse" size={24} />,
  acting: <Zap className="animate-bounce" size={24} />,
  observing: <Eye size={24} />,
  correcting: <Wrench className="animate-spin" size={24} />,
  rendering: <Film className="animate-spin" size={24} />,
};

const stageColors: Record<string, string> = {
  reasoning: 'from-purple-500 to-blue-500',
  acting: 'from-blue-500 to-cyan-500',
  observing: 'from-cyan-500 to-green-500',
  correcting: 'from-orange-500 to-yellow-500',
  rendering: 'from-green-500 to-emerald-500',
};

const thoughtTypeLabels: Record<string, { label: string; color: string }> = {
  reason: { label: 'REASON', color: 'text-purple-400' },
  act: { label: 'ACT', color: 'text-blue-400' },
  observe: { label: 'OBSERVE', color: 'text-green-400' },
};

interface ExtendedGenerationState extends GenerationState {
  agentProgress?: AgentProgress;
}

const App: React.FC = () => {
  const [brand, setBrand] = useState<BrandContext | null>(null);
  const [config, setConfig] = useState<VideoConfig | null>(null);
  const [generation, setGeneration] = useState<ExtendedGenerationState>({
    isGenerating: false,
    progressMessage: '',
  });

  const startGeneration = async (brandData: BrandContext, configData: VideoConfig) => {
    setBrand(brandData);
    setConfig(configData);
    setGeneration({
      isGenerating: true,
      progressMessage: '🚀 Initializing AI Agent...',
      agentProgress: { stage: 'reasoning', message: 'Starting up' }
    });

    try {
      const url = await generateMotionVideo(brandData, configData, (msg, agentProgress) => {
        setGeneration(prev => ({
          ...prev,
          progressMessage: msg,
          agentProgress: agentProgress || prev.agentProgress
        }));
      });
      setGeneration({ isGenerating: false, progressMessage: '', videoUrl: url });
    } catch (error: any) {
      console.error(error);
      let errorMessage = 'Motion synthesis failed. Check your creative brief and try again.';

      if (error.message === "API_KEY_ERROR") {
        errorMessage = 'API Key error. Please ensure the GEMINI_API_KEY is correctly configured.';
      } else if (error.message === "BACKEND_ERROR") {
        errorMessage = 'Cannot connect to backend server. Please ensure the server is running (npm run server).';
      }

      setGeneration({
        isGenerating: false,
        progressMessage: '',
        error: errorMessage
      });
    }
  };

  const reset = () => {
    setBrand(null);
    setConfig(null);
    setGeneration({ isGenerating: false, progressMessage: '', error: undefined });
  };

  const currentStage = generation.agentProgress?.stage || 'reasoning';
  const thoughts = generation.agentProgress?.thoughts || [];
  const latestThoughts = thoughts.slice(-5); // Show last 5 thoughts

  return (
    <Layout>
      {/* Subtle Utility Header */}
      <div className="mb-12 flex justify-between items-center opacity-60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <div className="w-3 h-3 bg-black rounded-sm transform rotate-45"></div>
          </div>
          <span className="heading-font font-bold text-sm uppercase tracking-widest">Agent Design Studio</span>
        </div>
        <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest font-bold text-zinc-400">
          <span className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${generation.isGenerating ? 'bg-green-500 animate-pulse' : 'bg-zinc-600'}`}></div>
            {generation.isGenerating ? 'Agent Active' : 'Ready for Synthesis'}
          </span>
        </div>
      </div>

      {generation.isGenerating ? (
        <div className="max-w-3xl mx-auto flex flex-col items-center justify-center py-8 space-y-6 text-center animate-in fade-in duration-500">

          {/* Agent Brain Animation */}
          <div className="relative">
            <div className={`absolute inset-0 w-28 h-28 rounded-full bg-gradient-to-r ${stageColors[currentStage]} opacity-20 blur-xl animate-pulse`}></div>
            <div className="relative w-28 h-28 rounded-full border-2 border-zinc-800 flex items-center justify-center bg-black">
              <div className="absolute inset-0 w-28 h-28 rounded-full border-t-2 border-white animate-spin" style={{ animationDuration: '3s' }}></div>
              <div className={`text-white bg-gradient-to-r ${stageColors[currentStage]} p-4 rounded-full`}>
                {stageIcons[currentStage]}
              </div>
            </div>
          </div>

          {/* Current Stage Label */}
          <div className="space-y-2">
            <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-gradient-to-r ${stageColors[currentStage]} text-black`}>
              {currentStage}
            </div>
            <h2 className="heading-font text-xl font-bold uppercase tracking-widest text-white">
              {generation.agentProgress?.message || 'Processing'}
            </h2>
            <p className="text-zinc-400 text-sm max-w-md">
              {generation.progressMessage}
            </p>
          </div>

          {/* ReAct Thought Trace */}
          {latestThoughts.length > 0 && (
            <div className="w-full max-w-2xl bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-left overflow-hidden">
              <div className="flex items-center gap-2 mb-3">
                <Brain size={14} className="text-purple-400" />
                <span className="text-zinc-500 text-xs uppercase tracking-wider font-bold">Agent Cognitive Trace</span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {latestThoughts.map((thought, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2 text-xs font-mono animate-in slide-in-from-left-2 ${i === latestThoughts.length - 1 ? 'opacity-100' : 'opacity-60'}`}
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <span className={`font-bold min-w-[70px] ${thoughtTypeLabels[thought.type]?.color || 'text-zinc-400'}`}>
                      [{thoughtTypeLabels[thought.type]?.label || thought.type.toUpperCase()}]
                    </span>
                    <span className="text-zinc-300">{thought.content}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Current Thought Display */}
          {generation.agentProgress?.thought && (
            <div className={`w-full max-w-2xl p-3 rounded-lg border ${generation.agentProgress.thought.type === 'reason' ? 'border-purple-500/30 bg-purple-500/10' :
                generation.agentProgress.thought.type === 'act' ? 'border-blue-500/30 bg-blue-500/10' :
                  'border-green-500/30 bg-green-500/10'
              }`}>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold uppercase ${thoughtTypeLabels[generation.agentProgress.thought.type]?.color}`}>
                  {thoughtTypeLabels[generation.agentProgress.thought.type]?.label}
                </span>
                <span className="text-zinc-300 text-sm">{generation.agentProgress.thought.content}</span>
              </div>
            </div>
          )}

          {/* Code Preview (if available) */}
          {generation.agentProgress?.codePreview && (
            <div className="w-full max-w-2xl bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-left overflow-hidden animate-in slide-in-from-bottom-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-zinc-600 text-xs ml-2">Generated Remotion Code</span>
              </div>
              <pre className="text-xs text-zinc-400 font-mono overflow-hidden">
                <code>{generation.agentProgress.codePreview}</code>
              </pre>
            </div>
          )}

          {/* Attempt Counter (if correcting) */}
          {generation.agentProgress?.attempt && generation.agentProgress.maxAttempts && (
            <div className="text-zinc-500 text-xs">
              Attempt {generation.agentProgress.attempt} of {generation.agentProgress.maxAttempts}
            </div>
          )}

          {/* Progress Bar */}
          <div className="w-64 bg-zinc-900 h-1 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${stageColors[currentStage]} transition-all duration-500`}
              style={{
                width: currentStage === 'reasoning' ? '20%'
                  : currentStage === 'acting' ? '50%'
                    : currentStage === 'observing' ? '70%'
                      : currentStage === 'correcting' ? '60%'
                        : '90%'
              }}
            />
          </div>
        </div>
      ) : generation.videoUrl ? (
        <MotionPreview videoUrl={generation.videoUrl} onReset={reset} />
      ) : (
        <>
          {generation.error && (
            <div className="mb-8 p-4 bg-red-950/20 border border-red-900/30 rounded-lg flex items-center gap-3 text-red-400 text-xs animate-in slide-in-from-top-2">
              <AlertCircle size={14} />
              {generation.error}
            </div>
          )}
          <BrandWizard onComplete={startGeneration} />
        </>
      )}
    </Layout>
  );
};

export default App;
