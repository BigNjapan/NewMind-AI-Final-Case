const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  const traceId = req.headers['x-trace-id'] || Date.now().toString();

  if (!token) {
    logger.warn({
      message: 'No token provided',
      traceId
    });
    return res.status(401).json({
      success: false,
      message: 'No token provided'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.traceId = traceId;
    
    logger.info({
      message: 'Token verified successfully',
      userId: decoded.userId,
      traceId
    });
    
    next();
  } catch (error) {
    logger.error({
      message: 'Invalid token',
      error: error.message,
      traceId
    });
    
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

module.exports = verifyToken; 