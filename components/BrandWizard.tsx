
import React, { useState } from 'react';
import { BrandContext, VideoConfig, MotionStyle } from '../types';
import { Check, ChevronRight, Upload, Palette, Rocket, Zap, Sliders } from 'lucide-react';

interface BrandWizardProps {
  onComplete: (brand: BrandContext, config: VideoConfig) => void;
}

export const BrandWizard: React.FC<BrandWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [brand, setBrand] = useState<BrandContext>({
    name: '',
    industry: '',
    colors: ['#000000', '#FFFFFF'],
    tagline: '',
  });

  const [config, setConfig] = useState<VideoConfig>({
    style: 'minimalist',
    aspectRatio: '16:9',
    resolution: '1080p',
    prompt: '',
  });

  const steps = [
    { id: 1, title: 'Foundation', icon: <Rocket size={18} /> },
    { id: 2, title: 'Identity', icon: <Palette size={18} /> },
    { id: 3, title: 'Motion DNA', icon: <Sliders size={18} /> },
    { id: 4, title: 'Creative Brief', icon: <Zap size={18} /> },
  ];

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBrand(prev => ({ ...prev, logoBase64: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const nextStep = () => setStep(s => Math.min(s + 1, steps.length));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const isFoundationComplete = brand.name && brand.industry;
  const isCreativeComplete = config.prompt.length > 10;

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
                  />
                  <div className="h-40 border-2 border-dashed border-zinc-800 rounded-xl flex flex-col items-center justify-center gap-3 group-hover:border-zinc-500 transition-colors bg-zinc-900/50">
                    {brand.logoBase64 ? (
                      <img src={brand.logoBase64} alt="Preview" className="h-20 object-contain" />
                    ) : (
                      <>
                        <Upload className="text-zinc-500" />
                        <span className="text-sm text-zinc-500">Drop your logo here</span>
                      </>
                    )}
                  </div>
                </div>
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
      </div>

      {/* Navigation Footer */}
      <div className="flex justify-between items-center pt-8">
        <button 
          onClick={prevStep}
          className={`text-zinc-500 hover:text-white font-medium flex items-center gap-2 px-4 py-2 transition-all ${step === 1 ? 'opacity-0 pointer-events-none' : ''}`}
        >
          Previous
        </button>
        {step < 4 ? (
          <button 
            disabled={step === 1 && !isFoundationComplete}
            onClick={nextStep}
            className={`bg-white text-black px-8 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-zinc-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            Next <ChevronRight size={18} />
          </button>
        ) : (
          <button 
            disabled={!isCreativeComplete}
            onClick={() => onComplete(brand, config)}
            className="bg-white text-black px-12 py-4 rounded-full font-bold flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Render Vision <Zap size={18} fill="currentColor" />
          </button>
        )}
      </div>
    </div>
  );
};
