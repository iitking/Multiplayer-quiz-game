import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { getRedisClient } from './config/redis.js';
import { setupSockets } from './sockets/index.js';
import quizRoutes from './routes/quiz.routes.js';
import authRoutes from './routes/auth.routes.js';
import historyRoutes from './routes/history.routes.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5001;
const CLIENT_URL = process.env.CLIENT_URL || '*';

// Socket.io configuration with generous ping intervals and CORS
const io = new Server(server, {
  cors: {
    origin: CLIENT_URL === '*' ? '*' : [CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  },
  pingTimeout: 30000,
  pingInterval: 15000
});

// Middleware
app.use(cors({
  origin: CLIENT_URL === '*' ? '*' : [CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// API Routes
app.use('/api/quizzes', quizRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/history', historyRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    service: 'Multiplayer Quiz Server',
    version: '1.0.0'
  });
});

// Initialize database & Redis
await connectDB();
getRedisClient();

// Setup Real-time Sockets
setupSockets(io);

server.listen(PORT, () => {
  console.log(`\n🚀 Multiplayer Quiz Server running at http://localhost:${PORT}`);
  console.log(`📡 WebSocket server ready for connections`);
});

export { app, server, io };
