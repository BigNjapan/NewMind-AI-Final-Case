import React from 'react';
import { Link } from 'react-router-dom';
import { FaLaptop, FaTshirt, FaHeadphones, FaArrowRight } from 'react-icons/fa';
import './Home.css';

function Home() {
  const categories = [
    {
      id: 1,
      name: 'Electronics',
      description: 'Latest gadgets and devices',
      icon: <FaLaptop className="category-icon" />,
      link: '/products?category=electronics'
    },
    {
      id: 2,
      name: 'Clothing',
      description: 'Fashion for everyone',
      icon: <FaTshirt className="category-icon" />,
      link: '/products?category=clothing'
    },
    {
      id: 3,
      name: 'Accessories',
      description: 'Complete your style',
      icon: <FaHeadphones className="category-icon" />,
      link: '/products?category=accessories'
    }
  ];

  return (
    <div className="home-page">
      <div className="hero-section">
        <div className="container">
          <h1>Welcome to Our E-Commerce Store</h1>
          <p>Discover amazing products at great prices with our curated collection of electronics, fashion, and accessories.</p>
          <div className="hero-buttons">
            <Link to="/products" className="btn btn-primary">
              Browse Products <FaArrowRight style={{ marginLeft: '0.5rem' }} />
            </Link>
            <Link to="/cart" className="btn btn-secondary">
              View Cart
            </Link>
          </div>
        </div>
      </div>

      <div className="container">
        <section className="featured-categories">
          <h2>Featured Categories</h2>
          <div className="categories-grid">
            {categories.map(category => (
              <Link to={category.link} key={category.id} className="category-card">
                <div className="category-icon-wrapper">{category.icon}</div>
                <h3>{category.name}</h3>
                <p>{category.description}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default Home; 