import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { PlayerList } from '../components/PlayerList';
import { TeamSelector } from '../components/TeamSelector';
import { Copy, Check, Play, Crown, Users, Sparkles, Shield } from 'lucide-react';

export function Lobby() {
  const { roomCode, room, player, players, startGame, kickPlayer, switchTeam, showToast } = useGame();
  const [copied, setCopied] = useState(false);

  const isHost = player?.isHost;
  const isTeamMode = room?.mode === 'team';

  const copyRoomCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      showToast(`Copied room code: ${roomCode}`, 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Top Room Banner */}
      <div className="text-center mb-8 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold">
          {isTeamMode ? (
            <>
              <Shield className="w-3.5 h-3.5 text-amber-400" /> Team War Mode Active
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Solo Match
            </>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          {room?.quizTitle || 'Multiplayer Trivia Room'}
        </h1>

        {/* Big Room Code Display */}
        <div className="inline-block">
          <div className="flex items-center justify-center gap-3 bg-slate-900/90 border-2 border-purple-500/40 rounded-3xl px-8 py-4 shadow-2xl shadow-purple-900/30">
            <div className="text-left">
              <span className="text-[11px] font-black uppercase text-purple-400 tracking-widest block">
                JOIN CODE
              </span>
              <span className="font-mono font-black text-4xl sm:text-6xl text-white tracking-widest">
                {roomCode}
              </span>
            </div>
            <button
              type="button"
              onClick={copyRoomCode}
              className="p-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white transition shadow-lg shadow-purple-600/30 ml-2"
              title="Copy Room Code"
            >
              {copied ? <Check className="w-6 h-6 stroke-[3]" /> : <Copy className="w-6 h-6" />}
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2 font-medium">
            Share this 4-digit code with friends on other devices/tabs to join
          </p>
        </div>
      </div>

      {/* Team Selection Section if Team Mode */}
      {isTeamMode && (
        <div className="mb-6 p-4 rounded-2xl glass-panel">
          <TeamSelector
            currentTeam={player?.team}
            onSelectTeam={(teamId) => switchTeam(teamId)}
          />
        </div>
      )}

      {/* Players in Lobby Section */}
      <div className="rounded-3xl glass-panel p-6 sm:p-8 shadow-2xl mb-8">
        <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            <h3 className="font-extrabold text-lg text-white">
              Players in Lobby ({players.length})
            </h3>
          </div>
          {isHost && (
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
              <Crown className="w-3.5 h-3.5" /> You are Host
            </span>
          )}
        </div>

        {/* Player List Grid */}
        <PlayerList
          players={players}
          isHostView={isHost}
          onKick={(playerId) => kickPlayer(playerId)}
        />
      </div>

      {/* Action / Launch Section */}
      <div className="text-center">
        {isHost ? (
          <button
            type="button"
            onClick={startGame}
            className="w-full sm:w-auto min-w-[280px] py-4 px-8 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-xl transition shadow-xl shadow-emerald-500/25 active:scale-95 inline-flex items-center justify-center gap-3 animate-pulse"
          >
            <Play className="w-6 h-6 fill-current" /> START GAME
          </button>
        ) : (
          <div className="inline-flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/30 text-purple-300 font-bold text-sm">
            <span className="w-3 h-3 rounded-full bg-purple-400 animate-ping" />
            Waiting for the host to start the game...
          </div>
        )}
      </div>
    </div>
  );
}
