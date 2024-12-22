import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import './OrderHistory.css';

function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token, user } = useAuth();

  useEffect(() => {
    if (token && user) {
      fetchOrders();
    }
  }, [token, user]);

  const fetchOrders = async () => {
    try {
      console.log('Fetching orders with token:', token);
      const response = await api.get('/orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('Orders response:', response.data);
      setOrders(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err.response || err);
      setError(err.response?.data?.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  if (!token || !user) {
    return (
      <div className="order-error">
        Please log in to view your orders
      </div>
    );
  }

  if (loading) {
    return <div className="order-loading">Loading orders...</div>;
  }

  if (error) {
    return <div className="order-error">{error}</div>;
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="no-orders">
        <h3>No Orders Yet</h3>
        <p>Your order history will appear here once you make a purchase.</p>
      </div>
    );
  }

  return (
    <div className="order-history">
      <h2>Order History</h2>
      <div className="orders-list">
        {orders.map(order => (
          <div key={order._id} className="order-card">
            <div className="order-header">
              <div className="order-id">
                <span>Order #{order._id.slice(-6)}</span>
                <span className={`order-status ${order.status}`}>
                  {order.status}
                </span>
              </div>
              <span className="order-date">
                {new Date(order.createdAt).toLocaleDateString()}
              </span>
            </div>

            <div className="order-items">
              {order.products.map((item, index) => (
                <div key={index} className="order-item">
                  <div className="item-details">
                    <span className="item-name">{item.name}</span>
                    <span className="item-quantity">Qty: {item.quantity}</span>
                  </div>
                  <span className="item-price">${item.price.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="order-footer">
              <div className="order-total">
                <span>Total</span>
                <span className="total-amount">${order.totalAmount.toFixed(2)}</span>
              </div>
              <div className="payment-details">
                <span>Payment: {order.paymentDetails.method}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default OrderHistory; 