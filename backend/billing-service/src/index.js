require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { consumer, connectConsumer } = require('./config/kafka');
const logger = require('./utils/logger');
const testRoutes = require('./routes/test.routes');

const app = express();
const PORT = process.env.PORT || 5002;

// Initialize global array to store processed messages
global.processedMessages = [];

app.use(cors());
app.use(express.json());

// Debug logging middleware
app.use((req, res, next) => {
  logger.info(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Mount test routes
app.use('/api/test', testRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    kafka: consumer ? 'connected' : 'disconnected',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    processedMessages: global.processedMessages.length,
    timestamp: new Date().toISOString()
  });
});

const connectServices = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Connect to Kafka
    logger.info('Connecting to Kafka consumer...');
    await connectConsumer();
    logger.info('Kafka consumer connected and running');

  } catch (error) {
    logger.error('Error connecting to services:', error);
    process.exit(1);
  }
};

connectServices();

const server = app.listen(PORT, () => {
  logger.info(`Billing service running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  try {
    logger.info('Starting graceful shutdown...');
    await consumer.disconnect();
    await mongoose.connection.close();
    await server.close();
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
}); 