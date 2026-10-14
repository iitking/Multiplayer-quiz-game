import React from 'react';
import { useCountdown } from '../hooks/useCountdown';
import { useGame } from '../context/GameContext';

export function Timer({ endsAt, duration, bonusTime = 0, onExpire }) {
  const { clockOffset, sound } = useGame();

  const { remainingSeconds, progressPercent, isExpired } = useCountdown({
    endsAt,
    duration,
    clockOffset,
    bonusTime,
    onTick: () => sound.playTick(),
    onExpire
  });

  const isLowTime = remainingSeconds <= 5 && !isExpired;

  // SVG circular properties
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  let strokeColor = 'stroke-purple-500';
  if (remainingSeconds <= 3) {
    strokeColor = 'stroke-red-500';
  } else if (remainingSeconds <= 6) {
    strokeColor = 'stroke-amber-400';
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24 flex items-center justify-center">
        {/* SVG background circle */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r={radius}
            className="stroke-white/10"
            strokeWidth="7"
            fill="transparent"
          />
          <circle
            cx="48"
            cy="48"
            r={radius}
            className={`${strokeColor} transition-all duration-100 ease-linear`}
            strokeWidth="7"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        {/* Center Countdown number */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`font-black tracking-tighter ${
              isLowTime
                ? 'text-3xl text-red-400 animate-pulse scale-110'
                : 'text-2xl text-white'
            } transition-transform`}
          >
            {remainingSeconds}
          </span>
          <span className="text-[10px] uppercase font-bold text-slate-400 -mt-1 tracking-wider">
            SEC
          </span>
        </div>
      </div>

      {bonusTime > 0 && (
        <span className="mt-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          +{bonusTime}s Freeze
        </span>
      )}
    </div>
  );
}
