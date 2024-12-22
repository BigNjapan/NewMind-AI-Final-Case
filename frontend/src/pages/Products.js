import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { searchProducts } from '../services/productService';
import { useDebounce } from '../hooks/useDebounce';
import ProductFilters from '../components/products/ProductFilters';
import { useCart } from '../context/CartContext';
import './Products.css';

function Products() {
  const location = useLocation();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToCart } = useCart();
  
  // Initialize filters from URL params
  const queryParams = new URLSearchParams(location.search);
  const [filters, setFilters] = useState({
    search: queryParams.get('search') || '',
    category: queryParams.get('category') || '',
    sort: queryParams.get('sort') || 'newest',
    minPrice: queryParams.get('minPrice') || '',
    maxPrice: queryParams.get('maxPrice') || ''
  });

  // Track active filters for filter chips
  const [activeFilters, setActiveFilters] = useState({});

  const debouncedSearch = useDebounce(filters.search, 500);
  const debouncedMinPrice = useDebounce(filters.minPrice, 500);
  const debouncedMaxPrice = useDebounce(filters.maxPrice, 500);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });

    // Update active filters
    const active = {};
    if (filters.category) active.Category = filters.category;
    if (filters.minPrice) active['Min Price'] = `$${filters.minPrice}`;
    if (filters.maxPrice) active['Max Price'] = `$${filters.maxPrice}`;
    if (filters.search) active.Search = filters.search;
    setActiveFilters(active);
  }, [filters, navigate, location.pathname]);

  // Fetch products when filters change
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const searchQuery = {
          search: debouncedSearch,
          category: filters.category,
          minPrice: debouncedMinPrice,
          maxPrice: debouncedMaxPrice,
          sort: filters.sort
        };

        const response = await searchProducts(searchQuery);
        setProducts(Array.isArray(response) ? response : []);
        setError(null);
      } catch (err) {
        console.error('Search error:', err);
        setError('Failed to fetch products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [debouncedSearch, debouncedMinPrice, debouncedMaxPrice, filters.category, filters.sort]);

  const clearFilter = (key) => {
    setFilters(prev => ({ ...prev, [key.toLowerCase()]: '' }));
  };

  const handleAddToCart = (product) => {
    addToCart(product);
    // You could add a toast notification here
  };

  return (
    <div className="products-page">
      <div className="container">
        <div className="products-header">
          <h1>Our Products</h1>
          <p>{products.length} products found</p>
        </div>

        <div className="products-container">
          <ProductFilters
            filters={filters}
            setFilters={setFilters}
            activeFilters={activeFilters}
            clearFilter={clearFilter}
          />

          <main className="products-grid-section">
            {loading ? (
              <div className="loading-spinner">
                <div className="spinner"></div>
                <p>Loading products...</p>
              </div>
            ) : error ? (
              <div className="error-message">
                <p>{error}</p>
                <button onClick={() => window.location.reload()} className="btn btn-primary">
                  Try Again
                </button>
              </div>
            ) : (
              <div className="products-grid">
                {products.length > 0 ? (
                  products.map(product => (
                    <div key={product._id} className="product-card">
                      <div className="product-image">
                        <img 
                          src={product.image || '/placeholder.png'} 
                          alt={product.name}
                          onError={(e) => {
                            e.target.src = '/placeholder.png';
                          }}
                        />
                      </div>
                      <div className="product-info">
                        <h3>{product.name}</h3>
                        <p className="product-description">{product.description}</p>
                        <div className="product-price">${product.price.toFixed(2)}</div>
                        <button 
                          className="btn btn-primary add-to-cart-btn"
                          onClick={() => handleAddToCart(product)}
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-products">
                    <p>No products found matching your criteria</p>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default Products;