import React, { createContext, useState, useContext, useEffect } from 'react';
import { login as loginService, register as registerService, verifyAuth } from '../services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const validateToken = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const response = await verifyAuth(storedToken);
          if (response.success && response.user) {
            setUser(response.user);
            setIsAuthenticated(true);
          } else {
            throw new Error('Invalid token response');
          }
        } catch (err) {
          console.error('Token validation failed:', err);
          localStorage.removeItem('token');
          setUser(null);
          setToken(null);
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };

    validateToken();
  }, []);

  const login = async (email, password) => {
    try {
      console.log('Attempting login...', { email });
      const response = await loginService(email, password);
      console.log('Login response:', response);

      if (!response.success || !response.token) {
        throw new Error(response.message || 'Login failed');
      }

      localStorage.setItem('token', response.token);
      setToken(response.token);
      setUser(response.user);
      setIsAuthenticated(true);

      console.log('Login successful:', { user: response.user });
      return true;
    } catch (error) {
      console.error('Login error in context:', error);
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (updatedUser) => {
    console.log('Updating user in context:', updatedUser);
    setUser(prevUser => {
      const newUser = {
        ...prevUser,
        ...updatedUser
      };
      console.log('Updated user state:', newUser);
      return newUser;
    });
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token,
      isAuthenticated, 
      loading,
      login, 
      logout,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 