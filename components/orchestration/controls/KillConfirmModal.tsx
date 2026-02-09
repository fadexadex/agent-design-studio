/**
 * KillConfirmModal Component
 * 
 * Confirmation dialog for stopping generation.
 */

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KillConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  scenesInProgress?: number;
}

export function KillConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
  scenesInProgress = 0,
}: KillConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div className={cn(
        'relative z-10 w-full max-w-md mx-4',
        'bg-gray-900 border border-white/10 rounded-xl shadow-2xl',
        'animate-in zoom-in-95 fade-in duration-200'
      )}>
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="p-6">
          {/* Icon */}
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-500/20">
            <AlertTriangle className="h-6 w-6 text-red-400" />
          </div>

          {/* Title */}
          <h2 className="text-lg font-semibold text-white text-center mb-2">
            Stop Generation?
          </h2>

          {/* Description */}
          <p className="text-sm text-gray-400 text-center mb-6">
            This will cancel all running scenes and cannot be undone.
            {scenesInProgress > 0 && (
              <span className="block mt-2 text-yellow-400">
                {scenesInProgress} scene{scenesInProgress !== 1 ? 's' : ''} currently in progress will be lost.
              </span>
            )}
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className={cn(
                'flex-1 px-4 py-2.5 rounded-lg',
                'bg-white/10 text-white font-medium',
                'hover:bg-white/20 transition-colors'
              )}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className={cn(
                'flex-1 px-4 py-2.5 rounded-lg',
                'bg-red-500 text-white font-medium',
                'hover:bg-red-600 transition-colors'
              )}
            >
              Stop Generation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default KillConfirmModal;
