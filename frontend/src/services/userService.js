import axios from 'axios';
import api from './api';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const updateUserProfile = async (profileData) => {
  try {
    const response = await api.put('/users/profile', profileData);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update profile');
    }
    return response.data.user;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updatePassword = async (passwordData) => {
  try {
    const response = await api.put('/users/password', passwordData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getUserProfile = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/users/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Get profile error:', error);
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Failed to fetch profile'
    );
  }
}; 