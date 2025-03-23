import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../styles/VerifyEmail.css';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import config from '../config';

const VerifyEmail = () => {
  const [verificationStatus, setVerificationStatus] = useState('verifying');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const searchParams = new URLSearchParams(location.search);
        const code = searchParams.get('code');

        if (!code) {
          setVerificationStatus('error');
          setError('Kein Verifizierungscode gefunden');
          return;
        }

        const response = await axios.get(`${config.API_URL}/verify-email?code=${code}`);
        console.log('Verifizierungsantwort:', response.data);

        if (response.data && response.data.message === "E-Mail erfolgreich verifiziert") {
          setVerificationStatus('success');
          toast.success('E-Mail erfolgreich verifiziert!');
          // Kurz warten und dann zum Login weiterleiten
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        } else {
          throw new Error('Unerwartete Serverantwort');
        }
      } catch (error) {
        console.error('Verifizierungsfehler:', error.response || error);
        setVerificationStatus('error');
        if (error.response?.data?.error) {
          setError(error.response.data.error);
        } else {
          setError('Ein Fehler ist bei der Verifizierung aufgetreten. Bitte versuchen Sie es erneut.');
        }
        toast.error('Fehler bei der Verifizierung');
      }
    };

    verifyEmail();
  }, [location, navigate]);

  return (
    <div className="verify-email-container">
      {verificationStatus === 'verifying' && (
        <div className="verifying-message">
          <div className="spinner"></div>
          <h2>Verifizierung läuft...</h2>
          <p>Bitte warten Sie einen Moment.</p>
        </div>
      )}

      {verificationStatus === 'success' && (
        <div className="success-message">
          <FaCheckCircle className="success-icon" />
          <h2>E-Mail erfolgreich verifiziert!</h2>
          <p>Sie werden automatisch zum Login weitergeleitet...</p>
        </div>
      )}

      {verificationStatus === 'error' && (
        <div className="error-message">
          <FaTimesCircle className="error-icon" />
          <h2>Verifizierung fehlgeschlagen</h2>
          <p>{error}</p>
          <div className="error-actions">
            <button 
              onClick={() => window.location.reload()} 
              className="btn-secondary"
            >
              Erneut versuchen
            </button>
            <button 
              onClick={() => navigate('/login')} 
              className="btn-primary"
            >
              Zum Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerifyEmail; 