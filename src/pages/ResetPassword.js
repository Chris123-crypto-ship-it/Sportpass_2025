import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { FaLock } from 'react-icons/fa';
import config from '../config';
import '../styles/ResetPassword.css';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  const [error, setError] = useState('');
  const [resetToken, setResetToken] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setError('Kein gültiger Zurücksetzungs-Token gefunden');
      return;
    }
    setResetToken(token);
  }, [searchParams]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validierungen
    if (formData.password.length < 6) {
      setError('Das Passwort muss mindestens 6 Zeichen lang sein');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${config.API_URL}/reset-password`, {
        token: resetToken,
        password: formData.password
      });
      
      if (response.data.success || response.status === 200) {
        setResetComplete(true);
        toast.success('Dein Passwort wurde erfolgreich zurückgesetzt.');
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

  if (resetComplete) {
    return (
      <div className="reset-password-container">
        <div className="success-message">
          <h2>Passwort zurückgesetzt!</h2>
          <p>Dein Passwort wurde erfolgreich zurückgesetzt.</p>
          <button onClick={() => navigate('/login')} className="primary-button">
            Zum Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-container">
      <h2>Neues Passwort erstellen</h2>
      
      {error && error === 'Kein gültiger Zurücksetzungs-Token gefunden' ? (
        <div className="error-message token-error">
          <p>{error}</p>
          <p>Bitte stelle sicher, dass du den richtigen Link verwendest oder fordere einen neuen Link an.</p>
          <button onClick={() => navigate('/forgot-password')} className="primary-button">
            Neuen Link anfordern
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Neues Passwort</label>
            <div className="input-with-icon">
              <FaLock className="input-icon" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Neues Passwort"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Passwort bestätigen</label>
            <div className="input-with-icon">
              <FaLock className="input-icon" />
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Passwort wiederholen"
                required
              />
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? 'Passwort wird zurückgesetzt...' : 'Passwort zurücksetzen'}
          </button>
        </form>
      )}
    </div>
  );
};

export default ResetPassword; 