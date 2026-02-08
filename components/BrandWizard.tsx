
import React, { useState } from 'react';
import { BrandContext, VideoConfig, MotionStyle, VideoScript, StoryScript } from '../types';
import { Check, ChevronRight, Upload, Palette, Rocket, Zap, Sliders, FileText, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import ScriptPreview from './ScriptPreview';

interface BrandWizardProps {
  onComplete: (brand: BrandContext, config: VideoConfig, script: VideoScript) => void;
}

export const BrandWizard: React.FC<BrandWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [brand, setBrand] = useState<BrandContext>({
    name: '',
    industry: '',
    colors: ['#000000', '#FFFFFF'],
    tagline: '',
  });
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);

  const [config, setConfig] = useState<VideoConfig>({
    style: 'minimalist',
    aspectRatio: '16:9',
    resolution: '1080p',
    prompt: '',
  });

  // Script state for step 5 (Story-driven format)
  const [scriptMode, setScriptMode] = useState<'upload' | 'generate' | null>(null);
  const [uploadedScript, setUploadedScript] = useState<string>('');
  const [storyScript, setStoryScript] = useState<StoryScript | null>(null);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [scriptError, setScriptError] = useState<string | null>(null);

  const steps = [
    { id: 1, title: 'Foundation', icon: <Rocket size={18} /> },
    { id: 2, title: 'Identity', icon: <Palette size={18} /> },
    { id: 3, title: 'Motion DNA', icon: <Sliders size={18} /> },
    { id: 4, title: 'Creative Brief', icon: <Zap size={18} /> },
    { id: 5, title: 'Script', icon: <FileText size={18} /> },
  ];

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploadingLogo(true);
    setLogoUploadError(null);
    
    // First, read the file as base64 for preview
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result as string;
      
      // Update preview immediately
      setBrand(prev => ({ ...prev, logoBase64: base64Data }));
      
      try {
        // Upload to server to save in remotion/public/uploads
        const response = await fetch('/api/upload/logo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64: base64Data,
            originalName: file.name
          })
        });
        
        const result = await response.json();
        
        if (result.success && result.logoPath) {
          // Store the path for use with staticFile() in Remotion
          setBrand(prev => ({ ...prev, logoPath: result.logoPath }));
          console.log('[BrandWizard] Logo uploaded to:', result.logoPath);
        } else {
          throw new Error(result.error || 'Failed to upload logo');
        }
      } catch (error: any) {
        console.error('[BrandWizard] Logo upload error:', error);
        setLogoUploadError(error.message || 'Failed to upload logo to server');
        // Keep the base64 preview but note that the server path failed
      } finally {
        setIsUploadingLogo(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const nextStep = () => setStep(s => Math.min(s + 1, steps.length));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleScriptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const text = reader.result as string;
        setUploadedScript(text);
        // Transform the uploaded text to story script
        transformUploadedScript(text);
      };
      reader.readAsText(file);
    }
  };

  const transformUploadedScript = async (text: string) => {
    setIsGeneratingScript(true);
    setScriptError(null);

    try {
      const response = await fetch('/api/script/transform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          brand,
          config
        })
      });

      const data = await response.json();

      if (response.ok && data.scenes) {
        // API returns StoryScript directly (not wrapped in {script: ...})
        setStoryScript(data);
        setScriptError(null);
      } else {
        setScriptError(data.error || 'Failed to transform script. Please try again.');
      }
    } catch (error: any) {
      setScriptError(error.message || 'Network error. Please check your connection and try again.');
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const generateAIScript = async () => {
    setIsGeneratingScript(true);
    setScriptError(null);
    setStoryScript(null);

    try {
      const response = await fetch('/api/script/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand,
          config
        })
      });

      const data = await response.json();

      if (response.ok && data.scenes) {
        // API returns StoryScript directly (not wrapped in {script: ...})
        setStoryScript(data);
        setScriptError(null);
      } else {
        setScriptError(data.error || 'Failed to generate script. Please try again.');
      }
    } catch (error: any) {
      setScriptError(error.message || 'Network error. Please check your connection and try again.');
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const isFoundationComplete = brand.name && brand.industry;
  const isCreativeComplete = config.prompt.length > 10;
  // Script is REQUIRED - must have a valid story script with scenes
  const isScriptComplete = storyScript !== null && storyScript.scenes.length > 0;

  return (
    <div className="max-w-2xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Progress Header */}
      <div className="flex justify-between items-center border-b border-zinc-800 pb-6">
        {steps.map((s) => (
          <div 
            key={s.id} 
            className={`flex items-center gap-3 transition-opacity duration-300 ${step === s.id ? 'opacity-100' : 'opacity-40'}`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${step === s.id ? 'bg-white text-black border-white' : 'border-zinc-700'}`}>
              {step > s.id ? <Check size={18} /> : s.icon}
            </div>
            <span className="hidden md:block font-medium text-sm">{s.title}</span>
          </div>
        ))}
      </div>

      <div className="min-h-[400px]">
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="space-y-2">
              <h2 className="heading-font text-3xl font-bold uppercase tracking-tight">Business Foundation</h2>
              <p className="text-zinc-400">Tell us what fuels your business so the AI can understand your essence.</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">Company Name</label>
                <input 
                  value={brand.name}
                  onChange={e => setBrand({...brand, name: e.target.value})}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 focus:outline-none focus:border-white transition-colors"
                  placeholder="e.g. Lumina Labs"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">Industry / Sector</label>
                <input 
                  value={brand.industry}
                  onChange={e => setBrand({...brand, industry: e.target.value})}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 focus:outline-none focus:border-white transition-colors"
                  placeholder="e.g. Sustainable Tech"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="space-y-2">
              <h2 className="heading-font text-3xl font-bold uppercase tracking-tight">Visual Identity</h2>
              <p className="text-zinc-400">Your logo and palette define the visual rules of the motion design.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-xs uppercase tracking-widest text-zinc-500 font-semibold block">Logo Asset</label>
                <div className="relative group">
                  <input 
                    type="file" 
                    onChange={handleLogoUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                    accept="image/*"
                    disabled={isUploadingLogo}
                  />
                  <div className={`h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 transition-colors bg-zinc-900/50 ${
                    logoUploadError ? 'border-red-500/50' : 
                    brand.logoPath ? 'border-green-500/50' : 
                    'border-zinc-800 group-hover:border-zinc-500'
                  }`}>
                    {isUploadingLogo ? (
                      <>
                        <Loader2 className="text-zinc-400 animate-spin" />
                        <span className="text-sm text-zinc-400">Uploading...</span>
                      </>
                    ) : brand.logoBase64 ? (
                      <div className="flex flex-col items-center gap-2">
                        <img src={brand.logoBase64} alt="Preview" className="h-16 object-contain" />
                        {brand.logoPath && (
                          <span className="text-xs text-green-400">Ready for video</span>
                        )}
                        {logoUploadError && (
                          <span className="text-xs text-red-400">{logoUploadError}</span>
                        )}
                      </div>
                    ) : (
                      <>
                        <Upload className="text-zinc-500" />
                        <span className="text-sm text-zinc-500">Drop your logo here</span>
                      </>
                    )}
                  </div>
                </div>
                {brand.logoPath && (
                  <p className="text-xs text-zinc-600">
                    Path: <code className="bg-zinc-800 px-1 rounded">{brand.logoPath}</code>
                  </p>
                )}
              </div>
              <div className="space-y-4">
                <label className="text-xs uppercase tracking-widest text-zinc-500 font-semibold block">Brand Palette</label>
                <div className="flex gap-4">
                  {brand.colors.map((color, i) => (
                    <div key={i} className="space-y-2">
                      <input 
                        type="color" 
                        value={color}
                        onChange={e => {
                          const newColors = [...brand.colors];
                          newColors[i] = e.target.value;
                          setBrand({...brand, colors: newColors});
                        }}
                        className="w-12 h-12 rounded-lg bg-transparent cursor-pointer overflow-hidden border border-zinc-800"
                      />
                    </div>
                  ))}
                  <button 
                    onClick={() => setBrand({...brand, colors: [...brand.colors, '#cccccc']})}
                    className="w-12 h-12 rounded-lg border-2 border-dashed border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white hover:border-zinc-500"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="space-y-2">
              <h2 className="heading-font text-3xl font-bold uppercase tracking-tight">Motion Personality</h2>
              <p className="text-zinc-400">Select the rhythm and flow that matches your business character.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {(['minimalist', 'geometric', 'fluid', 'brutalist', 'cinematic'] as MotionStyle[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setConfig({...config, style: s})}
                  className={`p-4 rounded-xl border text-left capitalize transition-all ${config.style === s ? 'bg-white text-black border-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600'}`}
                >
                  <div className="text-sm font-bold mb-1">{s}</div>
                  <div className="text-[10px] opacity-70">
                    {s === 'minimalist' && 'Clean, sparse, elegant'}
                    {s === 'geometric' && 'Sharp shapes, precise'}
                    {s === 'fluid' && 'Organic, flowing, soft'}
                    {s === 'brutalist' && 'Raw, bold, industrial'}
                    {s === 'cinematic' && 'Dramatic, lighting-focused'}
                  </div>
                </button>
              ))}
            </div>
            
            <div className="flex gap-8 border-t border-zinc-800 pt-8">
               <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-zinc-500 font-semibold block">Aspect Ratio</label>
                <div className="flex gap-2">
                  {(['16:9', '9:16'] as const).map(ar => (
                    <button 
                      key={ar}
                      onClick={() => setConfig({...config, aspectRatio: ar})}
                      className={`px-4 py-2 rounded-lg border text-sm transition-all ${config.aspectRatio === ar ? 'bg-white text-black border-white' : 'border-zinc-800 text-zinc-500'}`}
                    >
                      {ar}
                    </button>
                  ))}
                </div>
              </div>
               <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-zinc-500 font-semibold block">Resolution</label>
                <div className="flex gap-2">
                  {(['720p', '1080p'] as const).map(res => (
                    <button 
                      key={res}
                      onClick={() => setConfig({...config, resolution: res})}
                      className={`px-4 py-2 rounded-lg border text-sm transition-all ${config.resolution === res ? 'bg-white text-black border-white' : 'border-zinc-800 text-zinc-500'}`}
                    >
                      {res}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="space-y-2">
              <h2 className="heading-font text-3xl font-bold uppercase tracking-tight">The Vision</h2>
              <p className="text-zinc-400">What specific message or idea should this motion design video convey?</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">Creative Brief</label>
                <textarea
                  rows={5}
                  value={config.prompt}
                  onChange={e => setConfig({...config, prompt: e.target.value})}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 focus:outline-none focus:border-white transition-colors resize-none"
                  placeholder="Describe the scenes, key text, and overall vibe... (e.g. An opening shot of a logo dissolving into light particles, followed by bold text saying 'The Future is Circular' over a pulsing gradient background.)"
                />
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="space-y-2">
              <h2 className="heading-font text-3xl font-bold uppercase tracking-tight">Story Script</h2>
              <p className="text-zinc-400">
                Choose how to create your 30-second story-driven video: upload your ideas or let AI craft the narrative.
              </p>
            </div>

            {/* Mode Selection */}
            {!scriptMode && !storyScript && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                  onClick={() => setScriptMode('upload')}
                  className="p-6 rounded-xl border-2 border-dashed border-zinc-700 hover:border-purple-500 bg-zinc-900/50 hover:bg-zinc-900 transition-all group text-left"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                      <Upload size={24} className="text-zinc-400 group-hover:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">Upload Script</h3>
                      <p className="text-xs text-zinc-500">Transform your ideas</p>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-400">
                    Paste or upload your text. AI will transform it into a story-driven 5-act narrative.
                  </p>
                </button>

                <button
                  onClick={() => {
                    setScriptMode('generate');
                    generateAIScript();
                  }}
                  className="p-6 rounded-xl border-2 border-dashed border-zinc-700 hover:border-blue-500 bg-zinc-900/50 hover:bg-zinc-900 transition-all group text-left"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                      <Sparkles size={24} className="text-zinc-400 group-hover:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">AI Generate</h3>
                      <p className="text-xs text-zinc-500">Full story creation</p>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-400">
                    AI creates a complete 30-second story with text choreography based on your brand.
                  </p>
                </button>
              </div>
            )}

            {/* Upload Mode */}
            {scriptMode === 'upload' && !storyScript && (
              <div className="space-y-6">
                <div className="relative group">
                  <input
                    type="file"
                    onChange={handleScriptUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    accept=".txt,.md,.rtf"
                    disabled={isGeneratingScript}
                  />
                  <div className={`h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 transition-colors bg-zinc-900/50 ${
                    isGeneratingScript ? 'border-blue-500' : uploadedScript ? 'border-green-500' : 'border-zinc-800 group-hover:border-zinc-500'
                  }`}>
                    {isGeneratingScript ? (
                      <div className="text-center">
                        <Loader2 className="mx-auto text-blue-400 mb-2 animate-spin" size={24} />
                        <span className="text-sm text-blue-400">Transforming to story format...</span>
                      </div>
                    ) : uploadedScript ? (
                      <div className="text-center">
                        <FileText className="mx-auto text-green-400 mb-2" size={24} />
                        <span className="text-sm text-green-400">Script uploaded - transforming...</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="text-zinc-500" />
                        <span className="text-sm text-zinc-500">Drop your script file here (.txt, .md)</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Manual Script Input */}
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">Or paste your script</label>
                  <textarea
                    rows={8}
                    value={uploadedScript}
                    onChange={(e) => setUploadedScript(e.target.value)}
                    disabled={isGeneratingScript}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 focus:outline-none focus:border-white transition-colors resize-none text-sm font-mono disabled:opacity-50"
                    placeholder="Describe what should happen in your video...&#10;&#10;Example:&#10;Show someone struggling with textbooks, then easily snapping a photo to list them, other students see the post nearby, they meet up and exchange, ending with the app name."
                  />
                  {uploadedScript && !isGeneratingScript && (
                    <button
                      onClick={() => transformUploadedScript(uploadedScript)}
                      className="mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Sparkles size={14} /> Transform to Story
                    </button>
                  )}
                </div>

                {scriptError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <p className="text-red-400 text-sm">{scriptError}</p>
                  </div>
                )}

                <button
                  onClick={() => {
                    setScriptMode(null);
                    setUploadedScript('');
                    setScriptError(null);
                  }}
                  className="text-sm text-zinc-500 hover:text-white transition-colors"
                  disabled={isGeneratingScript}
                >
                  ← Choose different option
                </button>
              </div>
            )}

            {/* Generate Mode - Loading State */}
            {scriptMode === 'generate' && isGeneratingScript && !storyScript && (
              <div className="flex flex-col items-center justify-center py-16 gap-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full blur-xl opacity-30 animate-pulse" />
                  <div className="relative w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-700">
                    <Sparkles size={32} className="text-purple-400 animate-pulse" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-ping" />
                </div>

                <div className="text-center space-y-2">
                  <h3 className="text-lg font-bold text-white">AI is crafting your story</h3>
                  <p className="text-sm text-zinc-400 max-w-sm">
                    Creating a compelling 30-second narrative for "{brand.name}" with text choreography...
                  </p>
                </div>

                <div className="flex flex-col gap-3 w-full max-w-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <Loader2 size={14} className="text-purple-400 animate-spin" />
                    </div>
                    <span className="text-sm text-zinc-300">Building 5-act story arc</span>
                  </div>
                  <div className="flex items-center gap-3 opacity-60">
                    <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center">
                      <div className="w-2 h-2 bg-zinc-600 rounded-full" />
                    </div>
                    <span className="text-sm text-zinc-500">Choreographing text animations</span>
                  </div>
                  <div className="flex items-center gap-3 opacity-40">
                    <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center">
                      <div className="w-2 h-2 bg-zinc-600 rounded-full" />
                    </div>
                    <span className="text-sm text-zinc-500">Timing story phases</span>
                  </div>
                </div>

                <p className="text-xs text-zinc-600 italic">This usually takes 15-30 seconds</p>
              </div>
            )}

            {/* Generate Mode - Error State */}
            {scriptMode === 'generate' && scriptError && !storyScript && (
              <div className="flex flex-col items-center justify-center py-12 gap-6">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/30">
                  <AlertCircle size={32} className="text-red-400" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-bold text-white">Script Generation Failed</h3>
                  <p className="text-sm text-zinc-400 max-w-sm">{scriptError}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setScriptMode(null);
                      setScriptError(null);
                    }}
                    className="text-sm text-zinc-500 hover:text-white transition-colors"
                  >
                    ← Choose different option
                  </button>
                  <button
                    onClick={generateAIScript}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Sparkles size={14} /> Try Again
                  </button>
                </div>
              </div>
            )}

            {/* Success State - Show ScriptPreview */}
            {storyScript && (
              <div className="space-y-4">
                <ScriptPreview
                  script={storyScript}
                  isLoading={false}
                  onRegenerate={() => {
                    setStoryScript(null);
                    setScriptError(null);
                    if (scriptMode === 'generate') {
                      generateAIScript();
                    } else if (scriptMode === 'upload' && uploadedScript) {
                      transformUploadedScript(uploadedScript);
                    }
                  }}
                  error={scriptError || undefined}
                />

                <button
                  onClick={() => {
                    setScriptMode(null);
                    setStoryScript(null);
                    setUploadedScript('');
                    setScriptError(null);
                  }}
                  className="text-sm text-zinc-500 hover:text-white transition-colors"
                >
                  ← Start over
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="flex justify-between items-center pt-8">
        <button
          onClick={prevStep}
          className={`text-zinc-500 hover:text-white font-medium flex items-center gap-2 px-4 py-2 transition-all ${step === 1 ? 'opacity-0 pointer-events-none' : ''}`}
        >
          Previous
        </button>
        {step < 5 ? (
          <button
            disabled={(step === 1 && !isFoundationComplete) || (step === 4 && !isCreativeComplete)}
            onClick={nextStep}
            className={`bg-white text-black px-8 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-zinc-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            Next <ChevronRight size={18} />
          </button>
        ) : (
          <button
            disabled={!isScriptComplete || isGeneratingScript}
            onClick={() => {
              if (!storyScript) return;
              
              // Convert StoryScript to legacy VideoScript format for compatibility
              // The backend/orchestrator expects VideoScript format
              const legacyScenes = storyScript.scenes.map((scene) => {
                const textOverlay = scene.moments.flatMap((m) =>
                  m.textElements.map((t) => t.content)
                );
                const keyElements = [
                  ...scene.moments.flatMap((m) => m.visualElements?.map((v) => v.name) || []),
                  ...scene.moments.flatMap((m) => m.textElements.map((t) => t.purpose)),
                ].filter((v, i, a) => a.indexOf(v) === i);
                const description = scene.moments.map((m) => m.visualAction).join(' ');

                return {
                  id: scene.id,
                  sceneNumber: scene.sceneNumber,
                  description,
                  frameRange: scene.frameRange,
                  keyElements,
                  visualStyle: 'kinetic_typography' as const,
                  textOverlay,
                };
              });

              const script: VideoScript = {
                script: `${storyScript.narrative.hook} ${storyScript.narrative.journey} ${storyScript.narrative.resolution}`,
                scenes: legacyScenes,
              };
              onComplete(brand, config, script);
            }}
            className="bg-white text-black px-12 py-4 rounded-full font-bold flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Render Vision <Zap size={18} fill="currentColor" />
          </button>
        )}
      </div>
    </div>
  );
};
