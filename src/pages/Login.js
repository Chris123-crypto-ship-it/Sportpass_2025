// src/pages/Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../styles/Login.css';
import { FaEnvelope, FaLock, FaInfoCircle } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import config from '../config';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResendVerification, setShowResendVerification] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleResendVerification = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${config.API_URL}/resend-verification`, {
        email: formData.email
      });

      if (response.data.message) {
        toast.success('Verifizierungs-E-Mail wurde erneut gesendet.');
      }
    } catch (error) {
      console.error('Fehler beim erneuten Senden:', error);
      toast.error('Fehler beim Senden der Verifizierungs-E-Mail.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setShowResendVerification(false);

    try {
      const result = await login(formData.email, formData.password);

      if (result.success) {
        toast.success('Erfolgreich eingeloggt!');

        // Weiterleitung basierend auf der Benutzerrolle
        if (result.user.role === 'admin') {
          window.location.href = '/admin-dashboard';
        } else {
          window.location.href = '/dashboard';
        }
      }
    } catch (error) {
      console.error('Login-Fehler:', error);
      
      if (error.response) {
        // Prüfen, ob es sich um einen Verifizierungsfehler handelt
        if (error.response.status === 403 && error.response.data.error === 'E-Mail-Adresse nicht verifiziert') {
          setError('Bitte verifiziere zuerst deine E-Mail-Adresse.');
          setShowResendVerification(true);
        } else {
          setError(error.response.data.error || 'Fehler beim Login');
        }
      } else if (error.request) {
        setError('Der Server antwortet nicht. Bitte versuche es später erneut.');
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>Anmelden</h2>

      <div className="info-box-login">
        <FaInfoCircle style={{ marginRight: '10px', marginTop: '3px', flexShrink: 0 }} />
        <div>
          <strong>Liebe Sportpass Teilnehmer!</strong>
          <p>Der Sprtpass hat nun sein Ende gefunden. Wir danken für die zahlreiche Teilnahme! Am Freitag dem 11.06.2025 findet eine kleine Siegerehrung statt - die Top 10 können Preise erwarten!/p>
          <p>Bei Fragen oder Problemen sind wir jederzeit unter unserem Support (ganz unten zu finden) für euch da!</p>
          <p>Viel Spaß,<br/>Euer Sportpass Team</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <label htmlFor="email">E-Mail</label>
          <div className="input-with-icon">
            <FaEnvelope className="input-icon" />
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="deine@email.de"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="password">Passwort</label>
          <div className="input-with-icon">
            <FaLock className="input-icon" />
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Dein Passwort"
              required
            />
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
            {showResendVerification && (
              <button
                type="button"
                onClick={handleResendVerification}
                className="btn-link"
                disabled={loading}
              >
                Verifizierungs-E-Mail erneut senden
              </button>
            )}
          </div>
        )}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Anmeldung läuft...' : 'Anmelden'}
        </button>
        
        <div className="forgot-password-link">
          <span onClick={() => navigate('/forgot-password')}>Passwort vergessen?</span>
        </div>
      </form>

      <div className="register-link">
        Noch kein Konto? <a href="/register">Hier registrieren</a>
      </div>
    </div>
  );
};

export default Login;
