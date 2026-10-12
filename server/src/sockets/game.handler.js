import { gameService } from '../services/gameService.js';
import { roomService } from '../services/roomService.js';

export function registerGameHandlers(io, socket) {
  // Start Game (Host only)
  socket.on('start_game', async ({ code }, callback) => {
    try {
      const cleanCode = (code || socket.data?.roomCode || '').trim().toUpperCase();
      const hostPlayerId = socket.data?.playerId;

      await gameService.startGame(io, cleanCode, hostPlayerId);
      if (typeof callback === 'function') callback({ success: true });
    } catch (err) {
      console.error('Error starting game:', err);
      if (typeof callback === 'function') callback({ success: false, message: err.message });
      socket.emit('error_message', { message: err.message || 'Failed to start game' });
    }
  });

  // Submit Answer
  socket.on('submit_answer', async ({ code, optionIndex }, callback) => {
    try {
      const cleanCode = (code || socket.data?.roomCode || '').trim().toUpperCase();
      const playerId = socket.data?.playerId;

      if (!cleanCode || !playerId) {
        throw new Error('Not connected to a room');
      }

      const res = await gameService.submitAnswer(io, cleanCode, playerId, optionIndex);
      if (typeof callback === 'function') callback(res);
    } catch (err) {
      console.error('Error submitting answer:', err);
      if (typeof callback === 'function') callback({ success: false, message: err.message });
      socket.emit('error_message', { message: err.message || 'Failed to submit answer' });
    }
  });

  // Use Power-up (50/50, 2x Double Points, Extra Time)
  socket.on('use_powerup', async ({ code, powerUpType }, callback) => {
    try {
      const cleanCode = (code || socket.data?.roomCode || '').trim().toUpperCase();
      const playerId = socket.data?.playerId;

      if (!cleanCode || !playerId) {
        throw new Error('Not connected to room');
      }

      const res = await gameService.usePowerUp(io, cleanCode, playerId, powerUpType);
      if (typeof callback === 'function') callback(res);
    } catch (err) {
      console.error('Error using powerup:', err);
      if (typeof callback === 'function') callback({ success: false, message: err.message });
      socket.emit('error_message', { message: err.message });
    }
  });

  // Next Question (Host only)
  socket.on('next_question', async ({ code }, callback) => {
    try {
      const cleanCode = (code || socket.data?.roomCode || '').trim().toUpperCase();
      const hostPlayerId = socket.data?.playerId;

      await gameService.nextQuestion(io, cleanCode, hostPlayerId);
      if (typeof callback === 'function') callback({ success: true });
    } catch (err) {
      console.error('Error advancing question:', err);
      if (typeof callback === 'function') callback({ success: false, message: err.message });
      socket.emit('error_message', { message: err.message });
    }
  });

  // Skip Question (Host only)
  socket.on('skip_question', async ({ code }, callback) => {
    try {
      const cleanCode = (code || socket.data?.roomCode || '').trim().toUpperCase();
      const hostPlayerId = socket.data?.playerId;

      await gameService.skipQuestion(io, cleanCode, hostPlayerId);
      if (typeof callback === 'function') callback({ success: true });
    } catch (err) {
      console.error('Error skipping question:', err);
      if (typeof callback === 'function') callback({ success: false, message: err.message });
      socket.emit('error_message', { message: err.message });
    }
  });

  // End Game (Host only)
  socket.on('end_game_early', async ({ code }, callback) => {
    try {
      const cleanCode = (code || socket.data?.roomCode || '').trim().toUpperCase();
      const hostPlayerId = socket.data?.playerId;
      const room = await roomService.getRoom(cleanCode);

      if (!room || room.hostId !== hostPlayerId) {
        throw new Error('Only the host can end the game');
      }

      await gameService.endGame(io, cleanCode);
      if (typeof callback === 'function') callback({ success: true });
    } catch (err) {
      if (typeof callback === 'function') callback({ success: false, message: err.message });
      socket.emit('error_message', { message: err.message });
    }
  });
}
