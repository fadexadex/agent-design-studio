/**
 * ExportProgressModal
 * 
 * Modal showing export progress with download button when complete.
 */

import React from 'react';
import { ExportStatus } from '../../services/editorService';
import {
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Download,
  Film,
} from 'lucide-react';

interface ExportProgressModalProps {
  status: ExportStatus;
  progress: number;
  videoPath?: string;
  onClose: () => void;
}

export const ExportProgressModal: React.FC<ExportProgressModalProps> = ({
  status,
  progress,
  videoPath,
  onClose,
}) => {
  const isComplete = status === 'complete';
  const isError = status === 'error';
  const isRendering = status === 'rendering';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl p-6">
        {/* Close button */}
        {(isComplete || isError) && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X size={20} className="text-zinc-400" />
          </button>
        )}

        {/* Content */}
        <div className="text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            {isRendering && (
              <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Film size={40} className="text-purple-400 animate-pulse" />
              </div>
            )}
            {isComplete && (
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 size={40} className="text-green-400" />
              </div>
            )}
            {isError && (
              <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertCircle size={40} className="text-red-400" />
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <h2 className="text-xl font-bold">
              {isRendering && 'Exporting Video...'}
              {isComplete && 'Export Complete!'}
              {isError && 'Export Failed'}
            </h2>
            <p className="text-sm text-zinc-400 mt-1">
              {isRendering && 'Please wait while we render your video'}
              {isComplete && 'Your video is ready to download'}
              {isError && 'Something went wrong. Please try again.'}
            </p>
          </div>

          {/* Progress bar */}
          {isRendering && (
            <div className="space-y-2">
              <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-zinc-400">
                <Loader2 size={14} className="animate-spin" />
                <span>{progress}% complete</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-center gap-3">
            {isComplete && videoPath && (
              <a
                href={videoPath}
                download
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold rounded-xl transition-all"
              >
                <Download size={18} />
                Download Video
              </a>
            )}
            {isError && (
              <button
                onClick={onClose}
                className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-xl transition-all"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
