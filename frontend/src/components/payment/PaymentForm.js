import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import './PaymentForm.css';

function PaymentForm({ onSubmit, loading, total, userDetails }) {
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    name: userDetails?.name || ''
  });

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (formData.cardNumber.length !== 16) {
      alert('Please enter a valid 16-digit card number');
      return;
    }

    if (!/^\d{2}\/\d{2}$/.test(formData.expiryDate)) {
      alert('Please enter expiry date in MM/YY format');
      return;
    }

    if (formData.cvv.length !== 3) {
      alert('Please enter a valid 3-digit CVV');
      return;
    }

    // Pass only the payment details
    onSubmit({
      cardNumber: formData.cardNumber.replace(/\s/g, ''),
      expiryDate: formData.expiryDate,
      cvv: formData.cvv,
      name: formData.name
    });
  };

  return (
    <div className="payment-form-container">
      <h3>Payment Details</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Cardholder Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="John Doe"
            required
          />
        </div>

        <div className="form-group">
          <label>Card Number</label>
          <input
            type="text"
            name="cardNumber"
            value={formData.cardNumber}
            onChange={handleChange}
            placeholder="1234 5678 9012 3456"
            maxLength="16"
            pattern="\d*"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Expiry Date</label>
            <input
              type="text"
              name="expiryDate"
              value={formData.expiryDate}
              onChange={handleChange}
              placeholder="MM/YY"
              maxLength="5"
              required
            />
          </div>

          <div className="form-group">
            <label>CVV</label>
            <input
              type="password"
              name="cvv"
              value={formData.cvv}
              onChange={handleChange}
              placeholder="123"
              maxLength="3"
              pattern="\d*"
              required
            />
          </div>
        </div>

        <button 
          type="submit" 
          className="btn btn-primary payment-button"
          disabled={loading}
        >
          {loading ? 'Processing...' : `Pay $${Number(total).toFixed(2)}`}
        </button>
      </form>
    </div>
  );
}

export default PaymentForm; 