const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// Test endpoint to check message processing
router.get('/messages', (req, res) => {
  try {
    // Return the last 10 processed messages
    const processedMessages = global.processedMessages || [];
    res.json({
      success: true,
      messages: processedMessages.slice(-10)
    });
  } catch (error) {
    logger.error({
      message: 'Error retrieving processed messages',
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve processed messages',
      error: error.message
    });
  }
});

// Test endpoint to check service status
router.get('/status', (req, res) => {
  res.json({
    success: true,
    service: 'billing',
    status: 'running',
    processedMessages: (global.processedMessages || []).length,
    timestamp: new Date().toISOString()
  });
});

module.exports = router; 