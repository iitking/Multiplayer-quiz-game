import React from 'react';
import { Volume2, VolumeX, Sparkles, PlusCircle, History, User, LogOut, Radio } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';

export function Navbar({ onOpenAuth, onOpenCreate, onOpenHistory, onOpenAI }) {
  const { sound, roomCode, isConnected, gameState, leaveRoom } = useGame();
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-md px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => { if (gameState === 'IDLE') {} }}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-400 flex items-center justify-center text-xl shadow-lg shadow-purple-500/25">
            🎮
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                QuizArena
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                LIVE
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              <span>{isConnected ? 'Connected' : 'Reconnecting...'}</span>
            </div>
          </div>
        </div>

        {/* Room Code Badge if in room */}
        {roomCode && (
          <div className="flex items-center gap-2 bg-purple-950/40 border border-purple-500/30 px-3 py-1 rounded-xl">
            <Radio className="w-4 h-4 text-purple-400 animate-pulse" />
            <span className="text-xs text-purple-300 font-medium hidden sm:inline">Room:</span>
            <span className="font-mono font-black text-lg text-purple-300 tracking-wider">{roomCode}</span>
          </div>
        )}

        {/* Actions & Profile */}
        <div className="flex items-center gap-2">
          {/* AI Generator Button */}
          <button
            onClick={onOpenAI}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-pink-500/20 border border-amber-500/30 text-amber-300 hover:text-white hover:border-amber-400 text-xs font-bold transition shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            AI Quiz
          </button>

          {/* Create Quiz Button */}
          <button
            onClick={onOpenCreate}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-semibold transition"
          >
            <PlusCircle className="w-3.5 h-3.5 text-purple-400" />
            Create
          </button>

          {/* History Button */}
          <button
            onClick={onOpenHistory}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition"
            title="Past Matches History"
          >
            <History className="w-4 h-4" />
          </button>

          {/* Sound Toggle */}
          <button
            onClick={sound.toggleMute}
            className={`p-2 rounded-xl border transition ${
              sound.isMuted
                ? 'bg-red-500/10 border-red-500/20 text-red-400'
                : 'bg-white/5 border-white/10 text-slate-300 hover:text-white'
            }`}
            title={sound.isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {sound.isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* User Profile / Auth */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <div className="flex items-center gap-2 bg-slate-900 border border-white/10 px-2.5 py-1 rounded-xl">
                <span className="text-base">{user.avatar || '🦊'}</span>
                <span className="text-xs font-bold text-slate-200 hidden sm:inline">{user.username}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">
                  {user.stats?.wins || 0}🏆
                </span>
              </div>
              <button
                onClick={logout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 transition"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-md shadow-purple-600/20"
            >
              <User className="w-3.5 h-3.5" />
              Sign In
            </button>
          )}

          {/* Leave room button if currently in room */}
          {roomCode && (
            <button
              onClick={leaveRoom}
              className="text-xs px-2.5 py-1 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 font-semibold transition ml-1"
            >
              Leave
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
