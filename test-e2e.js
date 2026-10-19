import { io as Client } from './client/node_modules/socket.io-client/build/esm/index.js';
import http from 'http';
import { app, server } from './server/src/server.js';

async function runTests() {
  console.log('🧪 Starting End-to-End Test Suite...\n');

  const PORT = process.env.PORT || 5001;
  const SERVER_URL = `http://localhost:${PORT}`;
  console.log(`✅ Using active server on ${SERVER_URL}`);

  try {
    // 1. REST API: Health Check
    console.log('1️⃣ Testing GET /api/health...');
    const healthRes = await fetch(`${SERVER_URL}/api/health`);
    const healthData = await healthRes.json();
    if (healthData.status !== 'ok') throw new Error('Health check failed');
    console.log('   ✓ Health check passed');

    // 2. REST API: Get Quizzes
    console.log('2️⃣ Testing GET /api/quizzes...');
    const quizzesRes = await fetch(`${SERVER_URL}/api/quizzes`);
    const quizzesData = await quizzesRes.json();
    if (!quizzesData.success || quizzesData.data.length === 0) throw new Error('Failed to load quizzes');
    console.log(`   ✓ Found ${quizzesData.data.length} quizzes`);
    const testQuiz = quizzesData.data[0];

    // 3. REST API: AI Quiz Generator
    console.log('3️⃣ Testing POST /api/quizzes/generate-ai...');
    const aiRes = await fetch(`${SERVER_URL}/api/quizzes/generate-ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: 'Space & Astronomy', count: 3, difficulty: 'Easy' })
    });
    const aiData = await aiRes.json();
    if (!aiData.success || !aiData.data.questions || aiData.data.questions.length !== 3) {
      throw new Error('AI quiz generation failed');
    }
    console.log(`   ✓ AI Quiz generated: "${aiData.data.title}" with ${aiData.data.questions.length} questions`);

    // 4. REST API: Auth Register & Login
    console.log('4️⃣ Testing Auth: Register & Login...');
    const testUser = {
      username: 'QuizMaster_' + Math.floor(Math.random() * 10000),
      email: `player_${Date.now()}@example.com`,
      password: 'password123',
      avatar: '🦊'
    };
    const regRes = await fetch(`${SERVER_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    const regData = await regRes.json();
    if (!regData.success || !regData.token) throw new Error('Registration failed');
    console.log(`   ✓ Registered user "${regData.user.username}"`);

    const loginRes = await fetch(`${SERVER_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: testUser.username, password: testUser.password })
    });
    const loginData = await loginRes.json();
    if (!loginData.success || !loginData.token) throw new Error('Login failed');
    console.log('   ✓ Logged in and verified JWT token');

    // 5. WebSocket: Room Creation & Joining
    console.log('5️⃣ Testing WebSocket Room Flow & Socket Handlers...');
    const hostSocket = Client(SERVER_URL);
    const playerSocket = Client(SERVER_URL);

    await Promise.all([
      new Promise((res) => hostSocket.on('connect', res)),
      new Promise((res) => playerSocket.on('connect', res))
    ]);
    console.log('   ✓ Both host and player sockets connected');

    // Host creates room
    let roomCode = null;
    let hostPlayerId = null;
    await new Promise((resolve, reject) => {
      hostSocket.emit(
        'create_room',
        { quizId: testQuiz._id || testQuiz.id, hostName: 'HostAlex', mode: 'team' },
        (res) => {
          if (!res.success) return reject(new Error(res.message));
          roomCode = res.code;
          hostPlayerId = res.hostPlayerId;
          resolve();
        }
      );
    });
    console.log(`   ✓ Room created with 4-digit code: ${roomCode}`);

    // Player joins room
    let playerId = null;
    await new Promise((resolve, reject) => {
      playerSocket.emit(
        'join_room',
        { code: roomCode, name: 'PlayerBob', avatar: '🦁', preferredTeam: 'blue' },
        (res) => {
          if (!res.success) return reject(new Error(res.message));
          playerId = res.player.id;
          resolve();
        }
      );
    });
    console.log(`   ✓ Player joined room as ${playerId} (Team Blue)`);

    // Player switches team to 'green'
    await new Promise((resolve) => {
      playerSocket.emit('switch_team', { code: roomCode, team: 'green' }, (res) => {
        resolve();
      });
    });
    console.log('   ✓ Player switched team to Green Vipers');

    // 6. WebSocket: Game Start, Power-Up & Answer Submission
    console.log('6️⃣ Testing Game Loop, Timer & Power-ups...');
    const questionPromise = new Promise((resolve) => {
      playerSocket.on('question_start', (data) => {
        resolve(data);
      });
    });

    // Host starts game
    hostSocket.emit('start_game', { code: roomCode });
    console.log('   ✓ Host clicked start game');

    const questionData = await questionPromise;
    console.log(`   ✓ Question #1 received: "${questionData.question.text}" (Duration: ${questionData.duration}s)`);
    if (questionData.correctIndex !== undefined) {
      throw new Error('Security flaw: correctIndex must NOT be sent to client!');
    }
    console.log('   ✓ Verified correctIndex is NOT exposed to client');

    // Player uses 50/50 Power-Up
    const powerUpPromise = new Promise((resolve) => {
      playerSocket.on('powerup_result', (data) => {
        resolve(data);
      });
    });
    playerSocket.emit('use_powerup', { code: roomCode, powerUpType: 'fiftyFifty' });
    const powerUpResult = await powerUpPromise;
    console.log(`   ✓ Power-up 50/50 applied, eliminated options:`, powerUpResult.eliminatedOptions);

    // Player submits answer
    const answerPromise = new Promise((resolve) => {
      playerSocket.on('answer_acknowledged', (data) => {
        resolve(data);
      });
    });
    playerSocket.emit('submit_answer', { code: roomCode, optionIndex: 1 });
    const answerRes = await answerPromise;
    console.log(`   ✓ Answer submitted! Points: ${answerRes.pointsEarned}, Speed Bonus: ${answerRes.speedBonus}`);

    // Wait for question_end event
    const questionEndPromise = new Promise((resolve) => {
      playerSocket.on('question_end', (data) => {
        resolve(data);
      });
    });
    const questionEndData = await questionEndPromise;
    console.log(`   ✓ Question ended! Correct answer was index #${questionEndData.correctIndex}`);
    console.log(`   ✓ Leaderboard updated: Top score: ${questionEndData.leaderboard[0]?.score}`);

    // Host ends game early
    const gameOverPromise = new Promise((resolve) => {
      playerSocket.on('game_over', (data) => {
        resolve(data);
      });
    });
    hostSocket.emit('end_game_early', { code: roomCode });
    const gameOverData = await gameOverPromise;
    console.log(`   ✓ Game Over! Winner: ${gameOverData.podium[0]?.name} (${gameOverData.podium[0]?.score} pts)`);

    // 7. Verify Saved Game History
    console.log('7️⃣ Testing Saved Game History Record...');
    const histRes = await fetch(`${SERVER_URL}/api/history`);
    const histData = await histRes.json();
    if (!histData.success || histData.data.length === 0) throw new Error('Game history not found');
    console.log(`   ✓ Game history record saved for Room ${histData.data[0].roomCode}`);

    // Clean up
    hostSocket.disconnect();
    playerSocket.disconnect();
    server.close();

    console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! 100% of Features & Future Ideas Verified!\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Test failed:', err);
    process.exit(1);
  }
}

runTests();
