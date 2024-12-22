import React, { useState } from 'react';

function OrderForm() {
  const [amount, setAmount] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/payments/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer your_test_token_here' // In a real app, get from auth context
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          orderId: 'test-' + Date.now(),
          cardDetails: {
            cardNumber: '4242424242424242',
            expiryDate: '12/25'
          }
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('Payment processed successfully!');
        setAmount('');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Payment failed');
    }
  };

  return (
    <div className="order-form">
      <h2>Test Payment</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Amount: </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            step="0.01"
            required
          />
        </div>
        <button type="submit">Process Payment</button>
      </form>
    </div>
  );
}

export default OrderForm; 