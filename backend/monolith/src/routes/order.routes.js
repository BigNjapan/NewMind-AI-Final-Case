const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Order = require('../models/order');
const Product = require('../models/Product');
const redis = require('../config/redis');
const axios = require('axios');
const { Kafka } = require('kafkajs');
const { sendNotification } = require('../config/websocket');

// Initialize Kafka producer
const kafka = new Kafka({
  clientId: 'order-service',
  brokers: [process.env.KAFKA_BROKER || 'kafka:9092']
});

const producer = kafka.producer();
producer.connect().catch(err => console.error('Kafka connection error:', err));

// Get user's orders
router.get('/', auth, async (req, res) => {
  try {
    console.log('GET /orders - Start');
    console.log('User ID:', req.userId);
    console.log('Auth header:', req.headers.authorization);
    
    console.log('Querying orders from database...');
    const orders = await Order.find({ userId: req.userId })
      .sort({ createdAt: -1 });
    
    console.log('Found orders:', JSON.stringify(orders, null, 2));
    res.json(orders);
  } catch (error) {
    console.error('Error in GET /orders:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get single order
router.get('/:id', auth, async (req, res) => {
  try {
    console.log('GET /orders/:id - Start');
    console.log('Order ID:', req.params.id);
    console.log('User ID:', req.userId);
    
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!order) {
      console.log('Order not found');
      return res.status(404).json({ message: 'Order not found' });
    }

    console.log('Found order:', JSON.stringify(order, null, 2));
    res.json(order);
  } catch (error) {
    console.error('Error in GET /orders/:id:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create order and process payment
router.post('/', auth, async (req, res) => {
  try {
    console.log('POST /orders - Start');
    console.log('User ID:', req.userId);
    
    // Get user's cart
    const cartKey = `cart:${req.userId}`;
    const cartData = await redis.get(cartKey);
    
    if (!cartData) {
      console.log('Cart is empty (no cart data)');
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const cart = JSON.parse(cartData);
    if (cart.items.length === 0) {
      console.log('Cart is empty (no items)');
      return res.status(400).json({ message: 'Cart is empty' });
    }

    console.log('Cart data:', JSON.stringify(cart, null, 2));

    // Validate stock availability
    for (const item of cart.items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        console.log(`Product not found: ${item.name}`);
        return res.status(400).json({ message: `Product ${item.name} not found` });
      }
      if (product.stock < item.quantity) {
        console.log(`Not enough stock for: ${item.name}`);
        return res.status(400).json({ message: `Not enough stock for ${item.name}` });
      }
    }

    // Process payment through payment microservice
    console.log('Processing payment...');
    const paymentResponse = await axios.post('http://payment-service:5001/api/payments/process', {
      userId: req.userId,
      amount: cart.total,
      items: cart.items,
      paymentDetails: req.body.paymentDetails
    }, {
      headers: {
        'Authorization': req.headers.authorization
      }
    });

    if (!paymentResponse.data.success) {
      console.log('Payment failed:', paymentResponse.data);
      throw new Error('Payment failed');
    }

    console.log('Payment successful:', paymentResponse.data);

    // Create order
    const order = new Order({
      userId: req.userId,
      products: cart.items.map(item => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      totalAmount: cart.total,
      status: 'processing',
      shippingAddress: req.body.shippingAddress,
      paymentDetails: {
        method: req.body.paymentDetails.method,
        transactionId: paymentResponse.data.paymentId
      }
    });

    console.log('Creating order:', JSON.stringify(order, null, 2));
    await order.save();
    console.log('Order created successfully');

    // Update product stock
    console.log('Updating product stock...');
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity }
      });
    }

    // Clear cart
    console.log('Clearing cart...');
    await redis.del(cartKey);

    // Send order to Kafka for billing service
    try {
      console.log('Sending order to Kafka...');
      await producer.send({
        topic: 'order-created',
        messages: [{
          key: order._id.toString(),
          value: JSON.stringify({
            orderId: order._id,
            userId: req.userId,
            products: order.products,
            totalAmount: order.totalAmount,
            shippingAddress: order.shippingAddress,
            paymentDetails: order.paymentDetails
          })
        }]
      });
      console.log('Order sent to Kafka successfully');
    } catch (kafkaError) {
      console.error('Error sending order to Kafka:', kafkaError);
      // Don't throw error here, as the order is already created
    }

    // Send real-time notification
    try {
      console.log('Sending WebSocket notification...');
      sendNotification(req.userId, 'ORDER_CREATED', {
        orderId: order._id,
        status: 'processing'
      });
      console.log('WebSocket notification sent successfully');
    } catch (wsError) {
      console.error('Error sending WebSocket notification:', wsError);
      // Don't throw error here, as the order is already created
    }

    res.status(201).json(order);
  } catch (error) {
    console.error('Error in POST /orders:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update order status (webhook endpoint for payment/billing services)
router.put('/:id/status', async (req, res) => {
  try {
    console.log('PUT /orders/:id/status - Start');
    console.log('Order ID:', req.params.id);
    console.log('Status update:', req.body);
    
    const { id } = req.params;
    const { status, type } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      console.log('Order not found');
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = status;
    await order.save();
    console.log('Order status updated successfully');

    // Send real-time notification
    try {
      console.log('Sending WebSocket notification...');
      sendNotification(order.userId, 'ORDER_UPDATED', {
        orderId: order._id,
        status,
        type
      });
      console.log('WebSocket notification sent successfully');
    } catch (wsError) {
      console.error('Error sending WebSocket notification:', wsError);
    }

    res.json(order);
  } catch (error) {
    console.error('Error in PUT /orders/:id/status:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 