import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import OrderHistory from '../components/profile/OrderHistory';
import ProfileEdit from '../components/profile/ProfileEdit';
import './Profile.css';

function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, token, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const orderDetails = location.state?.orderDetails;

  useEffect(() => {
    // Wait for auth state to be determined
    if (!authLoading) {
      if (!isAuthenticated) {
        navigate('/login', { replace: true });
      } else {
        setLoading(false);
      }
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Show loading state while checking auth
  if (authLoading || loading) {
    return (
      <div className="profile-loading">
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  // Don't show unauthorized message, redirect instead
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>My Profile</h1>
        <div className="user-info">
          <h2>{user?.name}</h2>
          <p>{user?.email}</p>
        </div>
      </div>

      {orderDetails && (
        <div className="order-confirmation">
          <h3>Order Confirmed!</h3>
          <p>Thank you for your purchase. Your order has been successfully placed.</p>
          <div className="order-details">
            <p>Order ID: {orderDetails.paymentId}</p>
            <p>Total Amount: ${orderDetails.total.toFixed(2)}</p>
          </div>
        </div>
      )}

      <div className="profile-content">
        <ProfileEdit />
        <OrderHistory />
      </div>
    </div>
  );
}

export default Profile; 