/**
 * DeleteConfirmModal
 * 
 * Confirmation modal for deleting a scene.
 */

import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  sceneNumber: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  sceneNumber,
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-sm bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl p-6">
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-zinc-800 transition-colors"
        >
          <X size={20} className="text-zinc-400" />
        </button>

        {/* Content */}
        <div className="text-center space-y-4">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertTriangle size={32} className="text-red-400" />
            </div>
          </div>

          {/* Title */}
          <div>
            <h2 className="text-xl font-bold">Delete Scene {sceneNumber}?</h2>
            <p className="text-sm text-zinc-400 mt-2">
              This action cannot be undone. The scene and all its versions will be permanently removed.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-all"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg transition-all"
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
