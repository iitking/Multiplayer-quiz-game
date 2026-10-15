import React from 'react';
import { Scissors, Zap, Clock, Sparkles } from 'lucide-react';
import { useGame } from '../context/GameContext';

export function PowerUpBar({ disabled = false }) {
  const { player, usePowerUp, eliminatedOptions, activeMultiplier, bonusTime } = useGame();

  const powerUps = player?.powerUps || { fiftyFifty: true, doublePoints: true, extraTime: true };

  const handleUse = (type) => {
    if (disabled) return;
    usePowerUp(type);
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 py-2">
      {/* 50/50 */}
      <button
        type="button"
        onClick={() => handleUse('fiftyFifty')}
        disabled={disabled || !powerUps.fiftyFifty || eliminatedOptions.length > 0}
        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm border transition-all ${
          eliminatedOptions.length > 0
            ? 'bg-purple-600 text-white border-purple-400 ring-2 ring-purple-400/50 shadow-lg'
            : powerUps.fiftyFifty
            ? 'bg-slate-900/80 hover:bg-purple-950/60 border-purple-500/30 text-purple-300 hover:text-white hover:border-purple-400 shadow-md active:scale-95'
            : 'bg-white/5 border-white/5 text-slate-500 cursor-not-allowed opacity-40 line-through'
        }`}
        title="Eliminate 2 wrong answers"
      >
        <Scissors className="w-4 h-4 text-purple-400" />
        <span>50/50</span>
        {powerUps.fiftyFifty && eliminatedOptions.length === 0 && (
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        )}
      </button>

      {/* 2x Double Points */}
      <button
        type="button"
        onClick={() => handleUse('doublePoints')}
        disabled={disabled || !powerUps.doublePoints || activeMultiplier > 1}
        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm border transition-all ${
          activeMultiplier > 1
            ? 'bg-amber-500 text-slate-950 border-amber-300 ring-2 ring-amber-300/50 shadow-lg shadow-amber-500/20'
            : powerUps.doublePoints
            ? 'bg-slate-900/80 hover:bg-amber-950/60 border-amber-500/30 text-amber-300 hover:text-white hover:border-amber-400 shadow-md active:scale-95'
            : 'bg-white/5 border-white/5 text-slate-500 cursor-not-allowed opacity-40 line-through'
        }`}
        title="Double score for this question"
      >
        <Zap className="w-4 h-4 text-amber-400" />
        <span>2x Points</span>
        {activeMultiplier > 1 && (
          <span className="text-[10px] bg-slate-950 text-amber-300 px-1 rounded font-black">
            ACTIVE
          </span>
        )}
      </button>

      {/* Extra Time */}
      <button
        type="button"
        onClick={() => handleUse('extraTime')}
        disabled={disabled || !powerUps.extraTime || bonusTime > 0}
        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm border transition-all ${
          bonusTime > 0
            ? 'bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-400/50 shadow-lg'
            : powerUps.extraTime
            ? 'bg-slate-900/80 hover:bg-emerald-950/60 border-emerald-500/30 text-emerald-300 hover:text-white hover:border-emerald-400 shadow-md active:scale-95'
            : 'bg-white/5 border-white/5 text-slate-500 cursor-not-allowed opacity-40 line-through'
        }`}
        title="Add +5 seconds extra time"
      >
        <Clock className="w-4 h-4 text-emerald-400" />
        <span>+5s Time</span>
        {bonusTime > 0 && (
          <span className="text-[10px] bg-emerald-950 text-emerald-300 px-1 rounded font-black">
            +5s
          </span>
        )}
      </button>
    </div>
  );
}
