import React from 'react';
import { useGame } from '../context/GameContext';
import { AnswerButton } from '../components/AnswerButton';
import { LeaderboardCard } from '../components/LeaderboardCard';
import { HostControls } from '../components/HostControls';
import { CheckCircle2, XCircle, ArrowRight, Lightbulb, Users } from 'lucide-react';

export function QuestionResultScreen() {
  const {
    currentQuestion,
    questionIndex,
    totalQuestions,
    questionResult,
    selectedOption,
    nextQuestion,
    player,
    leaderboard,
    teams,
    teamScores,
    room
  } = useGame();

  if (!questionResult) return null;

  const isHost = player?.isHost;
  const isTeamMode = room?.mode === 'team';
  const { correctIndex, explanation, stats, isLastQuestion } = questionResult;
  const wasCorrect = selectedOption !== null && selectedOption === correctIndex;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8 pb-28">
      {/* Top Result Banner */}
      <div className="text-center mb-6 space-y-2">
        <div className="inline-block">
          {selectedOption === null ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-800 text-slate-300 font-bold text-sm">
              <Users className="w-4 h-4" /> Time's up! Let's see the answers.
            </div>
          ) : wasCorrect ? (
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-black text-lg animate-bounce-subtle">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              Correct! Great Job! 🎉
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-300 font-black text-lg">
              <XCircle className="w-6 h-6 text-rose-400" />
              Incorrect! Better luck next question!
            </div>
          )}
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white">
          {currentQuestion?.text}
        </h2>
      </div>

      {/* Answer Options with Breakdown Stats and Correct Highlight */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6">
        {currentQuestion?.options.map((opt, idx) => (
          <AnswerButton
            key={idx}
            index={idx}
            text={opt}
            isSelected={selectedOption === idx}
            revealResult={true}
            isCorrect={idx === correctIndex}
            statCount={stats?.optionCounts?.[idx] || 0}
            totalAnswered={stats?.totalAnswered || 0}
          />
        ))}
      </div>

      {/* Explanation Box */}
      {explanation && (
        <div className="mb-6 p-4 rounded-2xl bg-purple-950/30 border border-purple-500/20 flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-xs uppercase tracking-wider text-purple-300 block mb-0.5">
              Did you know?
            </span>
            <p className="text-sm text-slate-200 leading-relaxed">{explanation}</p>
          </div>
        </div>
      )}

      {/* Mini Leaderboard */}
      <div className="mb-8">
        <LeaderboardCard
          leaderboard={leaderboard}
          teams={teams}
          teamScores={teamScores}
          isTeamMode={isTeamMode}
          maxDisplay={5}
        />
      </div>

      {/* Advance Section */}
      <div className="text-center">
        {isHost ? (
          <button
            type="button"
            onClick={nextQuestion}
            className="py-4 px-8 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white font-black text-lg transition shadow-xl shadow-purple-600/30 inline-flex items-center gap-2 active:scale-95"
          >
            <span>{isLastQuestion ? 'View Final Results' : 'Next Question'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        ) : (
          <p className="text-xs text-slate-400 font-semibold animate-pulse">
            Waiting for the host to advance to the next round...
          </p>
        )}
      </div>

      {/* Floating Host Controls */}
      <HostControls />
    </div>
  );
}
