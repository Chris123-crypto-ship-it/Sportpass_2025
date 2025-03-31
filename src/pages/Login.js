// src/pages/Login.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../styles/Login.css';
import { FaSignInAlt, FaEnvelope, FaLock } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import config from '../config';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Fehler beim Einloggen. Bitte überprüfen Sie Ihre Eingaben.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Anmeldung läuft...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Anmelden</h1>
      </div>

      <div className="form-container card">
        {error && (
          <div className="info-box" style={{ background: 'rgba(220, 53, 69, 0.1)', borderColor: 'rgba(220, 53, 69, 0.2)' }}>
            <div className="info-text" style={{ color: '#dc3545' }}>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              <FaEnvelope /> E-Mail
            </label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="ihre@email.de"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <FaLock /> Passwort
            </label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="button button-primary" style={{ width: '100%', marginBottom: '1rem' }}>
            <FaSignInAlt /> Anmelden
          </button>

          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <Link to="/forgot-password" style={{ color: '#2193b0', textDecoration: 'none' }}>
              Passwort vergessen?
            </Link>
          </div>

          <div style={{ textAlign: 'center', marginTop: '1rem', color: '#64748b' }}>
            Noch kein Konto?{' '}
            <Link to="/register" style={{ color: '#2193b0', textDecoration: 'none', fontWeight: '600' }}>
              Jetzt registrieren
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
