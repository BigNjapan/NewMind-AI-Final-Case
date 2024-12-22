const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const redis = require('../config/redis');
const { client } = require('../config/elasticsearch');

console.log('Product routes module loaded');

// Debug logging middleware
router.use((req, res, next) => {
  console.log('Product route accessed:', {
    method: req.method,
    url: req.url,
    body: req.body,
    headers: req.headers
  });
  next();
});

// Get all products
router.get('/', async (req, res) => {
  try {
    console.log('GET /products query:', req.query);
    const startTime = Date.now();
    
    const { sort, category, minPrice, maxPrice, search } = req.query;
    
    // If search is present, use Elasticsearch
    if (search) {
      const esQuery = {
        bool: {
          must: [
            {
              multi_match: {
                query: search,
                fields: ['name', 'description'],
                fuzziness: 'AUTO'
              }
            }
          ]
        }
      };

      // Add filters to Elasticsearch query
      if (category) {
        esQuery.bool.must.push({
          term: { category: category.toLowerCase() }
        });
      }
      
      if (minPrice || maxPrice) {
        const rangeQuery = { range: { price: {} } };
        if (minPrice) rangeQuery.range.price.gte = parseFloat(minPrice);
        if (maxPrice) rangeQuery.range.price.lte = parseFloat(maxPrice);
        esQuery.bool.must.push(rangeQuery);
      }

      // Add sorting
      let sortField = { createdAt: 'desc' };
      if (sort === 'price-low') {
        sortField = { price: 'asc' };
      } else if (sort === 'price-high') {
        sortField = { price: 'desc' };
      }

      const { body } = await client.search({
        index: 'products',
        body: {
          query: esQuery,
          sort: [sortField]
        }
      });

      const products = body.hits.hits.map(hit => ({
        ...hit._source,
        _id: hit._id
      }));

      console.log(`Found ${products.length} products using Elasticsearch`);
      return res.json(products);
    }

    // If no search term, use MongoDB with filters
    let query = {};
    
    if (category) {
      query.category = category.toLowerCase();
    }
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Create cache key based on query parameters
    const cacheKey = `products:${JSON.stringify({ query, sort })}`;
    
    // Try to get from cache first
    const cachedProducts = await redis.get(cacheKey);
    if (cachedProducts) {
      const products = JSON.parse(cachedProducts);
      if (products && products.length > 0) {
        const endTime = Date.now();
        console.log('Cache hit for products');
        res.set({
          'X-Cache': 'HIT',
          'X-Cache-Time': `${endTime - startTime}ms`
        });
        return res.json(products);
      }
    }

    // If not in cache or cache is empty, get from database
    let productsQuery = Product.find(query);
    
    // Apply sorting
    switch (sort) {
      case 'price-low':
        productsQuery = productsQuery.sort({ price: 1 });
        break;
      case 'price-high':
        productsQuery = productsQuery.sort({ price: -1 });
        break;
      case 'newest':
      default:
        productsQuery = productsQuery.sort({ createdAt: -1 });
        break;
    }

    const products = await productsQuery.exec();
    console.log(`Found ${products.length} products using MongoDB`);
    
    if (products.length > 0) {
      // Store in cache for 1 hour
      await redis.setex(cacheKey, 3600, JSON.stringify(products));
    }
    
    const endTime = Date.now();
    res.set({
      'X-Cache': 'MISS',
      'X-Cache-Time': `${endTime - startTime}ms`
    });
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create product (requires authentication)
router.post('/', auth, async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();

    // Index in Elasticsearch
    await client.index({
      index: 'products',
      id: product._id.toString(),
      body: {
        name: product.name,
        description: product.description,
        category: product.category.toLowerCase(),
        price: parseFloat(product.price),
        stock: parseInt(product.stock),
        createdAt: product.createdAt
      },
      refresh: true
    });

    // Clear products cache
    const keys = await redis.keys('products:*');
    if (keys.length > 0) {
      await redis.del(keys);
    }

    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update product (requires authentication)
router.put('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Update in Elasticsearch
    await client.update({
      index: 'products',
      id: product._id.toString(),
      body: {
        doc: {
          name: product.name,
          description: product.description,
          category: product.category.toLowerCase(),
          price: parseFloat(product.price),
          stock: parseInt(product.stock),
          createdAt: product.createdAt
        }
      },
      refresh: true
    });

    // Clear products cache
    const keys = await redis.keys('products:*');
    if (keys.length > 0) {
      await redis.del(keys);
    }

    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete product (requires authentication)
router.delete('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Delete from Elasticsearch
    await client.delete({
      index: 'products',
      id: product._id.toString(),
      refresh: true
    });

    // Clear products cache
    const keys = await redis.keys('products:*');
    if (keys.length > 0) {
      await redis.del(keys);
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: error.message });
  }
});

// Search products
router.post('/search', async (req, res) => {
  try {
    const { query, filters } = req.body;
    console.log('Search request:', { query, filters });

    // Build Elasticsearch query
    const esQuery = {
      bool: {
        must: []
      }
    };

    // Add text search if query exists
    if (query) {
      esQuery.bool.must.push({
        multi_match: {
          query: query,
          fields: ['name^2', 'description'],
          fuzziness: 'AUTO'
        }
      });
    }

    // Add price range if exists
    if (filters?.price?.gte || filters?.price?.lte) {
      const rangeQuery = { range: { price: {} } };
      if (filters.price.gte) rangeQuery.range.price.gte = parseFloat(filters.price.gte);
      if (filters.price.lte) rangeQuery.range.price.lte = parseFloat(filters.price.lte);
      esQuery.bool.must.push(rangeQuery);
    }

    // Add category if exists
    if (filters?.category && filters.category !== 'all') {
      esQuery.bool.must.push({
        term: { category: filters.category.toLowerCase() }
      });
    }

    // Add sorting
    let sortField = { createdAt: 'desc' };
    if (filters?.sort === 'price-low') {
      sortField = { price: 'asc' };
    } else if (filters?.sort === 'price-high') {
      sortField = { price: 'desc' };
    }

    console.log('Elasticsearch query:', JSON.stringify(esQuery, null, 2));

    const { body } = await client.search({
      index: 'products',
      body: {
        query: esQuery,
        sort: [sortField]
      }
    });

    const products = body.hits.hits.map(hit => ({
      ...hit._source,
      _id: hit._id
    }));

    console.log(`Found ${products.length} products using Elasticsearch`);
    return res.json(products);

  } catch (error) {
    console.error('Search error:', error);
    
    // Fallback to MongoDB
    try {
      let mongoQuery = {};
      
      // Add text search
      if (query) {
        mongoQuery.$or = [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } }
        ];
      }
      
      // Add price range
      if (filters?.price?.gte || filters?.price?.lte) {
        mongoQuery.price = {};
        if (filters.price.gte) mongoQuery.price.$gte = parseFloat(filters.price.gte);
        if (filters.price.lte) mongoQuery.price.$lte = parseFloat(filters.price.lte);
      }
      
      // Add category
      if (filters?.category && filters.category !== 'all') {
        mongoQuery.category = filters.category.toLowerCase();
      }

      // Add sorting
      let sort = { createdAt: -1 };
      if (filters?.sort === 'price-low') {
        sort = { price: 1 };
      } else if (filters?.sort === 'price-high') {
        sort = { price: -1 };
      }

      const products = await Product.find(mongoQuery).sort(sort);
      console.log(`Found ${products.length} products using MongoDB (fallback)`);
      return res.json(products);
    } catch (mongoError) {
      console.error('MongoDB fallback error:', mongoError);
      res.status(500).json({ message: 'Error searching products' });
    }
  }
});

module.exports = router; 
module.exports = router; 