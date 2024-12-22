const mongoose = require('mongoose');
const Order = require('../models/order');

const orders = [
  {
    userId: '65856b8fa8e6183c8c8d63e1',
    products: [
      {
        productId: '65856b8fa8e6183c8c8d63e2',
        name: 'Sample Product 1',
        quantity: 2,
        price: 29.99
      }
    ],
    totalAmount: 59.98,
    status: 'completed',
    shippingAddress: {
      street: '123 Main St',
      city: 'Sample City',
      state: 'ST',
      zipCode: '12345',
      country: 'Sample Country'
    },
    paymentDetails: {
      method: 'credit_card',
      transactionId: 'txn_123456789'
    }
  },
  {
    userId: '65856b8fa8e6183c8c8d63e1',
    products: [
      {
        productId: '65856b8fa8e6183c8c8d63e3',
        name: 'Sample Product 2',
        quantity: 1,
        price: 49.99
      }
    ],
    totalAmount: 49.99,
    status: 'processing',
    shippingAddress: {
      street: '456 Oak Ave',
      city: 'Sample City',
      state: 'ST',
      zipCode: '12345',
      country: 'Sample Country'
    },
    paymentDetails: {
      method: 'paypal',
      transactionId: 'txn_987654321'
    }
  }
];

async function seedOrders() {
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect('mongodb://mongodb:27017/ecommerce', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB');
    await Order.deleteMany({});
    console.log('Cleared existing orders');
    
    const result = await Order.insertMany(orders);
    console.log(`Successfully seeded ${result.length} orders`);
    
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedOrders(); 