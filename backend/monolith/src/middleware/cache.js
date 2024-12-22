const redis = require('../config/redis');

const cacheMiddleware = (duration) => async (req, res, next) => {
  const key = `cache:${req.originalUrl}`;

  try {
    console.log('Checking cache for key:', key);
    const cachedData = await redis.get(key);
    
    if (cachedData) {
      console.log('Cache HIT for:', key);
      return res.json(JSON.parse(cachedData));
    }
    
    console.log('Cache MISS for:', key);

    // Store original send
    const originalSend = res.json;
    res.json = function(data) {
      console.log('Caching data for:', key, 'Duration:', duration);
      redis.setex(key, duration, JSON.stringify(data));
      originalSend.call(this, data);
    };

    next();
  } catch (error) {
    console.error('Redis error:', error);
    next();
  }
};

module.exports = cacheMiddleware; 