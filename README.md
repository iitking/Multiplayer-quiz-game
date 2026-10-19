# 🎮 QuizArena — Real-Time Multiplayer Quiz Game

Quiz rooms where friends join with a **4-digit code**, with a **live synchronized server-authoritative timer**, **live leaderboard**, **power-ups**, **team war battles**, and **AI quiz generation**.

**Tech Stack:** React 18 · Vite · Socket.io · Node.js · Express · Redis (ioredis + memory fallback) · MongoDB (Mongoose + local store fallback) · Tailwind CSS

---

## ✨ Complete Feature Matrix

All specifications from `README-3.md` and **all Future Ideas** are fully implemented:

- [x] **4-Digit Room Codes**: Unique alphanumeric codes (`JB4Q`, `7K9P`) with 1-click clipboard copy.
- [x] **Server-Authoritative Synced Timer**: Millisecond-precision clock offset calculation (`ping_time` sync).
- [x] **Speed Bonus Scoring**: Kahoot/Quizizz formula:
  $$\text{points} = \text{base} (1000) + \text{speedBonus} \left(500 \times \left(1 - \frac{\text{timeTaken}}{\text{duration}}\right)\right)$$
- [x] **Live Leaderboard**: Real-time sorted scores, rank podium badges (🥇 🥈 🥉), and score updates.
- [x] **Host Controls**:
  - `start_game`: Initiates synchronized 3s countdown
  - `next_question`: Advances to next round
  - `skip_question`: Immediately reveals answer
  - `kick_player`: Removes disruptive participants
  - `end_game_early`: Concludes match and renders final podium
  - Auto-host migration if host disconnects
- [x] **Custom Quizzes (Full CRUD)**:
  - Create / View / Edit / Delete quizzes
  - Customizable question durations (10s, 15s, 20s, 30s)
  - Visual image and audio clues support
- [x] **Edge Case & Polish**:
  - Session recovery via `localStorage` (`playerId` + `roomCode` rejoin upon page refresh)
  - Duplicate player name handling (automatic `(2)`, `(3)` deduplication)
  - Late-joiner Spectator Mode (read-only real-time viewing)
  - Double-submit prevention & rate limiting
  - Web Audio API synthesized sound effects (ticks, correct chime, wrong buzzer, victory fanfare)
  - Winner celebration confetti (`canvas-confetti`)
  - 100% Mobile-first responsive glassmorphic UI

---

## 💡 Implemented Future Ideas

All 5 future ideas outlined in `README-3.md` are completed:

### 1. 🔐 User Authentication & Saved Game History
- User registration and login with bcrypt password hashing and JWT authentication.
- Player profile with trackable statistics: total score, games played, tournament wins.
- Match history records saved automatically at the end of each game (`/api/history`).

### 2. 🛡️ Team Mode (Team War)
- Host can choose between **Solo Battle** and **Team War** during room creation.
- 4 Teams:
  - 🔴 **Red Dragons**
  - 🔵 **Blue Sharks**
  - 🟢 **Green Vipers**
  - 🟡 **Yellow Titans**
- Live team score aggregation, team switcher in lobby, and Team Leaderboard alongside solo ranking.

### 3. ⚡ Strategic Power-Ups
Players can deploy 3 tactical power-ups during active questions:
- ✂️ **50/50**: Eliminates two incorrect options.
- ⚡ **2x Points**: Multiplies score on that question by 2 if correct.
- ⏳ **+5s Extra Time**: Extends player's answer buffer by 5 seconds.

### 4. 🖼️ Visual & Audio Questions
- Questions support optional `imageUrl` for landmark / visual identification quizzes.
- Questions support optional `audioUrl` with integrated audio playback preview.

### 5. ✨ AI Quiz Generator
- Generate quizzes instantly on **ANY** topic (e.g. *Space*, *React Hooks*, *World History*, *Cinema*).
- Select difficulty (*Easy*, *Medium*, *Hard*) and question count (3 to 10 questions).
- Built-in intelligent domain generator + Google Gemini / OpenAI API support via `.env`.

---

## 🏗️ Architecture

```
React Client (Vite)  <──WebSocket (Socket.io)──>  Node.js Server  ──>  Redis (live game state)
      │                                                  │
      └─────────── REST API (Express) ───────────────────┴──>  MongoDB (quizzes, users, history)
```

- **Server is the source of truth**: Questions are delivered without the correct answer (`correctIndex` omitted). The server validates timestamps against `endsAt` before calculating scores.
- **Graceful Fallbacks**: The server runs instantly out-of-the-box with high-performance In-Memory Redis and local persistent storage with pre-seeded sample quizzes. Connecting MongoDB Atlas or Redis via `.env` enables seamless cloud persistence.

---

## 📁 Project Structure

```
quiz-game/
├── client/
│   ├── src/
│   │   ├── pages/         # Home, Lobby, QuestionScreen, QuestionResultScreen, ResultsScreen
│   │   ├── components/    # Timer, AnswerButton, PlayerList, LeaderboardCard, PowerUpBar,
│   │   │                  # TeamSelector, MediaViewer, HostControls, Navbar, Modals
│   │   ├── hooks/         # useSocket (clock sync), useCountdown, useSound (Web Audio)
│   │   ├── context/       # GameContext, AuthContext
│   │   └── main.jsx
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
│   └── package.json
├── test-e2e.js            # Automated end-to-end integration test suite
├── dev.js                 # Unified dev runner
└── package.json           # Root package scripts
```

---

## 🚀 Quickstart

### 1. Install Dependencies
```bash
# In server directory
cd server && npm install

# In client directory
cd ../client && npm install
```

### 2. Run Both Server & Client
From the root directory:
```bash
npm run dev
```
- **Client**: [http://localhost:5173](http://localhost:5173)
- **Server**: [http://localhost:5001](http://localhost:5001)

### 3. Run Automated Tests
```bash
npm test
```
Executes complete E2E verification of REST APIs, sockets, power-ups, teams, and history.

---

## 📡 Socket Events Reference

| Event (Client → Server) | Payload | Description |
|---|---|---|
| `create_room` | `{ quizId, hostName, mode, userId }` | Creates room with 4-digit code |
| `join_room` | `{ code, name, avatar, userId, preferredTeam }` | Joins room |
| `reconnect_room` | `{ code, playerId }` | Restores session upon refresh |
| `switch_team` | `{ code, team }` | Selects Red, Blue, Green, or Yellow |
| `start_game` | `{ code }` | Host starts match with 3s countdown |
| `use_powerup` | `{ code, powerUpType }` | Uses 50/50, 2x Points, or Extra Time |
| `submit_answer` | `{ code, optionIndex }` | Submits answer within question time |
| `next_question` | `{ code }` | Host advances to next round |
| `skip_question` | `{ code }` | Host ends current question early |
| `kick_player` | `{ code, playerId }` | Host removes player |
| `end_game_early` | `{ code }` | Host ends match early |

| Event (Server → Client) | Payload | Description |
|---|---|---|
| `room_created` | `{ code, hostPlayerId, room, player }` | Room created confirmation |
| `room_joined` | `{ code, player, room, players }` | Room join confirmation |
| `room_updated` | `{ players, hostId, status, mode }` | Lobby/participant roster sync |
| `game_starting` | `{ countdown, totalQuestions }` | Pre-game countdown |
| `question_start` | `{ index, total, question, endsAt, duration, serverTime }` | Round start (no correct answer) |
| `answer_count` | `{ answered, total }` | Real-time response counter |
| `powerup_result` | `{ powerUpType, eliminatedOptions, multiplier }` | Power-up outcome |
| `question_end` | `{ correctIndex, explanation, stats, leaderboard, teams }` | Correct answer reveal & stats |
| `game_over` | `{ finalLeaderboard, winningTeam, podium }` | Tournament podium & finish |
