const { Kafka } = require('kafkajs');
const logger = require('../utils/logger');

const kafka = new Kafka({
  clientId: 'billing-service',
  brokers: (process.env.KAFKA_BROKERS || 'kafka:29092').split(','),
  retry: {
    initialRetryTime: 1000,
    retries: 50,
    maxRetryTime: 30000,
    factor: 2
  }
});

const consumer = kafka.consumer({ 
  groupId: 'billing-group',
  maxWaitTimeInMs: 50,
  maxBytesPerPartition: 1048576,
  retry: {
    initialRetryTime: 1000,
    retries: 50,
    maxRetryTime: 30000,
    factor: 2
  }
});

const connectConsumer = async () => {
  let retries = 0;
  const maxRetries = 50;
  const retryInterval = 1000;

  while (retries < maxRetries) {
    try {
      logger.info('Attempting to connect consumer...');
      await consumer.connect();
      logger.info('Kafka consumer connected successfully');

      // Get list of available topics
      const admin = kafka.admin();
      await admin.connect();
      const topics = await admin.listTopics();
      logger.info('Available Kafka topics:', topics);

      // Check if required topics exist
      if (!topics.includes('payment-completed')) {
        logger.warn('Waiting for topics to be created: payment-completed');
        await admin.disconnect();
        await new Promise(resolve => setTimeout(resolve, retryInterval));
        retries++;
        continue;
      }

      await admin.disconnect();

      // Subscribe to payment-completed topic
      logger.info('Subscribing to payment-completed topic');
      await consumer.subscribe({ topic: 'payment-completed', fromBeginning: true });
      logger.info('Successfully subscribed to topics');

      // Start consuming messages
      logger.info('Starting consumer run loop');
      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const messageValue = JSON.parse(message.value.toString());
            logger.info({
              message: 'Processing payment message',
              topic,
              partition,
              offset: message.offset,
              value: messageValue
            });

            // Store the processed message
            global.processedMessages = global.processedMessages || [];
            global.processedMessages.push({
              topic,
              partition,
              offset: message.offset,
              timestamp: new Date().toISOString(),
              value: messageValue
            });

            // Keep only the last 100 messages
            if (global.processedMessages.length > 100) {
              global.processedMessages = global.processedMessages.slice(-100);
            }

            // Process the payment message
            // Add your billing logic here
            logger.info({
              message: 'Payment message processed successfully',
              orderId: messageValue.orderId
            });

          } catch (error) {
            logger.error({
              message: 'Error processing payment message',
              error: error.message,
              stack: error.stack,
              topic,
              partition,
              offset: message.offset
            });

            // Move failed message to dead letter queue
            await handleFailedMessage(topic, partition, message, error);
          }
        }
      });

      return;
    } catch (error) {
      logger.error('Error connecting consumer:', error);
      retries++;
      await new Promise(resolve => setTimeout(resolve, retryInterval));
    }
  }

  throw new Error(`Failed to connect consumer after ${maxRetries} attempts`);
};

const handleFailedMessage = async (topic, partition, message, error) => {
  try {
    const deadLetterTopic = `${topic}.dead-letter`;
    const producer = kafka.producer();
    await producer.connect();
    
    await producer.send({
      topic: deadLetterTopic,
      messages: [{
        key: message.key,
        value: message.value,
        headers: {
          ...message.headers,
          error: error.message,
          originalTopic: topic,
          failedAt: new Date().toISOString()
        }
      }]
    });

    await producer.disconnect();

    logger.info({
      message: 'Message moved to dead letter queue',
      topic: deadLetterTopic,
      originalTopic: topic,
      error: error.message
    });
  } catch (dlqError) {
    logger.error('Failed to move message to dead letter queue:', dlqError);
  }
};

module.exports = { kafka, consumer, connectConsumer }; 