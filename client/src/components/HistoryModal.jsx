import React, { useState, useEffect } from 'react';
import { X, History, Trophy, Calendar, Users, Shield } from 'lucide-react';

export function HistoryModal({ isOpen, onClose }) {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    async function fetchHistory() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/history?limit=15');
        const data = await res.json();
        if (data.success && data.data) {
          setHistory(data.data);
        }
      } catch (err) {
        console.warn('Failed to fetch history:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchHistory();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-white/10 shadow-2xl overflow-hidden my-8 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">Match History</h3>
              <p className="text-xs text-slate-400">Past tournament records, podium results & winners</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="py-12 text-center text-sm text-slate-400">Loading past matches...</div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <History className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-semibold">No finished matches on record yet.</p>
              <p className="text-xs text-slate-600 mt-1">Play a multiplayer game to see tournament history here!</p>
            </div>
          ) : (
            history.map((record) => {
              const topWinner = record.players?.find((p) => p.rank === 1) || record.players?.[0];
              const dateStr = record.playedAt ? new Date(record.playedAt).toLocaleDateString() : 'Recent';

              return (
                <div
                  key={record._id || record.id}
                  className="p-4 rounded-2xl bg-slate-950/80 border border-white/5 hover:border-white/15 transition space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 mr-2">
                        ROOM {record.roomCode}
                      </span>
                      <span className="text-xs text-slate-400 inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {dateStr}
                      </span>
                    </div>
                    {record.mode === 'team' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
                        <Shield className="w-3 h-3" /> Team Mode
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="font-extrabold text-base text-white">{record.quizTitle}</h4>
                    <p className="text-xs text-slate-400">Host: {record.hostName || 'Host'} • {record.totalQuestions} Questions</p>
                  </div>

                  {/* Top players snapshot */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                    <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      <span>Winner: {topWinner?.name || 'Player'}</span>
                      <span className="font-mono text-slate-400">({topWinner?.score?.toLocaleString()} pts)</span>
                    </div>

                    <div className="flex items-center gap-1 text-slate-400">
                      <Users className="w-3.5 h-3.5" />
                      <span>{record.players?.length || 0} participants</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
