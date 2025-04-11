import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { FaRunning, FaHeartbeat, FaDumbbell, FaMedal, FaFire, FaStar, FaUpload, FaVideo, FaTrash, FaClock, FaInfoCircle, FaSpinner, FaGift } from 'react-icons/fa';
import { toast } from 'react-toastify';
import '../pages/Tasks.css'; // Korrigierter Pfad zur CSS-Datei
import { Link } from 'react-router-dom';

// Die TaskCard Komponente, jetzt ausgelagert
const TaskCard = ({ task, isChallengeView = false }) => { // Neuer Prop: isChallengeView
  const { user } = useAuth();
  const { submitTask, allUserSubmissions } = useTasks(); // Nur benötigte Funktionen/Daten holen

  const [selectedFile, setSelectedFile] = useState(null);
  const [dynamicValue, setDynamicValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { id, title, description, points, dynamic, dynamic_type, multiplier, category, difficulty, expiration_date, max_submissions, details_link, is_easter_egg, available_date } = task;

  // Heutiges Datum im Format YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];

  // Prüfen, ob es sich um ein heute verfügbares Osterei handelt
  const isAvailableEasterEgg = is_easter_egg && available_date === today;

  // Wenn es ein Osterei ist, aber nicht heute verfügbar, zeige nichts an.
  if (is_easter_egg && !isAvailableEasterEgg) {
    return null; // Gib nichts zurück, wenn das Osterei nicht heute ist
  }

  // Bestimme die anzuzeigenden Punkte
  const displayPoints = is_easter_egg ? 5 : (dynamic ? `Dynamisch (${multiplier} Pkt/${dynamic_type || 'Einheit'})` : `${points} Pkt`);

  // --- Logik zur Bestimmung des Task-Status & Einreichbarkeit --- START ---
  const isExpired = expiration_date && new Date(expiration_date) < new Date();
  const cardClass = `task-card ${isExpired ? 'expired' : ''} ${isChallengeView ? 'challenge-view' : ''}`;

  // Finde relevante Einreichungen des Users (approved oder pending)
  const userSubmissionsForThisTask = allUserSubmissions.filter(
    s => s.task_id === id && (s.status === 'approved' || s.status === 'pending')
  );
  const userSubmissionsCount = userSubmissionsForThisTask.length;

  // Prüfe, ob das Osterei heute verfügbar ist
  const isSubmittableEasterEgg = is_easter_egg && available_date === today;

  // Kombinierte Deaktivierungslogik
  const isDisabled = isSubmitting ||
                     (!is_easter_egg && isExpired) || // Normale abgelaufene Tasks
                     (!is_easter_egg && max_submissions && userSubmissionsCount >= max_submissions) || // Limit normaler Tasks
                     (is_easter_egg && !isSubmittableEasterEgg) || // Osterei nicht heute verfügbar
                     (is_easter_egg && userSubmissionsCount > 0); // Osterei bereits gesammelt
  // --- Logik zur Bestimmung des Task-Status & Einreichbarkeit --- ENDE ---

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Bitte melde dich an.');
      return;
    }
    // Spezifische Prüfungen basierend auf dem Task-Typ
    if (!is_easter_egg && isExpired) {
      toast.warn('Diese Aufgabe ist bereits abgelaufen.');
      return;
    }
    if (is_easter_egg && !isSubmittableEasterEgg) {
      toast.warn('Dieses Osterei ist heute nicht verfügbar.');
      return;
    }
    if (is_easter_egg && userSubmissionsCount > 0) {
      toast.warn('Du hast dieses Osterei bereits gesammelt.');
      return;
    }
    if (!is_easter_egg && max_submissions && userSubmissionsCount >= max_submissions) {
        toast.warn('Maximale Anzahl an Einreichungen erreicht.');
        return;
    }

    // Allgemeine Prüfungen
    if (!selectedFile) {
      toast.error('Bitte wähle eine Datei aus.');
      return;
    }
    if (!is_easter_egg && dynamic && (!dynamicValue || parseFloat(dynamicValue) <= 0)) {
      toast.error(`Bitte gib einen Wert für ${dynamic_type === 'minutes' ? 'Minuten' : 'Kilometer'} ein.`);
      return;
    }

    try {
      setIsSubmitting(true);
      // Details nur für normale dynamische Aufgaben sammeln
      const details = !is_easter_egg && dynamic
        ? {
            dynamic_value: dynamicValue,
            dynamic_type: dynamic_type,
          }
        : {};

      await submitTask(id, user.email, selectedFile, details);
      setSelectedFile(null);
      setDynamicValue('');
      toast.success(is_easter_egg ? 'Osterei erfolgreich gesammelt!' : 'Aufgabe erfolgreich eingereicht!');
      // Kein Neuladen von Submissions hier, das sollte der übergeordnete Kontext/Seite machen
    } catch (error) {
      console.error('Fehler beim Einreichen:', error);
      const errorMsg = error.response?.data?.message || (is_easter_egg ? 'Fehler beim Sammeln des Ostereis.' : 'Fehler beim Einreichen der Aufgabe.');
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatExpirationDate = (dateString) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return date.toLocaleString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Fehler beim Formatieren des Datums:', error);
      return null;
    }
  };

  const renderDifficultyStars = (difficulty) => {
    const level = parseInt(difficulty) || 0;
    return (
      <div className="difficulty-stars">
        {[1, 2, 3].map((star) => (
          <span
            key={star}
            className={`star ${star <= level ? 'active' : ''}`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className={cardClass}>
      {is_easter_egg && <span className="easter-egg-badge">🥚 Osterei!</span>}
      <div className="task-header">
        {is_easter_egg && <FaGift className="easter-egg-icon" />} {/* Icon nur für Eier */}
        <h3 className="task-title">{title}</h3>
        <div className="task-meta-info">
          <span className={`task-category ${is_easter_egg ? 'easter' : (category?.toLowerCase() || 'default')}`}> {/* Kategorie anpassen */} 
            {is_easter_egg ? 'Oster-Challenge' : category}
          </span>
          <div className="task-points">
            {displayPoints}
          </div>
        </div>
      </div>

      {/* Details nur für normale Aufgaben anzeigen */} 
      {!is_easter_egg && (
        <>
          <div className="task-details">
            <div className="task-description">
              {description}
            </div>

            {details_link && (
              <div className="task-details-link">
                <a
                  href={details_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="details-link-button"
                >
                  <FaInfoCircle style={{ marginRight: '5px' }} />
                  Weitere Details / Anleitung
                </a>
              </div>
            )}
          </div>

          <div className="meta-info">
            <div className="difficulty">
              <span>Schwierigkeit: </span>
              {renderDifficultyStars(difficulty)}
            </div>

            {expiration_date && (
              <div className={`expiration ${isExpired ? 'expired-text' : ''}`}>
                <span>
                  {new Date(expiration_date) < new Date()
                    ? 'Abgelaufen am: '
                    : 'Läuft ab am: '
                  }
                  {formatExpirationDate(expiration_date)}
                </span>
              </div>
            )}
          </div>
        </>
      )}

      <div className="task-submission">
        {/* Dynamisches Feld nur für normale dynamische Aufgaben */} 
        {!is_easter_egg && dynamic && (
          <div className="dynamic-input-wrapper">
            <label>
              {dynamic_type === 'minutes' ? 'Minuten' : 'Kilometer'}:
              <input
                type="number"
                min="0"
                step={dynamic_type === 'minutes' ? '1' : '0.1'}
                value={dynamicValue}
                onChange={(e) => setDynamicValue(e.target.value)}
                className="dynamic-input"
                disabled={isDisabled}
              />
            </label>
            {dynamicValue > 0 && multiplier && (
              <div className="calculated-points">
                = {Math.round(parseFloat(dynamicValue) * multiplier)} Punkte
              </div>
            )}
          </div>
        )}

        {/* Einreichungslimit nur für normale Aufgaben anzeigen */} 
        {!is_easter_egg && max_submissions && (
          <div className="submission-count-info">
            <span className={userSubmissionsCount >= max_submissions ? 'submissions-limit-reached' : ''}>
              Einreichungen: {userSubmissionsCount} / {max_submissions}
            </span>
          </div>
        )}

        <div className="file-upload-section">
          <label className="file-upload-label">
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file && (file.type.startsWith('image/') || file.type.startsWith('video/'))) {
                  setSelectedFile(file);
                } else {
                  toast.warn('Bitte nur Bilder oder Videos hochladen');
                  e.target.value = null;
                  setSelectedFile(null);
                }
              }}
              style={{ display: 'none' }}
              disabled={isDisabled} // Kombinierte Deaktivierung
            />
            {!selectedFile ? (
              <div className={`upload-placeholder ${isDisabled ? 'disabled' : ''}`}> {/* Deaktiviert, wenn nötig */}
                <FaUpload />
                <span>Nachweis hochladen (Bild/Video)</span>
              </div>
            ) : (
              <div className="file-preview">
                {selectedFile.type.startsWith('image/') ? (
                  <img src={URL.createObjectURL(selectedFile)} alt="Vorschau" />
                ) : (
                  <div className="video-preview">
                    <FaVideo />
                    <span>{selectedFile.name}</span>
                  </div>
                )}
                <button
                  type="button"
                  className="remove-file"
                  onClick={() => setSelectedFile(null)}
                  disabled={isSubmitting} // Nur während des Submit-Vorgangs deaktivieren
                >
                  <FaTrash />
                </button>
              </div>
            )}
          </label>
        </div>

        <button
          className="submit-button"
          onClick={handleSubmit}
          disabled={!selectedFile || isDisabled} // Kombinierte Deaktivierung
        >
          {isSubmitting ? <FaSpinner className="spin" /> :
            (is_easter_egg ?
                (isSubmittableEasterEgg ? (userSubmissionsCount > 0 ? 'Bereits gesammelt' : 'Osterei sammeln') : 'Nicht verfügbar') :
                (isExpired ? 'Abgelaufen' : (max_submissions && userSubmissionsCount >= max_submissions ? 'Limit erreicht' : 'Aufgabe einreichen'))
            )
          }
        </button>
      </div>
    </div>
  );
};

export default TaskCard; 