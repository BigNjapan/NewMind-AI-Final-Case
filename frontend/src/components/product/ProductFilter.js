import React from 'react';
import './ProductFilter.css';

function ProductFilter({ filters, setFilters }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="filter-container">
      <input
        type="text"
        name="query"
        placeholder="Search products..."
        value={filters.query}
        onChange={handleChange}
        className="search-input"
      />

      <select
        name="category"
        value={filters.category}
        onChange={handleChange}
        className="category-select"
      >
        <option value="">All Categories</option>
        <option value="electronics">Electronics</option>
        <option value="clothing">Clothing</option>
        <option value="accessories">Accessories</option>
      </select>

      <div className="price-filters">
        <input
          type="number"
          name="minPrice"
          placeholder="Min Price"
          value={filters.minPrice}
          onChange={handleChange}
          min="0"
          className="price-input"
        />
        <input
          type="number"
          name="maxPrice"
          placeholder="Max Price"
          value={filters.maxPrice}
          onChange={handleChange}
          min="0"
          className="price-input"
        />
      </div>

      <select
        name="sort"
        value={filters.sort}
        onChange={handleChange}
        className="sort-select"
      >
        <option value="newest">Newest First</option>
        <option value="price-low">Price: Low to High</option>
        <option value="price-high">Price: High to Low</option>
      </select>
    </div>
  );
}

export default ProductFilter; 