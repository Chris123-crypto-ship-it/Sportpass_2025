import React from 'react';
import { FaCheck, FaTimes, FaQuestionCircle } from 'react-icons/fa';
import '../pages/Profile.css';

/**
 * VerificationStatus-Komponente zur Anzeige des Verifizierungsstatus eines Benutzers
 * @param {boolean} isVerified - Der Verifizierungsstatus des Benutzers
 * @returns {JSX.Element} Eine React-Komponente, die den Verifizierungsstatus anzeigt
 */
const VerificationStatus = ({ isVerified }) => {
  // Debug-Ausgabe im Konsolenfenster
  console.log('VerificationStatus wird gerendert mit isVerified:', isVerified);

  // Wenn der Wert undefined ist, zeige einen Fallback an
  if (isVerified === undefined) {
    console.log('Kein Verifizierungsstatus gefunden, zeige Fallback an');
    return (
      <div className="verification-status">
        <FaQuestionCircle />
        <span>Verifizierung ausstehend</span>
      </div>
    );
  }

  return (
    <div className={`verification-status ${isVerified ? 'verified' : 'unverified'}`}>
      {isVerified ? (
        <>
          <FaCheck />
          <span>Verifiziert</span>
        </>
      ) : (
        <>
          <FaTimes />
          <span>Nicht verifiziert</span>
        </>
      )}
    </div>
  );
};

export default VerificationStatus; 