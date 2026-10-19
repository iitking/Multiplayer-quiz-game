# 🎮 QuizArena — Real-Time Multiplayer Quiz Game

<div align="center">

![Multiplayer Quiz Game](https://img.shields.io/badge/Status-Production%20Ready-success?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20Socket.io%20%7C%20Node%20%7C%20Redis%20%7C%20Mongo-8B5CF6?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

Quiz rooms jahan friends ek **4-digit unique code** se live join karte hain, featuring a **server-authoritative synced timer**, **live ranked leaderboard**, **speed bonus scoring**, **team war battles**, **strategic power-ups**, and **AI quiz generation**.

[Features](#-features) • [Architecture](#-architecture) • [Workflow (Phase 0--10)](#-build-workflow-phase-by-phase) • [Socket Events](#-socket-events-reference) • [REST APIs](#-rest-api-reference) • [Quickstart](#-quickstart--installation) • [Author](#-author)

</div>

---

## 📖 Overview

**QuizArena** is an interactive, real-time multiplayer trivia platform inspired by Kahoot and Quizizz. It allows hosts to launch custom or AI-generated quiz rooms that players can join instantly from any mobile or desktop browser using a simple 4-digit room code.

### 🛡️ Why Server-Authoritative?
In standard client-driven trivia apps, questions contain correct answers directly in the frontend payload, and countdown timers are prone to client clock drift and inspection exploits. 

**QuizArena implements a strict server-authoritative architecture:**
1. **Zero Client Exploits**: The server never transmits `correctIndex` to the client until the round is over.
2. **Synchronized Clocks**: Bidirectional ping timestamps (`ping_time`) calculate client-server clock offsets down to the millisecond, guaranteeing the countdown timer expires at the exact same moment across all connected devices.
3. **Speed Bonus Calculations**: Answer submission times are validated and scored on the server using timestamp deltas.

---

## ✨ Features

- [x] **Instant 4-Digit Room Codes**: Simple uppercase alphanumeric codes (`JB4Q`, `7K9P`) with 1-click clipboard copy.
- [x] **Server-Authoritative Synced Timer**: Millisecond-precise clock offset synchronization with circular visual gauge and urgency audio ticks.
- [x] **Speed Bonus Scoring**: Dynamic point distribution rewarding both correctness and rapid response time.
- [x] **Live Leaderboard**: Real-time sorted scores, rank podium badges (🥇 🥈 🥉), and score deltas powered by Redis Sorted Sets (`ZSET`).
- [x] **Comprehensive Host Controls**:
  - `start_game`: Launches synchronized 3-second countdown
  - `next_question`: Advances to the next trivia round
  - `skip_question`: Immediately terminates round and reveals answer
  - `kick_player`: Removes unwanted participants
  - `end_game_early`: Concludes match and renders final tournament podium
  - Auto-host migration if the host disconnects
- [x] **Custom Quizzes (Full CRUD)**:
  - Create, view, edit, and delete custom quiz packs
  - Configurable durations per question (10s, 15s, 20s, 30s)
  - Visual image clues and audio sound bite support
- [x] **Resilience & Edge-Case Handling**:
  - Session recovery via `localStorage` (`playerId` + `roomCode` restore on refresh)
  - Duplicate player nickname handling (`Name (2)`)
  - Late-joiner **Spectator Mode**
  - Rate-limited and double-submission protection
  - Procedural Web Audio API sound effects (ticks, correct chime, wrong buzzer, victory fanfare)
  - Winner celebration confetti (`canvas-confetti`)
  - 100% Mobile-first responsive glassmorphic UI

---

## 💡 Advanced & Future Ideas Implemented

All 5 advanced gameplay and system capabilities are fully built and operational:

### 1. 🔐 User Authentication & Saved Game History
- User registration and login powered by `bcryptjs` password hashing and JWT authentication.
- Player profile stats: total score, matches played, tournament wins, and accuracy.
- Match history records saved automatically to MongoDB/DataStore at match conclusion (`/api/history`).

### 2. 🛡️ Team Mode (Team War)
- Host can toggle between **Solo Battle** (free-for-all) and **Team War** during room creation.
- 4 Competing Factions:
  - 🔴 **Red Dragons**
  - 🔵 **Blue Sharks**
  - 🟢 **Green Vipers**
  - 🟡 **Yellow Titans**
- Live team score aggregation, team switcher in lobby, and dual Solo/Team leaderboards.

### 3. ⚡ Strategic Tactical Power-Ups
Players can deploy 3 tactical power-ups during active questions:
- ✂️ **50/50**: Server eliminates two incorrect choices.
- ⚡ **2x Points**: Multiplies score on that question by 2 if answered correctly.
- ⏳ **+5s Extra Time**: Extends the countdown buffer for the player by 5 seconds.

### 4. 🖼️ Visual & Audio Questions
- Questions support optional `imageUrl` for landmark / logo / visual identification quizzes.
- Questions support optional `audioUrl` with integrated audio streaming preview.

### 5. ✨ AI Quiz Generator
- Generate quizzes instantly on **ANY** topic (e.g. *Space Exploration, React Hooks, World History, Cinema*).
- Select difficulty (*Easy*, *Medium*, *Hard*) and question count (3 to 10 questions).
- Built-in intelligent domain generator + Google Gemini / OpenAI API support via `.env`.

---

## 🏗️ Architecture

```
React Client (Vite)  <──WebSocket (Socket.io)──>  Node.js Server  ──>  Redis (live game state)
      │                                                  │
      └─────────── REST API (Express) ───────────────────┴──>  MongoDB (quizzes, users, history)
```

- **MongoDB** = Permanent data (quizzes, questions, registered users, tournament game history).
- **Redis** = High-performance temporary live state (rooms, players, sorted scores, answer hashes) with TTL.
- **Socket.io** = Bi-directional real-time events.
- **Graceful Fallbacks**: The server runs out of the box with high-performance In-Memory Redis and local persistent storage with pre-seeded sample quizzes. Connecting MongoDB Atlas or Redis via `.env` enables seamless cloud persistence.

---

## 📁 Folder Structure

```
quiz-game/
├── client/
│   ├── src/
│   │   ├── pages/         # Home, Lobby, QuestionScreen, QuestionResultScreen, ResultsScreen
│   │   ├── components/    # Timer, AnswerButton, PlayerList, LeaderboardCard, PowerUpBar,
│   │   │                  # TeamSelector, MediaViewer, HostControls, Navbar, Modals
│   │   ├── hooks/         # useSocket (clock sync), useCountdown, useSound (Web Audio)
│   │   ├── context/       # GameContext, AuthContext
│   │   ├── index.css      # Tailwind directives & glassmorphic styles
│   │   └── main.jsx
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── server/
│   ├── src/
│   │   ├── config/        # db.js (mongo + fallback), redis.js (ioredis + fallback)
│   │   ├── models/        # Quiz.js, User.js, GameHistory.js
│   │   ├── routes/        # quiz.routes.js, auth.routes.js, history.routes.js
│   │   ├── services/      # roomService.js, gameService.js, scoreService.js, aiService.js
│   │   ├── sockets/       # index.js, room.handler.js, game.handler.js
│   │   ├── utils/         # generateRoomCode.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
├── test-e2e.js            # Automated end-to-end integration test suite
├── dev.js                 # Unified dev runner orchestrator
├── requirements.txt       # System & package specifications
└── package.json           # Root package scripts
```

---

## 🗺️ Build Workflow (Phase by Phase)

### Phase 0 — Setup
- [x] Monorepo workspace with `client/` and `server/` folders
- [x] React client initialized with Vite and Tailwind CSS
- [x] Node.js server setup with Express, Socket.io, Mongoose, ioredis, JWT, bcryptjs
- [x] Environment variables configuration (`PORT`, `CLIENT_URL`, `JWT_SECRET`, `MONGO_URI`, `REDIS_URL`)

### Phase 1 — Basic Socket Connection
- [x] Express + Socket.io server running with CORS support
- [x] Client `useSocket` hook with singleton connection instance
- [x] Automatic reconnection and health monitoring

### Phase 2 — Room System
- [x] `create_room` → Server generates unique 4-digit code (`generateRoomCode.js`)
- [x] `join_room` → Code validation, player profile assignment, `socket.join(code)`
- [x] Lobby UI: Live player list with avatars and host crown (`room_updated` event)
- [x] Host identification (`hostId`) with auto-migration upon host disconnect
- [x] Clean departure and disconnect handling (`leave_room`)

### Phase 3 — Game Loop + Synced Timer
- [x] Host triggers `start_game` with synchronized 3s countdown
- [x] Server emits `question_start` payload (**omitting `correctIndex`**):
  ```json
  {
    "index": 0,
    "total": 5,
    "question": {
      "text": "What will `typeof NaN` evaluate to in JavaScript?",
      "options": ["nan", "undefined", "number", "object"]
    },
    "endsAt": 1730000015000,
    "duration": 15,
    "serverTime": 1730000000000
  }
  ```
- [x] Client computes remaining time with clock offset compensation: `diff = endsAt - (Date.now() + clockOffset)`
- [x] Server timeout triggers `question_end` upon expiration
- [x] Early completion: If all active eligible players answer, question ends immediately
- [x] Server transmits `question_end` with `correctIndex`, explanation, and option histogram stats

### Phase 4 — Answers + Scoring
- [x] Player submits answer via `submit_answer { code, optionIndex }`
- [x] Server-side validation: Room active? Question active? `Date.now() <= endsAt + gracePeriod`? Duplicate answer check?
- [x] Speed bonus points calculation formula:
  $$\text{base} = 1000$$
  $$\text{speedBonus} = \text{round}\left(500 \times \left(1 - \frac{\text{timeTaken}}{\text{duration}}\right)\right)$$
  $$\text{points} = \text{isCorrect} ? (\text{base} + \text{speedBonus}) \times \text{multiplier} : 0$$
- [x] Leaderboard updated dynamically after every submission

### Phase 5 — Redis Integration
Live state managed via Redis with 3-hour TTL:

| Key | Type | Purpose |
|---|---|---|
| `room:{code}` | Hash | hostId, quizId, status, currentIndex, endsAt, mode |
| `room:{code}:players` | Hash | playerId → JSON string (name, avatar, team, powerUps) |
| `room:{code}:scores` | Sorted Set | playerId → score (`ZINCRBY`, `ZREVRANGE`) |
| `room:{code}:answers:{qIndex}` | Hash | playerId → JSON string (optionIndex, points, isCorrect) |

- Leaderboard query: `ZREVRANGE room:{code}:scores 0 -1 WITHSCORES`

### Phase 6 — MongoDB: Custom Quizzes
- [x] Mongoose models for `Quiz`, `User`, and `GameHistory`
- [x] Full REST endpoints: `GET /api/quizzes`, `GET /api/quizzes/:id`, `POST`, `PUT`, `DELETE`
- [x] Interactive `CreateQuizModal` in React for designing questions, options, durations, and media
- [x] Host selects quiz during room creation

### Phase 7 — Frontend Screens
- [x] **Home**: Join with 4-digit code + name + avatar picker / Host quiz selector / Featured shelf
- [x] **Lobby**: Big room code with 1-click copy, live player chips, team selector, start button
- [x] **Question**: Circular SVG countdown timer, question card, media viewer, 4 Kahoot-style colored cards, power-up bar
- [x] **Question Result**: Correct answer highlight, player feedback, answer statistics histogram, mini leaderboard
- [x] **Final Results**: 3D tournament podium (1st, 2nd, 3rd), winning team banner, full leaderboard, victory confetti
- [x] Mobile-first responsive layout with dark glassmorphism

### Phase 8 — Host Controls
- [x] Skip active question
- [x] Next question advancement
- [x] Kick disruptive player
- [x] End game early
- [x] Automatic host migration if host disconnects

### Phase 9 — Edge Cases & Polish
- [x] Session recovery via `localStorage` on page refresh
- [x] Duplicate nickname deduplication
- [x] Late-joiner Spectator Mode
- [x] Double-submit prevention & rate limiting
- [x] Procedural sound effects using Web Audio API
- [x] Confetti particle celebration for winners

### Phase 10 — Deployment Ready
- [x] Client → Ready for **Vercel / Netlify**
- [x] Server → Ready for **Render / Railway** with WebSocket support
- [x] Redis → Supports **Upstash Redis** or self-hosted Redis
- [x] MongoDB → Supports **MongoDB Atlas**
- [x] Fully configured CORS and environment variables

---

## 🔄 Game State Flow

```
IDLE  ──>  LOBBY  ──>  STARTING (3s)  ──>  QUESTION_ACTIVE  ──>  QUESTION_RESULT  ──>  (Next Question)  ──>  FINISHED (Podium)
```

---

## 📡 Socket Events Reference

### Client → Server

| Event | Payload | Emitter | Purpose |
|---|---|---|---|
| `create_room` | `{ quizId, hostName, mode, userId }` | Host | Creates room with 4-digit code |
| `join_room` | `{ code, name, avatar, userId, preferredTeam }` | Player | Joins active room |
| `reconnect_room` | `{ code, playerId }` | Player/Host | Restores player session on tab refresh |
| `switch_team` | `{ code, team }` | Player | Selects Red, Blue, Green, or Yellow team |
| `start_game` | `{ code }` | Host | Starts 3-second match countdown |
| `use_powerup` | `{ code, powerUpType }` | Player | Deploys 50/50, 2x Points, or Extra Time |
| `submit_answer` | `{ code, optionIndex }` | Player | Submits answer within time limit |
| `next_question` | `{ code }` | Host | Advances to next round |
| `skip_question` | `{ code }` | Host | Skips remaining time on current question |
| `kick_player` | `{ code, playerId }` | Host | Removes player from room |
| `end_game_early` | `{ code }` | Host | Ends tournament early and renders podium |
| `leave_room` | `{ code }` | Any | Leaves current room |

### Server → Client

| Event | Payload | Purpose |
|---|---|---|
| `room_created` | `{ code, hostPlayerId, room, player, players }` | Room generation confirmation |
| `room_joined` | `{ code, player, room, players }` | Join room confirmation |
| `room_updated` | `{ players, hostId, status, mode }` | Roster and lobby state update |
| `game_starting` | `{ countdown, totalQuestions, quizTitle }` | 3-second start countdown |
| `question_start` | `{ index, total, question, endsAt, duration, serverTime }` | New round payload (correctIndex hidden) |
| `answer_count` | `{ answered, total }` | Real-time response counter |
| `answer_acknowledged` | `{ pointsEarned, speedBonus }` | Submission acknowledgement to player |
| `powerup_result` | `{ powerUpType, eliminatedOptions, multiplier, bonusSeconds }` | Power-up outcome |
| `question_end` | `{ correctIndex, explanation, stats, leaderboard, teams }` | Correct answer reveal & stats |
| `game_over` | `{ finalLeaderboard, winningTeam, teamScores, podium }` | Tournament finish & podium standings |
| `kicked` | `{ message }` | Notification for kicked player |
| `error_message` | `{ message }` | Generic error alert |

---

## 🔌 REST API Reference

### Quizzes (`/api/quizzes`)
- `GET /api/quizzes` — Retrieve all quizzes
- `GET /api/quizzes/:id` — Retrieve quiz by ID
- `POST /api/quizzes` — Create custom quiz
- `PUT /api/quizzes/:id` — Update quiz
- `DELETE /api/quizzes/:id` — Delete quiz
- `POST /api/quizzes/generate-ai` — Generate quiz via AI topic

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register new user account
- `POST /api/auth/login` — Sign in and receive JWT token
- `GET /api/auth/me` — Retrieve authenticated user profile and stats

### Match History (`/api/history`)
- `GET /api/history` — List recent completed tournament matches
- `GET /api/history/:id` — Get single match result breakdown

---

## ✅ Testing & Verification Checklist

- [x] Multi-tab concurrent gameplay tested (Host + Multiple Players)
- [x] Server-authoritative timer synchronized across devices
- [x] Late answers automatically rejected past `endsAt`
- [x] Duplicate submissions blocked per question
- [x] Page refresh gracefully rejoins active session
- [x] 50/50, 2x Points, and Extra Time power-up mechanics verified
- [x] Solo and Team Mode scoring verified
- [x] End-to-end integration test suite passes 100%

Run the automated test suite anytime:
```bash
npm test
```

---

## 🚀 Quickstart & Installation

### 1. Prerequisites
- **Node.js**: `v18.0.0` or higher (`v20+` recommended)
- **npm**: `v9.0.0` or higher

### 2. Install Dependencies
```bash
# Install backend dependencies
cd server && npm install

# Install frontend dependencies
cd ../client && npm install

# Return to root
cd ..
```

### 3. Environment Variables
Create a `server/.env` file (or use the pre-configured defaults):
```env
PORT=5001
CLIENT_URL=http://localhost:5173
JWT_SECRET=super-secret-quiz-game-key-999

# Optional: Remote Cloud Services (In-memory fallbacks work automatically)
# REDIS_URL=redis://localhost:6379
# MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/quizgame
# GEMINI_API_KEY=your_gemini_api_key
# OPENAI_API_KEY=your_openai_api_key
```

### 4. Run Development Server
```bash
npm run dev
```

- **Frontend Client**: [http://localhost:5173](http://localhost:5173)
- **Backend API & WebSockets**: [http://localhost:5001](http://localhost:5001)

---

## 👨💻 Author

<div align="center">

<a href="https://github.com/iitking">
  <img src="https://github.com/iitking.png" width="110" height="110" style="border-radius:50%" alt="Nivesh Kumar Meena" />
</a>

### **Nivesh Kumar Meena**

**AI Architect · MLOps Engineer** | B.Tech Electrical Engineering, **IIT Roorkee**

*Building agentic AI systems, RAG pipelines and production-ready ML.*

<a href="https://www.linkedin.com/in/nivesh-kumar-meena-a31465221/"><img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn" /></a>
<a href="https://github.com/iitking"><img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub" /></a>
<a href="mailto:niveshkr149@gmail.com"><img src="https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white" alt="Email" /></a>

<br/><br/>

⭐ **If you found this project useful, please give it a star!** ⭐

<sub>Open to AI/ML engineering opportunities and collaborations.</sub>

</div>

---

<div align="center">
  <sub>Made with ❤️ by <a href="https://github.com/iitking">Nivesh Kumar Meena</a> · © 2026 · MIT License</sub>
</div>
