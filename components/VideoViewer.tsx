/**
 * VideoViewer
 * 
 * Dedicated full-screen video viewing experience shown after generation completes.
 * Features a large centered video player, video details, scene thumbnails,
 * and action buttons (Download, Edit, New Project).
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useHistory, useHistorySession } from '../contexts/HistoryContext';
import { HistorySidebar } from './history/HistorySidebar';
import {
  Download,
  Pencil,
  Plus,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  ArrowLeft,
  Clock,
  Film,
  Palette,
  Monitor,
  History,
  SkipBack,
  Check,
  Copy,
} from 'lucide-react';

/**
 * Format seconds to mm:ss display
 */
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * VideoViewer Page Component
 */
export const VideoViewer: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { isSidebarOpen, toggleSidebar } = useHistory();
  const session = useHistorySession(jobId || null);

  // Video state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [copied, setCopied] = useState(false);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Build video URL
  const videoUrl = session?.outputVideoPath || `/api/video/${jobId}`;

  // Scene previews from session with fallback URL construction
  const scenes = (session?.scenes || []).map((scene, idx) => ({
    ...scene,
    // Construct fallback preview URL if not present
    // Format: /api/preview/{jobId}/scene-{index}_v1.mp4
    previewUrl: scene.previewUrl || `/api/preview/${jobId}/scene-${idx}_v1.mp4`
  }));

  // Auto-hide controls
  useEffect(() => {
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    }
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying, showControls]);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  };

  // Video event handlers
  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const time = parseFloat(e.target.value);
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleMuteToggle = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleRestart = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play();
    setIsPlaying(true);
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    setShowControls(true);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/video/${jobId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Progress percentage for the seek bar
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Metadata display
  const brandName = session?.brand?.name || 'Untitled Project';
  const style = session?.config?.style || 'Motion';
  const aspectRatio = session?.config?.aspectRatio || '16:9';
  const resolution = session?.config?.resolution || '1080p';
  const sceneCount = scenes.length;
  const createdDate = session?.createdAt ? new Date(session.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) : '';

  if (!jobId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <p>Invalid video ID</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-black">
      <HistorySidebar />
      <div className="flex-1 relative">
        <button
          onClick={toggleSidebar}
          className={`fixed bottom-4 left-4 z-50 p-2 rounded-lg bg-zinc-800/80 backdrop-blur border border-zinc-700/50 hover:bg-zinc-700 transition-all ${isSidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          title="Open History"
        >
          <History size={20} className="text-zinc-400" />
        </button>

        <div className="flex flex-col h-screen text-white">
          {/* Header */}
          <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-900/50 backdrop-blur-sm shrink-0 z-20">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                title="Back to Home"
              >
                <ArrowLeft size={20} className="text-zinc-400" />
              </button>
              <div>
                <h1 className="font-heading font-bold text-lg">{brandName}</h1>
                <p className="text-xs text-zinc-500">Video Complete</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-green-400">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Complete
              </span>
            </div>
          </header>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
              
              {/* Video Player */}
              <div
                ref={containerRef}
                className="relative rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-2xl shadow-black/50 group"
                onMouseMove={handleMouseMove}
                onMouseLeave={() => isPlaying && setShowControls(false)}
              >
                {/* Video Element */}
                <div className="relative aspect-video bg-black cursor-pointer" onClick={handlePlayPause}>
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    className="w-full h-full object-contain"
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={handleVideoEnded}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    playsInline
                  />

                  {/* Play overlay when paused */}
                  {!isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity">
                      <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 hover:bg-white/20 transition-all hover:scale-110">
                        <Play size={32} className="text-white ml-1" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Custom Controls */}
                <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-4 pb-4 pt-12 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                  {/* Seek Bar */}
                  <div className="relative w-full h-1 bg-zinc-700 rounded-full mb-3 group/seek cursor-pointer">
                    <div
                      className="absolute h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                    <input
                      type="range"
                      min={0}
                      max={duration || 0}
                      step={0.01}
                      value={currentTime}
                      onChange={handleSeek}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover/seek:opacity-100 transition-opacity"
                      style={{ left: `${progress}%`, marginLeft: '-6px' }}
                    />
                  </div>

                  {/* Controls Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button onClick={handleRestart} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                        <SkipBack size={18} className="text-zinc-300" />
                      </button>
                      <button onClick={handlePlayPause} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        {isPlaying ? <Pause size={22} className="text-white" /> : <Play size={22} className="text-white ml-0.5" />}
                      </button>
                      <button onClick={handleMuteToggle} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                        {isMuted ? <VolumeX size={18} className="text-zinc-300" /> : <Volume2 size={18} className="text-zinc-300" />}
                      </button>
                      <span className="text-xs text-zinc-400 font-mono tabular-nums">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button onClick={handleFullscreen} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                        {isFullscreen
                          ? <Minimize2 size={18} className="text-zinc-300" />
                          : <Maximize2 size={18} className="text-zinc-300" />
                        }
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <a
                  href={videoUrl}
                  download={`${brandName.replace(/\s+/g, '_')}_video.mp4`}
                  className="flex items-center gap-2.5 px-7 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-900/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-900/40"
                >
                  <Download size={20} />
                  Download
                </a>
                <button
                  onClick={() => navigate(`/editor/${jobId}`)}
                  className="flex items-center gap-2.5 px-7 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-900/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-900/40"
                >
                  <Pencil size={20} />
                  Edit Video
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="flex items-center gap-2.5 px-7 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-xl border border-zinc-700 transition-all duration-300 hover:scale-105"
                >
                  <Plus size={20} />
                  New Project
                </button>
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-2.5 px-5 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-xl border border-zinc-700 transition-all duration-300 hover:scale-105"
                  title="Copy link to this video"
                >
                  {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                  {copied ? 'Copied!' : 'Share'}
                </button>
              </div>

              {/* Video Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-zinc-500 text-xs uppercase tracking-wider mb-2">
                    <Palette size={14} />
                    Style
                  </div>
                  <p className="text-white font-medium capitalize">{style}</p>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-zinc-500 text-xs uppercase tracking-wider mb-2">
                    <Monitor size={14} />
                    Format
                  </div>
                  <p className="text-white font-medium">{aspectRatio} &middot; {resolution}</p>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-zinc-500 text-xs uppercase tracking-wider mb-2">
                    <Film size={14} />
                    Scenes
                  </div>
                  <p className="text-white font-medium">{sceneCount} scene{sceneCount !== 1 ? 's' : ''}</p>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-zinc-500 text-xs uppercase tracking-wider mb-2">
                    <Clock size={14} />
                    Created
                  </div>
                  <p className="text-white font-medium text-sm">{createdDate || 'Just now'}</p>
                </div>
              </div>

              {/* Brand Colors */}
              {session?.brand?.colors && session.brand.colors.length > 0 && (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                  <div className="flex items-center gap-2 text-zinc-500 text-xs uppercase tracking-wider mb-3">
                    <Palette size={14} />
                    Brand Colors
                  </div>
                  <div className="flex items-center gap-3">
                    {session.brand.colors.map((color, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-lg border border-zinc-700 shadow-inner"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-xs text-zinc-400 font-mono">{color}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Scene Thumbnails */}
              {scenes.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-zinc-500 text-xs uppercase tracking-wider mb-4">
                    <Film size={14} />
                    Scene Breakdown
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {scenes.map((scene, idx) => (
                      <div
                        key={scene.id}
                        className="group relative bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-600 transition-all cursor-pointer"
                      >
                        {/* Scene Preview */}
                        <div className="aspect-video bg-black flex items-center justify-center relative">
                          {scene.previewUrl ? (
                            <video
                              src={scene.previewUrl}
                              className="w-full h-full object-contain"
                              muted
                              loop
                              onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                              onMouseLeave={(e) => {
                                const vid = e.target as HTMLVideoElement;
                                vid.pause();
                                vid.currentTime = 0;
                              }}
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-1 text-zinc-600">
                              <Film size={20} />
                              <span className="text-[10px]">No preview</span>
                            </div>
                          )}
                          {/* Scene number badge */}
                          <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/70 backdrop-blur-sm border border-zinc-600 flex items-center justify-center text-[10px] font-bold text-white">
                            {idx + 1}
                          </div>
                        </div>
                        {/* Scene info */}
                        <div className="p-3">
                          <p className="text-xs font-medium text-zinc-300 truncate">{scene.title || `Scene ${idx + 1}`}</p>
                          <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-2">{scene.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom spacing */}
              <div className="h-8" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
