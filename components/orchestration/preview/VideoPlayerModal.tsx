/**
 * VideoPlayerModal
 * 
 * Modal dialog for playing video previews.
 * Features:
 * - Full-screen capable video player
 * - Keyboard controls (Escape to close, Space to pause)
 * - Click outside to dismiss
 */

import { memo, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { X, Maximize2, Volume2, VolumeX } from 'lucide-react';
import { useState } from 'react';

interface VideoPlayerModalProps {
  isOpen: boolean;
  videoSrc: string | null;
  title?: string;
  onClose: () => void;
}

export const VideoPlayerModal = memo(function VideoPlayerModal({
  isOpen,
  videoSrc,
  title = 'Video Preview',
  onClose,
}: VideoPlayerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case ' ':
          e.preventDefault();
          if (videoRef.current) {
            if (videoRef.current.paused) {
              videoRef.current.play();
            } else {
              videoRef.current.pause();
            }
          }
          break;
        case 'm':
        case 'M':
          setIsMuted(prev => !prev);
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Auto-play when modal opens
  useEffect(() => {
    if (isOpen && videoRef.current && videoSrc) {
      videoRef.current.play().catch(() => {
        // Autoplay might be blocked, that's fine
      });
    }
  }, [isOpen, videoSrc]);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!videoRef.current) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      videoRef.current.requestFullscreen();
    }
  }, []);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  if (!isOpen || !videoSrc) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      {/* Modal container */}
      <div className="relative w-full max-w-4xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-white">{title}</h3>
          <div className="flex items-center gap-2">
            {/* Mute toggle */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
              title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            
            {/* Fullscreen toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
              title="Fullscreen (F)"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            
            {/* Close button */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video player */}
        <div className="relative rounded-xl overflow-hidden bg-black border border-white/10 shadow-2xl">
          <video
            ref={videoRef}
            src={videoSrc}
            className="w-full aspect-video"
            controls
            muted={isMuted}
            playsInline
          />
        </div>

        {/* Keyboard hints */}
        <div className="mt-3 flex items-center justify-center gap-4 text-xs text-white/40">
          <span>Space: Play/Pause</span>
          <span>M: Mute</span>
          <span>F: Fullscreen</span>
          <span>Esc: Close</span>
        </div>
      </div>
    </div>
  );
});

export default VideoPlayerModal;
