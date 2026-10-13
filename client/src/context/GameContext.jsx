import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useSound } from '../hooks/useSound';
import confetti from 'canvas-confetti';

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const { socket, isConnected, clockOffset } = useSocket();
  const sound = useSound();

  // Room state
  const [roomCode, setRoomCode] = useState(null);
  const [room, setRoom] = useState(null);
  const [player, setPlayer] = useState(null);
  const [players, setPlayers] = useState([]);
  const [gameState, setGameState] = useState('IDLE'); // IDLE | LOBBY | STARTING | QUESTION_ACTIVE | QUESTION_RESULT | FINISHED

  // Leaderboard & Teams
  const [leaderboard, setLeaderboard] = useState([]);
  const [teams, setTeams] = useState([]);
  const [teamScores, setTeamScores] = useState({ red: 0, blue: 0, green: 0, yellow: 0 });

  // Active Question
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [questionDuration, setQuestionDuration] = useState(15);
  const [endsAt, setEndsAt] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [answerStats, setAnswerStats] = useState({ answered: 0, total: 0 });
  const [lastSubmissionResult, setLastSubmissionResult] = useState(null);
  const [questionResult, setQuestionResult] = useState(null);

  // Power-ups
  const [eliminatedOptions, setEliminatedOptions] = useState([]);
  const [activeMultiplier, setActiveMultiplier] = useState(1);
  const [bonusTime, setBonusTime] = useState(0);

  // Game Over
  const [gameOverData, setGameOverData] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Auto-clear toast
  const showToast = useCallback((msg, type = 'info') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  // Save session to localStorage for tab refresh recovery
  const saveSession = useCallback((code, pId) => {
    try {
      if (code && pId) {
        localStorage.setItem('quiz_session', JSON.stringify({ roomCode: code, playerId: pId }));
      } else {
        localStorage.removeItem('quiz_session');
      }
    } catch (e) {}
  }, []);

  // Attempt rejoining on initial socket connect if session exists
  useEffect(() => {
    if (!socket || !isConnected) return;

    try {
      const saved = localStorage.getItem('quiz_session');
      if (saved && !player) {
        const { roomCode: savedCode, playerId: savedPlayerId } = JSON.parse(saved);
        if (savedCode && savedPlayerId) {
          socket.emit('reconnect_room', { code: savedCode, playerId: savedPlayerId }, (res) => {
            if (res && res.success) {
              setRoomCode(savedCode);
              setRoom(res.room);
              setPlayer(res.player);
              setPlayers(res.players || []);
              if (res.leaderboard) setLeaderboard(res.leaderboard);
              if (res.teams) setTeams(res.teams);
              setGameState(res.room.status || 'LOBBY');
              showToast('Reconnected to room ' + savedCode, 'success');
            } else {
              saveSession(null, null);
            }
          });
        }
      }
    } catch (e) {
      saveSession(null, null);
    }
  }, [socket, isConnected, player, saveSession, showToast]);

  // Register real-time Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const onRoomCreated = (data) => {
      setRoomCode(data.code);
      setRoom(data.room);
      setPlayer(data.player);
      setPlayers(data.players || []);
      setGameState('LOBBY');
      saveSession(data.code, data.player.id);
      showToast(`Room created! Code: ${data.code}`, 'success');
    };

    const onRoomJoined = (data) => {
      setRoomCode(data.code);
      setRoom(data.room);
      setPlayer(data.player);
      setPlayers(data.players || []);
      setGameState(data.room.status === 'LOBBY' ? 'LOBBY' : 'QUESTION_ACTIVE');
      saveSession(data.code, data.player.id);
      showToast(`Joined room ${data.code}!`, 'success');
    };

    const onRoomUpdated = (data) => {
      setPlayers(data.players || []);
      setRoom((prev) => (prev ? { ...prev, status: data.status, hostId: data.hostId, mode: data.mode } : prev));
      if (data.status) {
        setGameState(data.status);
      }
      // Update our player instance if in the list
      setPlayer((prev) => {
        if (!prev) return null;
        const fresh = data.players.find((p) => p.id === prev.id);
        return fresh ? { ...prev, ...fresh } : prev;
      });
    };

    const onGameStarting = (data) => {
      setGameState('STARTING');
      setTotalQuestions(data.totalQuestions);
      sound.playStart();
      showToast(`Game starting in ${data.countdown} seconds! Get ready!`, 'info');
    };

    const onQuestionStart = (data) => {
      setGameState('QUESTION_ACTIVE');
      setCurrentQuestion(data.question);
      setQuestionIndex(data.index);
      setTotalQuestions(data.total);
      setQuestionDuration(data.duration);
      setEndsAt(data.endsAt);
      setSelectedOption(null);
      setHasAnswered(false);
      setLastSubmissionResult(null);
      setQuestionResult(null);
      setEliminatedOptions([]);
      setActiveMultiplier(1);
      setBonusTime(0);
      setAnswerStats({ answered: 0, total: players.filter((p) => !p.isSpectator).length });
    };

    const onAnswerCount = (data) => {
      setAnswerStats(data);
    };

    const onAnswerAcknowledged = (data) => {
      setLastSubmissionResult(data);
      if (data.pointsEarned > 0) {
        sound.playCorrect();
      } else {
        sound.playWrong();
      }
    };

    const onPowerupResult = (data) => {
      sound.playPowerUp();
      showToast(data.message, 'success');
      if (data.powerUpType === 'fiftyFifty') {
        setEliminatedOptions(data.eliminatedOptions || []);
      } else if (data.powerUpType === 'doublePoints') {
        setActiveMultiplier(data.multiplier || 2);
      } else if (data.powerUpType === 'extraTime') {
        setBonusTime((prev) => prev + (data.bonusSeconds || 5));
      }
    };

    const onQuestionEnd = (data) => {
      setGameState('QUESTION_RESULT');
      setQuestionResult(data);
      if (data.leaderboard) setLeaderboard(data.leaderboard);
      if (data.teams) setTeams(data.teams);
      if (data.teamScores) setTeamScores(data.teamScores);

      // Trigger feedback sound if user had answered
      if (selectedOption !== null) {
        if (selectedOption === data.correctIndex) {
          sound.playCorrect();
        } else {
          sound.playWrong();
        }
      }
    };

    const onGameOver = (data) => {
      setGameState('FINISHED');
      setGameOverData(data);
      if (data.finalLeaderboard) setLeaderboard(data.finalLeaderboard);
      if (data.teams) setTeams(data.teams);
      if (data.teamScores) setTeamScores(data.teamScores);

      sound.playVictory();

      // Launch victory confetti
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
        setTimeout(() => {
          confetti({
            particleCount: 80,
            angle: 60,
            spread: 55,
            origin: { x: 0 }
          });
          confetti({
            particleCount: 80,
            angle: 120,
            spread: 55,
            origin: { x: 1 }
          });
        }, 300);
      } catch (e) {}
    };

    const onKicked = (data) => {
      saveSession(null, null);
      setRoomCode(null);
      setRoom(null);
      setPlayer(null);
      setGameState('IDLE');
      showToast(data.message || 'You were kicked from the room', 'error');
    };

    const onErrorMessage = (data) => {
      showToast(data.message || 'An error occurred', 'error');
    };

    socket.on('room_created', onRoomCreated);
    socket.on('room_joined', onRoomJoined);
    socket.on('room_updated', onRoomUpdated);
    socket.on('game_starting', onGameStarting);
    socket.on('question_start', onQuestionStart);
    socket.on('answer_count', onAnswerCount);
    socket.on('answer_acknowledged', onAnswerAcknowledged);
    socket.on('powerup_result', onPowerupResult);
    socket.on('question_end', onQuestionEnd);
    socket.on('game_over', onGameOver);
    socket.on('kicked', onKicked);
    socket.on('error_message', onErrorMessage);

    return () => {
      socket.off('room_created', onRoomCreated);
      socket.off('room_joined', onRoomJoined);
      socket.off('room_updated', onRoomUpdated);
      socket.off('game_starting', onGameStarting);
      socket.off('question_start', onQuestionStart);
      socket.off('answer_count', onAnswerCount);
      socket.off('answer_acknowledged', onAnswerAcknowledged);
      socket.off('powerup_result', onPowerupResult);
      socket.off('question_end', onQuestionEnd);
      socket.off('game_over', onGameOver);
      socket.off('kicked', onKicked);
      socket.off('error_message', onErrorMessage);
    };
  }, [socket, selectedOption, sound, saveSession, showToast, players]);

  // Actions
  const createRoom = useCallback(({ quizId, hostName, mode = 'solo', userId = null }) => {
    if (!socket) return;
    socket.emit('create_room', { quizId, hostName, mode, userId });
  }, [socket]);

  const joinRoom = useCallback(({ code, name, avatar = '👤', userId = null, preferredTeam = null }) => {
    if (!socket) return;
    socket.emit('join_room', { code, name, avatar, userId, preferredTeam });
  }, [socket]);

  const startGame = useCallback(() => {
    if (!socket || !roomCode) return;
    socket.emit('start_game', { code: roomCode });
  }, [socket, roomCode]);

  const submitAnswer = useCallback((optionIndex) => {
    if (!socket || !roomCode || hasAnswered) return;
    setSelectedOption(optionIndex);
    setHasAnswered(true);
    socket.emit('submit_answer', { code: roomCode, optionIndex });
  }, [socket, roomCode, hasAnswered]);

  const usePowerUp = useCallback((powerUpType) => {
    if (!socket || !roomCode) return;
    socket.emit('use_powerup', { code: roomCode, powerUpType });
  }, [socket, roomCode]);

  const nextQuestion = useCallback(() => {
    if (!socket || !roomCode) return;
    socket.emit('next_question', { code: roomCode });
  }, [socket, roomCode]);

  const skipQuestion = useCallback(() => {
    if (!socket || !roomCode) return;
    socket.emit('skip_question', { code: roomCode });
  }, [socket, roomCode]);

  const switchTeam = useCallback((team) => {
    if (!socket || !roomCode) return;
    socket.emit('switch_team', { code: roomCode, team });
  }, [socket, roomCode]);

  const kickPlayer = useCallback((targetPlayerId) => {
    if (!socket || !roomCode) return;
    socket.emit('kick_player', { code: roomCode, playerId: targetPlayerId });
  }, [socket, roomCode]);

  const leaveRoom = useCallback(() => {
    if (socket && roomCode) {
      socket.emit('leave_room', { code: roomCode });
    }
    saveSession(null, null);
    setRoomCode(null);
    setRoom(null);
    setPlayer(null);
    setPlayers([]);
    setGameState('IDLE');
    setCurrentQuestion(null);
    setGameOverData(null);
  }, [socket, roomCode, saveSession]);

  return (
    <GameContext.Provider
      value={{
        socket,
        isConnected,
        clockOffset,
        sound,
        roomCode,
        room,
        player,
        players,
        gameState,
        leaderboard,
        teams,
        teamScores,
        currentQuestion,
        questionIndex,
        totalQuestions,
        questionDuration,
        endsAt,
        selectedOption,
        hasAnswered,
        answerStats,
        lastSubmissionResult,
        questionResult,
        eliminatedOptions,
        activeMultiplier,
        bonusTime,
        gameOverData,
        toastMessage,
        showToast,
        createRoom,
        joinRoom,
        startGame,
        submitAnswer,
        usePowerUp,
        nextQuestion,
        skipQuestion,
        switchTeam,
        kickPlayer,
        leaveRoom
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within a GameProvider');
  return ctx;
}
