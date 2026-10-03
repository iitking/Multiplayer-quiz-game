import { getRedisClient } from '../config/redis.js';
import { generateRoomCode } from '../utils/generateRoomCode.js';

const ROOM_TTL = 3 * 3600; // 3 hours

export class RoomService {
  constructor() {
    this.redis = getRedisClient();
  }

  getRoomKey(code) {
    return `room:${code.toUpperCase()}`;
  }

  getPlayersKey(code) {
    return `room:${code.toUpperCase()}:players`;
  }

  getScoresKey(code) {
    return `room:${code.toUpperCase()}:scores`;
  }

  getAnswersKey(code, qIndex) {
    return `room:${code.toUpperCase()}:answers:${qIndex}`;
  }

  getPowerUpsKey(code, qIndex) {
    return `room:${code.toUpperCase()}:powerups:${qIndex}`;
  }

  async createRoom({ hostName, quizId, quizTitle, mode = 'solo', userId = null }) {
    const code = generateRoomCode();
    const roomKey = this.getRoomKey(code);
    const hostPlayerId = 'host_' + Math.random().toString(36).substring(2, 9);

    const initialHost = {
      id: hostPlayerId,
      name: hostName || 'Host',
      isHost: true,
      team: mode === 'team' ? 'red' : null,
      avatar: '👑',
      userId: userId || null,
      score: 0,
      powerUps: {
        fiftyFifty: true,
        doublePoints: true,
        extraTime: true
      },
      connected: true
    };

    const roomData = {
      code,
      hostId: hostPlayerId,
      quizId,
      quizTitle: quizTitle || 'Custom Quiz',
      status: 'LOBBY', // LOBBY | QUESTION_ACTIVE | QUESTION_RESULT | FINISHED
      currentIndex: -1,
      totalQuestions: 0,
      endsAt: 0,
      mode: mode || 'solo',
      createdAt: Date.now()
    };

    await this.redis.hset(roomKey, roomData);
    await this.redis.hset(this.getPlayersKey(code), hostPlayerId, JSON.stringify(initialHost));
    await this.redis.zadd(this.getScoresKey(code), 0, hostPlayerId);

    // Set TTL on all keys
    await this.redis.expire(roomKey, ROOM_TTL);
    await this.redis.expire(this.getPlayersKey(code), ROOM_TTL);
    await this.redis.expire(this.getScoresKey(code), ROOM_TTL);

    return {
      code,
      hostPlayerId,
      room: roomData,
      host: initialHost
    };
  }

  async getRoom(code) {
    const data = await this.redis.hgetall(this.getRoomKey(code));
    if (!data || Object.keys(data).length === 0) return null;
    return {
      ...data,
      currentIndex: Number(data.currentIndex ?? -1),
      totalQuestions: Number(data.totalQuestions ?? 0),
      endsAt: Number(data.endsAt ?? 0),
      createdAt: Number(data.createdAt ?? 0)
    };
  }

  async updateRoom(code, updates) {
    const roomKey = this.getRoomKey(code);
    await this.redis.hset(roomKey, updates);
    await this.redis.expire(roomKey, ROOM_TTL);
    return this.getRoom(code);
  }

  async getPlayers(code) {
    const raw = await this.redis.hgetall(this.getPlayersKey(code));
    if (!raw) return [];
    const players = [];
    for (const val of Object.values(raw)) {
      try {
        players.push(typeof val === 'string' ? JSON.parse(val) : val);
      } catch (e) {
        // ignore parse error
      }
    }
    return players;
  }

  async getPlayer(code, playerId) {
    const raw = await this.redis.hget(this.getPlayersKey(code), playerId);
    if (!raw) return null;
    try {
      return typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch {
      return null;
    }
  }

  async joinRoom(code, { name, avatar = '👤', userId = null, preferredTeam = null }) {
    const room = await this.getRoom(code);
    if (!room) {
      throw new Error('Room not found. Please check your 4-digit code.');
    }
    if (room.status === 'FINISHED') {
      throw new Error('This quiz game has already ended.');
    }

    const players = await this.getPlayers(code);

    // Handle duplicate names smoothly by appending a small number
    let finalName = name.trim();
    const existingSameName = players.filter(p => p.name.toLowerCase() === finalName.toLowerCase());
    if (existingSameName.length > 0) {
      finalName = `${finalName} (${existingSameName.length + 1})`;
    }

    // Auto balance or assign team if team mode
    const teams = ['red', 'blue', 'green', 'yellow'];
    let assignedTeam = null;
    if (room.mode === 'team') {
      if (preferredTeam && teams.includes(preferredTeam)) {
        assignedTeam = preferredTeam;
      } else {
        // Balance teams based on player counts
        const teamCounts = { red: 0, blue: 0, green: 0, yellow: 0 };
        for (const p of players) {
          if (p.team && teamCounts[p.team] !== undefined) teamCounts[p.team]++;
        }
        assignedTeam = teams.reduce((min, t) => (teamCounts[t] < teamCounts[min] ? t : min), teams[0]);
      }
    }

    const playerId = 'player_' + Math.random().toString(36).substring(2, 9);
    const newPlayer = {
      id: playerId,
      name: finalName,
      isHost: false,
      isSpectator: room.status !== 'LOBBY', // Late joiners join as spectators if game started
      team: assignedTeam,
      avatar: avatar || '👤',
      userId: userId || null,
      score: 0,
      powerUps: {
        fiftyFifty: true,
        doublePoints: true,
        extraTime: true
      },
      connected: true
    };

    await this.redis.hset(this.getPlayersKey(code), playerId, JSON.stringify(newPlayer));
    await this.redis.zadd(this.getScoresKey(code), 0, playerId);
    await this.redis.expire(this.getPlayersKey(code), ROOM_TTL);
    await this.redis.expire(this.getScoresKey(code), ROOM_TTL);

    return {
      player: newPlayer,
      room
    };
  }

  async setPlayerConnection(code, playerId, connected) {
    const player = await this.getPlayer(code, playerId);
    if (!player) return null;
    player.connected = connected;
    await this.redis.hset(this.getPlayersKey(code), playerId, JSON.stringify(player));
    return player;
  }

  async updatePlayer(code, playerId, updates) {
    const player = await this.getPlayer(code, playerId);
    if (!player) return null;
    const updated = { ...player, ...updates };
    await this.redis.hset(this.getPlayersKey(code), playerId, JSON.stringify(updated));
    return updated;
  }

  async removePlayer(code, playerId) {
    await this.redis.hdel(this.getPlayersKey(code), playerId);
    // Don't necessarily delete score from leaderboard to preserve history, but mark disconnected
    const remaining = await this.getPlayers(code);
    const room = await this.getRoom(code);

    // If host left and there are other players, migrate host
    if (room && room.hostId === playerId && remaining.length > 0) {
      const newHost = remaining[0];
      newHost.isHost = true;
      await this.updatePlayer(code, newHost.id, { isHost: true });
      await this.updateRoom(code, { hostId: newHost.id });
      return { room: await this.getRoom(code), newHostId: newHost.id };
    }

    return { room, newHostId: null };
  }

  async switchTeam(code, playerId, newTeam) {
    const validTeams = ['red', 'blue', 'green', 'yellow'];
    if (!validTeams.includes(newTeam)) return null;
    return this.updatePlayer(code, playerId, { team: newTeam });
  }

  async addPlayerScore(code, playerId, points) {
    await this.redis.zincrby(this.getScoresKey(code), points, playerId);
    const currentScore = await this.redis.zscore(this.getScoresKey(code), playerId);
    await this.updatePlayer(code, playerId, { score: Number(currentScore || 0) });
    return Number(currentScore || 0);
  }

  async getLeaderboard(code) {
    // Sorted set ranking: ZREVRANGE 0 -1 WITHSCORES
    const raw = await this.redis.zrevrange(this.getScoresKey(code), 0, -1, 'WITHSCORES');
    const players = await this.getPlayers(code);
    const playerMap = new Map(players.map(p => [p.id, p]));

    const soloList = [];
    const teamScores = { red: 0, blue: 0, green: 0, yellow: 0 };

    for (let i = 0; i < raw.length; i += 2) {
      const pId = raw[i];
      const score = Number(raw[i + 1]);
      const pInfo = playerMap.get(pId);
      if (pInfo) {
        soloList.push({
          playerId: pId,
          name: pInfo.name,
          score,
          team: pInfo.team,
          avatar: pInfo.avatar,
          isHost: pInfo.isHost,
          isSpectator: pInfo.isSpectator
        });
        if (pInfo.team && teamScores[pInfo.team] !== undefined) {
          teamScores[pInfo.team] += score;
        }
      }
    }

    // Rank solo list
    const rankedSolo = soloList
      .filter(p => !p.isSpectator)
      .map((item, idx) => ({ ...item, rank: idx + 1 }));

    // Rank teams
    const rankedTeams = Object.entries(teamScores)
      .map(([team, score]) => ({ team, score }))
      .sort((a, b) => b.score - a.score);

    return {
      top: rankedSolo,
      teams: rankedTeams,
      teamScores
    };
  }

  async recordAnswer(code, qIndex, playerId, answerData) {
    const key = this.getAnswersKey(code, qIndex);
    await this.redis.hset(key, playerId, JSON.stringify(answerData));
    await this.redis.expire(key, ROOM_TTL);
  }

  async getAnswersForQuestion(code, qIndex) {
    const raw = await this.redis.hgetall(this.getAnswersKey(code, qIndex));
    if (!raw) return {};
    const result = {};
    for (const [pId, val] of Object.entries(raw)) {
      try {
        result[pId] = typeof val === 'string' ? JSON.parse(val) : val;
      } catch {
        result[pId] = val;
      }
    }
    return result;
  }
}

export const roomService = new RoomService();

