import { roomService } from './roomService.js';
import { DataStore } from './dataStore.js';
import { calculateScore } from './scoreService.js';

class GameService {
  constructor() {
    this.activeTimers = new Map(); // roomCode -> setTimeout timer
    this.roomQuizzes = new Map();  // roomCode -> quiz object
    this.activeQuestionData = new Map(); // roomCode -> { startedAt, endsAt, duration, correctIndex, optionsCount, activeMultipliers: Map }
  }

  async startGame(io, code, hostPlayerId) {
    const room = await roomService.getRoom(code);
    if (!room) throw new Error('Room not found');
    if (room.hostId !== hostPlayerId) throw new Error('Only the host can start the game');

    // Load Quiz
    let quiz = await DataStore.getQuizById(room.quizId);
    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
      // Fallback to first available quiz if specific quiz not found
      const allQuizzes = await DataStore.getQuizzes();
      quiz = allQuizzes[0];
    }

    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
      throw new Error('No questions available in selected quiz');
    }

    this.roomQuizzes.set(code, quiz);

    await roomService.updateRoom(code, {
      status: 'STARTING',
      currentIndex: -1,
      totalQuestions: quiz.questions.length
    });

    // Notify room that game is starting in 3 seconds countdown
    io.to(code).emit('game_starting', {
      countdown: 3,
      totalQuestions: quiz.questions.length,
      quizTitle: quiz.title
    });

    setTimeout(() => {
      this.startQuestion(io, code, 0);
    }, 3000);
  }

  async startQuestion(io, code, index) {
    const quiz = this.roomQuizzes.get(code);
    if (!quiz || !quiz.questions[index]) {
      return this.endGame(io, code);
    }

    const question = quiz.questions[index];
    const durationSec = Number(question.duration || 15);
    const durationMs = durationSec * 1000;
    const now = Date.now();
    const endsAt = now + durationMs;

    // Clear any previous timer
    if (this.activeTimers.has(code)) {
      clearTimeout(this.activeTimers.get(code));
      this.activeTimers.delete(code);
    }

    this.activeQuestionData.set(code, {
      index,
      startedAt: now,
      endsAt,
      durationMs,
      correctIndex: question.correctIndex,
      optionsCount: question.options.length,
      activeMultipliers: new Map() // playerId -> multiplier
    });

    await roomService.updateRoom(code, {
      status: 'QUESTION_ACTIVE',
      currentIndex: index,
      endsAt
    });

    // Server-authoritative timer payload - DO NOT send correctIndex!
    const clientPayload = {
      index,
      total: quiz.questions.length,
      question: {
        text: question.text,
        options: question.options,
        imageUrl: question.imageUrl || '',
        audioUrl: question.audioUrl || ''
      },
      duration: durationSec,
      endsAt,
      serverTime: now
    };

    io.to(code).emit('question_start', clientPayload);

    // Initial answer count (0 answered)
    const players = await roomService.getPlayers(code);
    const eligibleCount = players.filter(p => !p.isSpectator).length;
    io.to(code).emit('answer_count', { answered: 0, total: eligibleCount });

    // Set server timeout to trigger question_end
    const timer = setTimeout(() => {
      this.endQuestion(io, code, index);
    }, durationMs + 200); // 200ms grace period for clock precision

    this.activeTimers.set(code, timer);
  }

  async submitAnswer(io, code, playerId, optionIndex) {
    const room = await roomService.getRoom(code);
    if (!room || room.status !== 'QUESTION_ACTIVE') {
      return { success: false, message: 'Question is not active' };
    }

    const qData = this.activeQuestionData.get(code);
    if (!qData) {
      return { success: false, message: 'No question data available' };
    }

    const currentIndex = room.currentIndex;
    const existingAnswers = await roomService.getAnswersForQuestion(code, currentIndex);

    if (existingAnswers[playerId]) {
      return { success: false, message: 'You have already submitted an answer' };
    }

    const now = Date.now();
    // Allow up to 1200ms network grace period after endsAt
    if (now > qData.endsAt + 1200) {
      return { success: false, message: 'Time is up for this question!' };
    }

    const timeTakenMs = Math.max(50, now - qData.startedAt);
    const isCorrect = Number(optionIndex) === Number(qData.correctIndex);
    const multiplier = qData.activeMultipliers.get(playerId) || 1;

    const scoreResult = calculateScore({
      isCorrect,
      timeTakenMs,
      durationMs: qData.durationMs,
      multiplier
    });

    // Record answer in Redis
    await roomService.recordAnswer(code, currentIndex, playerId, {
      optionIndex: Number(optionIndex),
      timeTakenMs,
      isCorrect,
      pointsAwarded: scoreResult.points,
      submittedAt: now
    });

    // Increment player's score
    if (scoreResult.points > 0) {
      await roomService.addPlayerScore(code, playerId, scoreResult.points);
    }

    // Update answer count for all clients
    const updatedAnswers = await roomService.getAnswersForQuestion(code, currentIndex);
    const players = await roomService.getPlayers(code);
    const eligiblePlayers = players.filter(p => !p.isSpectator);
    const answeredCount = Object.keys(updatedAnswers).length;

    io.to(code).emit('answer_count', {
      answered: answeredCount,
      total: eligiblePlayers.length
    });

    // Notify individual player with immediate submission acknowledgement
    const playerSocket = await this.findPlayerSocket(io, playerId);
    if (playerSocket) {
      playerSocket.emit('answer_acknowledged', {
        pointsEarned: scoreResult.points,
        speedBonus: scoreResult.speedBonus
      });
    }

    // Early finish check: If all active eligible players answered, end question immediately
    if (answeredCount >= eligiblePlayers.length && eligiblePlayers.length > 0) {
      if (this.activeTimers.has(code)) {
        clearTimeout(this.activeTimers.get(code));
        this.activeTimers.delete(code);
      }
      setTimeout(() => {
        this.endQuestion(io, code, currentIndex);
      }, 500); // short delay so last submitter sees feedback
    }

    return { success: true, points: scoreResult.points };
  }

  async usePowerUp(io, code, playerId, powerUpType) {
    const room = await roomService.getRoom(code);
    if (!room || room.status !== 'QUESTION_ACTIVE') {
      return { success: false, message: 'Power-ups can only be used during active questions' };
    }

    const player = await roomService.getPlayer(code, playerId);
    if (!player) return { success: false, message: 'Player not found' };

    const powerUps = player.powerUps || {};
    if (!powerUps[powerUpType]) {
      return { success: false, message: 'You have already used this power-up!' };
    }

    const qData = this.activeQuestionData.get(code);
    if (!qData) return { success: false, message: 'Question not found' };

    // Mark power-up as consumed
    powerUps[powerUpType] = false;
    await roomService.updatePlayer(code, playerId, { powerUps });

    const playerSocket = await this.findPlayerSocket(io, playerId);

    if (powerUpType === 'fiftyFifty') {
      // Pick 2 wrong option indices to eliminate
      const wrongIndices = [];
      for (let i = 0; i < qData.optionsCount; i++) {
        if (i !== qData.correctIndex) wrongIndices.push(i);
      }
      // Shuffle and pick 2
      const shuffled = wrongIndices.sort(() => 0.5 - Math.random());
      const eliminated = shuffled.slice(0, Math.min(2, shuffled.length));

      if (playerSocket) {
        playerSocket.emit('powerup_result', {
          powerUpType: 'fiftyFifty',
          eliminatedOptions: eliminated,
          message: '✂️ 50/50 Activated! Two incorrect options removed!'
        });
      }
      return { success: true, powerUpType, eliminated };
    }

    if (powerUpType === 'doublePoints') {
      qData.activeMultipliers.set(playerId, 2);
      if (playerSocket) {
        playerSocket.emit('powerup_result', {
          powerUpType: 'doublePoints',
          multiplier: 2,
          message: '⚡ 2x Double Points Activated! Score doubled on this question!'
        });
      }
      return { success: true, powerUpType, multiplier: 2 };
    }

    if (powerUpType === 'extraTime') {
      // Extend client's time buffer
      if (playerSocket) {
        playerSocket.emit('powerup_result', {
          powerUpType: 'extraTime',
          bonusSeconds: 5,
          message: '⏳ Extra Time Activated! +5s bonus time!'
        });
      }
      return { success: true, powerUpType, bonusSeconds: 5 };
    }

    return { success: false, message: 'Unknown power-up' };
  }

  async endQuestion(io, code, index) {
    if (this.activeTimers.has(code)) {
      clearTimeout(this.activeTimers.get(code));
      this.activeTimers.delete(code);
    }

    const room = await roomService.getRoom(code);
    if (!room) return;

    const quiz = this.roomQuizzes.get(code);
    const question = quiz?.questions?.[index];
    const qData = this.activeQuestionData.get(code);
    const correctIndex = question ? question.correctIndex : (qData ? qData.correctIndex : 0);

    await roomService.updateRoom(code, {
      status: 'QUESTION_RESULT'
    });

    // Compute stats
    const answers = await roomService.getAnswersForQuestion(code, index);
    const optionCounts = [0, 0, 0, 0];
    let correctCount = 0;

    for (const ans of Object.values(answers)) {
      if (ans.optionIndex !== undefined && ans.optionIndex >= 0 && ans.optionIndex < 4) {
        optionCounts[ans.optionIndex]++;
      }
      if (ans.isCorrect) correctCount++;
    }

    const leaderboard = await roomService.getLeaderboard(code);
    const isLastQuestion = index + 1 >= (quiz?.questions?.length || 0);

    const payload = {
      index,
      correctIndex,
      explanation: question?.explanation || '',
      stats: {
        totalAnswered: Object.keys(answers).length,
        correctCount,
        optionCounts
      },
      leaderboard: leaderboard.top,
      teams: leaderboard.teams,
      teamScores: leaderboard.teamScores,
      isLastQuestion
    };

    io.to(code).emit('question_end', payload);
  }

  async nextQuestion(io, code, hostPlayerId) {
    const room = await roomService.getRoom(code);
    if (!room) throw new Error('Room not found');
    if (room.hostId !== hostPlayerId) throw new Error('Only the host can advance questions');

    const nextIdx = room.currentIndex + 1;
    const quiz = this.roomQuizzes.get(code);

    if (nextIdx < (quiz?.questions?.length || 0)) {
      await this.startQuestion(io, code, nextIdx);
    } else {
      await this.endGame(io, code);
    }
  }

  async skipQuestion(io, code, hostPlayerId) {
    const room = await roomService.getRoom(code);
    if (!room) throw new Error('Room not found');
    if (room.hostId !== hostPlayerId) throw new Error('Only the host can skip questions');

    await this.endQuestion(io, code, room.currentIndex);
  }

  async endGame(io, code) {
    if (this.activeTimers.has(code)) {
      clearTimeout(this.activeTimers.get(code));
      this.activeTimers.delete(code);
    }

    const room = await roomService.getRoom(code);
    const quiz = this.roomQuizzes.get(code);
    const leaderboard = await roomService.getLeaderboard(code);

    await roomService.updateRoom(code, {
      status: 'FINISHED'
    });

    const podium = leaderboard.top.slice(0, 3);
    const winningTeam = leaderboard.teams.length > 0 ? leaderboard.teams[0].team : null;

    // Save Game History to database / store
    try {
      const historyRecord = {
        roomCode: code,
        quizId: room?.quizId || 'quiz',
        quizTitle: room?.quizTitle || quiz?.title || 'Multiplayer Quiz',
        mode: room?.mode || 'solo',
        hostName: leaderboard.top.find(p => p.isHost)?.name || 'Host',
        totalQuestions: quiz?.questions?.length || room?.totalQuestions || 0,
        players: leaderboard.top.map(p => ({
          playerId: p.playerId,
          name: p.name,
          score: p.score,
          rank: p.rank,
          team: p.team,
          userId: p.userId
        })),
        teamScores: leaderboard.teamScores,
        winningTeam
      };

      await DataStore.saveGameHistory(historyRecord);

      // Update registered player stats
      for (const p of leaderboard.top) {
        if (p.userId) {
          await DataStore.updateUserStats(p.userId, {
            isWin: p.rank === 1,
            score: p.score,
            correctCount: 0,
            totalCount: quiz?.questions?.length || 0
          });
        }
      }
    } catch (e) {
      console.warn('Error saving game history:', e.message);
    }

    io.to(code).emit('game_over', {
      finalLeaderboard: leaderboard.top,
      teams: leaderboard.teams,
      teamScores: leaderboard.teamScores,
      winningTeam,
      podium
    });
  }

  async findPlayerSocket(io, playerId) {
    const sockets = await io.fetchSockets();
    for (const socket of sockets) {
      if (socket.data?.playerId === playerId) {
        return socket;
      }
    }
    return null;
  }
}

export const gameService = new GameService();
