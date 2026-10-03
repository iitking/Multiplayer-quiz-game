import { registerRoomHandlers } from './room.handler.js';
import { registerGameHandlers } from './game.handler.js';

export function setupSockets(io) {
  io.on('connection', (socket) => {
    // Clock synchronization ping event for precise timer offset
    socket.on('ping_time', (clientTimestamp, callback) => {
      const serverTime = Date.now();
      if (typeof callback === 'function') {
        callback({ clientTimestamp, serverTime });
      }
    });

    // Register modular handlers
    registerRoomHandlers(io, socket);
    registerGameHandlers(io, socket);
  });
}
