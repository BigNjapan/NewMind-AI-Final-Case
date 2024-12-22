import React from 'react';
import './OrderSummary.css';

function OrderSummary({ items, total }) {
  return (
    <div className="order-summary">
      <h3>Order Summary</h3>
      <div className="order-items">
        {items.map(item => (
          <div key={item._id} className="order-item">
            <div className="item-info">
              <span className="item-name">{item.name}</span>
              <span className="item-quantity">x{item.quantity}</span>
            </div>
            <span className="item-price">
              ${(item.price * item.quantity).toFixed(2)}
            </span>
          </div>
        ))}
      </div>
      
      <div className="order-total">
        <span>Total</span>
        <span className="total-amount">${Number(total).toFixed(2)}</span>
      </div>
    </div>
  );
}

export default OrderSummary; 