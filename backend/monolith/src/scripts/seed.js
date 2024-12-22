const mongoose = require('mongoose');
const Product = require('../models/Product');
require('dotenv').config();

const sampleProducts = [
  {
    name: 'iPhone 14 Pro',
    description: 'Latest Apple smartphone with advanced camera system',
    price: 999.99,
    category: 'electronics',
    image: 'https://images.unsplash.com/photo-1678685888221-cda773a3dcdb?w=500&q=80',
    stock: 10
  },
  {
    name: 'MacBook Pro M2',
    description: 'Powerful laptop for professionals and creators',
    price: 1499.99,
    category: 'electronics',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&q=80',
    stock: 15
  },
  {
    name: 'Nike Air Max',
    description: 'Comfortable and stylish running shoes',
    price: 129.99,
    category: 'clothing',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80',
    stock: 30
  },
  {
    name: 'Leather Backpack',
    description: 'Stylish and durable leather backpack',
    price: 89.99,
    category: 'accessories',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80',
    stock: 15
  }
];

async function seedProducts() {
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongodb:27017/ecommerce');
    console.log('Connected to MongoDB');
    
    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products');
    
    // Insert new products
    const products = await Product.insertMany(
      sampleProducts.map(product => ({
        ...product,
        category: product.category.toLowerCase()
      }))
    );
    console.log(`${products.length} products inserted successfully`);
    
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedProducts(); 