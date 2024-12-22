import React from 'react';
import { FaSearch, FaTimes } from 'react-icons/fa';
import './ProductFilters.css';

const ProductFilters = ({ filters, setFilters, activeFilters, clearFilter }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle price range validation
    if (name === 'minPrice' || name === 'maxPrice') {
      const numValue = value === '' ? '' : parseFloat(value);
      const otherPrice = name === 'minPrice' ? filters.maxPrice : filters.minPrice;
      
      // Don't allow negative values
      if (numValue < 0) return;
      
      // Don't allow minPrice to be greater than maxPrice
      if (name === 'minPrice' && otherPrice !== '' && numValue > parseFloat(otherPrice)) {
        return;
      }
      
      // Don't allow maxPrice to be less than minPrice
      if (name === 'maxPrice' && otherPrice !== '' && numValue < parseFloat(otherPrice)) {
        return;
      }
    }
    
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'clothing', label: 'Clothing' },
    { value: 'accessories', label: 'Accessories' },
    { value: 'home', label: 'Home & Living' }
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' }
  ];

  return (
    <aside className="filters-section">
      <div className="filter-group">
        <h2>Filters</h2>
        
        <label className="filter-label">Search Products</label>
        <div className="search-box">
          <input
            type="text"
            name="search"
            placeholder="Search products..."
            value={filters.search}
            onChange={handleChange}
            className="search-input"
          />
          <FaSearch className="search-icon" />
        </div>
      </div>

      <div className="filter-group">
        <label className="filter-label">Category</label>
        <select
          name="category"
          value={filters.category}
          onChange={handleChange}
          className="select-input"
        >
          {categories.map(category => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label className="filter-label">Price Range</label>
        <div className="price-inputs">
          <input
            type="number"
            name="minPrice"
            placeholder="Min Price"
            value={filters.minPrice}
            onChange={handleChange}
            className="price-input"
            min="0"
          />
          <span className="price-separator">to</span>
          <input
            type="number"
            name="maxPrice"
            placeholder="Max Price"
            value={filters.maxPrice}
            onChange={handleChange}
            className="price-input"
            min="0"
          />
        </div>
      </div>

      <div className="filter-group">
        <label className="filter-label">Sort By</label>
        <select
          name="sort"
          value={filters.sort}
          onChange={handleChange}
          className="select-input"
        >
          {sortOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {Object.keys(activeFilters).length > 0 && (
        <div className="filter-chips">
          {Object.entries(activeFilters).map(([key, value]) => (
            <div key={key} className="filter-chip">
              <span>{`${key}: ${value}`}</span>
              <FaTimes
                className="remove-icon"
                onClick={() => clearFilter(key)}
                aria-label={`Remove ${key} filter`}
              />
            </div>
          ))}
        </div>
      )}
    </aside>
  );
};

export default ProductFilters; 