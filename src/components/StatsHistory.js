import React from 'react';
import { FaWeightHanging, FaRulerVertical } from 'react-icons/fa';
import '../pages/Profile.css';

/**
 * StatsHistory-Komponente zur Anzeige der Körperdaten eines Benutzers
 * @param {Object} user - Das Benutzerobjekt mit weight und height Eigenschaften
 * @returns {JSX.Element} Eine React-Komponente, die die Körperdaten des Benutzers anzeigt
 */
const StatsHistory = ({ user }) => {
  // Wenn der Benutzer keine Gewichts- oder Größendaten hat, zeige nichts an
  if (!user || (!user.weight && !user.height)) return null;

  return (
    <div className="stat-history">
      <h3 className="history-title">Deine Körperdaten</h3>
      <div className="history-stats">
        {user.weight && (
          <div className="stat-item">
            <FaWeightHanging />
            <span>Gewicht: {user.weight} kg</span>
          </div>
        )}
        {user.height && (
          <div className="stat-item">
            <FaRulerVertical />
            <span>Größe: {user.height} cm</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsHistory; 