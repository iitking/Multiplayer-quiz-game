import React from 'react';
import { Check, X } from 'lucide-react';

const SHAPES = [
  { icon: '▲', name: 'Triangle', baseColor: 'from-rose-500 to-red-600', ringColor: 'ring-red-400', border: 'border-red-400/40' },
  { icon: '◆', name: 'Diamond', baseColor: 'from-blue-500 to-indigo-600', ringColor: 'ring-blue-400', border: 'border-blue-400/40' },
  { icon: '●', name: 'Circle', baseColor: 'from-amber-400 to-yellow-500', ringColor: 'ring-yellow-300', border: 'border-yellow-400/40' },
  { icon: '■', name: 'Square', baseColor: 'from-emerald-500 to-teal-600', ringColor: 'ring-emerald-400', border: 'border-emerald-400/40' },
];

export function AnswerButton({
  index,
  text,
  onClick,
  isSelected,
  isDisabled,
  isEliminated,
  revealResult = false,
  isCorrect = false,
  statCount = null,
  totalAnswered = 0
}) {
  const shape = SHAPES[index % 4];

  // Elimination by 50/50
  if (isEliminated) {
    return (
      <div className="relative min-h-[90px] rounded-2xl bg-white/5 border border-dashed border-white/10 opacity-30 flex items-center justify-center p-4 cursor-not-allowed select-none">
        <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">
          ✂️ 50/50 Eliminated
        </span>
      </div>
    );
  }

  // Visual state styling
  let containerStyle = `bg-gradient-to-br ${shape.baseColor} border ${shape.border} text-white shadow-lg active:scale-95 transition-all duration-150`;

  if (revealResult) {
    if (isCorrect) {
      containerStyle = 'bg-gradient-to-br from-emerald-500 to-teal-600 border-2 border-emerald-300 text-white shadow-xl shadow-emerald-500/30 scale-[1.02] ring-4 ring-emerald-400/40';
    } else {
      containerStyle = 'bg-slate-800/60 border border-white/5 text-slate-400 opacity-40';
    }
  } else if (isSelected) {
    containerStyle += ` ring-4 ${shape.ringColor} scale-[1.02] shadow-2xl`;
  }

  const statPercent = totalAnswered > 0 && statCount !== null ? Math.round((statCount / totalAnswered) * 100) : 0;

  return (
    <button
      type="button"
      onClick={() => !isDisabled && onClick(index)}
      disabled={isDisabled}
      className={`relative w-full min-h-[95px] md:min-h-[110px] p-4 md:p-5 rounded-2xl flex items-center justify-between gap-4 text-left font-bold overflow-hidden group cursor-pointer disabled:cursor-default ${containerStyle}`}
    >
      {/* Background shape watermark */}
      <span className="absolute -right-3 -bottom-4 text-6xl md:text-7xl opacity-15 pointer-events-none select-none font-black">
        {shape.icon}
      </span>

      <div className="flex items-center gap-3.5 z-10 w-full">
        {/* Shape icon pill */}
        <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-black/25 backdrop-blur-sm flex items-center justify-center text-lg md:text-xl font-black shrink-0 border border-white/15">
          {shape.icon}
        </div>

        {/* Text */}
        <span className="text-base md:text-lg lg:text-xl font-bold tracking-tight text-white leading-snug drop-shadow-sm flex-1">
          {text}
        </span>
      </div>

      {/* Selected Indicator or Reveal Status */}
      <div className="z-10 shrink-0">
        {revealResult ? (
          isCorrect ? (
            <div className="w-9 h-9 rounded-full bg-emerald-400 text-emerald-950 flex items-center justify-center font-black shadow-md">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
          ) : isSelected ? (
            <div className="w-9 h-9 rounded-full bg-red-500 text-white flex items-center justify-center font-black shadow-md">
              <X className="w-6 h-6 stroke-[3]" />
            </div>
          ) : null
        ) : isSelected ? (
          <div className="w-8 h-8 rounded-full bg-white text-slate-900 flex items-center justify-center font-black shadow-md animate-pulse">
            <Check className="w-5 h-5 stroke-[3]" />
          </div>
        ) : null}
      </div>

      {/* Answer percentage bar in result phase */}
      {revealResult && statCount !== null && (
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/40">
          <div
            className={`h-full ${isCorrect ? 'bg-emerald-300' : 'bg-white/40'}`}
            style={{ width: `${statPercent}%` }}
          />
        </div>
      )}
    </button>
  );
}
