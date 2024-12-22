require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { producer, connectProducer } = require('./config/kafka');
const paymentRoutes = require('./routes/payment.routes');
const testRoutes = require('./routes/test.routes');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 5001;

let isKafkaConnected = false;

// Enable CORS for all routes
app.use(cors({
  origin: [
    'http://localhost:3500',
    'http://localhost:5000',
    'http://frontend:3500',
    'http://monolith:5000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-trace-id', 'Accept', 'Origin']
}));

// Add CORS preflight handler
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-trace-id, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(200).send();
});

app.use(express.json());

// Debug logging middleware
app.use((req, res, next) => {
  logger.info({
    message: `Incoming request`,
    method: req.method,
    url: req.url,
    headers: {
      'content-type': req.headers['content-type'],
      'authorization': req.headers['authorization'] ? 'present' : 'missing',
      'x-trace-id': req.headers['x-trace-id'],
      'origin': req.headers['origin']
    }
  });
  next();
});

// Mount routes
app.use('/api/payments', paymentRoutes);
app.use('/api/test', testRoutes);
logger.info('Routes mounted: /api/payments, /api/test');

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    kafka: isKafkaConnected ? 'connected' : 'disconnected',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware - must be after all routes
app.use((err, req, res, next) => {
  logger.error({
    message: 'Unhandled error',
    error: err.message,
    stack: err.stack,
    traceId: req.headers['x-trace-id']
  });

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    traceId: req.headers['x-trace-id']
  });
});

mongoose.set('strictQuery', false);

const connectServices = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Connect to Kafka
    logger.info('Connecting to Kafka...');
    await connectProducer();
    isKafkaConnected = true;
    logger.info('Connected to Kafka');

    // Make the producer available globally
    app.set('kafkaProducer', producer);

  } catch (error) {
    logger.error({
      message: 'Error connecting to services',
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
};

connectServices();

const server = app.listen(PORT, () => {
  logger.info(`Payment service running on port ${PORT}`);
  logger.info('Available routes:');
  
  // Log all registered routes
  const printRoutes = (stack, basePath = '') => {
    stack.forEach(layer => {
      if (layer.route) {
        const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
        logger.info(`${methods} ${basePath}${layer.route.path}`);
      } else if (layer.name === 'router') {
        const newBase = basePath + (layer.regexp.toString().match(/^\/\^(.*?)\\/)?.[1] || '');
        printRoutes(layer.handle.stack, newBase);
      }
    });
  };
  
  printRoutes(app._router.stack);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  try {
    logger.info('Starting graceful shutdown...');
    if (producer) {
      await producer.disconnect();
      isKafkaConnected = false;
    }
    await mongoose.connection.close();
    await server.close();
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error({
      message: 'Error during graceful shutdown',
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}); 