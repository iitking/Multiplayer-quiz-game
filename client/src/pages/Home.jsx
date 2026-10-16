import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import { Play, Plus, Users, Shield, Sparkles, BookOpen, ChevronRight } from 'lucide-react';

const AVATARS = ['🦊', '🦁', '🐼', '🚀', '🧙‍♂️', '🦄', '⚡', '🤖', '🐯', '🦅', '🐲', '🐙'];

export function Home({ onOpenCreate, onOpenAI }) {
  const { createRoom, joinRoom, showToast } = useGame();
  const { user } = useAuth();

  const [tab, setTab] = useState('join'); // 'join' | 'create'
  
  // Join form state
  const [joinCode, setJoinCode] = useState('');
  const [playerName, setPlayerName] = useState(user?.username || '');
  const [avatar, setAvatar] = useState(user?.avatar || '🦊');

  // Create form state
  const [hostName, setHostName] = useState(user?.username || 'Host');
  const [selectedQuizId, setSelectedQuizId] = useState('');
  const [gameMode, setGameMode] = useState('solo'); // 'solo' | 'team'
  const [quizzes, setQuizzes] = useState([]);
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(false);

  // Sync username if logged in
  useEffect(() => {
    if (user?.username) {
      setPlayerName(user.username);
      setHostName(user.username);
      if (user.avatar) setAvatar(user.avatar);
    }
  }, [user]);

  // Fetch available quizzes for Host creation
  useEffect(() => {
    async function loadQuizzes() {
      setIsLoadingQuizzes(true);
      try {
        const res = await fetch('/api/quizzes');
        const data = await res.json();
        if (data.success && data.data) {
          setQuizzes(data.data);
          if (data.data.length > 0 && !selectedQuizId) {
            setSelectedQuizId(data.data[0]._id || data.data[0].id);
          }
        }
      } catch (err) {
        console.warn('Failed to load quizzes:', err);
      } finally {
        setIsLoadingQuizzes(false);
      }
    }
    loadQuizzes();
  }, [selectedQuizId]);

  const handleJoin = (e) => {
    e.preventDefault();
    if (!joinCode || joinCode.trim().length !== 4) {
      showToast('Please enter a valid 4-digit room code', 'error');
      return;
    }
    if (!playerName || playerName.trim().length === 0) {
      showToast('Please enter your nickname', 'error');
      return;
    }
    joinRoom({
      code: joinCode.trim().toUpperCase(),
      name: playerName.trim(),
      avatar,
      userId: user?.id || null
    });
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!selectedQuizId) {
      showToast('Please select a quiz to play', 'error');
      return;
    }
    createRoom({
      quizId: selectedQuizId,
      hostName: hostName.trim() || 'Host',
      mode: gameMode,
      userId: user?.id || null
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-14">
      {/* Hero Header */}
      <div className="text-center mb-10 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Real-time Synchronized Multiplayer
        </div>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white">
          Compete in <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-amber-400 bg-clip-text text-transparent">Live Trivia</span>
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-lg mx-auto">
          Join with friends using a 4-digit code. Answer fast for speed bonus points, use strategic power-ups, and dominate the leaderboard!
        </p>
      </div>

      {/* Main Action Card */}
      <div className="max-w-xl mx-auto rounded-3xl glass-panel p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-600/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-pink-600/25 rounded-full blur-3xl pointer-events-none" />

        {/* Tab switchers */}
        <div className="flex bg-slate-900/90 p-1 rounded-2xl border border-white/10 mb-6">
          <button
            type="button"
            onClick={() => setTab('join')}
            className={`flex-1 py-3 rounded-xl font-black text-sm transition flex items-center justify-center gap-2 ${
              tab === 'join'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Play className="w-4 h-4" /> Join Room
          </button>
          <button
            type="button"
            onClick={() => setTab('create')}
            className={`flex-1 py-3 rounded-xl font-black text-sm transition flex items-center justify-center gap-2 ${
              tab === 'create'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Plus className="w-4 h-4" /> Host Quiz
          </button>
        </div>

        {/* TAB 1: JOIN ROOM */}
        {tab === 'join' ? (
          <form onSubmit={handleJoin} className="space-y-5">
            {/* 4-Digit Room Code */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                4-Digit Room Code
              </label>
              <input
                type="text"
                maxLength={4}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="e.g. 7K9P"
                className="w-full text-center text-3xl sm:text-4xl font-black tracking-widest bg-slate-900/80 border-2 border-purple-500/30 focus:border-purple-400 focus:ring-4 focus:ring-purple-500/20 rounded-2xl py-3.5 text-white uppercase placeholder:text-slate-700 transition outline-none font-mono"
                required
              />
            </div>

            {/* Nickname */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Your Nickname
              </label>
              <input
                type="text"
                maxLength={16}
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter player name"
                className="w-full bg-slate-900/80 border border-white/10 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 rounded-xl px-4 py-3 text-white text-base font-bold placeholder:text-slate-600 transition outline-none"
                required
              />
            </div>

            {/* Avatar Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Select Avatar
              </label>
              <div className="grid grid-cols-6 gap-2">
                {AVATARS.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setAvatar(av)}
                    className={`h-11 rounded-xl text-xl flex items-center justify-center transition ${
                      avatar === av
                        ? 'bg-purple-600/40 border-2 border-purple-400 scale-110 shadow-lg'
                        : 'bg-white/5 border border-white/5 hover:bg-white/10'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Join */}
            <button
              type="submit"
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white font-black text-lg transition shadow-xl shadow-purple-600/30 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-current" /> Enter Room
            </button>
          </form>
        ) : (
          /* TAB 2: HOST QUIZ */
          <form onSubmit={handleCreate} className="space-y-5">
            {/* Host Name */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Host Name
              </label>
              <input
                type="text"
                maxLength={16}
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                placeholder="Host nickname"
                className="w-full bg-slate-900/80 border border-white/10 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 rounded-xl px-4 py-3 text-white text-base font-bold placeholder:text-slate-600 transition outline-none"
                required
              />
            </div>

            {/* Mode selection: Solo vs Team */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Game Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setGameMode('solo')}
                  className={`p-3.5 rounded-2xl border text-left transition flex items-center gap-3 ${
                    gameMode === 'solo'
                      ? 'bg-purple-950/60 border-purple-400 text-white shadow-md'
                      : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  <Users className="w-5 h-5 text-purple-400" />
                  <div>
                    <span className="font-extrabold text-sm block">Solo Battle</span>
                    <span className="text-[11px] text-slate-400">Free for all players</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setGameMode('team')}
                  className={`p-3.5 rounded-2xl border text-left transition flex items-center gap-3 ${
                    gameMode === 'team'
                      ? 'bg-purple-950/60 border-purple-400 text-white shadow-md'
                      : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  <Shield className="w-5 h-5 text-amber-400" />
                  <div>
                    <span className="font-extrabold text-sm block">Team War</span>
                    <span className="text-[11px] text-slate-400">Red vs Blue vs Green</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Quiz selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Select Quiz
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onOpenAI}
                    className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" /> Generate with AI
                  </button>
                  <span className="text-slate-600">|</span>
                  <button
                    type="button"
                    onClick={onOpenCreate}
                    className="text-xs font-bold text-purple-400 hover:underline"
                  >
                    + Custom Quiz
                  </button>
                </div>
              </div>

              {isLoadingQuizzes ? (
                <div className="py-4 text-center text-sm text-slate-500">Loading quizzes...</div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {quizzes.map((q) => {
                    const qId = q._id || q.id;
                    const isSelected = selectedQuizId === qId;

                    return (
                      <div
                        key={qId}
                        onClick={() => setSelectedQuizId(qId)}
                        className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-purple-600/20 border-purple-400 text-white shadow-md'
                            : 'bg-white/5 border-white/5 hover:border-white/20 text-slate-300'
                        }`}
                      >
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm truncate">{q.title}</h4>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                            <span className="px-1.5 py-0.2 rounded bg-white/10">{q.category || 'General'}</span>
                            <span>{q.questions?.length || 0} questions</span>
                            <span className="text-amber-400 font-bold">{q.difficulty || 'Medium'}</span>
                          </div>
                        </div>
                        <input
                          type="radio"
                          name="quizSelection"
                          checked={isSelected}
                          onChange={() => setSelectedQuizId(qId)}
                          className="accent-purple-500"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Create Room Submit */}
            <button
              type="submit"
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-lg transition shadow-xl shadow-purple-600/30 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" /> Generate Room Code
            </button>
          </form>
        )}
      </div>

      {/* Featured Quizzes Carousel / Shelf */}
      <div className="mt-14">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-purple-400" />
            <h3 className="font-extrabold text-lg text-white">Featured Quiz Library</h3>
          </div>
          <button
            onClick={onOpenCreate}
            className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1"
          >
            Create New <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {quizzes.slice(0, 4).map((q) => (
            <div
              key={q._id || q.id}
              className="p-4 rounded-2xl glass-panel hover:border-purple-500/40 transition group cursor-pointer flex flex-col justify-between"
              onClick={() => {
                setSelectedQuizId(q._id || q.id);
                setTab('create');
              }}
            >
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 mb-2 inline-block">
                  {q.category || 'Trivia'}
                </span>
                <h4 className="font-bold text-base text-slate-100 group-hover:text-purple-300 transition line-clamp-2">
                  {q.title}
                </h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  {q.description || 'Challenge your knowledge in real-time!'}
                </p>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-4 mt-2 border-t border-white/5">
                <span>{q.questions?.length || 0} Questions</span>
                <span className="text-purple-400 font-bold group-hover:translate-x-0.5 transition">Host →</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
