import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import { useDebounce } from '../hooks/useDebounce';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    sort: 'newest'
  });

  // Debounce search and price inputs to prevent too many API calls
  const debouncedSearch = useDebounce(filters.search, 500);
  const debouncedMinPrice = useDebounce(filters.minPrice, 500);
  const debouncedMaxPrice = useDebounce(filters.maxPrice, 500);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setFilters({
      search: params.get('search') || '',
      category: params.get('category') || '',
      minPrice: params.get('minPrice') || '',
      maxPrice: params.get('maxPrice') || '',
      sort: params.get('sort') || 'newest'
    });
  }, [location]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError('');

        const params = new URLSearchParams();
        if (debouncedSearch) params.set('search', debouncedSearch);
        if (filters.category) params.set('category', filters.category);
        if (debouncedMinPrice) params.set('minPrice', debouncedMinPrice);
        if (debouncedMaxPrice) params.set('maxPrice', debouncedMaxPrice);
        if (filters.sort) params.set('sort', filters.sort);

        const response = await api.get(`/products?${params}`);
        console.log('Products response:', response);
        setProducts(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching products:', error.response || error);
        setError('Failed to fetch products. Please try again.');
        setLoading(false);
      }
    };

    fetchProducts();
  }, [debouncedSearch, filters.category, debouncedMinPrice, debouncedMaxPrice, filters.sort]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    
    // Update URL params for non-debounced filters
    if (name !== 'search' && name !== 'minPrice' && name !== 'maxPrice') {
      const params = new URLSearchParams(location.search);
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      navigate(`${location.pathname}?${params}`);
    }
  };

  if (loading) return (
    <div className="loading-container">
      <div className="loading-spinner">Loading...</div>
    </div>
  );

  if (error) return (
    <div className="error-container">
      <div className="error-message">{error}</div>
    </div>
  );

  return (
    <div className="product-list">
      <div className="filters">
        <input
          type="text"
          name="search"
          placeholder="Search products..."
          value={filters.search}
          onChange={handleFilterChange}
          className="search-input"
        />
        
        <select
          name="category"
          value={filters.category}
          onChange={handleFilterChange}
          className="category-select"
        >
          <option value="">All Categories</option>
          <option value="electronics">Electronics</option>
          <option value="clothing">Clothing</option>
          <option value="accessories">Accessories</option>
        </select>

        <select
          name="sort"
          value={filters.sort}
          onChange={handleFilterChange}
          className="sort-select"
        >
          <option value="newest">Newest First</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
        </select>

        <div className="price-filters">
          <input
            type="number"
            name="minPrice"
            placeholder="Min Price"
            value={filters.minPrice}
            onChange={handleFilterChange}
            className="price-input"
            min="0"
          />
          <input
            type="number"
            name="maxPrice"
            placeholder="Max Price"
            value={filters.maxPrice}
            onChange={handleFilterChange}
            className="price-input"
            min="0"
          />
        </div>
      </div>

      <div className="products-grid">
        {products.length > 0 ? (
          products.map(product => (
            <ProductCard key={product._id} product={product} />
          ))
        ) : (
          <div className="no-products">
            No products found matching your criteria
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductList; 