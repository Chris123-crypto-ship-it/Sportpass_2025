import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import config from '../config';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const code = searchParams.get('code');
      
      if (!code) {
        setStatus('error');
        setError('Kein Verifizierungscode gefunden');
        return;
      }

      try {
        console.log('Sende Verifizierungsanfrage an:', `${config.API_URL}/verify-email?code=${code}`);
        const response = await fetch(`${config.API_URL}/verify-email?code=${code}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        console.log('Server Antwort Status:', response.status);
        const data = await response.json();
        console.log('Server Antwort Daten:', data);

        if (response.ok) {
          setStatus('success');
          // Nach 3 Sekunden zur Login-Seite weiterleiten
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        } else {
          setStatus('error');
          setError(data.error || 'Verifizierung fehlgeschlagen');
        }
      } catch (error) {
        console.error('Verifizierungsfehler:', error);
        setStatus('error');
        setError('Ein Fehler ist aufgetreten. Bitte versuche es später erneut.');
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="verify-email-container">
      {status === 'verifying' && (
        <div className="verifying">
          <h2>E-Mail wird verifiziert...</h2>
          <div className="loading-spinner"></div>
        </div>
      )}

      {status === 'success' && (
        <div className="success">
          <h2>E-Mail erfolgreich verifiziert!</h2>
          <p>Du wirst in wenigen Sekunden zur Login-Seite weitergeleitet.</p>
        </div>
      )}

      {status === 'error' && (
        <div className="error">
          <h2>Verifizierung fehlgeschlagen</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/login')}>
            Zurück zur Login-Seite
          </button>
        </div>
      )}
    </div>
  );
};

export default VerifyEmail; 