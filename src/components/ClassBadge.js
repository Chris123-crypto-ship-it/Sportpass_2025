import React from 'react';
import { FaGraduationCap } from 'react-icons/fa';
import '../pages/Profile.css';

/**
 * ClassBadge-Komponente zur Anzeige der Nutzerklasse mit verschiedenen Stilen basierend auf der Klasse
 * @param {string} className - Der Name der Klasse des Benutzers
 * @returns {JSX.Element} Eine React-Komponente, die die Klasse des Benutzers anzeigt
 */
const ClassBadge = ({ className }) => {
  // Debug-Ausgabe im Konsolenfenster
  console.log('ClassBadge wird gerendert mit className:', className);

  // Formatiere den Klassennamen für die Anzeige
  const formatClassName = (className) => {
    if (!className) return '';
    
    // Ersetze Unterstriche durch Leerzeichen und mache jeden Anfangsbuchstaben groß
    return className
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Bestimme die Beschreibung basierend auf der Klasse
  const getClassDescription = (className) => {
    if (!className) return '';
    
    if (className.includes('beginner')) {
      return 'Du bist auf dem Weg zu einem gesünderen Lebensstil. Weiter so!';
    } else if (className.includes('intermediate')) {
      return 'Du machst große Fortschritte. Halte dein Momentum!';
    } else if (className.includes('advanced')) {
      return 'Du zeigst beeindruckende Leistungen. Andere sehen zu dir auf!';
    } else if (className.includes('expert')) {
      return 'Du bist ein Vorbild für die Community. Deine Hingabe ist inspirierend!';
    } else {
      return 'Setze dir Ziele und arbeite kontinuierlich an deinem Fortschritt!';
    }
  };

  // Bestimme die CSS-Klasse basierend auf der Benutzerklasse
  const getClassStyle = (className) => {
    if (!className) return '';
    
    if (className.includes('beginner')) {
      return 'beginner-badge';
    } else if (className.includes('intermediate')) {
      return 'intermediate-badge';
    } else if (className.includes('advanced')) {
      return 'advanced-badge';
    } else if (className.includes('expert')) {
      return 'expert-badge';
    } else {
      return '';
    }
  };

  // Wenn keine Klasse vorhanden ist, zeige einen Platzhalter an
  if (!className) {
    console.log('Keine Klasse gefunden, zeige Fallback an');
    return (
      <div className="class-info">
        <div className="class-icon">
          <FaGraduationCap />
        </div>
        <div className="class-details">
          <div className="class-name">Keine Klasse</div>
          <div className="class-description">
            Setze dir Ziele und sammle Punkte, um eine Klasse freizuschalten!
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`class-info ${getClassStyle(className)}`}>
      <div className="class-icon">
        <FaGraduationCap />
      </div>
      <div className="class-details">
        <div className="class-name">{formatClassName(className)}</div>
        <div className="class-description">
          {getClassDescription(className)}
        </div>
      </div>
    </div>
  );
};

export default ClassBadge; 