import mongoose from 'mongoose';

const playerResultSchema = new mongoose.Schema({
  playerId: { type: String, required: true },
  name: { type: String, required: true },
  score: { type: Number, default: 0 },
  rank: { type: Number, default: 1 },
  team: { type: String, default: null },
  correctCount: { type: Number, default: 0 },
  userId: { type: String, default: null }
});

const gameHistorySchema = new mongoose.Schema({
  roomCode: { type: String, required: true },
  quizId: { type: String, required: true },
  quizTitle: { type: String, required: true },
  mode: { type: String, enum: ['solo', 'team'], default: 'solo' },
  hostName: { type: String, default: 'Host' },
  totalQuestions: { type: Number, default: 0 },
  players: [playerResultSchema],
  teamScores: {
    type: Map,
    of: Number,
    default: {}
  },
  winningTeam: { type: String, default: null },
  playedAt: { type: Date, default: Date.now }
});

export const GameHistoryModel = mongoose.model('GameHistory', gameHistorySchema);
