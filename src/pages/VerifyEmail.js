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
        const response = await fetch(`${config.API_URL}/api/verify-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          // Nach 3 Sekunden zur Login-Seite weiterleiten
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        } else {
          setStatus('error');
          setError(data.message || 'Verifizierung fehlgeschlagen');
        }
      } catch (error) {
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