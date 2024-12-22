const Payment = require('../models/Payment');
const { producer } = require('../config/kafka');

const processPayment = async (paymentData, userId) => {
  try {
    // Validate payment data
    if (!paymentData.amount || !paymentData.items || !paymentData.paymentDetails) {
      throw new Error('Invalid payment data');
    }

    // Create payment record first
    const payment = new Payment({
      userId,
      amount: paymentData.amount,
      items: paymentData.items,
      cardDetails: {
        last4: paymentData.paymentDetails.cardNumber.slice(-4),
        expiryDate: paymentData.paymentDetails.expiryDate
      },
      status: 'pending' // Start with pending status
    });

    await payment.save();

    try {
      // Send to Kafka with retry logic
      let retries = 3;
      while (retries > 0) {
        try {
          await producer.send({
            topic: 'payment-completed',
            messages: [{
              key: payment._id.toString(),
              value: JSON.stringify({
                paymentId: payment._id.toString(),
                userId,
                amount: paymentData.amount,
                items: paymentData.items,
                status: 'completed',
                timestamp: new Date().toISOString()
              })
            }]
          });
          
          // Update payment status after successful Kafka message
          payment.status = 'completed';
          await payment.save();
          
          break;
        } catch (err) {
          retries--;
          if (retries === 0) throw err;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      return {
        success: true,
        payment: {
          id: payment._id,
          amount: payment.amount,
          status: payment.status
        }
      };
    } catch (kafkaError) {
      // Rollback payment on Kafka error
      payment.status = 'failed';
      await payment.save();
      throw new Error('Failed to process payment: Kafka error');
    }
  } catch (error) {
    console.error('Payment processing error:', error);
    throw error;
  }
};

module.exports = { processPayment }; 