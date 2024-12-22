const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('../models/product.model');

const sampleProducts = [
  {
    name: "Smartphone X",
    description: "Latest smartphone with amazing features",
    price: 999.99,
    category: "electronics",
    image: "https://via.placeholder.com/200",
    stock: 50
  },
  {
    name: "Laptop Pro",
    description: "High-performance laptop for professionals",
    price: 1499.99,
    category: "electronics",
    image: "https://via.placeholder.com/200",
    stock: 30
  },
  {
    name: "Classic T-Shirt",
    description: "Comfortable cotton t-shirt",
    price: 19.99,
    category: "clothing",
    image: "https://via.placeholder.com/200",
    stock: 100
  },
  {
    name: "Running Shoes",
    description: "Lightweight running shoes",
    price: 89.99,
    category: "accessories",
    image: "https://via.placeholder.com/200",
    stock: 45
  }
];

const seedProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    await Product.deleteMany({});
    console.log('Cleared existing products');

    await Product.insertMany(sampleProducts);
    console.log('Sample products inserted successfully');

    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding products:', error);
    process.exit(1);
  }
};

seedProducts(); 