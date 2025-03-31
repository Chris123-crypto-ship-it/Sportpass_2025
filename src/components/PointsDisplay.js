import React from 'react';
import { FaTrophy } from 'react-icons/fa';
import '../pages/Profile.css';

/**
 * PointsDisplay-Komponente zur Anzeige der Benutzerpunkte mit Fortschrittsanzeige zum nächsten Level
 * @param {number} points - Die Punktzahl des Benutzers
 * @returns {JSX.Element} Eine React-Komponente, die die Punkte des Benutzers anzeigt
 */
const PointsDisplay = ({ points }) => {
  // Debug-Ausgabe im Konsolenfenster
  console.log('PointsDisplay wird gerendert mit points:', points);

  // Berechne das Level basierend auf den Punkten
  const calculateLevel = (points) => {
    const basePoints = 1000; // Punkte für Level 1
    return Math.floor(points / basePoints) + 1;
  };

  // Berechne die Fortschrittsleiste für das nächste Level
  const calculateProgress = (points) => {
    const basePoints = 1000; // Punkte für Level 1
    const currentLevel = calculateLevel(points);
    const pointsForCurrentLevel = (currentLevel - 1) * basePoints;
    const pointsForNextLevel = currentLevel * basePoints;
    const progress = ((points - pointsForCurrentLevel) / (pointsForNextLevel - pointsForCurrentLevel)) * 100;
    return progress;
  };
  
  // Wenn keine Punkte vorhanden sind, zeige einen Fallback an
  if (points === undefined || points === null) {
    console.log('Keine Punkte gefunden, zeige Fallback an');
    const demoPoints = 0;
    
    return (
      <>
        <div className="points-section">
          <FaTrophy className="points-icon" />
          <div>
            <span className="points-value">{demoPoints}</span>
            <span className="points-label"> Punkte</span>
          </div>
        </div>
        
        <div className="progress-card">
          <h3 className="progress-title">Dein Fortschritt</h3>
          <div className="progress-bar-container">
            <div 
              className="progress-bar" 
              style={{ width: '0%' }}
            ></div>
          </div>
          <div className="progress-info">
            <span>Level 1</span>
            <span>{demoPoints} von 1000 Punkten</span>
            <span>Nächstes Level: 2</span>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="points-section">
        <FaTrophy className="points-icon" />
        <div>
          <span className="points-value">{points}</span>
          <span className="points-label"> Punkte</span>
        </div>
      </div>
      
      <div className="progress-card">
        <h3 className="progress-title">Dein Fortschritt</h3>
        <div className="progress-bar-container">
          <div 
            className="progress-bar" 
            style={{ width: `${calculateProgress(points)}%` }}
          ></div>
        </div>
        <div className="progress-info">
          <span>Level {calculateLevel(points)}</span>
          <span>{points} von {calculateLevel(points) * 1000} Punkten</span>
          <span>Nächstes Level: {calculateLevel(points) + 1}</span>
        </div>
      </div>
    </>
  );
};

export default PointsDisplay; 