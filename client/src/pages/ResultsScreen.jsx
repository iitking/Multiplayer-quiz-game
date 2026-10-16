import React from 'react';
import { useGame } from '../context/GameContext';
import { LeaderboardCard } from '../components/LeaderboardCard';
import { Trophy, Crown, RotateCcw, Home, Sparkles, Shield } from 'lucide-react';

const TEAM_NAMES = {
  red: '🔴 Red Dragons',
  blue: '🔵 Blue Sharks',
  green: '🟢 Green Vipers',
  yellow: '🟡 Yellow Titans'
};

export function ResultsScreen({ onHome }) {
  const { gameOverData, leaderboard, teams, teamScores, room, leaveRoom } = useGame();

  const isTeamMode = room?.mode === 'team';
  const podium = gameOverData?.podium || leaderboard.slice(0, 3);
  const winningTeam = gameOverData?.winningTeam;

  const first = podium[0];
  const second = podium[1];
  const third = podium[2];

  const handleReturnHome = () => {
    leaveRoom();
    if (onHome) onHome();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
      {/* Game Over Title */}
      <div className="text-center mb-10 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Match Finished
        </div>
        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight">
          Tournament <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300 bg-clip-text text-transparent">Podium</span>
        </h1>

        {/* Team Winner Banner if Team Mode */}
        {isTeamMode && winningTeam && (
          <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500/20 to-purple-500/20 border border-amber-500/40 text-amber-300 font-black text-base shadow-lg">
            <Shield className="w-5 h-5 text-amber-400" />
            <span>Winning Team: {TEAM_NAMES[winningTeam] || winningTeam.toUpperCase()}</span>
          </div>
        )}
      </div>

      {/* 3D-Style Podium (Top 3) */}
      <div className="max-w-2xl mx-auto flex items-end justify-center gap-3 sm:gap-6 mb-12 pt-10">
        {/* 2nd Place */}
        {second && (
          <div className="flex-1 flex flex-col items-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-800 border-2 border-slate-400 flex items-center justify-center text-2xl sm:text-3xl shadow-xl relative -mb-3 z-10">
              {second.avatar || '🥈'}
              <span className="absolute -top-2.5 -right-2 text-base">🥈</span>
            </div>
            <div className="w-full bg-gradient-to-t from-slate-900 to-slate-800 border border-slate-700/50 rounded-2xl pt-6 pb-4 px-3 text-center shadow-lg h-36 flex flex-col justify-between">
              <div>
                <span className="font-extrabold text-sm text-slate-200 block truncate">
                  {second.name}
                </span>
                <span className="text-xs font-mono font-bold text-slate-400">
                  {second.score.toLocaleString()} pts
                </span>
              </div>
              <span className="font-black text-2xl text-slate-400 font-mono">#2</span>
            </div>
          </div>
        )}

        {/* 1st Place (Champion) */}
        {first && (
          <div className="flex-1 flex flex-col items-center">
            <div className="relative -mb-4 z-10 flex flex-col items-center">
              <Crown className="w-8 h-8 text-amber-400 animate-bounce -mb-1 filter drop-shadow" />
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 border-4 border-amber-300 flex items-center justify-center text-3xl sm:text-4xl shadow-2xl shadow-amber-500/30">
                {first.avatar || '🥇'}
              </div>
            </div>
            <div className="w-full bg-gradient-to-t from-amber-950/80 via-slate-900 to-slate-800 border-2 border-amber-500/40 rounded-2xl pt-8 pb-5 px-3 text-center shadow-2xl h-48 flex flex-col justify-between">
              <div>
                <span className="font-black text-base sm:text-lg text-amber-300 block truncate">
                  {first.name}
                </span>
                <span className="text-sm font-mono font-extrabold text-white">
                  {first.score.toLocaleString()} pts
                </span>
              </div>
              <span className="font-black text-3xl text-amber-400 font-mono">#1</span>
            </div>
          </div>
        )}

        {/* 3rd Place */}
        {third && (
          <div className="flex-1 flex flex-col items-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-950 border-2 border-amber-700 flex items-center justify-center text-2xl sm:text-3xl shadow-xl relative -mb-3 z-10">
              {third.avatar || '🥉'}
              <span className="absolute -top-2.5 -right-2 text-base">🥉</span>
            </div>
            <div className="w-full bg-gradient-to-t from-slate-900 to-slate-800 border border-slate-700/50 rounded-2xl pt-6 pb-4 px-3 text-center shadow-lg h-28 flex flex-col justify-between">
              <div>
                <span className="font-extrabold text-sm text-slate-200 block truncate">
                  {third.name}
                </span>
                <span className="text-xs font-mono font-bold text-slate-400">
                  {third.score.toLocaleString()} pts
                </span>
              </div>
              <span className="font-black text-2xl text-amber-700 font-mono">#3</span>
            </div>
          </div>
        )}
      </div>

      {/* Full Leaderboard Breakdown */}
      <div className="mb-10">
        <LeaderboardCard
          leaderboard={leaderboard}
          teams={teams}
          teamScores={teamScores}
          isTeamMode={isTeamMode}
          maxDisplay={20}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={handleReturnHome}
          className="py-4 px-8 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-lg transition shadow-xl shadow-purple-600/30 flex items-center gap-2"
        >
          <Home className="w-5 h-5" /> Back to Home
        </button>
      </div>
    </div>
  );
}
