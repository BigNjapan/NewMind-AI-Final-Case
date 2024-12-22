const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Product = require('../models/Product');

console.log('Cart routes module loaded');

// Initialize carts Map if not exists
if (!global.carts) {
  global.carts = new Map();
}
const carts = global.carts;

// Debug middleware for cart routes
router.use((req, res, next) => {
  console.log('Cart route hit:', {
    method: req.method,
    url: req.url,
    path: req.path,
    userId: req.userId,
    headers: {
      authorization: req.headers.authorization ? 'Bearer [token]' : 'none',
      'content-type': req.headers['content-type']
    },
    body: req.body
  });
  next();
});

// Apply auth middleware to all cart routes
router.use(auth);

// Get cart
router.get('/', async (req, res) => {
  try {
    if (!req.userId) {
      console.error('No userId found in request');
      return res.status(401).json({ message: 'User ID not found in request' });
    }

    // Get cart from memory
    const cart = carts.get(req.userId) || { items: [], total: 0 };
    console.log('Retrieved cart:', cart);
    res.json(cart);
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ message: 'Failed to fetch cart' });
  }
});

// Add item to cart
router.post('/items', async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    
    if (!productId || !quantity) {
      console.error('Missing required fields:', { productId, quantity });
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (!req.userId) {
      console.error('No userId found in request');
      return res.status(401).json({ message: 'User ID not found in request' });
    }

    console.log('Finding product:', productId);
    const product = await Product.findById(productId);
    
    if (!product) {
      console.error('Product not found:', productId);
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.stock < quantity) {
      console.error('Not enough stock:', { available: product.stock, requested: quantity });
      return res.status(400).json({ message: 'Not enough stock available' });
    }

    // Get or initialize cart
    let cart = carts.get(req.userId) || { items: [], total: 0 };
    console.log('Current cart:', cart);

    // Check if product already in cart
    const existingItemIndex = cart.items.findIndex(item => item.productId === productId);
    
    if (existingItemIndex !== -1) {
      // Update existing item
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      cart.items.push({
        productId: product._id.toString(),
        name: product.name,
        price: product.price,
        quantity,
        image: product.image
      });
    }

    // Recalculate total
    cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Save cart
    carts.set(req.userId, cart);
    console.log('Updated cart:', cart);

    res.json(cart);
  } catch (error) {
    console.error('Error adding item to cart:', error);
    res.status(500).json({ message: 'Failed to add item to cart' });
  }
});

// Update cart item
router.put('/items/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!req.userId) {
      return res.status(401).json({ message: 'User ID not found in request' });
    }

    if (quantity < 0) {
      return res.status(400).json({ message: 'Quantity must be positive' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Not enough stock available' });
    }

    let cart = carts.get(req.userId);
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(item => item.productId === productId);
    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    if (quantity === 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }

    cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    carts.set(req.userId, cart);

    res.json(cart);
  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({ message: 'Failed to update cart item' });
  }
});

// Remove item from cart
router.delete('/items/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    if (!req.userId) {
      return res.status(401).json({ message: 'User ID not found in request' });
    }

    let cart = carts.get(req.userId);
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(item => item.productId === productId);
    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    cart.items.splice(itemIndex, 1);
    cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    carts.set(req.userId, cart);

    res.json(cart);
  } catch (error) {
    console.error('Error removing item from cart:', error);
    res.status(500).json({ message: 'Failed to remove item from cart' });
  }
});

// Clear cart
router.delete('/', async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'User ID not found in request' });
    }

    carts.delete(req.userId);
    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ message: 'Failed to clear cart' });
  }
});

// Debug route to check if cart routes are loaded
router.get('/debug', (req, res) => {
  res.json({
    message: 'Cart routes are working',
    routes: router.stack.map(r => ({
      path: r.route?.path,
      methods: r.route?.methods
    })).filter(r => r.path)
  });
});

console.log('Cart routes configured with paths:', 
  router.stack
    .filter(r => r.route)
    .map(r => ({
      path: r.route.path,
      methods: Object.keys(r.route.methods)
    }))
);

module.exports = router; 