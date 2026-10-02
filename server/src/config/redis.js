import Redis from 'ioredis';

class InMemoryRedisStore {
  constructor() {
    this.hashes = new Map();
    this.sortedSets = new Map();
    this.strings = new Map();
    this.ttls = new Map();
  }

  async hset(key, ...args) {
    if (!this.hashes.has(key)) {
      this.hashes.set(key, new Map());
    }
    const hash = this.hashes.get(key);

    if (args.length === 1 && typeof args[0] === 'object') {
      for (const [k, v] of Object.entries(args[0])) {
        hash.set(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
      }
    } else {
      for (let i = 0; i < args.length; i += 2) {
        const field = args[i];
        const val = args[i + 1];
        hash.set(field, typeof val === 'object' ? JSON.stringify(val) : String(val));
      }
    }
    return 1;
  }

  async hget(key, field) {
    const hash = this.hashes.get(key);
    if (!hash) return null;
    return hash.has(field) ? hash.get(field) : null;
  }

  async hgetall(key) {
    const hash = this.hashes.get(key);
    if (!hash) return {};
    const res = {};
    for (const [k, v] of hash.entries()) {
      res[k] = v;
    }
    return res;
  }

  async hdel(key, ...fields) {
    const hash = this.hashes.get(key);
    if (!hash) return 0;
    let deleted = 0;
    for (const f of fields) {
      if (hash.delete(f)) deleted++;
    }
    return deleted;
  }

  async zadd(key, score, member) {
    if (!this.sortedSets.has(key)) {
      this.sortedSets.set(key, new Map());
    }
    const zset = this.sortedSets.get(key);
    zset.set(String(member), Number(score));
    return 1;
  }

  async zincrby(key, increment, member) {
    if (!this.sortedSets.has(key)) {
      this.sortedSets.set(key, new Map());
    }
    const zset = this.sortedSets.get(key);
    const m = String(member);
    const current = zset.get(m) || 0;
    const next = current + Number(increment);
    zset.set(m, next);
    return next;
  }

  async zscore(key, member) {
    const zset = this.sortedSets.get(key);
    if (!zset) return null;
    const score = zset.get(String(member));
    return score !== undefined ? score : null;
  }

  async zrevrange(key, start, stop, withScores) {
    const zset = this.sortedSets.get(key);
    if (!zset) return [];
    const entries = Array.from(zset.entries());
    entries.sort((a, b) => b[1] - a[1]); // Descending order
    const sliced = stop === -1 ? entries.slice(start) : entries.slice(start, stop + 1);

    if (withScores === 'WITHSCORES') {
      const flat = [];
      for (const [member, score] of sliced) {
        flat.push(member, String(score));
      }
      return flat;
    }
    return sliced.map(([member]) => member);
  }

  async expire(key, seconds) {
    if (this.ttls.has(key)) {
      clearTimeout(this.ttls.get(key));
    }
    const timer = setTimeout(() => {
      this.del(key);
      this.ttls.delete(key);
    }, seconds * 1000);
    this.ttls.set(key, timer);
    return 1;
  }

  async del(key) {
    let deleted = 0;
    if (this.hashes.delete(key)) deleted = 1;
    if (this.sortedSets.delete(key)) deleted = 1;
    if (this.strings.delete(key)) deleted = 1;
    if (this.ttls.has(key)) {
      clearTimeout(this.ttls.get(key));
      this.ttls.delete(key);
    }
    return deleted;
  }

  async set(key, value, ex, seconds) {
    this.strings.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
    if (ex === 'EX' && seconds) {
      await this.expire(key, seconds);
    }
    return 'OK';
  }

  async get(key) {
    return this.strings.get(key) || null;
  }
}

let redisClient = null;
let isRedisConnected = false;

export function getRedisClient() {
  if (redisClient) return redisClient;

  const redisUrl = process.env.REDIS_URL;

  if (redisUrl) {
    try {
      const realClient = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        retryStrategy: (times) => (times > 3 ? null : Math.min(times * 100, 1000)),
        lazyConnect: true,
      });

      realClient.connect()
        .then(() => {
          console.log('✅ Connected to external Redis at', redisUrl);
          isRedisConnected = true;
          redisClient = realClient;
        })
        .catch((err) => {
          console.warn('⚠️ Redis connection failed, falling back to In-Memory Redis store:', err.message);
          redisClient = new InMemoryRedisStore();
        });

      redisClient = realClient;
      return redisClient;
    } catch (e) {
      console.warn('⚠️ Redis initialization error, using In-Memory Redis:', e.message);
      redisClient = new InMemoryRedisStore();
      return redisClient;
    }
  }

  // If no REDIS_URL provided, default to In-Memory Redis with zero configuration needed
  console.log('ℹ️ No REDIS_URL provided in .env, running high-performance In-Memory Redis store.');
  redisClient = new InMemoryRedisStore();
  return redisClient;
}

export { isRedisConnected };
