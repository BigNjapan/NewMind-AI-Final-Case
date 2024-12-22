const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const auth = require('./middleware/auth');
const errorHandler = require('./middleware/error');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:3500',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-trace-id', 'Accept']
}));
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());

// Debug logging middleware
app.use((req, res, next) => {
  console.log('Incoming request:', {
    method: req.method,
    url: req.url,
    path: req.path,
    body: req.body,
    headers: req.headers,
    timestamp: new Date().toISOString()
  });
  next();
});

// Routes
console.log('Mounting routes...');

// Mount routes directly
app.use('/api/auth', require('./routes/auth.routes'));
console.log('Auth routes mounted');

app.use('/api/users', require('./routes/user.routes'));
console.log('User routes mounted');

app.use('/api/products', require('./routes/product.routes'));
console.log('Product routes mounted');

app.use('/api/cart', require('./routes/cart.routes'));
console.log('Cart routes mounted');

app.use('/api/orders', auth, require('./routes/order.routes'));
console.log('Order routes mounted');

// Print all registered routes
console.log('Registered routes:');
app._router.stack.forEach((middleware) => {
  if (middleware.route) {
    console.log('Route:', {
      path: middleware.route.path,
      methods: Object.keys(middleware.route.methods)
    });
  } else if (middleware.name === 'router') {
    console.log('Router middleware:', middleware.regexp);
  }
});

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

// Error handling middleware should be last
app.use(errorHandler);

// 404 handler should be the very last middleware
app.use((req, res, next) => {
  console.log('Route not found:', {
    method: req.method,
    url: req.url,
    path: req.path,
    body: req.body,
    headers: req.headers
  });
  res.status(404).json({ message: 'Route not found' });
});

module.exports = app; 