import React from 'react';
import { useGame } from '../context/GameContext';
import { Info, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';

export function Toast() {
  const { toastMessage } = useGame();

  if (!toastMessage) return null;

  const { msg, type = 'info' } = toastMessage;

  const icons = {
    info: <Info className="w-4 h-4 text-sky-400 shrink-0" />,
    success: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />,
  };

  const borders = {
    info: 'border-sky-500/30 bg-sky-950/80',
    success: 'border-emerald-500/30 bg-emerald-950/80',
    warning: 'border-amber-500/30 bg-amber-950/80',
    error: 'border-red-500/30 bg-red-950/80',
  };

  return (
    <div className="fixed top-16 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
      <div className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border backdrop-blur-xl shadow-2xl text-xs sm:text-sm font-semibold text-slate-100 ${borders[type] || borders.info}`}>
        {icons[type] || icons.info}
        <span>{msg}</span>
      </div>
    </div>
  );
}
