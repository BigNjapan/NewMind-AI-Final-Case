const Product = require('../models/Product');
const { client, waitForElasticsearch, initializeIndex, bulkIndex } = require('../config/elasticsearch');
const mongoose = require('mongoose');
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
    name: 'AirPods Pro',
    description: 'Premium wireless earbuds with noise cancellation',
    price: 249.99,
    category: 'electronics',
    image: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=500&q=80',
    stock: 25
  },
  {
    name: 'Samsung 4K Smart TV',
    description: 'Ultra HD Smart TV with vibrant display',
    price: 799.99,
    category: 'electronics',
    image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500&q=80',
    stock: 8
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
    name: 'Premium Cotton Hoodie',
    description: 'Soft and warm cotton hoodie for everyday wear',
    price: 59.99,
    category: 'clothing',
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&q=80',
    stock: 20
  },
  {
    name: 'Wireless Gaming Mouse',
    description: 'High-precision wireless gaming mouse',
    price: 79.99,
    category: 'electronics',
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&q=80',
    stock: 12
  },
  {
    name: 'Premium Sunglasses',
    description: 'UV protected stylish sunglasses',
    price: 159.99,
    category: 'accessories',
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&q=80',
    stock: 18
  },
  {
    name: 'Leather Wallet',
    description: 'Genuine leather wallet with card slots',
    price: 49.99,
    category: 'accessories',
    image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=500&q=80',
    stock: 22
  },
  {
    name: 'Smart Watch',
    description: 'Feature-rich smartwatch with health tracking',
    price: 299.99,
    category: 'electronics',
    image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=500&q=80',
    stock: 15
  },
  {
    name: 'Wireless Earbuds',
    description: 'Compact wireless earbuds with great sound',
    price: 89.99,
    category: 'electronics',
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&q=80',
    stock: 28
  },
  {
    name: 'Denim Jacket',
    description: 'Classic denim jacket for all seasons',
    price: 79.99,
    category: 'clothing',
    image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=500&q=80',
    stock: 16
  }
];

async function seedProducts() {
  try {
    console.log('Starting seeding process...');

    // Initialize Elasticsearch
    await initializeIndex();
    console.log('Elasticsearch index initialized');

    // Clear existing products
    await Product.deleteMany({});
    console.log('Cleared existing products from MongoDB');

    // Insert products into MongoDB and Elasticsearch
    const operations = [];
    const products = [];

    // First, create all products in MongoDB
    for (const product of sampleProducts) {
      const newProduct = await Product.create(product);
      console.log(`Created product in MongoDB: ${newProduct.name}`);
      products.push(newProduct);
      
      // Prepare bulk operations for Elasticsearch
      operations.push(
        { index: { _index: 'products' } }
      );
      operations.push({
        name: product.name,
        description: product.description,
        category: product.category.toLowerCase(),
        price: parseFloat(product.price),
        stock: parseInt(product.stock),
        image: product.image,
        createdAt: newProduct.createdAt
      });
    }

    // Bulk index in Elasticsearch
    if (operations.length > 0) {
      await bulkIndex(operations);
    }

    // Verify Elasticsearch index
    const { body: searchResult } = await client.search({
      index: 'products',
      body: {
        query: { match_all: {} }
      }
    });
    
    console.log(`Verified ${searchResult.hits.hits.length} products in Elasticsearch`);
    console.log('Seeding completed successfully');

    return products;
  } catch (error) {
    console.error('Seeding error:', error);
    throw error;
  }
}

module.exports = seedProducts; 