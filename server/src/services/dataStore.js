import { QuizModel } from '../models/Quiz.js';
import { UserModel } from '../models/User.js';
import { GameHistoryModel } from '../models/GameHistory.js';
import { getIsMongoConnected } from '../config/db.js';

// Pre-seeded default quizzes with varied domains, timings, and media
const INITIAL_QUIZZES = [
  {
    _id: 'seed-quiz-1',
    id: 'seed-quiz-1',
    title: '💻 Web Development & JavaScript Mastery',
    description: 'Test your knowledge on modern JavaScript, React, Node.js and web architecture!',
    category: 'Technology',
    difficulty: 'Medium',
    createdBy: 'Antigravity Team',
    creatorId: 'system',
    isPublic: true,
    questions: [
      {
        id: 'q1-1',
        text: 'What will `typeof NaN` evaluate to in JavaScript?',
        options: ['"nan"', '"undefined"', '"number"', '"object"'],
        correctIndex: 2,
        duration: 15,
        explanation: 'In JavaScript, NaN is a numeric value representing "Not a Number", so typeof NaN is "number".'
      },
      {
        id: 'q1-2',
        text: 'Which React hook is used to perform side effects like subscriptions or data fetching?',
        options: ['useMemo', 'useEffect', 'useReducer', 'useCallback'],
        correctIndex: 1,
        duration: 15,
        explanation: 'useEffect handles side-effects in functional React components.'
      },
      {
        id: 'q1-3',
        text: 'What protocol does Socket.io upgrade to for real-time bi-directional communication?',
        options: ['HTTP/2', 'WebSocket', 'GraphQL Subscription', 'gRPC'],
        correctIndex: 1,
        duration: 15,
        explanation: 'Socket.io starts with HTTP long-polling and upgrades to WebSocket.'
      },
      {
        id: 'q1-4',
        text: 'Which Redis data structure is optimal for maintaining a real-time sorted leaderboard?',
        options: ['List', 'Hash', 'Sorted Set (ZSET)', 'HyperLogLog'],
        correctIndex: 2,
        duration: 15,
        explanation: 'Redis Sorted Sets (ZSET) rank members automatically with logarithmic insertion and retrieval.'
      },
      {
        id: 'q1-5',
        text: 'What is the time complexity of looking up a key in a standard JavaScript Map or Object?',
        options: ['O(1) average', 'O(n)', 'O(log n)', 'O(n²)'],
        correctIndex: 0,
        duration: 12,
        explanation: 'Hash table lookups are O(1) constant time on average.'
      }
    ],
    createdAt: new Date().toISOString()
  },
  {
    _id: 'seed-quiz-2',
    id: 'seed-quiz-2',
    title: '🌍 World Wonders & Global Landmarks',
    description: 'Can you identify world-famous monuments, natural wonders, and geography trivia?',
    category: 'Geography',
    difficulty: 'Easy',
    createdBy: 'Explorer Guild',
    creatorId: 'system',
    isPublic: true,
    questions: [
      {
        id: 'q2-1',
        text: 'In which country would you find the ancient rock-cut city of Petra?',
        options: ['Egypt', 'Jordan', 'Turkey', 'Peru'],
        correctIndex: 1,
        duration: 15,
        imageUrl: 'https://images.unsplash.com/photo-1579606032829-9a700684f092?w=800&auto=format&fit=crop&q=80',
        explanation: 'Petra is a famous archaeological site in Jordan\'s southwestern desert.'
      },
      {
        id: 'q2-2',
        text: 'Which is the longest river in the world by overall length?',
        options: ['Amazon River', 'Nile River', 'Yangtze River', 'Mississippi River'],
        correctIndex: 1,
        duration: 15,
        explanation: 'The Nile River spans approximately 6,650 km (4,132 miles).'
      },
      {
        id: 'q2-3',
        text: 'Which iconic amphitheatre was constructed in Rome during the Flavian dynasty?',
        options: ['Pantheon', 'Colosseum', 'Parthenon', 'Acropolis'],
        correctIndex: 1,
        duration: 15,
        imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&auto=format&fit=crop&q=80',
        explanation: 'The Colosseum in Rome was commissioned by Emperor Vespasian around 70–72 AD.'
      },
      {
        id: 'q2-4',
        text: 'What is the highest mountain peak in the world above sea level?',
        options: ['K2', 'Kangchenjunga', 'Mount Everest', 'Mount Kilimanjaro'],
        correctIndex: 2,
        duration: 12,
        explanation: 'Mount Everest stands at 8,848.86 metres (29,031.7 ft).'
      }
    ],
    createdAt: new Date().toISOString()
  },
  {
    _id: 'seed-quiz-3',
    id: 'seed-quiz-3',
    title: '⚡ Science, Cosmos & Future Tech',
    description: 'Quantum physics, space exploration, and futuristic scientific breakthroughs.',
    category: 'Science',
    difficulty: 'Hard',
    createdBy: 'AstroLab',
    creatorId: 'system',
    isPublic: true,
    questions: [
      {
        id: 'q3-1',
        text: 'What astronomical object is at the center of the Milky Way galaxy?',
        options: ['Sagittarius A*', 'Andromeda Core', 'Betelgeuse', 'Pulsar PSR B1919+21'],
        correctIndex: 0,
        duration: 15,
        imageUrl: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&auto=format&fit=crop&q=80',
        explanation: 'Sagittarius A* is a supermassive black hole located at the Galactic Center of the Milky Way.'
      },
      {
        id: 'q3-2',
        text: 'Which elementary particle mediates the electromagnetic force?',
        options: ['Gluon', 'Photon', 'Higgs Boson', 'Z Boson'],
        correctIndex: 1,
        duration: 15,
        explanation: 'Photons are the gauge bosons for electromagnetism.'
      },
      {
        id: 'q3-3',
        text: 'What is the speed of light in vacuum approximately equal to?',
        options: ['150,000 km/s', '300,000 km/s', '450,000 km/s', '1,000,000 km/s'],
        correctIndex: 1,
        duration: 12,
        explanation: 'The speed of light in vacuum is exactly 299,792,458 metres per second (approx 300,000 km/s).'
      },
      {
        id: 'q3-4',
        text: 'Which telescope was launched in December 2021 as the premier deep space observatory?',
        options: ['Hubble', 'James Webb Space Telescope', 'Spitzer', 'Kepler'],
        correctIndex: 1,
        duration: 15,
        imageUrl: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=800&auto=format&fit=crop&q=80',
        explanation: 'The James Webb Space Telescope (JWST) succeeded Hubble as NASA\'s flagship astrophysics mission.'
      }
    ],
    createdAt: new Date().toISOString()
  },
  {
    _id: 'seed-quiz-4',
    id: 'seed-quiz-4',
    title: '🎬 Movies, Gaming & Pop Culture Mania',
    description: 'Cinema classics, video game legends, and blockbuster trivia.',
    category: 'Entertainment',
    difficulty: 'Easy',
    createdBy: 'PopCultureHub',
    creatorId: 'system',
    isPublic: true,
    questions: [
      {
        id: 'q4-1',
        text: 'In Minecraft, what material is required alongside an Iron Ingot to craft Flint and Steel?',
        options: ['Coal', 'Flint', 'Gunpowder', 'Obsidian'],
        correctIndex: 1,
        duration: 12,
        explanation: 'Flint and steel is crafted with one flint and one iron ingot.'
      },
      {
        id: 'q4-2',
        text: 'Who directed the sci-fi mind-bending films "Inception" and "Interstellar"?',
        options: ['Steven Spielberg', 'Christopher Nolan', 'Denis Villeneuve', 'James Cameron'],
        correctIndex: 1,
        duration: 15,
        explanation: 'Christopher Nolan directed Inception (2010) and Interstellar (2014).'
      },
      {
        id: 'q4-3',
        text: 'What is the name of the protagonist in the legendary Nintendo franchise "The Legend of Zelda"?',
        options: ['Zelda', 'Link', 'Ganon', 'Epona'],
        correctIndex: 1,
        duration: 12,
        explanation: 'Link is the green-clad courage hero; Zelda is the Princess of Hyrule.'
      },
      {
        id: 'q4-4',
        text: 'Which superhero says the line: "I am Iron Man"?',
        options: ['Tony Stark', 'Steve Rogers', 'Peter Parker', 'Bruce Wayne'],
        correctIndex: 0,
        duration: 10,
        explanation: 'Tony Stark played by Robert Downey Jr. in the Marvel Cinematic Universe.'
      }
    ],
    createdAt: new Date().toISOString()
  }
];

class MemoryDataStore {
  constructor() {
    this.quizzes = new Map();
    this.users = new Map();
    this.history = [];

    // Pre-populate quizzes
    for (const q of INITIAL_QUIZZES) {
      this.quizzes.set(q._id, { ...q });
    }
  }

  // Quizzes
  async getQuizzes() {
    return Array.from(this.quizzes.values());
  }

  async getQuizById(id) {
    return this.quizzes.get(id) || null;
  }

  async createQuiz(data) {
    const id = 'quiz_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const newQuiz = {
      _id: id,
      id: id,
      title: data.title || 'Untitled Quiz',
      description: data.description || '',
      category: data.category || 'General',
      difficulty: data.difficulty || 'Medium',
      createdBy: data.createdBy || 'Host',
      creatorId: data.creatorId || null,
      isPublic: data.isPublic !== undefined ? data.isPublic : true,
      questions: (data.questions || []).map((q, idx) => ({
        id: q.id || 'q_' + idx + '_' + Date.now(),
        text: q.text,
        options: q.options || [],
        correctIndex: Number(q.correctIndex || 0),
        duration: Number(q.duration || 15),
        imageUrl: q.imageUrl || '',
        audioUrl: q.audioUrl || '',
        explanation: q.explanation || ''
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.quizzes.set(id, newQuiz);
    return newQuiz;
  }

  async updateQuiz(id, data) {
    const existing = this.quizzes.get(id);
    if (!existing) return null;
    const updated = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString()
    };
    this.quizzes.set(id, updated);
    return updated;
  }

  async deleteQuiz(id) {
    return this.quizzes.delete(id);
  }

  // Users
  async findUserByUsername(username) {
    for (const user of this.users.values()) {
      if (user.username.toLowerCase() === username.toLowerCase()) return user;
    }
    return null;
  }

  async findUserByEmail(email) {
    for (const user of this.users.values()) {
      if (user.email.toLowerCase() === email.toLowerCase()) return user;
    }
    return null;
  }

  async findUserById(id) {
    return this.users.get(id) || null;
  }

  async createUser(userData) {
    const id = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const user = {
      _id: id,
      id: id,
      username: userData.username,
      email: userData.email,
      passwordHash: userData.passwordHash,
      avatar: userData.avatar || '🦊',
      stats: {
        gamesPlayed: 0,
        wins: 0,
        totalScore: 0,
        correctAnswers: 0,
        totalAnswers: 0
      },
      createdAt: new Date().toISOString()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserStats(id, { isWin, score, correctCount, totalCount }) {
    const user = this.users.get(id);
    if (!user) return null;
    user.stats.gamesPlayed += 1;
    if (isWin) user.stats.wins += 1;
    user.stats.totalScore += (score || 0);
    user.stats.correctAnswers += (correctCount || 0);
    user.stats.totalAnswers += (totalCount || 0);
    return user;
  }

  // Game History
  async saveGameHistory(historyData) {
    const record = {
      _id: 'hist_' + Date.now(),
      id: 'hist_' + Date.now(),
      ...historyData,
      playedAt: new Date().toISOString()
    };
    this.history.unshift(record);
    if (this.history.length > 100) this.history.pop();
    return record;
  }

  async getGameHistories(limit = 20) {
    return this.history.slice(0, limit);
  }
}

const memoryStore = new MemoryDataStore();

// Unified repository methods that route to Mongo or MemoryStore transparently
export const DataStore = {
  async getQuizzes() {
    if (getIsMongoConnected()) {
      try {
        const docs = await QuizModel.find().lean();
        if (docs.length > 0) return docs;
      } catch (e) {
        console.warn('Mongo read error, falling back to local memory store:', e.message);
      }
    }
    return memoryStore.getQuizzes();
  },

  async getQuizById(id) {
    if (getIsMongoConnected()) {
      try {
        const doc = await QuizModel.findById(id).lean();
        if (doc) return doc;
      } catch (e) {
        // ID might be non-ObjectId seed ID, fallback to memory
      }
    }
    return memoryStore.getQuizById(id);
  },

  async createQuiz(quizData) {
    if (getIsMongoConnected()) {
      try {
        const doc = await QuizModel.create(quizData);
        return doc.toObject();
      } catch (e) {
        console.warn('Mongo create error, falling back to local memory store:', e.message);
      }
    }
    return memoryStore.createQuiz(quizData);
  },

  async updateQuiz(id, quizData) {
    if (getIsMongoConnected()) {
      try {
        const doc = await QuizModel.findByIdAndUpdate(id, quizData, { new: true }).lean();
        if (doc) return doc;
      } catch (e) {
        console.warn('Mongo update error, falling back to local memory store:', e.message);
      }
    }
    return memoryStore.updateQuiz(id, quizData);
  },

  async deleteQuiz(id) {
    if (getIsMongoConnected()) {
      try {
        await QuizModel.findByIdAndDelete(id);
        return true;
      } catch (e) {
        console.warn('Mongo delete error, falling back to local memory store:', e.message);
      }
    }
    return memoryStore.deleteQuiz(id);
  },

  // Users
  async findUserByUsername(username) {
    if (getIsMongoConnected()) {
      try {
        return await UserModel.findOne({ username: new RegExp(`^${username}$`, 'i') }).lean();
      } catch (e) {
        console.warn('Mongo findUser error:', e.message);
      }
    }
    return memoryStore.findUserByUsername(username);
  },

  async findUserByEmail(email) {
    if (getIsMongoConnected()) {
      try {
        return await UserModel.findOne({ email: email.toLowerCase() }).lean();
      } catch (e) {
        console.warn('Mongo findUser error:', e.message);
      }
    }
    return memoryStore.findUserByEmail(email);
  },

  async findUserById(id) {
    if (getIsMongoConnected()) {
      try {
        return await UserModel.findById(id).lean();
      } catch (e) {
        // fallback
      }
    }
    return memoryStore.findUserById(id);
  },

  async createUser(userData) {
    if (getIsMongoConnected()) {
      try {
        const user = await UserModel.create(userData);
        return user.toObject();
      } catch (e) {
        console.warn('Mongo createUser error:', e.message);
      }
    }
    return memoryStore.createUser(userData);
  },

  async updateUserStats(id, stats) {
    if (getIsMongoConnected()) {
      try {
        const inc = {
          'stats.gamesPlayed': 1,
          'stats.wins': stats.isWin ? 1 : 0,
          'stats.totalScore': stats.score || 0,
          'stats.correctAnswers': stats.correctCount || 0,
          'stats.totalAnswers': stats.totalCount || 0
        };
        const updated = await UserModel.findByIdAndUpdate(id, { $inc: inc }, { new: true }).lean();
        if (updated) return updated;
      } catch (e) {
        console.warn('Mongo update stats error:', e.message);
      }
    }
    return memoryStore.updateUserStats(id, stats);
  },

  // Game History
  async saveGameHistory(historyData) {
    if (getIsMongoConnected()) {
      try {
        const doc = await GameHistoryModel.create(historyData);
        return doc.toObject();
      } catch (e) {
        console.warn('Mongo saveHistory error:', e.message);
      }
    }
    return memoryStore.saveGameHistory(historyData);
  },

  async getGameHistories(limit = 20) {
    if (getIsMongoConnected()) {
      try {
        return await GameHistoryModel.find().sort({ playedAt: -1 }).limit(limit).lean();
      } catch (e) {
        console.warn('Mongo getHistories error:', e.message);
      }
    }
    return memoryStore.getGameHistories(limit);
  }
};
