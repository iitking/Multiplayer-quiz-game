import React, { useState } from 'react';
import { useGame } from './context/GameContext';
import { Navbar } from './components/Navbar';
import { Toast } from './components/Toast';
import { Home } from './pages/Home';
import { Lobby } from './pages/Lobby';
import { QuestionScreen } from './pages/QuestionScreen';
import { QuestionResultScreen } from './pages/QuestionResultScreen';
import { ResultsScreen } from './pages/ResultsScreen';
import { CreateQuizModal } from './components/CreateQuizModal';
import { AIQuizModal } from './components/AIQuizModal';
import { AuthModal } from './components/AuthModal';
import { HistoryModal } from './components/HistoryModal';
import { Flame } from 'lucide-react';

export function App() {
  const { gameState } = useGame();

  // Modals state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-purple-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenCreate={() => setIsCreateOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenAI={() => setIsAIOpen(true)}
      />

      {/* Global In-Game Toast */}
      <Toast />

      {/* Main Screen Router */}
      <main className="flex-1">
        {/* STARTING COUNTDOWN OVERLAY */}
        {gameState === 'STARTING' && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl">
            <div className="text-center space-y-4 animate-pulse">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-400 to-purple-600 flex items-center justify-center text-4xl mx-auto shadow-2xl shadow-purple-500/50">
                <Flame className="w-10 h-10 text-white fill-current" />
              </div>
              <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight">
                GET READY!
              </h2>
              <p className="text-lg text-purple-300 font-bold">
                Round 1 begins in 3 seconds...
              </p>
            </div>
          </div>
        )}

        {/* Dynamic Views */}
        {gameState === 'IDLE' && (
          <Home
            onOpenCreate={() => setIsCreateOpen(true)}
            onOpenAI={() => setIsAIOpen(true)}
          />
        )}

        {gameState === 'LOBBY' && <Lobby />}

        {gameState === 'QUESTION_ACTIVE' && <QuestionScreen />}

        {gameState === 'QUESTION_RESULT' && <QuestionResultScreen />}

        {gameState === 'FINISHED' && <ResultsScreen onHome={() => {}} />}
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-white/5 text-center text-xs text-slate-500">
        <p>🎮 QuizArena — Real-Time Multiplayer Trivia Engine</p>
        <p className="mt-1 text-[11px] text-slate-600">Synced Timer • Live Leaderboard • Team Battles • AI Questions</p>
      </footer>

      {/* Modals */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <CreateQuizModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      <AIQuizModal isOpen={isAIOpen} onClose={() => setIsAIOpen(false)} />
      <HistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
    </div>
  );
}
