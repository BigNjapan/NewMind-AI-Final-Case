import api from './api';

const processPayment = async (paymentData) => {
  try {
    console.log('Processing payment with data:', {
      amount: paymentData.amount,
      items: paymentData.items.length,
      cardLast4: paymentData.paymentDetails.cardNumber.slice(-4)
    });

    // Use the monolith API proxy
    const token = localStorage.getItem('token');
    const response = await api.post('/payments', paymentData, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Payment Response:', response.data);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Payment failed');
    }
    
    return response.data;
  } catch (error) {
    console.error('Payment Error:', error.response?.data || error.message || error);
    
    if (error.response?.status === 403 || error.response?.status === 401) {
      throw { 
        success: false,
        message: 'Authentication failed. Please log in again.'
      };
    }
    
    throw { 
      success: false,
      message: error.response?.data?.message || 'Payment processing failed. Please try again.'
    };
  }
};

export { processPayment }; 