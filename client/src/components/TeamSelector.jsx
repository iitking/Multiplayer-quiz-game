import React from 'react';
import { Shield } from 'lucide-react';
import { useGame } from '../context/GameContext';

const TEAMS = [
  { id: 'red', name: 'Red Dragons', emoji: '🔴', color: 'from-red-600 to-rose-700', border: 'border-red-500/40', text: 'text-red-400' },
  { id: 'blue', name: 'Blue Sharks', emoji: '🔵', color: 'from-blue-600 to-indigo-700', border: 'border-blue-500/40', text: 'text-blue-400' },
  { id: 'green', name: 'Green Vipers', emoji: '🟢', color: 'from-emerald-600 to-teal-700', border: 'border-emerald-500/40', text: 'text-emerald-400' },
  { id: 'yellow', name: 'Yellow Titans', emoji: '🟡', color: 'from-amber-500 to-yellow-600', border: 'border-yellow-500/40', text: 'text-yellow-400' }
];

export function TeamSelector({ currentTeam, onSelectTeam }) {
  const { players } = useGame();

  const getTeamMemberCount = (teamId) => {
    return players.filter((p) => p.team === teamId).length;
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="w-4 h-4 text-purple-400" />
        <h4 className="text-sm font-bold text-slate-200">Choose Your Team</h4>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {TEAMS.map((t) => {
          const isSelected = currentTeam === t.id;
          const count = getTeamMemberCount(t.id);

          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelectTeam(t.id)}
              className={`p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? `bg-gradient-to-br ${t.color} border-white/40 ring-2 ring-white/30 text-white shadow-lg scale-[1.02]`
                  : `bg-slate-900/60 ${t.border} hover:bg-slate-800/80 text-slate-300`
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-lg">{t.emoji}</span>
                <span className={`text-[11px] font-black px-1.5 py-0.5 rounded ${isSelected ? 'bg-black/30 text-white' : 'bg-white/5 text-slate-400'}`}>
                  {count} {count === 1 ? 'player' : 'players'}
                </span>
              </div>
              <div className="font-bold text-xs truncate">
                {t.name}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
