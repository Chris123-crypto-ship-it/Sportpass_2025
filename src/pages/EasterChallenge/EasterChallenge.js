import React, { useEffect, useState, useCallback } from 'react';
import { useTasks } from '../../context/TaskContext';
import { useAuth } from '../../context/AuthContext';
import { FaEgg, FaTrophy, FaUpload, FaSpinner, FaExclamationCircle } from 'react-icons/fa';
import './EasterChallenge.css';
import axios from 'axios';
import config from '../../config';

const EasterChallenge = () => {
  const { user } = useAuth();
  const { 
    tasks, 
    fetchTasks, 
    submitTask, 
    allUserSubmissions, 
    fetchAllUserSubmissions,
    loading 
  } = useTasks();

  const [easterEggs, setEasterEggs] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userRanking, setUserRanking] = useState([]);
  const [loadingRanking, setLoadingRanking] = useState(false);
  const [error, setError] = useState(null);
  const [collectedEggCount, setCollectedEggCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchTasks();
      fetchAllUserSubmissions();
    }
  }, [user, fetchTasks, fetchAllUserSubmissions]);

  useEffect(() => {
    if (tasks && tasks.length > 0) {
      // Filter für Oster-Eier-Aufgaben
      const eggs = tasks.filter(task => task.is_easter_egg && !task.is_hidden);
      setEasterEggs(eggs);
    }
  }, [tasks]);

  useEffect(() => {
    if (allUserSubmissions && easterEggs.length > 0) {
      // Zähle die gesammelten Eier des aktuellen Benutzers
      const collectedEggsCount = allUserSubmissions.filter(
        submission => 
          easterEggs.some(egg => egg.id === submission.task_id) && 
          submission.status === 'approved'
      ).length;
      
      setCollectedEggCount(collectedEggsCount);
    }
  }, [allUserSubmissions, easterEggs]);

  // Funktion um Rangliste zu berechnen
  const fetchEasterRanking = useCallback(async () => {
    if (!user) return;
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    };
    
    try {
      setLoadingRanking(true);
      const response = await axios.get(`${config.API_URL}/easter-ranking`, { headers });
      
      if (response.data && response.data.ranking) {
        // Füge isCurrentUser-Eigenschaft hinzu
        const rankingWithCurrentUser = response.data.ranking.map(entry => ({
          ...entry,
          isCurrentUser: entry.email === user.email
        }));
        
        setUserRanking(rankingWithCurrentUser);
      }
    } catch (err) {
      console.error('Fehler beim Abrufen der Rangliste:', err);
      // Fallback zu simulierten Daten bei einem Fehler
      setUserRanking([
        { name: 'Max Mustermann', eggs: 14, isCurrentUser: user.name === 'Max Mustermann' },
        { name: 'Erika Musterfrau', eggs: 12, isCurrentUser: user.name === 'Erika Musterfrau' },
        { name: user.name || user.email, eggs: collectedEggCount, isCurrentUser: true }
      ]);
    } finally {
      setLoadingRanking(false);
    }
  }, [user, collectedEggCount]);

  useEffect(() => {
    if (user) {
      fetchEasterRanking();
    }
  }, [user, fetchEasterRanking, collectedEggCount]);

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowSubmitModal(true);
    setFile(null);
    setPreviewUrl(null);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    if (!selectedFile) {
      setFile(null);
      setPreviewUrl(null);
      return;
    }

    setFile(selectedFile);
    
    // Bildvorschau erstellen
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedTask || !file) {
      setError("Bitte wähle ein Ei und lade ein Foto hoch");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      await submitTask(
        selectedTask.id,
        user.email,
        file,
        { details: "Oster-Ei gefunden!" }
      );
      
      setShowSubmitModal(false);
      fetchAllUserSubmissions(); // Aktualisiere die Einsendungen
    } catch (err) {
      setError(err.message || "Fehler beim Einreichen des Ostereis");
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowSubmitModal(false);
    setSelectedTask(null);
    setFile(null);
    setPreviewUrl(null);
    setError(null);
  };

  return (
    <div className="easter-challenge-container">
      <div className="easter-challenge-header">
        <h1 className="easter-title">
          <FaEgg className="easter-egg-icon" />
          Oster-Challenge 2025
        </h1>
        <div className="easter-stats">
          <div className="collected-eggs">
            <span className="egg-count">{collectedEggCount}</span>
            <span className="egg-label">Gesammelte Eier</span>
          </div>
        </div>
      </div>

      <div className="easter-challenge-description">
        <p>
          Finde die versteckten Ostereier und sammle Punkte! Jeden Tag werden 2 neue Eier versteckt.
          Für jedes gefundene Ei bekommst du 5 Punkte. 
          Der Benutzer mit den meisten gesammelten Eiern erhält einen Bonus von 70 Punkten!
        </p>
      </div>

      <div className="easter-content">
        <div className="easter-eggs-section">
          <h2 className="section-title">Verfügbare Eier</h2>
          
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Lade Ostereier...</p>
            </div>
          ) : easterEggs.length === 0 ? (
            <div className="no-eggs">
              <FaExclamationCircle />
              <p>Aktuell sind keine Ostereier verfügbar. Schau später wieder vorbei!</p>
            </div>
          ) : (
            <div className="easter-eggs-grid">
              {easterEggs.map(egg => {
                // Prüfe, ob der Benutzer diese Aufgabe bereits erledigt hat
                const alreadySubmitted = allUserSubmissions?.some(
                  sub => sub.task_id === egg.id && ['approved', 'pending'].includes(sub.status)
                );
                
                return (
                  <div 
                    key={egg.id} 
                    className={`easter-egg-card ${alreadySubmitted ? 'submitted' : ''}`}
                    onClick={() => !alreadySubmitted && handleTaskClick(egg)}
                  >
                    <div className="easter-egg-icon-container">
                      <FaEgg className="egg-icon" />
                      {alreadySubmitted && <div className="submitted-overlay">✓</div>}
                    </div>
                    <h3 className="easter-egg-title">{egg.title}</h3>
                    <p className="easter-egg-description">{egg.description}</p>
                    <div className="easter-egg-points">5 Punkte</div>
                    
                    {!alreadySubmitted && (
                      <button className="collect-button">
                        <FaUpload /> Sammeln
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="easter-ranking-section">
          <h2 className="section-title">
            <FaTrophy /> Rangliste
          </h2>
          
          {loadingRanking ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Lade Rangliste...</p>
            </div>
          ) : userRanking.length === 0 ? (
            <div className="no-eggs">
              <p>Noch keine Teilnehmer in der Rangliste.</p>
            </div>
          ) : (
            <div className="easter-ranking-list">
              {userRanking.map((user, index) => (
                <div 
                  key={index} 
                  className={`ranking-item ${user.isCurrentUser ? 'current-user' : ''} ${index < 3 ? 'top-three' : ''}`}
                >
                  <div className="ranking-position">#{index + 1}</div>
                  <div className="ranking-user">{user.name}</div>
                  <div className="ranking-eggs">
                    <FaEgg /> {user.eggs}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="ranking-info">
            <p>Die Challenge läuft noch 5 Tage. Sammle fleißig weiter!</p>
            <p>Dem Gewinner winken 70 zusätzliche Punkte!</p>
          </div>
        </div>
      </div>

      {showSubmitModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Osterei einreichen</h3>
            
            {error && (
              <div className="error-message">
                <FaExclamationCircle /> {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="selected-egg-info">
                <FaEgg className="egg-icon" />
                <span>{selectedTask?.title}</span>
              </div>
              
              <div className="file-upload-container">
                <label className="file-upload-label">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept="image/*"
                    className="file-input"
                  />
                  {!previewUrl ? (
                    <div className="upload-placeholder">
                      <FaUpload />
                      <span>Foto hochladen</span>
                      <small>Mache ein Foto vom gefundenen Ei</small>
                    </div>
                  ) : (
                    <div className="file-preview">
                      <img src={previewUrl} alt="Vorschau" />
                    </div>
                  )}
                </label>
              </div>
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="cancel-button" 
                  onClick={closeModal}
                  disabled={isSubmitting}
                >
                  Abbrechen
                </button>
                <button 
                  type="submit" 
                  className="submit-button"
                  disabled={isSubmitting || !file}
                >
                  {isSubmitting ? (
                    <>
                      <FaSpinner className="spinner-icon" /> Wird eingereicht...
                    </>
                  ) : (
                    'Einreichen'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EasterChallenge; 
