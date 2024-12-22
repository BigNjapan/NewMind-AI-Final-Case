import api from './api';

export const login = async (email, password) => {
  try {
    console.log('Making login request:', { email });
    const response = await api.post('/auth/login', { email, password });
    console.log('Raw login response:', response);

    if (!response.data || !response.data.success) {
      console.error('Login failed:', response.data);
      throw new Error(response.data?.message || 'Login failed');
    }

    return response.data;
  } catch (error) {
    console.error('Login request error:', error);
    if (error.response?.data) {
      throw new Error(error.response.data.message || 'Login failed');
    }
    throw new Error(error.message || 'Failed to connect to the server');
  }
};

export const register = async (userData) => {
  try {
    console.log('Making registration request:', { email: userData.email });
    const response = await api.post('/auth/register', userData);
    console.log('Raw registration response:', response);

    if (!response.data || !response.data.success) {
      console.error('Registration failed:', response.data);
      throw new Error(response.data?.message || 'Registration failed');
    }

    return response.data;
  } catch (error) {
    console.error('Registration request error:', error);
    if (error.response?.data) {
      throw new Error(error.response.data.message || 'Registration failed');
    }
    throw new Error(error.message || 'Failed to connect to the server');
  }
};

export const verifyAuth = async (token) => {
  try {
    console.log('Making token verification request');
    const response = await api.get('/auth/verify', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('Raw verification response:', response);

    if (!response.data || !response.data.success) {
      console.error('Token verification failed:', response.data);
      throw new Error(response.data?.message || 'Token verification failed');
    }

    return response.data;
  } catch (error) {
    console.error('Token verification request error:', error);
    if (error.response?.data) {
      throw new Error(error.response.data.message || 'Token verification failed');
    }
    throw new Error(error.message || 'Failed to connect to the server');
  }
}; 