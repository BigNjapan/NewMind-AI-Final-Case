const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// Simple test endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Test endpoint is working'
  });
});

// Test payment processing
router.post('/payment', async (req, res) => {
  try {
    const producer = req.app.get('kafkaProducer');
    if (!producer) {
      throw new Error('Kafka producer not available');
    }

    const testPayment = {
      amount: 100,
      orderId: `test-${Date.now()}`,
      userId: 'test-user',
      cardDetails: {
        cardNumber: '4242424242424242',
        expiryDate: '12/25',
        cvv: '123'
      }
    };

    // Send test payment message to Kafka
    await producer.send({
      topic: 'payment-completed',
      messages: [
        {
          key: testPayment.orderId,
          value: JSON.stringify(testPayment)
        }
      ]
    });

    logger.info({
      message: 'Test payment message sent to Kafka',
      orderId: testPayment.orderId
    });

    res.json({
      success: true,
      message: 'Test payment message sent successfully',
      payment: testPayment
    });
  } catch (error) {
    logger.error({
      message: 'Error sending test payment message',
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'Failed to send test payment message',
      error: error.message
    });
  }
});

// Test Kafka connection
router.get('/kafka', async (req, res) => {
  try {
    const producer = req.app.get('kafkaProducer');
    if (!producer) {
      throw new Error('Kafka producer not available');
    }

    const topics = await producer.send({
      topic: 'test-topic',
      messages: [{ value: 'test message' }]
    });

    res.json({
      success: true,
      message: 'Kafka connection test successful',
      topics
    });
  } catch (error) {
    logger.error({
      message: 'Kafka connection test failed',
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'Kafka connection test failed',
      error: error.message
    });
  }
});

module.exports = router; 