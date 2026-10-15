import React from 'react';
import { useGame } from '../context/GameContext';
import { Timer } from '../components/Timer';
import { AnswerButton } from '../components/AnswerButton';
import { PowerUpBar } from '../components/PowerUpBar';
import { MediaViewer } from '../components/MediaViewer';
import { HostControls } from '../components/HostControls';
import { Users, Zap, CheckCircle2 } from 'lucide-react';

export function QuestionScreen() {
  const {
    currentQuestion,
    questionIndex,
    totalQuestions,
    questionDuration,
    endsAt,
    selectedOption,
    hasAnswered,
    answerStats,
    lastSubmissionResult,
    eliminatedOptions,
    bonusTime,
    submitAnswer,
    player
  } = useGame();

  if (!currentQuestion) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 font-bold">Loading question...</p>
        </div>
      </div>
    );
  }

  const isSpectator = player?.isSpectator;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8 pb-24">
      {/* Top Header: Question Index + Live Timer + Players Answering Counter */}
      <div className="flex items-center justify-between gap-4 mb-6">
        {/* Question Counter Pill */}
        <div className="bg-slate-900/80 border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400">QUESTION</span>
          <span className="font-black text-lg text-white">
            {questionIndex + 1} <span className="text-slate-500 font-normal">/ {totalQuestions}</span>
          </span>
        </div>

        {/* Circular Synced Timer */}
        <Timer
          endsAt={endsAt}
          duration={questionDuration}
          bonusTime={bonusTime}
        />

        {/* Players Answered Counter */}
        <div className="bg-slate-900/80 border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-2 text-right">
          <Users className="w-4 h-4 text-purple-400" />
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase">Answered</span>
            <span className="font-mono font-black text-sm text-slate-200">
              {answerStats.answered} / {answerStats.total}
            </span>
          </div>
        </div>
      </div>

      {/* Spectator Notice if spectator */}
      {isSpectator && (
        <div className="mb-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs text-center font-bold">
          👀 Spectator Mode: You joined after the match started. Enjoy watching the live quiz!
        </div>
      )}

      {/* Question Card */}
      <div className="relative rounded-3xl glass-panel p-6 sm:p-10 shadow-2xl mb-6 text-center border-white/10">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-relaxed tracking-tight">
          {currentQuestion.text}
        </h2>

        {/* Image / Audio clues if present */}
        <MediaViewer
          imageUrl={currentQuestion.imageUrl}
          audioUrl={currentQuestion.audioUrl}
        />
      </div>

      {/* Power-up Bar (only for active participants) */}
      {!isSpectator && !hasAnswered && (
        <div className="mb-4">
          <PowerUpBar disabled={hasAnswered} />
        </div>
      )}

      {/* Answer Submission Feedback Banner */}
      {hasAnswered && (
        <div className="mb-6 p-4 rounded-2xl bg-purple-950/50 border border-purple-500/30 flex items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <span className="font-extrabold text-sm sm:text-base text-white block">
                Answer Locked In!
              </span>
              <span className="text-xs text-purple-300">
                Waiting for remaining players or timer to reveal results...
              </span>
            </div>
          </div>
          {lastSubmissionResult?.speedBonus > 0 && (
            <div className="text-right shrink-0 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl">
              <span className="flex items-center gap-1 text-xs font-black text-amber-300">
                <Zap className="w-3.5 h-3.5" /> +{lastSubmissionResult.speedBonus}
              </span>
              <span className="text-[10px] text-amber-400/80 font-bold uppercase block">Speed Bonus</span>
            </div>
          )}
        </div>
      )}

      {/* 4 Colored Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
        {currentQuestion.options.map((opt, idx) => {
          const isSelected = selectedOption === idx;
          const isEliminated = eliminatedOptions.includes(idx);

          return (
            <AnswerButton
              key={idx}
              index={idx}
              text={opt}
              onClick={() => submitAnswer(idx)}
              isSelected={isSelected}
              isDisabled={hasAnswered || isSpectator || isEliminated}
              isEliminated={isEliminated}
            />
          );
        })}
      </div>

      {/* Floating Host Controls */}
      <HostControls />
    </div>
  );
}
