import React from 'react';
import { Crown, UserX, WifiOff, Users } from 'lucide-react';
import { useGame } from '../context/GameContext';

const TEAM_MAP = {
  red: { name: 'Red Dragons', emoji: '🔴', bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' },
  blue: { name: 'Blue Sharks', emoji: '🔵', bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
  green: { name: 'Green Vipers', emoji: '🟢', bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400' },
  yellow: { name: 'Yellow Titans', emoji: '🟡', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400' }
};

export function PlayerList({ players, isHostView = false, onKick = null }) {
  const { player: currentPlayer } = useGame();

  if (!players || players.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400 border border-dashed border-white/10 rounded-2xl">
        <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm font-medium">Waiting for players to join with the room code...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {players.map((p) => {
        const isMe = currentPlayer && currentPlayer.id === p.id;
        const teamInfo = p.team ? TEAM_MAP[p.team] : null;

        return (
          <div
            key={p.id}
            className={`relative rounded-2xl p-3.5 flex items-center justify-between gap-3 border transition-all ${
              isMe
                ? 'bg-purple-950/40 border-purple-500/40 shadow-lg shadow-purple-500/10'
                : 'bg-slate-900/60 border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xl shrink-0">
                {p.avatar || '👤'}
              </div>

              {/* Player details */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-slate-100 truncate">
                    {p.name}
                  </span>
                  {p.isHost && (
                    <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" title="Host" />
                  )}
                </div>

                <div className="flex items-center gap-1.5 mt-0.5">
                  {isMe && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300">
                      YOU
                    </span>
                  )}
                  {teamInfo && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${teamInfo.bg} ${teamInfo.text} border ${teamInfo.border}`}>
                      {teamInfo.emoji} {teamInfo.name.split(' ')[0]}
                    </span>
                  )}
                  {p.connected === false && (
                    <span className="flex items-center gap-0.5 text-[10px] text-amber-400 font-medium">
                      <WifiOff className="w-2.5 h-2.5" /> Offline
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Host Kick action */}
            {isHostView && !p.isHost && onKick && (
              <button
                type="button"
                onClick={() => onKick(p.id)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition shrink-0"
                title={`Kick ${p.name}`}
              >
                <UserX className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
