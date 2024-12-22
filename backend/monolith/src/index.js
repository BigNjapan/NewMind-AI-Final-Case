const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const socketIO = require('socket.io');
const http = require('http');
const axios = require('axios');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const seedProducts = require('./utils/seedProducts');
const { initializeElasticsearch } = require('./config/elasticsearch');

// Import routes
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const orderRoutes = require('./routes/order.routes');
const userRoutes = require('./routes/user.routes');
const cartRoutes = require('./routes/cart.routes');

const app = express();
const server = http.createServer(app);

// Enable CORS for all routes
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3500",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-trace-id', 'Accept']
}));

// Parse JSON bodies
app.use(express.json());

// Global request logging middleware
app.use((req, res, next) => {
  console.log('Request received:', {
    method: req.method,
    url: req.url,
    path: req.path,
    baseUrl: req.baseUrl,
    originalUrl: req.originalUrl,
    body: req.body,
    headers: req.headers,
    timestamp: new Date().toISOString()
  });
  next();
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

// API Routes with debugging
console.log('Registering routes...');

// Register routes
console.log('Registering routes for /api/auth');
app.use('/api/auth', authRoutes);
console.log('Routes registered for /api/auth:', authRoutes.stack
  .filter(r => r.route)
  .map(r => ({
    path: r.route.path,
    methods: Object.keys(r.route.methods)
  }))
);

console.log('Registering routes for /api/products');
app.use('/api/products', productRoutes);
console.log('Routes registered for /api/products:', productRoutes.stack
  .filter(r => r.route)
  .map(r => ({
    path: r.route.path,
    methods: Object.keys(r.route.methods)
  }))
);

console.log('Registering routes for /api/orders');
app.use('/api/orders', orderRoutes);
console.log('Routes registered for /api/orders:', orderRoutes.stack
  .filter(r => r.route)
  .map(r => ({
    path: r.route.path,
    methods: Object.keys(r.route.methods)
  }))
);

console.log('Registering routes for /api/users');
app.use('/api/users', userRoutes);
console.log('Routes registered for /api/users:', userRoutes.stack
  .filter(r => r.route)
  .map(r => ({
    path: r.route.path,
    methods: Object.keys(r.route.methods)
  }))
);

console.log('Registering routes for /api/cart');
app.use('/api/cart', cartRoutes);
console.log('Routes registered for /api/cart:', cartRoutes.stack
  .filter(r => r.route)
  .map(r => ({
    path: r.route.path,
    methods: Object.keys(r.route.methods)
  }))
);

// Payment service proxy
app.use('/api/payments', async (req, res) => {
  // Handle OPTIONS requests for CORS preflight
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin || 'http://localhost:3500');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-trace-id, Accept');
    res.header('Access-Control-Allow-Credentials', 'true');
    return res.status(200).send();
  }

  // Verify token
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No token provided'
    });
  }

  try {
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;

    console.log('Payment proxy request:', {
      method: req.method,
      path: req.path,
      body: req.body,
      userId: req.userId,
      headers: {
        'content-type': req.headers['content-type'],
        'authorization': 'present',
        'origin': req.headers.origin
      }
    });

    const paymentServiceUrl = 'http://payment-service:5001/api/payments/process';
    console.log('Forwarding to payment service:', paymentServiceUrl);

    // Forward the request to the payment service
    const response = await axios({
      method: req.method,
      url: paymentServiceUrl,
      data: { ...req.body, userId: req.userId },
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-trace-id': req.headers['x-trace-id'],
        'Origin': req.headers.origin || 'http://localhost:3500'
      },
      validateStatus: false // Don't throw on any status
    });

    console.log('Payment proxy response:', {
      status: response.status,
      data: response.data
    });

    // Set CORS headers explicitly
    res.header('Access-Control-Allow-Origin', req.headers.origin || 'http://localhost:3500');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-trace-id, Accept');
    res.header('Access-Control-Allow-Credentials', 'true');

    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Payment proxy error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      stack: error.stack
    });

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    return res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.message || 'Payment processing failed',
      error: error.message
    });
  }
});

// Socket.IO setup
const io = socketIO(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3500",
    methods: ["GET", "POST"]
  }
});

// Socket.IO middleware for authentication
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.userId);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.userId);
  });
});

// Export io instance to be used in other files
global.io = io;

// 404 handler - must be after all routes
app.use((req, res) => {
  console.log('404 Not Found:', {
    method: req.method,
    url: req.url,
    path: req.path,
    baseUrl: req.baseUrl,
    originalUrl: req.originalUrl,
    body: req.body,
    headers: req.headers
  });
  res.status(404).json({ 
    message: 'Route not found',
    availableRoutes: [
      '/api/auth',
      '/api/products',
      '/api/orders',
      '/api/users',
      '/api/cart'
    ]
  });
});

// Error handler middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error'
  });
});

// Redis setup
const redis = require('./config/redis');

redis.on('connect', () => {
  console.log('Redis Connected');
});

redis.on('error', (err) => {
  console.error('Redis Error:', err);
});

// Connect to MongoDB and start server
mongoose.set('strictQuery', true);
mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongodb:27017/e-commerce')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Initialize Elasticsearch and seed products
    if (process.env.SEED_DB === 'true') {
      try {
        console.log('Seeding products...');
        await seedProducts();
        console.log('Products seeded successfully');
      } catch (error) {
        console.error('Error seeding products:', error);
      }
    }

    // Start server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log('Available routes:', [
        '/api/auth',
        '/api/products',
        '/api/orders',
        '/api/users',
        '/api/cart'
      ]);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
 