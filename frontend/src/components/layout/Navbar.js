import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../context/CartContext';
import { FaShoppingCart, FaUser } from 'react-icons/fa';
import './Navbar.css';

function Navbar() {
  const { isAuthenticated, logout, user } = useAuth();
  const { cartItems } = useCart();
  const navigate = useNavigate();

  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <Link to="/" className="navbar-brand">
            E-Commerce
          </Link>
        </div>

        <div className="navbar-center">
          <Link to="/products" className="nav-link">
            Products
          </Link>
        </div>

        <div className="navbar-right">
          {isAuthenticated ? (
            <div className="auth-section">
              <Link to="/profile" className="user-profile-link">
                <FaUser className="user-icon" />
                <span className="username">{user?.name || 'User'}</span>
              </Link>
              
              <Link to="/cart" className="cart-icon-container">
                <FaShoppingCart className="cart-icon" />
                {cartItemCount > 0 && (
                  <span className="cart-badge">{cartItemCount}</span>
                )}
              </Link>
              
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="login-btn">
                Login
              </Link>
              <Link to="/register" className="register-btn">
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar; 