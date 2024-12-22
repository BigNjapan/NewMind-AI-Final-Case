const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'redis',
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: 5,
  retryStrategy: (times) => {
    console.log('Redis retry attempt:', times);
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  enableReadyCheck: true,
  showFriendlyErrorStack: true
});

redis.on('connect', () => {
  console.log('Redis client connected');
});

redis.on('error', (err) => {
  console.error('Redis client error:', err);
});

redis.on('ready', () => {
  console.log('Redis client ready');
});

redis.on('reconnecting', () => {
  console.log('Redis client reconnecting');
});

module.exports = redis; 