import React, { createContext, useState, useContext, useEffect } from 'react';
import config from '../config';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Versuche, gespeicherte Anmeldeinformationen zu laden
    const checkAuth = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }

        // Token validieren
        const response = await fetch(`${config.API_URL}/auth/validate`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const userData = await response.json();
          console.log('User data loaded:', userData);

          // Füge Demo-Daten für die neuen Attribute hinzu, falls sie nicht vorhanden sind
          const enhancedUserData = {
            ...userData,
            points: userData.points !== undefined ? userData.points : 2350,
            class: userData.class || 'intermediate_athlete',
            is_verified: userData.is_verified !== undefined ? userData.is_verified : true,
            weight: userData.weight || 75,
            height: userData.height || 180
          };

          console.log('Enhanced user data:', enhancedUserData);
          setUser(enhancedUserData);
        } else {
          // Token ist ungültig, lösche ihn
          localStorage.removeItem('token');
          setUser(null);
        }
      } catch (err) {
        console.error('Auth check error:', err);
        
        // Für Testzwecke: Falls der Server nicht erreichbar ist, verwende Demo-Daten
        const isLocalDevelopment = window.location.hostname === 'localhost';
        if (isLocalDevelopment) {
          console.log('Using demo data for local development');
          const token = localStorage.getItem('token');
          if (token) {
            // Parse JWT payload (2. Teil nach dem Punkt)
            try {
              const payload = token.split('.')[1];
              const decodedData = JSON.parse(atob(payload));
              
              const demoUser = {
                id: decodedData.userId || '12345',
                email: decodedData.email || 'demo@sportpass.com',
                name: decodedData.name || 'Demo User',
                role: decodedData.role || 'user',
                // Demo-Daten für die neuen Attribute
                points: 2350,
                class: 'intermediate_athlete',
                is_verified: true,
                weight: 75,
                height: 180,
                token: token
              };
              
              console.log('Using demo user:', demoUser);
              setUser(demoUser);
            } catch (e) {
              console.error('Error parsing JWT:', e);
              setUser(null);
            }
          }
        } else {
          setError('Verbindung zum Server fehlgeschlagen');
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${config.API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Anmeldung fehlgeschlagen');
      }

      localStorage.setItem('token', data.token);

      // Füge Demo-Daten für die neuen Attribute hinzu
      const enhancedUserData = {
        ...data.user,
        points: data.user.points !== undefined ? data.user.points : 2350,
        class: data.user.class || 'intermediate_athlete',
        is_verified: data.user.is_verified !== undefined ? data.user.is_verified : true,
        weight: data.user.weight || 75,
        height: data.user.height || 180,
        token: data.token
      };

      setUser(enhancedUserData);
      return true;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Anmeldung fehlgeschlagen');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${config.API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registrierung fehlgeschlagen');
      }

      return true;
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registrierung fehlgeschlagen');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;