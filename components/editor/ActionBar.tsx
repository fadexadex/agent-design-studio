/**
 * ActionBar
 * 
 * Bottom action bar with undo/redo and export controls.
 */

import React from 'react';
import { ExportStatus } from '../../services/editorService';
import {
  Undo2,
  Redo2,
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface ActionBarProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
  exportStatus: ExportStatus;
  exportProgress: number;
  exportedVideoPath?: string;
  isProcessing: boolean;
}

export const ActionBar: React.FC<ActionBarProps> = ({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onExport,
  exportStatus,
  exportProgress,
  exportedVideoPath,
  isProcessing,
}) => {
  const isExporting = exportStatus === 'rendering';
  const isExportComplete = exportStatus === 'complete';
  const isExportError = exportStatus === 'error';

  return (
    <div className="h-14 border-t border-zinc-800 bg-zinc-900/50 px-4 flex items-center justify-between shrink-0">
      {/* Left: Undo/Redo */}
      <div className="flex items-center gap-2">
        <button
          onClick={onUndo}
          disabled={!canUndo || isProcessing}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={14} />
          <span className="hidden sm:inline">Undo</span>
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo || isProcessing}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 size={14} />
          <span className="hidden sm:inline">Redo</span>
        </button>
      </div>

      {/* Center: Status */}
      <div className="text-xs text-zinc-500">
        {isProcessing && !isExporting && (
          <span className="flex items-center gap-2">
            <Loader2 size={12} className="animate-spin" />
            Processing...
          </span>
        )}
        {!isProcessing && !isExporting && (
          <span>All changes saved</span>
        )}
      </div>

      {/* Right: Export */}
      <div className="flex items-center gap-2">
        {isExporting && (
          <div className="flex items-center gap-3">
            <div className="w-32 h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
            <span className="text-xs text-zinc-400">{exportProgress}%</span>
          </div>
        )}

        {isExportComplete && exportedVideoPath && (
          <a
            href={exportedVideoPath}
            download
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white font-medium text-sm transition-colors"
          >
            <CheckCircle2 size={14} />
            Download
          </a>
        )}

        {isExportError && (
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle size={14} />
            Export failed
          </div>
        )}

        {!isExporting && !isExportComplete && (
          <button
            onClick={onExport}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm transition-all"
          >
            {isExporting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download size={14} />
                Export Video
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
