import React from 'react';
import { FaCheck, FaTimes } from 'react-icons/fa';
import '../pages/Profile.css';

/**
 * VerificationStatus-Komponente zur Anzeige des Verifizierungsstatus eines Benutzers
 * @param {boolean} isVerified - Der Verifizierungsstatus des Benutzers
 * @returns {JSX.Element} Eine React-Komponente, die den Verifizierungsstatus anzeigt
 */
const VerificationStatus = ({ isVerified }) => {
  // Wenn der Wert undefined ist, zeige nichts an
  if (isVerified === undefined) return null;

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