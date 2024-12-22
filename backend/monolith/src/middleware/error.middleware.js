const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date()
  });

  res.status(err.status || 500).json({
    error: {
      message: err.message,
      status: err.status,
      timestamp: new Date()
    }
  });
};

module.exports = errorHandler; 