# 🎮 Multiplayer Quiz Game

Quiz rooms jahan friends ek code se join karte hain, with a **live synced timer** and **live leaderboard**.

**Tech stack:** React · Socket.io · Node.js · Redis · MongoDB

---

## ✨ Features

- [ ] Room codes (4-digit, join with one code)
- [ ] Synced timer (server-authoritative)
- [ ] Live leaderboard
- [ ] Host controls (start, skip, next, kick)
- [ ] Custom quizzes (create / edit / delete)
- [ ] Speed bonus points

---

## 🏗️ Architecture

```
React Client  <──WebSocket (Socket.io)──>  Node.js Server  ──>  Redis (live game state)
      │                                          │
      └────────── REST API (Express) ────────────┴──>  MongoDB (users, quizzes)
```

- **MongoDB** = permanent data (quizzes, questions, optional users, game history)
- **Redis** = temporary live data (rooms, players, scores, timers) with TTL
- **Socket.io** = real-time events
- **Server is the source of truth** for timer, scoring and answers. Client sirf display karta hai.

---

## 📁 Folder Structure

```
quiz-game/
├── client/
│   ├── src/
│   │   ├── pages/        # Home, Lobby, Question, Leaderboard, Results, CreateQuiz
│   │   ├── components/   # Timer, AnswerButton, PlayerList, LeaderboardCard
│   │   ├── hooks/        # useSocket, useCountdown
│   │   ├── context/      # GameContext (or Zustand store)
│   │   └── main.jsx
│   └── package.json
├── server/
│   ├── src/
│   │   ├── config/       # db.js (mongo), redis.js
│   │   ├── models/       # Quiz.js
│   │   ├── routes/       # quiz.routes.js
│   │   ├── sockets/      # index.js, room.handler.js, game.handler.js
│   │   ├── services/     # roomService.js, gameService.js, scoreService.js
│   │   ├── utils/        # generateRoomCode.js
│   │   └── server.js
│   └── package.json
└── README.md
```

---

## 🗺️ Build Workflow (Phase by Phase)

### Phase 0 — Setup
- [ ] Git repo + `client/` and `server/` folders
- [ ] `npm create vite@latest client -- --template react`
- [ ] Server: `npm i express socket.io cors dotenv mongoose ioredis nanoid`
- [ ] `.env` files (`MONGO_URI`, `REDIS_URL`, `PORT`, `CLIENT_URL`)

### Phase 1 — Basic Socket Connection
- [ ] Express + Socket.io server run karo
- [ ] Client mein `useSocket` hook (single socket instance)
- [ ] Test: client connect hone par server log kare

### Phase 2 — Room System (in-memory first)
> Pehle Redis ke bina plain JS object se banao, phir Redis par shift karo.

- [ ] `create_room` → server 4-digit unique code generate kare
- [ ] `join_room` → validate code, add player, `socket.join(code)`
- [ ] Lobby UI: live player list (`room_updated` event)
- [ ] Host identify karo (`hostId`)
- [ ] `leave_room` / disconnect handling

### Phase 3 — Game Loop + Synced Timer
- [ ] Host `start_game` karta hai
- [ ] Server `question_start` emit kare:
  ```json
  { "index": 4, "question": "...", "options": ["Stack","Queue","Tree","Graph"],
    "endsAt": 1730000000000, "duration": 15000 }
  ```
  (**correct answer client ko mat bhejo**)
- [ ] Client: `remaining = endsAt - Date.now()` se countdown chalaye (clock offset ke liye `server_time` ping se sync karo)
- [ ] Server `setTimeout(duration)` se `question_end` trigger kare
- [ ] Agar sab players answer de chuke hain → early end
- [ ] `question_end` mein correct answer + answer stats bhejo

### Phase 4 — Answers + Scoring
- [ ] `submit_answer { roomCode, optionIndex }`
- [ ] Server checks: room valid? question active? `Date.now() <= endsAt`? already answered?
- [ ] Score formula (speed bonus):

```js
// timeTaken, duration in ms
const base = 1000;
const speedBonus = Math.round(500 * (1 - timeTaken / duration));
const points = isCorrect ? base + speedBonus : 0;
```

- [ ] Leaderboard update after every question

### Phase 5 — Redis Integration
Move live state from in-memory to Redis.

| Key | Type | Purpose |
|---|---|---|
| `room:{code}` | Hash | hostId, quizId, status, currentIndex, endsAt |
| `room:{code}:players` | Hash | socketId/playerId → name |
| `room:{code}:scores` | Sorted Set | playerId → score (`ZINCRBY`, `ZREVRANGE`) |
| `room:{code}:answers:{qIndex}` | Hash | playerId → {option, time} |

- [ ] Sab keys par TTL (e.g. 3 hours) lagao
- [ ] Leaderboard = `ZREVRANGE room:{code}:scores 0 9 WITHSCORES`

### Phase 6 — MongoDB: Custom Quizzes
```js
Quiz {
  title: String,
  createdBy: String,
  questions: [{
    text: String,
    options: [String],      // 2–4 options
    correctIndex: Number,
    duration: Number        // seconds
  }],
  createdAt: Date
}
```
- [ ] REST: `POST /api/quizzes`, `GET /api/quizzes`, `GET /api/quizzes/:id`, `PUT`, `DELETE`
- [ ] Create-quiz form in React
- [ ] Host room banate waqt quiz select kare

### Phase 7 — Frontend Screens
- [ ] **Home:** Create Room / Join with code + name
- [ ] **Lobby:** room code (big), players list, Start button (host only)
- [ ] **Question:** circular timer, question card, 4 coloured buttons, "18 players answering"
- [ ] **Between questions:** correct answer reveal + mini leaderboard
- [ ] **Final:** podium (top 3) + full leaderboard
- [ ] Mobile-first design

### Phase 8 — Host Controls
- [ ] Skip question
- [ ] Next question (manual mode)
- [ ] Kick player
- [ ] End game
- [ ] Host disconnect → transfer host ya game pause

### Phase 9 — Edge Cases & Polish
- [ ] Reconnect: `playerId` localStorage mein rakho, refresh par rejoin
- [ ] Duplicate names handle karo
- [ ] Late joiners (lobby only ya spectator mode)
- [ ] Rate limit answer submissions
- [ ] Input validation (room code, name length)
- [ ] Sounds, animations, confetti for winner

### Phase 10 — Deployment
- [ ] Client → **Vercel**
- [ ] Server → **Render / Railway** (WebSocket support chahiye)
- [ ] Redis → **Upstash**
- [ ] MongoDB → **Atlas**
- [ ] CORS + env variables set karo
- [ ] Multiple devices par test karo

---

## 📡 Socket Events Reference

### Client → Server
| Event | Payload | Who |
|---|---|---|
| `create_room` | `{ quizId, hostName }` | Host |
| `join_room` | `{ code, name }` | Player |
| `start_game` | `{ code }` | Host |
| `submit_answer` | `{ code, optionIndex }` | Player |
| `next_question` | `{ code }` | Host |
| `skip_question` | `{ code }` | Host |
| `kick_player` | `{ code, playerId }` | Host |
| `leave_room` | `{ code }` | Any |

### Server → Client
| Event | Payload |
|---|---|
| `room_created` | `{ code }` |
| `room_updated` | `{ players, hostId, status }` |
| `question_start` | `{ index, total, question, options, endsAt, duration }` |
| `answer_count` | `{ answered, total }` |
| `question_end` | `{ correctIndex, stats }` |
| `leaderboard_update` | `{ top: [{ name, score }] }` |
| `game_over` | `{ finalLeaderboard }` |
| `error_message` | `{ message }` |

---

## 🔄 Game State Flow

```
LOBBY → QUESTION_ACTIVE → QUESTION_RESULT → (next) QUESTION_ACTIVE ... → FINISHED
```

---

## ✅ Testing Checklist

- [ ] 2+ browser tabs se same room join
- [ ] Timer sab devices par same time par khatam ho
- [ ] Late answer reject ho
- [ ] Same player do baar answer na de sake
- [ ] Refresh karne par player wapas room mein aa jaye
- [ ] Redis keys TTL ke baad expire hon

---

## 🚀 Suggested Order (TL;DR)

1. Socket connect → 2. Rooms (in-memory) → 3. Game loop + timer → 4. Scoring → 5. Redis → 6. MongoDB quizzes → 7. UI polish → 8. Host controls → 9. Edge cases → 10. Deploy

---

## 💡 Future Ideas

- Login + saved game history
- Team mode
- Power-ups (double points, 50/50)
- Image / audio questions
- AI-generated quizzes from a topic
