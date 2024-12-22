const { Kafka, Partitioners } = require('kafkajs');
const logger = require('../utils/logger');

const kafka = new Kafka({
  clientId: 'payment-service',
  brokers: (process.env.KAFKA_BROKERS || 'kafka:29092').split(','),
  retry: {
    initialRetryTime: 1000,
    retries: 50,
    maxRetryTime: 30000,
    factor: 2
  }
});

const producer = kafka.producer({ 
  createPartitioner: Partitioners.LegacyPartitioner,
  allowAutoTopicCreation: true,
  idempotent: true,
  maxInFlightRequests: 5
});

const connectProducer = async () => {
  let retries = 0;
  const maxRetries = 50;
  const retryInterval = 1000;

  while (retries < maxRetries) {
    try {
      await producer.connect();
      logger.info('Producer connected to Kafka');
      
      // Wait for Kafka to be fully ready
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Create topics if they don't exist
      const admin = kafka.admin();
      await admin.connect();
      
      try {
        const existingTopics = await admin.listTopics();
        const requiredTopics = ['payment-completed', 'billing-created'];
        const topicsToCreate = requiredTopics.filter(topic => !existingTopics.includes(topic));

        if (topicsToCreate.length > 0) {
          await admin.createTopics({
            waitForLeaders: true,
            validateOnly: false,
            timeout: 10000,
            topics: topicsToCreate.map(topic => ({
              topic,
              numPartitions: 1,
              replicationFactor: 1,
              configEntries: [
                { name: 'cleanup.policy', value: 'delete' },
                { name: 'retention.ms', value: '604800000' } // 7 days
              ]
            }))
          });
          logger.info('Successfully created Kafka topics:', topicsToCreate);
        } else {
          logger.info('All required Kafka topics already exist');
        }
      } catch (topicError) {
        logger.warn('Topic creation warning:', topicError.message);
      } finally {
        await admin.disconnect();
      }
      return producer;
    } catch (error) {
      logger.error('Error connecting producer:', error);
      retries++;
      await new Promise(resolve => setTimeout(resolve, retryInterval));
    }
  }

  throw new Error(`Failed to connect producer after ${maxRetries} attempts`);
};

module.exports = { kafka, producer, connectProducer };