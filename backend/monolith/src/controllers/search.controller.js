const { client } = require('../config/elasticsearch');
const Product = require('../models/Product');

exports.searchProducts = async (req, res) => {
  try {
    const { query, filters } = req.body;
    console.log('Search request:', { query, filters });

    // Build search query
    const searchQuery = {
      bool: {
        must: [],
        filter: []
      }
    };

    // Add text search if exists
    if (query && query.trim()) {
      searchQuery.bool.must.push({
        multi_match: {
          query: query.trim(),
          fields: ['name^3', 'description^2', 'category'],
          type: 'most_fields',
          operator: 'or',
          fuzziness: 'AUTO',
          prefix_length: 2
        }
      });
    } else {
      searchQuery.bool.must.push({ match_all: {} });
    }

    // Add category filter if exists
    if (filters?.category && filters.category !== 'all') {
      searchQuery.bool.filter.push({
        term: {
          category: filters.category.toLowerCase()
        }
      });
    }

    // Add price range filter if exists
    if (filters?.price?.gte || filters?.price?.lte) {
      const priceRange = {
        range: {
          price: {}
        }
      };

      if (filters.price.gte) {
        priceRange.range.price.gte = filters.price.gte;
      }
      if (filters.price.lte) {
        priceRange.range.price.lte = filters.price.lte;
      }

      searchQuery.bool.filter.push(priceRange);
    }

    // Build sort options
    let sortOptions = [];
    if (filters?.sort) {
      switch (filters.sort) {
        case 'price-low':
          sortOptions.push({ price: { order: 'asc' } });
          break;
        case 'price-high':
          sortOptions.push({ price: { order: 'desc' } });
          break;
        case 'newest':
        default:
          sortOptions.push({ createdAt: { order: 'desc' } });
          break;
      }
    } else {
      sortOptions.push({ createdAt: { order: 'desc' } });
    }

    console.log('Elasticsearch query:', JSON.stringify({
      query: searchQuery,
      sort: sortOptions
    }, null, 2));

    try {
      const result = await client.search({
        index: 'products',
        body: {
          query: searchQuery,
          sort: sortOptions,
          size: 100,
          track_total_hits: true
        }
      });

      // Check if hits exist in the response
      const hits = result.hits?.hits || result.body?.hits?.hits;
      if (!hits || hits.length === 0) {
        console.warn('No hits in Elasticsearch response, falling back to MongoDB');
        const products = await Product.find().sort({ createdAt: 'desc' });
        return res.json(products);
      }

      const products = hits.map(hit => ({
        _id: hit._id,
        ...hit._source,
        score: hit._score
      }));

      console.log('Search response:', {
        total: (result.hits?.total?.value || result.body?.hits?.total?.value) || products.length,
        returned: products.length,
        query: req.body
      });

      res.json(products);
    } catch (esError) {
      console.error('Elasticsearch error:', esError);
      // Fallback to MongoDB
      const products = await Product.find().sort({ createdAt: 'desc' });
      return res.json(products);
    }
  } catch (error) {
    console.error('Search error:', error);
    try {
      // Final fallback to MongoDB
      console.warn('Error in search, falling back to MongoDB');
      const products = await Product.find().sort({ createdAt: 'desc' });
      return res.json(products);
    } catch (mongoError) {
      console.error('MongoDB fallback error:', mongoError);
      res.status(500).json({ 
        message: 'Error searching products',
        error: error.message 
      });
    }
  }
}; 