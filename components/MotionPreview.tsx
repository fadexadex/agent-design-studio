
import React from 'react';
import { Download, Share2, RotateCcw } from 'lucide-react';

interface MotionPreviewProps {
  videoUrl: string;
  onReset: () => void;
}

export const MotionPreview: React.FC<MotionPreviewProps> = ({ videoUrl, onReset }) => {
  return (
    <div className="space-y-8 animate-in zoom-in-95 duration-700">
      <div className="space-y-2 text-center">
        <h2 className="heading-font text-4xl font-bold uppercase tracking-tight">Your Motion Piece</h2>
        <p className="text-zinc-400">AI has translated your brand context into this sequence.</p>
      </div>

      <div className="relative group max-w-4xl mx-auto rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl">
        <video 
          src={videoUrl} 
          controls 
          autoPlay 
          loop 
          className="w-full aspect-video md:aspect-auto"
        />
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        <a 
          href={videoUrl} 
          download="kinetic-motion-design.mp4"
          className="bg-white text-black px-8 py-4 rounded-full font-bold flex items-center gap-2 hover:bg-zinc-200 transition-colors"
        >
          <Download size={20} /> Download MP4
        </a>
        <button 
          className="bg-zinc-900 text-white border border-zinc-800 px-8 py-4 rounded-full font-bold flex items-center gap-2 hover:border-zinc-600 transition-colors"
        >
          <Share2 size={20} /> Copy Link
        </button>
        <button 
          onClick={onReset}
          className="bg-transparent text-zinc-500 hover:text-white px-8 py-4 rounded-full font-bold flex items-center gap-2 transition-colors"
        >
          <RotateCcw size={20} /> New Creation
        </button>
      </div>
    </div>
  );
};
