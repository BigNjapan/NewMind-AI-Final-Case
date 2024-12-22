import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../hooks/useAuth';
import { processPayment } from '../services/paymentService';
import PaymentForm from '../components/payment/PaymentForm';
import OrderSummary from '../components/payment/OrderSummary';
import Notification from '../components/Notification';
import './Checkout.css';

function Checkout() {
  const navigate = useNavigate();
  const { cartItems, getTotal, clearCart } = useCart();
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState(null);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  const handlePayment = async (paymentDetails) => {
    setLoading(true);
    setIsProcessingOrder(true);
    setError('');

    try {
      if (!token) {
        throw new Error('Please login to continue');
      }

      if (cartItems.length === 0) {
        throw new Error('Your cart is empty');
      }

      const total = getTotal();
      if (total <= 0) {
        throw new Error('Invalid order total');
      }

      console.log('Preparing payment data...');
      const paymentData = {
        amount: total,
        items: cartItems.map(item => ({
          id: item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        paymentDetails: {
          cardNumber: paymentDetails.cardNumber,
          expiryDate: paymentDetails.expiryDate,
          cvv: paymentDetails.cvv,
          name: paymentDetails.name
        }
      };

      console.log('Sending payment request...');
      const response = await processPayment(paymentData);

      if (response.success) {
        setNotification({
          type: 'success',
          message: 'Payment successful! Your order has been placed.'
        });

        const orderDetails = {
          paymentId: response.payment.id,
          total: total,
          items: [...cartItems]
        };

        clearCart();
        navigate('/profile', { 
          state: { 
            paymentSuccess: true,
            orderDetails
          }
        });
      } else {
        throw new Error(response.message || 'Payment failed');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment processing failed');
      setNotification({
        type: 'error',
        message: err.message || 'Payment processing failed'
      });
    } finally {
      setIsProcessingOrder(false);
      setLoading(false);
    }
  };

  if (isProcessingOrder) {
    return (
      <div className="checkout-processing">
        <div className="processing-content">
          <div className="spinner"></div>
          <h2>Processing Your Order</h2>
          <p>Please wait while we process your payment...</p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0 && !isProcessingOrder) {
    return (
      <div className="checkout-empty">
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

  return (
    <div className="checkout-container">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      <h2>Checkout</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      
      <div className="checkout-grid">
        <OrderSummary 
          items={cartItems} 
          total={getTotal()} 
        />
        
        <PaymentForm 
          onSubmit={handlePayment}
          loading={loading}
          total={getTotal()}
          userDetails={user}
        />
      </div>
    </div>
  );
}

export default Checkout; 