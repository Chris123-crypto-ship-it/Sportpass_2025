import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { FaEnvelope } from 'react-icons/fa';
import config from '../config';
import '../styles/ForgotPassword.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email) {
      setError('Bitte gib deine E-Mail-Adresse ein');
      setLoading(false);
      return;
    }

    // Einfache E-Mail-Validierung
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Bitte gib eine gültige E-Mail-Adresse ein');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${config.API_URL}/forgot-password`, { email });
      
      if (response.data.success || response.status === 200) {
        setEmailSent(true);
        toast.success('E-Mail zum Zurücksetzen des Passworts wurde gesendet.');
      }
    } catch (error) {
      console.error('Fehler beim Zurücksetzen des Passworts:', error);
      
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError('Es ist ein Fehler aufgetreten. Bitte versuche es später erneut.');
      }
      
      toast.error('Fehler beim Zurücksetzen des Passworts');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="forgot-password-container">
        <div className="success-message">
          <h2>E-Mail gesendet!</h2>
          <p>
            Wir haben eine E-Mail mit Anweisungen zum Zurücksetzen deines Passworts an 
            <strong> {email}</strong> gesendet.
          </p>
          <p>
            Bitte überprüfe deine E-Mails und folge den Anweisungen, um dein Passwort zurückzusetzen.
          </p>
          <button onClick={() => navigate('/login')} className="primary-button">
            Zurück zum Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="forgot-password-container">
      <h2>Passwort zurücksetzen</h2>
      <p className="instructions">
        Gib deine E-Mail-Adresse ein, und wir senden dir einen Link zum Zurücksetzen deines Passworts.
      </p>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>E-Mail-Adresse</label>
          <div className="input-with-icon">
            <FaEnvelope className="input-icon" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="deine@email.de"
              required
            />
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <button type="submit" disabled={loading}>
          {loading ? 'Sende...' : 'Link senden'}
        </button>

        <p className="login-link">
          <span onClick={() => navigate('/login')}>Zurück zum Login</span>
        </p>
      </form>
    </div>
  );
};

export default ForgotPassword; 