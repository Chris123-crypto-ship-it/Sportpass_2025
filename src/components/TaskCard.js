import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { FaRunning, FaHeartbeat, FaDumbbell, FaMedal, FaFire, FaStar, FaUpload, FaVideo, FaTrash, FaClock, FaInfoCircle, FaSpinner, FaGift } from 'react-icons/fa';
import { toast } from 'react-toastify';
import '../styles/Tasks.css'; // Wir verwenden vorerst die gleichen Basis-Stile

// Die TaskCard Komponente, jetzt ausgelagert
const TaskCard = ({ task, isChallengeView = false }) => { // Neuer Prop: isChallengeView
  const { user } = useAuth();
  const { submitTask, allUserSubmissions } = useTasks(); // Nur benötigte Funktionen/Daten holen

  const [selectedFile, setSelectedFile] = useState(null);
  const [dynamicValue, setDynamicValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Logik zur Bestimmung des Task-Status & Einreichbarkeit --- START ---
  const isEasterEgg = task.is_easter_egg === true;
  const isExpired = !isEasterEgg && task.expiration_date && new Date(task.expiration_date) < new Date();

  // Finde relevante Einreichungen des Users (approved oder pending)
  const userSubmissionsForThisTask = allUserSubmissions.filter(
    s => s.task_id === task.id && (s.status === 'approved' || s.status === 'pending')
  );
  const userSubmissionsCount = userSubmissionsForThisTask.length;

  // Prüfe, ob das Osterei heute verfügbar ist
  const isSubmittableEasterEgg = isEasterEgg && task.available_date === new Date().toISOString().split('T')[0];

  // Kombinierte Deaktivierungslogik
  const isDisabled = isSubmitting ||
                     (!isEasterEgg && isExpired) || // Normale abgelaufene Tasks
                     (!isEasterEgg && task.max_submissions && userSubmissionsCount >= task.max_submissions) || // Limit normaler Tasks
                     (isEasterEgg && !isSubmittableEasterEgg) || // Osterei nicht heute verfügbar
                     (isEasterEgg && userSubmissionsCount > 0); // Osterei bereits gesammelt
  // --- Logik zur Bestimmung des Task-Status & Einreichbarkeit --- ENDE ---

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Bitte melde dich an.');
      return;
    }
    // Spezifische Prüfungen basierend auf dem Task-Typ
    if (!isEasterEgg && isExpired) {
      toast.warn('Diese Aufgabe ist bereits abgelaufen.');
      return;
    }
    if (isEasterEgg && !isSubmittableEasterEgg) {
      toast.warn('Dieses Osterei ist heute nicht verfügbar.');
      return;
    }
    if (isEasterEgg && userSubmissionsCount > 0) {
      toast.warn('Du hast dieses Osterei bereits gesammelt.');
      return;
    }
    if (!isEasterEgg && task.max_submissions && userSubmissionsCount >= task.max_submissions) {
        toast.warn('Maximale Anzahl an Einreichungen erreicht.');
        return;
    }

    // Allgemeine Prüfungen
    if (!selectedFile) {
      toast.error('Bitte wähle eine Datei aus.');
      return;
    }
    if (!isEasterEgg && task.dynamic && (!dynamicValue || parseFloat(dynamicValue) <= 0)) {
      toast.error(`Bitte gib einen Wert für ${task.dynamic_type === 'minutes' ? 'Minuten' : 'Kilometer'} ein.`);
      return;
    }

    try {
      setIsSubmitting(true);
      // Details nur für normale dynamische Aufgaben sammeln
      const details = !isEasterEgg && task.dynamic
        ? {
            dynamic_value: dynamicValue,
            dynamic_type: task.dynamic_type,
          }
        : {};

      await submitTask(task.id, user.email, selectedFile, details);
      setSelectedFile(null);
      setDynamicValue('');
      toast.success(isEasterEgg ? 'Osterei erfolgreich gesammelt!' : 'Aufgabe erfolgreich eingereicht!');
      // Kein Neuladen von Submissions hier, das sollte der übergeordnete Kontext/Seite machen
    } catch (error) {
      console.error('Fehler beim Einreichen:', error);
      const errorMsg = error.response?.data?.message || (isEasterEgg ? 'Fehler beim Sammeln des Ostereis.' : 'Fehler beim Einreichen der Aufgabe.');
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
    <div className={`task-card ${!isEasterEgg && isExpired ? 'expired' : ''} ${isChallengeView ? 'challenge-view' : ''}`}>
      <div className="task-header">
        {isEasterEgg && <FaGift className="easter-egg-icon" />} {/* Icon nur für Eier */}
        <h3 className="task-title">{task.title}</h3>
        <div className="task-meta-info">
          <span className={`task-category ${isEasterEgg ? 'easter' : (task.category?.toLowerCase() || 'default')}`}> {/* Kategorie anpassen */} 
            {isEasterEgg ? 'Oster-Challenge' : task.category}
          </span>
          <div className="task-points">
            {isEasterEgg ? (
              <span>{task.points || 5} Punkte</span> // Feste Punkte für Eier
            ) : task.dynamic ? (
              <span>{task.multiplier} Punkte pro {task.dynamic_type === 'minutes' ? 'Minute' : 'Kilometer'}</span>
            ) : (
              <span>{task.points} Punkte</span>
            )}
          </div>
        </div>
      </div>

      {/* Details nur für normale Aufgaben anzeigen */} 
      {!isEasterEgg && (
        <>
          <div className="task-details">
            <div className="task-description">
              {task.description}
            </div>

            {task.details_link && (
              <div className="task-details-link">
                <a
                  href={task.details_link}
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
              {renderDifficultyStars(task.difficulty)}
            </div>

            {task.expiration_date && (
              <div className={`expiration ${isExpired ? 'expired-text' : ''}`}>
                <span>
                  {new Date(task.expiration_date) < new Date()
                    ? 'Abgelaufen am: '
                    : 'Läuft ab am: '
                  }
                  {formatExpirationDate(task.expiration_date)}
                </span>
              </div>
            )}
          </div>
        </>
      )}

      <div className="task-submission">
        {/* Dynamisches Feld nur für normale dynamische Aufgaben */} 
        {!isEasterEgg && task.dynamic && (
          <div className="dynamic-input-wrapper">
            <label>
              {task.dynamic_type === 'minutes' ? 'Minuten' : 'Kilometer'}:
              <input
                type="number"
                min="0"
                step={task.dynamic_type === 'minutes' ? '1' : '0.1'}
                value={dynamicValue}
                onChange={(e) => setDynamicValue(e.target.value)}
                className="dynamic-input"
                disabled={isDisabled}
              />
            </label>
            {dynamicValue > 0 && task.multiplier && (
              <div className="calculated-points">
                = {Math.round(parseFloat(dynamicValue) * task.multiplier)} Punkte
              </div>
            )}
          </div>
        )}

        {/* Einreichungslimit nur für normale Aufgaben anzeigen */} 
        {!isEasterEgg && task.max_submissions && (
          <div className="submission-count-info">
            <span className={userSubmissionsCount >= task.max_submissions ? 'submissions-limit-reached' : ''}>
              Einreichungen: {userSubmissionsCount} / {task.max_submissions}
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
            (isEasterEgg ?
                (isSubmittableEasterEgg ? (userSubmissionsCount > 0 ? 'Bereits gesammelt' : 'Osterei sammeln') : 'Nicht verfügbar') :
                (isExpired ? 'Abgelaufen' : (task.max_submissions && userSubmissionsCount >= task.max_submissions ? 'Limit erreicht' : 'Aufgabe einreichen'))
            )
          }
        </button>
      </div>
    </div>
  );
};

export default TaskCard; 