const express = require('express');
const router = express.Router();
const { producer } = require('../config/kafka');
const Payment = require('../models/payment.model');
const verifyToken = require('../middleware/auth');
const logger = require('../utils/logger');

// Validate payment details middleware
const validatePaymentDetails = (req, res, next) => {
  const { amount, items, paymentDetails } = req.body;
  
  logger.info({
    message: 'Validating payment details',
    amount,
    itemCount: items?.length,
    cardLast4: paymentDetails?.cardNumber?.slice(-4)
  });

  if (!amount || amount <= 0) {
    logger.warn('Invalid payment amount');
    return res.status(400).json({
      success: false,
      message: 'Invalid payment amount'
    });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    logger.warn('Invalid items data');
    return res.status(400).json({
      success: false,
      message: 'Invalid items data'
    });
  }

  if (!paymentDetails || !paymentDetails.cardNumber || !paymentDetails.expiryDate) {
    logger.warn('Invalid payment details');
    return res.status(400).json({
      success: false,
      message: 'Invalid payment details'
    });
  }

  next();
};

// Process payment handler
const processPayment = async (req, res) => {
  const startTime = Date.now();
  const traceId = req.headers['x-trace-id'] || Date.now().toString();
  
  logger.info({
    message: 'Starting payment processing',
    traceId,
    userId: req.userId,
    amount: req.body.amount,
    paymentDetails: {
      cardLast4: req.body.paymentDetails.cardNumber.slice(-4),
      expiryDate: req.body.paymentDetails.expiryDate
    }
  });

  try {
    const payment = new Payment({
      userId: req.userId,
      amount: req.body.amount,
      items: req.body.items,
      cardDetails: {
        last4: req.body.paymentDetails.cardNumber.slice(-4),
        expiryDate: req.body.paymentDetails.expiryDate
      },
      status: 'pending'
    });

    await payment.save();

    // Send payment completed event to Kafka
    await producer.send({
      topic: 'payment-completed',
      messages: [{
        key: payment._id.toString(),
        value: JSON.stringify({
          paymentId: payment._id.toString(),
          userId: req.userId,
          amount: payment.amount,
          items: payment.items,
          status: 'completed',
          timestamp: new Date().toISOString()
        })
      }]
    });

    // Update payment status after successful Kafka message
    payment.status = 'completed';
    await payment.save();

    logger.info({
      message: 'Payment processed successfully',
      traceId,
      paymentId: payment._id,
      processingTime: Date.now() - startTime
    });

    res.json({
      success: true,
      payment: {
        id: payment._id,
        amount: payment.amount,
        status: payment.status
      }
    });
  } catch (error) {
    logger.error({
      message: 'Payment processing failed',
      traceId,
      error: error.message,
      stack: error.stack,
      processingTime: Date.now() - startTime
    });

    res.status(500).json({
      success: false,
      message: 'Payment processing failed',
      error: error.message
    });
  }
};

// Routes
router.post('/process', [verifyToken, validatePaymentDetails], processPayment);
router.post('/', [verifyToken, validatePaymentDetails], processPayment);

// Get payment status endpoint
router.get('/:paymentId', verifyToken, async (req, res) => {
  try {
    const payment = await Payment.findOne({
      _id: req.params.paymentId,
      userId: req.userId
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.json({
      success: true,
      payment: {
        id: payment._id,
        amount: payment.amount,
        status: payment.status,
        timestamp: payment.timestamp
      }
    });
  } catch (error) {
    logger.error({
      message: 'Error fetching payment',
      paymentId: req.params.paymentId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Error fetching payment details'
    });
  }
});

module.exports = router; 