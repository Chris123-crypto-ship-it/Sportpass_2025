import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { FaUpload, FaVideo, FaTrash } from 'react-icons/fa';

const TaskCard = ({ task }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [dynamicValue, setDynamicValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { submitTask } = useTasks();
  const isExpired = task.expiration_date && new Date(task.expiration_date) < new Date();

  const handleSubmit = async () => {
    if (!user) {
      alert('Bitte melde dich an, um eine Aufgabe einzureichen.');
      return;
    }

    if (isExpired) {
      alert('Diese Aufgabe ist bereits abgelaufen.');
      return;
    }

    if (!selectedFile) {
      alert('Bitte wähle eine Datei aus.');
      return;
    }

    if (task.dynamic && (!dynamicValue || parseFloat(dynamicValue) <= 0)) {
      alert(`Bitte gib einen Wert für ${task.dynamic_type === 'minutes' ? 'Minuten' : 'Kilometer'} ein.`);
      return;
    }

    try {
      setIsSubmitting(true);

      const details = task.dynamic 
        ? {
            dynamic_value: dynamicValue,
            dynamic_type: task.dynamic_type,
            calculated_points: Math.round(parseFloat(dynamicValue) * task.multiplier)
          }
        : {};

      await submitTask(task.id, user.email, selectedFile, details);

      setSelectedFile(null);
      setDynamicValue('');
      alert('Aufgabe erfolgreich eingereicht!');
    } catch (error) {
      console.error('Fehler beim Einreichen:', error);
      alert('Fehler beim Einreichen der Aufgabe. Bitte versuche es erneut.');
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
    <div className="task-card">
      <div className="task-header">
        <h3 className="task-title">{task.title}</h3>
        <div className="task-meta-info">
          <span className={`task-category ${task.category ? task.category.toLowerCase() : 'other'}`}>
            {task.category || 'Sonstige'}
          </span>
          <div className="task-points">
            {task.dynamic ? (
              <span>{task.multiplier} Punkte pro {task.dynamic_type === 'minutes' ? 'Minute' : 'Kilometer'}</span>
            ) : (
              <span>{task.points} Punkte</span>
            )}
          </div>
        </div>
      </div>

      <div className="task-details">
        <div className="task-description">
          {task.description}
        </div>

        <div className="meta-info">
          <div className="difficulty">
            <span>Schwierigkeit: </span>
            {renderDifficultyStars(task.difficulty)}
          </div>

          {task.expiration_date && (
            <div className="expiration">
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
      </div>

      <div className="task-submission">
        {task.dynamic && (
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
              />
            </label>
            {dynamicValue > 0 && (
              <div className="calculated-points">
                = {Math.round(parseFloat(dynamicValue) * task.multiplier)} Punkte
              </div>
            )}
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
                  alert('Bitte nur Bilder oder Videos hochladen');
                }
              }}
              style={{ display: 'none' }}
            />
            {!selectedFile ? (
              <div className="upload-placeholder">
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
          disabled={isSubmitting || !selectedFile || (task.dynamic && !dynamicValue)}
        >
          {isSubmitting ? 'Wird eingereicht...' : 'Aufgabe einreichen'}
        </button>
      </div>
    </div>
  );
};

export default TaskCard; 