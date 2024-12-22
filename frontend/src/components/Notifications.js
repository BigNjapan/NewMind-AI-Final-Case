import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import { useNotifications } from '../context/NotificationContext';
import './Notifications.css';

function Notifications() {
  const { socket } = useWebSocket();
  const { addNotification, removeNotification, notifications } = useNotifications();

  useEffect(() => {
    if (!socket) return;

    const handleOrderStatus = (data) => {
      addNotification({
        id: Date.now(),
        message: `Order ${data.orderId} status: ${data.status}`,
        type: data.status.toLowerCase(),
        timestamp: new Date()
      });
    };

    const handlePaymentStatus = (data) => {
      addNotification({
        id: Date.now(),
        message: `Payment ${data.status} for order ${data.orderId}`,
        type: data.status.toLowerCase(),
        timestamp: new Date()
      });
    };

    socket.on('orderStatus', handleOrderStatus);
    socket.on('paymentStatus', handlePaymentStatus);

    return () => {
      socket.off('orderStatus', handleOrderStatus);
      socket.off('paymentStatus', handlePaymentStatus);
    };
  }, [socket, addNotification]);

  if (notifications.length === 0) return null;

  return (
    <div className="notifications-wrapper">
      <div className="notifications">
        <h3>Notifications</h3>
        {notifications.map(notification => (
          <div 
            key={notification.id} 
            className={`notification ${notification.type}`}
          >
            <div className="notification-content">
              <p>{notification.message}</p>
              <small>{new Date(notification.timestamp).toLocaleString()}</small>
            </div>
            <button 
              className="notification-close"
              onClick={() => removeNotification(notification.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Notifications; 