import { roomService } from '../services/roomService.js';
import { DataStore } from '../services/dataStore.js';

export function registerRoomHandlers(io, socket) {
  // Create Room
  socket.on('create_room', async ({ quizId, hostName, mode = 'solo', userId = null }, callback) => {
    try {
      let quizTitle = 'Multiplayer Trivia';
      if (quizId) {
        const q = await DataStore.getQuizById(quizId);
        if (q) quizTitle = q.title;
      }

      const { code, hostPlayerId, room, host } = await roomService.createRoom({
        hostName: hostName || 'Host',
        quizId,
        quizTitle,
        mode,
        userId
      });

      socket.join(code);
      socket.data = { roomCode: code, playerId: hostPlayerId, isHost: true };

      const players = await roomService.getPlayers(code);

      const response = {
        success: true,
        code,
        hostPlayerId,
        room,
        player: host,
        players
      };

      if (typeof callback === 'function') callback(response);
      socket.emit('room_created', response);
      io.to(code).emit('room_updated', {
        players,
        hostId: hostPlayerId,
        status: room.status,
        mode: room.mode
      });
    } catch (err) {
      console.error('Error creating room:', err);
      const errRes = { success: false, message: err.message || 'Failed to create room' };
      if (typeof callback === 'function') callback(errRes);
      socket.emit('error_message', errRes);
    }
  });

  // Join Room
  socket.on('join_room', async ({ code, name, avatar = '👤', userId = null, preferredTeam = null }, callback) => {
    try {
      if (!code) throw new Error('Room code is required');
      const cleanCode = code.trim().toUpperCase();

      const { player, room } = await roomService.joinRoom(cleanCode, {
        name: name || 'Player',
        avatar,
        userId,
        preferredTeam
      });

      socket.join(cleanCode);
      socket.data = { roomCode: cleanCode, playerId: player.id, isHost: player.isHost };

      const players = await roomService.getPlayers(cleanCode);

      const response = {
        success: true,
        code: cleanCode,
        player,
        room,
        players
      };

      if (typeof callback === 'function') callback(response);
      socket.emit('room_joined', response);

      // Notify all other clients in the room
      io.to(cleanCode).emit('room_updated', {
        players,
        hostId: room.hostId,
        status: room.status,
        mode: room.mode
      });
    } catch (err) {
      console.error('Error joining room:', err);
      const errRes = { success: false, message: err.message || 'Failed to join room' };
      if (typeof callback === 'function') callback(errRes);
      socket.emit('error_message', errRes);
    }
  });

  // Reconnect / Rejoin room (handles refresh or network reconnect)
  socket.on('reconnect_room', async ({ code, playerId }, callback) => {
    try {
      if (!code || !playerId) throw new Error('Missing code or playerId');
      const cleanCode = code.trim().toUpperCase();
      const room = await roomService.getRoom(cleanCode);
      if (!room) throw new Error('Room does not exist');

      const player = await roomService.getPlayer(cleanCode, playerId);
      if (!player) throw new Error('Player profile not found in room');

      await roomService.setPlayerConnection(cleanCode, playerId, true);

      socket.join(cleanCode);
      socket.data = { roomCode: cleanCode, playerId, isHost: player.isHost };

      const players = await roomService.getPlayers(cleanCode);
      const leaderboard = await roomService.getLeaderboard(cleanCode);

      const response = {
        success: true,
        code: cleanCode,
        player,
        room,
        players,
        leaderboard: leaderboard.top,
        teams: leaderboard.teams
      };

      if (typeof callback === 'function') callback(response);
      socket.emit('reconnected_success', response);

      io.to(cleanCode).emit('room_updated', {
        players,
        hostId: room.hostId,
        status: room.status,
        mode: room.mode
      });
    } catch (err) {
      const errRes = { success: false, message: err.message || 'Reconnection failed' };
      if (typeof callback === 'function') callback(errRes);
      socket.emit('error_message', errRes);
    }
  });

  // Switch Team (Team Mode)
  socket.on('switch_team', async ({ code, team }, callback) => {
    try {
      const cleanCode = (code || socket.data?.roomCode || '').trim().toUpperCase();
      const playerId = socket.data?.playerId;
      if (!cleanCode || !playerId) return;

      await roomService.switchTeam(cleanCode, playerId, team);
      const players = await roomService.getPlayers(cleanCode);
      const room = await roomService.getRoom(cleanCode);

      io.to(cleanCode).emit('room_updated', {
        players,
        hostId: room.hostId,
        status: room.status,
        mode: room.mode
      });

      if (typeof callback === 'function') callback({ success: true, team });
    } catch (err) {
      if (typeof callback === 'function') callback({ success: false, message: err.message });
    }
  });

  // Kick Player (Host control)
  socket.on('kick_player', async ({ code, playerId }, callback) => {
    try {
      const cleanCode = (code || socket.data?.roomCode || '').trim().toUpperCase();
      const hostId = socket.data?.playerId;
      const room = await roomService.getRoom(cleanCode);

      if (!room || room.hostId !== hostId) {
        throw new Error('Only the host can kick players');
      }

      // Notify the kicked player socket
      const sockets = await io.fetchSockets();
      for (const s of sockets) {
        if (s.data?.playerId === playerId) {
          s.emit('kicked', { message: 'You have been removed from the room by the host' });
          s.leave(cleanCode);
          break;
        }
      }

      await roomService.removePlayer(cleanCode, playerId);
      const players = await roomService.getPlayers(cleanCode);

      io.to(cleanCode).emit('room_updated', {
        players,
        hostId: room.hostId,
        status: room.status,
        mode: room.mode
      });

      if (typeof callback === 'function') callback({ success: true });
    } catch (err) {
      if (typeof callback === 'function') callback({ success: false, message: err.message });
      socket.emit('error_message', { message: err.message });
    }
  });

  // Leave room
  socket.on('leave_room', async ({ code }) => {
    const cleanCode = (code || socket.data?.roomCode || '').trim().toUpperCase();
    const playerId = socket.data?.playerId;
    if (!cleanCode || !playerId) return;

    socket.leave(cleanCode);
    const { room, newHostId } = await roomService.removePlayer(cleanCode, playerId);
    const players = await roomService.getPlayers(cleanCode);

    if (players.length > 0) {
      io.to(cleanCode).emit('room_updated', {
        players,
        hostId: newHostId || room.hostId,
        status: room.status,
        mode: room.mode
      });
    }
  });

  // Socket Disconnect
  socket.on('disconnect', async () => {
    const code = socket.data?.roomCode;
    const playerId = socket.data?.playerId;
    if (code && playerId) {
      await roomService.setPlayerConnection(code, playerId, false);
      const players = await roomService.getPlayers(code);
      const room = await roomService.getRoom(code);
      if (room && players.length > 0) {
        io.to(code).emit('room_updated', {
          players,
          hostId: room.hostId,
          status: room.status,
          mode: room.mode
        });
      }
    }
  });
}
