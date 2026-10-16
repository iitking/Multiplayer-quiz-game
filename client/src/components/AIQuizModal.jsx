import React, { useState } from 'react';
import { X, Sparkles, Wand2, Check, ArrowRight, Loader2 } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';

export function AIQuizModal({ isOpen, onClose, onQuizGenerated }) {
  const { showToast } = useGame();
  const { user } = useAuth();

  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [questionCount, setQuestionCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuiz, setGeneratedQuiz] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topic.trim()) {
      showToast('Please specify a topic for the quiz', 'warning');
      return;
    }

    setIsGenerating(true);
    setGeneratedQuiz(null);

    try {
      const res = await fetch('/api/quizzes/generate-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          count: questionCount,
          difficulty
        })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Generation failed');
      }

      setGeneratedQuiz(data.data);
      showToast('AI Quiz generated successfully!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAndUse = async () => {
    if (!generatedQuiz) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...generatedQuiz,
          createdBy: user?.username ? `${user.username} (AI)` : 'AI Generator',
          creatorId: user?.id || null
        })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to save quiz');
      }

      showToast('AI Quiz saved to library!', 'success');
      if (onQuizGenerated) onQuizGenerated(data.data);
      onClose();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-purple-500/30 shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Glow Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-purple-950/80 via-slate-900 to-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">AI Quiz Generator</h3>
              <p className="text-xs text-purple-300">Generate intelligent trivia questions on any topic in seconds</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Generation Form */}
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Enter Any Topic
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. JavaScript Frameworks, Harry Potter, Quantum Physics, World Flags..."
                className="w-full bg-slate-950 border border-purple-500/30 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 rounded-2xl px-4 py-3 text-white font-bold text-sm outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Questions Count</label>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none"
                >
                  <option value={3}>3 Questions (Quick)</option>
                  <option value={5}>5 Questions (Standard)</option>
                  <option value={8}>8 Questions (Extended)</option>
                  <option value={10}>10 Questions (Championship)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white font-black text-sm transition shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Questions with AI...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" /> Generate Quiz
                </>
              )}
            </button>
          </form>

          {/* Generated Quiz Preview */}
          {generatedQuiz && (
            <div className="border border-purple-500/30 rounded-2xl bg-purple-950/20 p-5 space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-base text-white">{generatedQuiz.title}</h4>
                  <p className="text-xs text-slate-400">{generatedQuiz.description}</p>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                  {generatedQuiz.questions?.length} Questions
                </span>
              </div>

              <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                {generatedQuiz.questions?.map((q, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950/80 border border-white/5 space-y-1 text-xs">
                    <span className="font-bold text-slate-200">
                      #{idx + 1}: {q.text}
                    </span>
                    <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-400">
                      {q.options?.map((opt, optIdx) => (
                        <span
                          key={optIdx}
                          className={optIdx === q.correctIndex ? 'text-emerald-400 font-bold' : ''}
                        >
                          {optIdx === q.correctIndex ? '✓ ' : '• '} {opt}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleSaveAndUse}
                disabled={isSaving}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
              >
                {isSaving ? 'Saving Quiz...' : 'Save to Library & Use Quiz'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
