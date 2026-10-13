import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

let socketInstance = null;

export function getSocket() {
  if (!socketInstance) {
    const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5001';
    socketInstance = io(serverUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling']
    });
  }
  return socketInstance;
}

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [clockOffset, setClockOffset] = useState(0);
  const socketRef = useRef(getSocket());

  useEffect(() => {
    const socket = socketRef.current;

    function handleConnect() {
      setIsConnected(true);
      // Sync clock offset with server
      syncClock(socket);
    }

    function handleDisconnect() {
      setIsConnected(false);
    }

    function syncClock(sock) {
      const clientStart = Date.now();
      sock.emit('ping_time', clientStart, (res) => {
        if (res && res.serverTime) {
          const now = Date.now();
          const rtt = now - clientStart;
          const calculatedOffset = res.serverTime - (clientStart + rtt / 2);
          setClockOffset(calculatedOffset);
        }
      });
    }

    if (socket.connected) {
      setIsConnected(true);
      syncClock(socket);
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // Periodically sync clock every 30 seconds
    const interval = setInterval(() => {
      if (socket.connected) {
        syncClock(socket);
      }
    }, 30000);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      clearInterval(interval);
    };
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    clockOffset
  };
}
