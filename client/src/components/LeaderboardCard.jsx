import React, { useState } from 'react';
import { Trophy, Medal, Users, User } from 'lucide-react';
import { useGame } from '../context/GameContext';

const TEAM_MAP = {
  red: { name: 'Red Dragons', emoji: '🔴', color: 'text-red-400', bar: 'bg-red-500' },
  blue: { name: 'Blue Sharks', emoji: '🔵', color: 'text-blue-400', bar: 'bg-blue-500' },
  green: { name: 'Green Vipers', emoji: '🟢', color: 'text-green-400', bar: 'bg-green-500' },
  yellow: { name: 'Yellow Titans', emoji: '🟡', color: 'text-yellow-400', bar: 'bg-yellow-500' }
};

export function LeaderboardCard({
  leaderboard = [],
  teams = [],
  teamScores = {},
  isTeamMode = false,
  maxDisplay = 10
}) {
  const { player: currentPlayer } = useGame();
  const [tab, setTab] = useState(isTeamMode ? 'teams' : 'solo');

  const topPlayers = leaderboard.slice(0, maxDisplay);

  const getRankBadge = (rank) => {
    if (rank === 1) {
      return (
        <div className="w-7 h-7 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-black text-xs shadow-md shadow-amber-400/20">
          🥇
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="w-7 h-7 rounded-full bg-slate-300 text-slate-900 flex items-center justify-center font-black text-xs shadow-md">
          🥈
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="w-7 h-7 rounded-full bg-amber-700 text-amber-100 flex items-center justify-center font-black text-xs shadow-md">
          🥉
        </div>
      );
    }
    return (
      <span className="w-7 text-center font-bold text-xs text-slate-400">
        #{rank}
      </span>
    );
  };

  return (
    <div className="w-full rounded-2xl glass-panel p-5 shadow-2xl">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h3 className="font-extrabold text-lg text-white">Live Leaderboard</h3>
        </div>

        {/* Solo vs Team toggle if team mode active */}
        {isTeamMode && (
          <div className="flex items-center bg-slate-900/80 p-0.5 rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => setTab('solo')}
              className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                tab === 'solo' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3 h-3" /> Solo
            </button>
            <button
              onClick={() => setTab('teams')}
              className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                tab === 'teams' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3 h-3" /> Teams
            </button>
          </div>
        )}
      </div>

      {tab === 'solo' ? (
        <div className="space-y-2">
          {topPlayers.length === 0 ? (
            <p className="text-center text-sm text-slate-500 py-4">No scores recorded yet</p>
          ) : (
            topPlayers.map((item) => {
              const isMe = currentPlayer && currentPlayer.id === item.playerId;
              const teamInfo = item.team ? TEAM_MAP[item.team] : null;

              return (
                <div
                  key={item.playerId}
                  className={`flex items-center justify-between p-3 rounded-xl border transition ${
                    isMe
                      ? 'bg-purple-950/50 border-purple-500/40 shadow-md shadow-purple-500/10'
                      : 'bg-white/5 border-white/5 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {getRankBadge(item.rank)}
                    <span className="text-lg">{item.avatar || '👤'}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-200 truncate">
                          {item.name}
                        </span>
                        {isMe && (
                          <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300">
                            YOU
                          </span>
                        )}
                      </div>
                      {teamInfo && (
                        <span className={`text-[10px] font-bold ${teamInfo.color}`}>
                          {teamInfo.emoji} {teamInfo.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono font-black text-base text-amber-300">
                      {item.score.toLocaleString()}
                    </span>
                    <span className="text-[10px] block text-slate-500 font-bold uppercase -mt-1">
                      PTS
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {teams.map((t, idx) => {
            const teamMeta = TEAM_MAP[t.team] || { name: t.team, emoji: '🛡️', color: 'text-purple-400', bar: 'bg-purple-500' };
            const highestScore = teams[0]?.score || 1;
            const widthPercent = highestScore > 0 ? Math.round((t.score / highestScore) * 100) : 0;

            return (
              <div key={t.team} className="p-3 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{teamMeta.emoji}</span>
                    <span className={`font-bold text-sm ${teamMeta.color}`}>
                      #{idx + 1} {teamMeta.name}
                    </span>
                  </div>
                  <span className="font-mono font-black text-amber-300 text-sm">
                    {t.score.toLocaleString()} pts
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={`h-full ${teamMeta.bar} rounded-full transition-all duration-500`}
                    style={{ width: `${Math.max(5, widthPercent)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
