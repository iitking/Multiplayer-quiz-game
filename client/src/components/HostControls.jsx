import React from 'react';
import { FastForward, SkipForward, PowerOff, Copy, Check, Crown } from 'lucide-react';
import { useGame } from '../context/GameContext';

export function HostControls({ canAdvance = false, onNext, onSkip }) {
  const { player, roomCode, gameState, skipQuestion, nextQuestion, showToast, socket } = useGame();
  const [copied, setCopied] = React.useState(false);

  if (!player?.isHost) return null;

  const copyCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      showToast(`Copied room code: ${roomCode}`, 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleEndGame = () => {
    if (window.confirm('Are you sure you want to end the game early for all players?')) {
      socket.emit('end_game_early', { code: roomCode });
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 p-2 rounded-2xl bg-slate-900/90 border border-purple-500/40 backdrop-blur-xl shadow-2xl shadow-purple-950/50">
      <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-300 rounded-xl text-xs font-bold border border-amber-500/20">
        <Crown className="w-3.5 h-3.5 text-amber-400" />
        <span className="hidden sm:inline">HOST</span>
      </div>

      {/* Copy Code */}
      <button
        onClick={copyCode}
        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition"
        title="Copy Room Code"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        <span className="hidden md:inline font-mono">{roomCode}</span>
      </button>

      {/* Skip Question (during active question) */}
      {gameState === 'QUESTION_ACTIVE' && (
        <button
          onClick={skipQuestion}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold transition"
        >
          <SkipForward className="w-3.5 h-3.5" />
          Skip
        </button>
      )}

      {/* Next Question (during result review) */}
      {gameState === 'QUESTION_RESULT' && (
        <button
          onClick={nextQuestion}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition shadow-md shadow-purple-600/30 animate-bounce-subtle"
        >
          <FastForward className="w-3.5 h-3.5" />
          Next Question
        </button>
      )}

      {/* End Game */}
      {gameState !== 'FINISHED' && (
        <button
          onClick={handleEndGame}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 text-xs font-bold transition"
          title="End Game for Everyone"
        >
          <PowerOff className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">End Game</span>
        </button>
      )}
    </div>
  );
}
