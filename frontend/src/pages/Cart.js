import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './Cart.css';

function Cart() {
  const navigate = useNavigate();
  const { cartItems, loading, error, removeFromCart, updateQuantity, getTotal, refreshCart } = useCart();
  const [updateError, setUpdateError] = useState(null);

  const handleQuantityChange = async (itemId, value) => {
    try {
      setUpdateError(null);
      const quantity = parseInt(value);
      if (!isNaN(quantity) && quantity > 0) {
        await updateQuantity(itemId, quantity);
      }
    } catch (error) {
      console.error('Failed to update quantity:', error);
      setUpdateError(error.message || 'Failed to update quantity');
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      setUpdateError(null);
      await removeFromCart(itemId);
    } catch (error) {
      console.error('Failed to remove item:', error);
      setUpdateError(error.message || 'Failed to remove item');
    }
  };

  if (loading) {
    return (
      <div className="cart-loading">
        <div className="spinner"></div>
        <p>Loading your cart...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cart-error">
        <h2>Error loading cart</h2>
        <p>{error}</p>
        <button 
          className="btn btn-primary"
          onClick={refreshCart}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="cart-empty">
        <h2>Your cart is empty</h2>
        <button 
          className="btn btn-primary"
          onClick={() => navigate('/products')}
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  const subtotal = getTotal();
  const shippingEstimate = 5.00;
  const taxEstimate = subtotal * 0.08; // 8% tax
  const orderTotal = subtotal + shippingEstimate + taxEstimate;

  return (
    <div className="cart-page">
      {updateError && (
        <div className="alert alert-danger">
          {updateError}
          <button onClick={() => setUpdateError(null)} className="close-button">×</button>
        </div>
      )}
      
      <div className="cart-container">
        <div className="cart-items-container">
          <h1>Shopping Cart</h1>
          {cartItems.map(item => (
            <div key={item.productId} className="cart-item">
              <div className="item-image">
                <img 
                  src={item.image} 
                  alt={item.name}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/200';
                  }}
                />
              </div>
              <div className="item-details">
                <div className="item-header">
                  <h3>{item.name}</h3>
                  <button 
                    onClick={() => handleRemoveItem(item.productId)}
                    className="remove-button"
                    aria-label="Remove item"
                  >
                    ×
                  </button>
                </div>
                <div className="item-controls">
                  <div className="quantity-selector">
                    <label htmlFor={`quantity-${item.productId}`}>Quantity:</label>
                    <select
                      id={`quantity-${item.productId}`}
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item.productId, e.target.value)}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                        <option key={num} value={num}>
                          {num}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="item-price">
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="order-summary">
          <h2>Order Summary</h2>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Shipping estimate</span>
            <span>${shippingEstimate.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Tax estimate</span>
            <span>${taxEstimate.toFixed(2)}</span>
          </div>
          <div className="summary-row total">
            <span>Order total</span>
            <span>${orderTotal.toFixed(2)}</span>
          </div>
          <button 
            className="checkout-button"
            onClick={() => navigate('/checkout')}
          >
            Proceed to Checkout
          </button>
          
        </div>
      </div>
    </div>
  );
}

export default Cart; 