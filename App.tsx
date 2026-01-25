import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { Layout } from './components/Layout';
import { BrandWizard } from './components/BrandWizard';
import { MotionPreview } from './components/MotionPreview';
import { WorkflowDashboard } from './components/workflow/WorkflowDashboard';
import { SceneEditor } from './components/editor/SceneEditor';
import { BrandContext, VideoConfig, GenerationState, VideoScript } from './types';
import { startWorkflow, AgentProgress, AgentThought } from './services/geminiService';
import { AlertCircle, Brain, Zap, Eye, Wrench, Film } from 'lucide-react';

const WORKFLOW_JOB_ID_KEY = 'agent_design_studio_workflow_job_id';

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

/**
 * Home page component - handles brand wizard and workflow initiation
 */
const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [brand, setBrand] = useState<BrandContext | null>(null);
  const [config, setConfig] = useState<VideoConfig | null>(null);
  // Initialize from sessionStorage to persist across page reloads/HMR
  const [workflowJobId, setWorkflowJobId] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(WORKFLOW_JOB_ID_KEY);
    } catch {
      return null;
    }
  });
  const [generation, setGeneration] = useState<ExtendedGenerationState>({
    isGenerating: false,
    progressMessage: '',
  });

  // Persist workflowJobId to sessionStorage whenever it changes
  useEffect(() => {
    try {
      if (workflowJobId) {
        sessionStorage.setItem(WORKFLOW_JOB_ID_KEY, workflowJobId);
      } else {
        sessionStorage.removeItem(WORKFLOW_JOB_ID_KEY);
      }
    } catch {
      // sessionStorage not available (e.g., private browsing)
    }
  }, [workflowJobId]);

  const startGeneration = async (brandData: BrandContext, configData: VideoConfig, script: VideoScript) => {
    setBrand(brandData);
    setConfig(configData);
    setGeneration({
      isGenerating: true,
      progressMessage: 'Initializing AI Agent...',
      agentProgress: { stage: 'reasoning', message: 'Starting up' }
    });

    try {
      // Use the new Workflow Streaming API with required script
      const jobId = await startWorkflow(brandData, configData, script);
      setWorkflowJobId(jobId);
    } catch (error: any) {
      console.error(error);
      let errorMessage = 'Motion synthesis failed. Check your creative brief and try again.';

      if (error.message === "API_KEY_ERROR") {
        errorMessage = 'API Key error. Please ensure the GEMINI_API_KEY is correctly configured.';
      } else if (error.message === "BACKEND_ERROR") {
        errorMessage = 'Cannot connect to backend server. Please ensure the server is running (npm run server).';
      } else if (error.message?.includes('Script with scenes is required')) {
        errorMessage = 'Please generate or upload a script before rendering.';
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
    setWorkflowJobId(null);
    setGeneration({ isGenerating: false, progressMessage: '', error: undefined });
  };

  // If we have a workflow job ID, render the WorkflowDashboard
  if (workflowJobId) {
    return <WorkflowDashboard jobId={workflowJobId} onNavigateToEditor={(jobId) => navigate(`/editor/${jobId}`)} />;
  }

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
          {/* Legacy loader here just in case, though workflowJobId should take over immediately */}
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-2 border-purple-500 border-t-white rounded-full animate-spin"></div>
            <p className="text-zinc-400 text-sm">Transferring to Workflow Engine...</p>
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

/**
 * Workflow page wrapper - extracts jobId from URL params
 */
const WorkflowPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  
  if (!jobId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-red-500 gap-4">
        <AlertCircle size={48} />
        <h2 className="text-xl font-bold">Invalid Job ID</h2>
        <button onClick={() => navigate('/')} className="text-purple-400 hover:underline">
          Go Home
        </button>
      </div>
    );
  }

  return <WorkflowDashboard jobId={jobId} onNavigateToEditor={(id) => navigate(`/editor/${id}`)} />;
};

/**
 * Editor page wrapper - extracts jobId from URL params
 */
const EditorPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  
  if (!jobId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-red-500 gap-4">
        <AlertCircle size={48} />
        <h2 className="text-xl font-bold">Invalid Job ID</h2>
        <button onClick={() => navigate('/')} className="text-purple-400 hover:underline">
          Go Home
        </button>
      </div>
    );
  }

  return <SceneEditor jobId={jobId} onBack={() => navigate(`/workflow/${jobId}`)} />;
};

/**
 * Main App component with routing
 */
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/workflow/:jobId" element={<WorkflowPage />} />
        <Route path="/editor/:jobId" element={<EditorPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
