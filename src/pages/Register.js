import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import '../styles/Register.css';
import { FaEnvelope, FaLock } from 'react-icons/fa';
import config from '../config';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    class: '',
  });
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validierungen
    if (formData.password !== formData.confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      setLoading(false);
      return;
    }

    if (!formData.name || !formData.email || !formData.password) {
      setError('Bitte fülle alle Pflichtfelder aus');
      setLoading(false);
      return;
    }

    // Einfache E-Mail-Validierung
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Bitte gib eine gültige E-Mail-Adresse ein');
      setLoading(false);
      return;
    }

    try {
      // Registrierungsdaten senden
      console.log('Sende Registrierungsdaten:', {
        name: formData.name,
        email: formData.email,
        class: formData.class
      });

      const response = await axios.post(`${config.API_URL}/register`, {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        class: formData.class
      });

      console.log('Registrierungsantwort:', response.data);

      // Bei erfolgreicher Registrierung
      if (response.data.success || response.status === 201) {
        setRegistrationComplete(true);
        toast.info('Bitte überprüfe deine E-Mails und verifiziere deine E-Mail-Adresse.');
      }
    } catch (error) {
      console.error('Registrierungsfehler:', error);
      
      if (error.response) {
        console.error('Serverantwort:', error.response.data);
        setError(error.response.data.error || 'Fehler bei der Registrierung');
      } else if (error.request) {
        console.error('Keine Antwort vom Server:', error.request);
        setError('Der Server antwortet nicht. Bitte versuche es später erneut.');
      } else {
        console.error('Fehler beim Senden der Anfrage:', error.message);
        setError('Fehler beim Senden der Anfrage: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
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

  if (registrationComplete) {
    return (
      <div className="verification-message">
        <h2>Registrierung erfolgreich!</h2>
        <p>
          Wir haben eine Bestätigungs-E-Mail an <strong>{formData.email}</strong> gesendet.
        </p>
        <p>
          Bitte überprüfe deine E-Mails und klicke auf den Verifizierungslink.
          Falls du keine E-Mail erhalten hast, kannst du sie erneut anfordern.
        </p>
        <button onClick={handleResendVerification} disabled={loading}>
          {loading ? 'Sende...' : 'Verifizierungs-E-Mail erneut senden'}
        </button>
        <button onClick={() => navigate('/login')} className="secondary-button">
          Zum Login
        </button>
      </div>
    );
  }

  return (
    <div className="register-container">
      {!registrationComplete ? (
        <>
          <h2>Registrierung</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Dein Name"
                required
              />
            </div>

            <div className="form-group">
              <label>E-Mail *</label>
              <div className="input-with-icon">
                <FaEnvelope className="input-icon" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="deine@email.de"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Klasse</label>
              <input
                type="text"
                name="class"
                value={formData.class}
                onChange={handleChange}
                placeholder="10a"
              />
            </div>

            <div className="form-group">
              <label>Passwort *</label>
              <div className="input-with-icon">
                <FaLock className="input-icon" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Passwort"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Passwort bestätigen *</label>
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
              {loading ? 'Registriere...' : 'Registrieren'}
            </button>

            <p className="login-link">
              Bereits registriert? <span onClick={() => navigate('/login')}>Zum Login</span>
            </p>
          </form>
        </>
      ) : (
        <div className="verification-message">
          <h2>Registrierung erfolgreich!</h2>
          <p>
            Wir haben eine Bestätigungs-E-Mail an <strong>{formData.email}</strong> gesendet.
          </p>
          <p>
            Bitte überprüfe deine E-Mails und klicke auf den Verifizierungslink.
            Falls du keine E-Mail erhalten hast, kannst du sie erneut anfordern.
          </p>
          <button onClick={handleResendVerification} disabled={loading}>
            {loading ? 'Sende...' : 'Verifizierungs-E-Mail erneut senden'}
          </button>
          <button onClick={() => navigate('/login')} className="secondary-button">
            Zum Login
          </button>
        </div>
      )}
    </div>
  );
};

export default Register;
