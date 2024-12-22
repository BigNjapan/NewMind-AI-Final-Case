import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      setCartItems([]);
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/cart');
      console.log('Fetch cart response:', response.data);
      setCartItems(response.data.items || []);
    } catch (error) {
      console.error('Error fetching cart:', error);
      setError('Failed to fetch cart');
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (product) => {
    try {
      setError(null);
      console.log('Adding to cart:', { product });
      
      if (!product._id) {
        throw new Error('Invalid product data: missing product ID');
      }

      const response = await api.post('/cart/items', {
        productId: product._id,
        quantity: 1
      });

      console.log('Add to cart response:', response.data);
      setCartItems(response.data.items || []);
      return response.data;
    } catch (error) {
      console.error('Error adding to cart:', error);
      setError(error.response?.data?.message || 'Failed to add item to cart');
      throw error;
    }
  };

  const removeFromCart = async (productId) => {
    try {
      setError(null);
      const response = await api.delete(`/cart/items/${productId}`);
      setCartItems(response.data.items || []);
      return response.data;
    } catch (error) {
      console.error('Error removing from cart:', error);
      setError(error.response?.data?.message || 'Failed to remove item from cart');
      throw error;
    }
  };

  const updateQuantity = async (productId, quantity) => {
    try {
      setError(null);
      if (quantity < 1) {
        throw new Error('Quantity must be at least 1');
      }
      
      const response = await api.put(`/cart/items/${productId}`, { quantity });
      setCartItems(response.data.items || []);
      return response.data;
    } catch (error) {
      console.error('Error updating quantity:', error);
      setError(error.response?.data?.message || 'Failed to update quantity');
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      setError(null);
      const response = await api.delete('/cart');
      setCartItems([]);
      return response.data;
    } catch (error) {
      console.error('Error clearing cart:', error);
      setError(error.response?.data?.message || 'Failed to clear cart');
      throw error;
    }
  };

  const getTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const value = {
    cartItems,
    loading,
    error,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotal,
    refreshCart: fetchCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
} 