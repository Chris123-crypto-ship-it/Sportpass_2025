import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import config from '../config';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Beim Start der App prüfen wir den Token
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      // Token zu allen axios Requests hinzufügen
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(`${config.API_URL}/login`, {
        email,
        password
      });

      const { token, user: userData } = response.data;

      // Token und User-Daten speichern
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));

      // Token zu allen zukünftigen axios Requests hinzufügen
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.error || 'Ein Fehler ist aufgetreten');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  // Neue Funktion zum Aktualisieren der Benutzerdaten
  const updateUserData = (newData) => {
    if (user) {
      const updatedUser = { ...user, ...newData };
      setUser(updatedUser);
      
      // Aktualisiere den Benutzer auch im localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      return updatedUser;
    }
    return null;
  };

  const sendConfirmationEmail = (email, code) => {
    // Logik zum Senden der E-Mail
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    updateUserData, // Neue Funktion zum Provider hinzufügen
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};