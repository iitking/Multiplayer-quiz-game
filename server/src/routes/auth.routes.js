import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { DataStore } from '../services/dataStore.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'multiplayer-quiz-secret-key-12345';

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, avatar } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Username, email, and password are required' });
    }

    if (username.length < 3) {
      return res.status(400).json({ success: false, message: 'Username must be at least 3 characters' });
    }

    const existingName = await DataStore.findUserByUsername(username);
    if (existingName) {
      return res.status(400).json({ success: false, message: 'Username is already taken' });
    }

    const existingEmail = await DataStore.findUserByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'Email is already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await DataStore.createUser({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      avatar: avatar || '🦊'
    });

    const token = jwt.sign(
      { id: user.id || user._id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id || user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        stats: user.stats
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: err.message || 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body; // username or email

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email/username and password' });
    }

    let user = await DataStore.findUserByEmail(identifier);
    if (!user) {
      user = await DataStore.findUserByUsername(identifier);
    }

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id || user._id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id || user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        stats: user.stats
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: err.message || 'Login failed' });
  }
});

// Get current user profile
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No authorization token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await DataStore.findUserById(decoded.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user.id || user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        stats: user.stats
      }
    });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
});

export default router;
