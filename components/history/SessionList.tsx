/**
 * Session List
 * 
 * Searchable list of all history sessions sorted by most recent.
 */

import React, { useState, useMemo } from 'react';
import { Search, Trash2, AlertCircle } from 'lucide-react';
import { useHistory } from '../../contexts/HistoryContext';
import { SessionCard } from './SessionCard';

export const SessionList: React.FC = () => {
  const { sessions, search, clearAll, isLoading } = useHistory();
  const [searchQuery, setSearchQuery] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) {
      return sessions;
    }
    return search(searchQuery);
  }, [sessions, searchQuery, search]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b border-zinc-800">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sessions..."
            className="w-full pl-9 pr-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto">
        {filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            {searchQuery ? (
              <>
                <Search size={32} className="text-zinc-600 mb-3" />
                <p className="text-zinc-400 text-sm">No sessions match your search</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-purple-400 text-xs mt-2 hover:underline"
                >
                  Clear search
                </button>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                  <span className="text-3xl">🎬</span>
                </div>
                <h3 className="text-zinc-300 font-medium mb-1">No History Yet</h3>
                <p className="text-zinc-500 text-sm">
                  Your generation sessions will appear here
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {filteredSessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        )}
      </div>

      {/* Clear All Button */}
      {sessions.length > 0 && (
        <div className="p-3 border-t border-zinc-800">
          {showClearConfirm ? (
            <div className="flex items-center gap-2">
              <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
              <span className="text-xs text-zinc-400 flex-1">Delete all?</span>
              <button
                onClick={() => {
                  clearAll();
                  setShowClearConfirm(false);
                }}
                className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white text-xs rounded transition-colors"
              >
                Yes
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-2 py-1 bg-zinc-700 hover:bg-zinc-600 text-white text-xs rounded transition-colors"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="w-full flex items-center justify-center gap-2 py-2 text-zinc-400 hover:text-red-400 text-xs transition-colors"
            >
              <Trash2 size={14} />
              <span>Clear All History</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
