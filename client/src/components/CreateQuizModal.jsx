import React, { useState } from 'react';
import { X, Plus, Trash2, Image, Volume2, Save, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';

export function CreateQuizModal({ isOpen, onClose, onCreated }) {
  const { user } = useAuth();
  const { showToast } = useGame();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [difficulty, setDifficulty] = useState('Medium');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [questions, setQuestions] = useState([
    {
      text: '',
      options: ['', '', '', ''],
      correctIndex: 0,
      duration: 15,
      imageUrl: '',
      audioUrl: '',
      explanation: ''
    }
  ]);

  if (!isOpen) return null;

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        text: '',
        options: ['', '', '', ''],
        correctIndex: 0,
        duration: 15,
        imageUrl: '',
        audioUrl: '',
        explanation: ''
      }
    ]);
  };

  const handleRemoveQuestion = (idx) => {
    if (questions.length <= 1) {
      showToast('A quiz must have at least one question', 'warning');
      return;
    }
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx, field, val) => {
    const updated = [...questions];
    updated[idx][field] = val;
    setQuestions(updated);
  };

  const updateOption = (qIdx, optIdx, val) => {
    const updated = [...questions];
    updated[qIdx].options[optIdx] = val;
    setQuestions(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast('Please enter a quiz title', 'error');
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        showToast(`Question #${i + 1} has empty text`, 'error');
        return;
      }
      for (let j = 0; j < 4; j++) {
        if (!q.options[j].trim()) {
          showToast(`Question #${i + 1} Option #${j + 1} cannot be blank`, 'error');
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          difficulty,
          createdBy: user?.username || 'Custom Host',
          creatorId: user?.id || null,
          questions
        })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to save quiz');
      }

      showToast('Quiz created successfully! Added to your library.', 'success');
      if (onCreated) onCreated(data.data);
      onClose();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl bg-slate-900 border border-white/10 shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-slate-950/60">
          <div>
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" /> Create Custom Quiz
            </h3>
            <p className="text-xs text-slate-400">Design custom questions, timer durations & optional media</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Quiz Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Quiz Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Modern JavaScript Challenge"
                className="w-full bg-slate-950 border border-white/10 focus:border-purple-400 rounded-xl px-4 py-2.5 text-white font-bold text-sm outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 focus:border-purple-400 rounded-xl px-3 py-2.5 text-white text-sm outline-none"
              >
                <option value="General">General Trivia</option>
                <option value="Technology">Technology & Coding</option>
                <option value="Science">Science & Cosmos</option>
                <option value="Geography">World Geography</option>
                <option value="Entertainment">Cinema & Gaming</option>
                <option value="History">History & Culture</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 focus:border-purple-400 rounded-xl px-3 py-2.5 text-white text-sm outline-none"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Question List */}
          <div className="space-y-6 pt-2">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="font-extrabold text-sm text-slate-200">
                Questions ({questions.length})
              </span>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="flex items-center gap-1 text-xs font-bold text-purple-400 hover:text-purple-300"
              >
                <Plus className="w-4 h-4" /> Add Question
              </button>
            </div>

            {questions.map((q, qIdx) => (
              <div key={qIdx} className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-4 relative">
                {/* Question index banner & delete button */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-400">
                    Question #{qIdx + 1}
                  </span>
                  <div className="flex items-center gap-3">
                    {/* Duration selector */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <span>Timer:</span>
                      <select
                        value={q.duration}
                        onChange={(e) => updateQuestion(qIdx, 'duration', Number(e.target.value))}
                        className="bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-white text-xs outline-none"
                      >
                        <option value={10}>10s</option>
                        <option value={15}>15s</option>
                        <option value={20}>20s</option>
                        <option value={30}>30s</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(qIdx)}
                      className="p-1 rounded-lg text-slate-500 hover:text-red-400 transition"
                      title="Delete Question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Question Text */}
                <input
                  type="text"
                  value={q.text}
                  onChange={(e) => updateQuestion(qIdx, 'text', e.target.value)}
                  placeholder="Enter question text here..."
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-white font-bold text-sm outline-none focus:border-purple-400"
                  required
                />

                {/* 4 Options with radio button for correct index */}
                <div className="space-y-2">
                  <span className="block text-[11px] font-bold text-slate-400 uppercase">
                    Options (Select the radio button for the correct answer):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt, optIdx) => (
                      <div
                        key={optIdx}
                        className={`flex items-center gap-2 p-2 rounded-xl border ${
                          q.correctIndex === optIdx
                            ? 'bg-emerald-950/40 border-emerald-500/40'
                            : 'bg-slate-900 border-white/5'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`correct_${qIdx}`}
                          checked={q.correctIndex === optIdx}
                          onChange={() => updateQuestion(qIdx, 'correctIndex', optIdx)}
                          className="accent-emerald-500 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => updateOption(qIdx, optIdx, e.target.value)}
                          placeholder={`Option ${optIdx + 1}`}
                          className="w-full bg-transparent text-sm text-white font-medium outline-none"
                          required
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Optional Image and Audio clues */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="flex items-center gap-2 bg-slate-900 border border-white/5 rounded-xl px-3 py-1.5">
                    <Image className="w-4 h-4 text-slate-500 shrink-0" />
                    <input
                      type="url"
                      value={q.imageUrl}
                      onChange={(e) => updateQuestion(qIdx, 'imageUrl', e.target.value)}
                      placeholder="Optional Image URL (https://...)"
                      className="w-full bg-transparent text-xs text-slate-300 outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 bg-slate-900 border border-white/5 rounded-xl px-3 py-1.5">
                    <Volume2 className="w-4 h-4 text-slate-500 shrink-0" />
                    <input
                      type="url"
                      value={q.audioUrl}
                      onChange={(e) => updateQuestion(qIdx, 'audioUrl', e.target.value)}
                      placeholder="Optional Audio URL (https://...)"
                      className="w-full bg-transparent text-xs text-slate-300 outline-none"
                    />
                  </div>
                </div>

                {/* Explanation */}
                <input
                  type="text"
                  value={q.explanation}
                  onChange={(e) => updateQuestion(qIdx, 'explanation', e.target.value)}
                  placeholder="Optional brief explanation for answer reveal"
                  className="w-full bg-slate-900 border border-white/5 rounded-xl px-3 py-1.5 text-xs text-slate-300 outline-none"
                />
              </div>
            ))}
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-sm font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition shadow-lg shadow-purple-600/30 flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Saving...' : 'Save Quiz'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
