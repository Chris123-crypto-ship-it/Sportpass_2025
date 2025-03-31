import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { FaRunning, FaHeartbeat, FaDumbbell, FaMedal, FaFire, FaStar, 
         FaUpload, FaFileImage, FaVideo, FaTrash, FaClock, FaCheck, FaTimes, FaFile, FaImage, FaCheckCircle, FaTimesCircle, FaUser, FaTag, FaFilter, FaInfoCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import '../styles/Tasks.css';

const Tasks = () => {
  const { user } = useAuth();
  const { tasks, submissions, fetchTasks, fetchSubmissions, submitTask, handleApproveSubmission, handleRejectSubmission, deleteTask, deleteSubmission } = useTasks();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [currentTaskId, setCurrentTaskId] = useState(null);
  const [duration, setDuration] = useState('');
  const [message, setMessage] = useState('');
  const [adminComment, setAdminComment] = useState('');
  const [filter, setFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [activeSubmissionId, setActiveSubmissionId] = useState(null);
  const [fileUploads, setFileUploads] = useState({});
  const fileInputRefs = useRef({});
  const [loading, setLoading] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [submissionsLoaded, setSubmissionsLoaded] = useState(false);

  const categories = [
    { value: 'all', label: 'Alle Kategorien' },
    { value: 'strength', label: 'Kraft' },
    { value: 'flexibility', label: 'Flexibilität' },
    { value: 'cardio', label: 'Cardio' },
    { value: 'endurance', label: 'Ausdauer' },
    { value: 'team', label: 'Team' },

  ];

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await fetchTasks();
        await fetchSubmissions();
        setSubmissionsLoaded(true);
      } catch (error) {
        console.error('Fehler beim Laden der Daten:', error);
        toast.error('Fehler beim Laden der Aufgaben und Einreichungen');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  useEffect(() => {
    if (!tasks) return;

    let filtered = [...tasks];
    
    if (filter === 'ausstehend') {
      filtered = filtered.filter(task => {
        const userSubmission = submissions.find(s => s.task_id === task.id && s.user_email === user?.email);
        return !userSubmission || userSubmission.status === 'rejected';
      });
    } else if (filter === 'abgeschlossen') {
      filtered = filtered.filter(task => {
        const userSubmission = submissions.find(s => s.task_id === task.id && s.user_email === user?.email);
        return userSubmission && userSubmission.status === 'approved';
      });
    }
    
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(task => 
        task.category && task.category.toLowerCase() === categoryFilter.toLowerCase()
      );
    }

    setFilteredTasks(filtered);
  }, [tasks, filter, categoryFilter, submissions, user]);

  const getCategoryIcon = (category) => {
    switch (category.toLowerCase()) {
      case 'running':
        return FaRunning;
      case 'cardio':
        return FaHeartbeat;
      case 'strength':
        return FaDumbbell;
      default:
        return FaFire;
    }
  };

  const getDifficultyDots = (difficulty) => {
    return Array(3).fill(0).map((_, index) => (
      <div 
        key={index}
        className={`difficulty-dot ${index < difficulty ? 'active' : ''}`}
      />
    ));
  };

  if (!user) {
    return <p>Bitte logge dich ein, um Aufgaben zu sehen.</p>;
  }

  const handleSubmit = async (taskId) => {
    if (!user) {
      toast.error('Bitte melde dich an, um eine Aufgabe einzureichen');
      return;
    }
    
    const fileUpload = fileUploads[taskId];
    if (!fileUpload || !fileUpload.file) {
      toast.error('Bitte wähle eine Datei aus');
      return;
    }
    
    try {
      setLoading(true);
      
      const success = await submitTask(taskId, user.email, fileUpload.file, {});
      
      handleRemoveFile(taskId);
      
      await fetchSubmissions();
      
      setLoading(false);
      
      toast.success('Aufgabe erfolgreich eingereicht!');
    } catch (error) {
      console.error('Fehler beim Einreichen:', error);
      setLoading(false);
      toast.error('Fehler beim Einreichen der Aufgabe');
    }
  };

  const handleFileSelect = (e, taskId) => {
    const file = e.target.files[0];
    if (!file) return;
    
    let previewUrl = null;
    
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFileUploads({
          ...fileUploads,
          [taskId]: {
            file,
            previewUrl: reader.result
          }
        });
      };
      reader.readAsDataURL(file);
      } else {
      setFileUploads({
        ...fileUploads,
        [taskId]: {
          file,
          previewUrl: null
        }
      });
    }
  };

  const handleRemoveFile = (taskId) => {
    const newFileUploads = { ...fileUploads };
    delete newFileUploads[taskId];
    setFileUploads(newFileUploads);
    
    if (fileInputRefs.current[taskId]) {
      fileInputRefs.current[taskId].value = '';
    }
  };

  const initFileInputRef = (taskId) => {
    if (!fileInputRefs.current[taskId]) {
      fileInputRefs.current[taskId] = null;
    }
    return fileInputRefs.current;
  };

  const triggerFileInput = (taskId) => {
    if (fileInputRefs.current[taskId]) {
      fileInputRefs.current[taskId].click();
    }
  };

  const renderFileUploadSection = (task) => {
    const taskId = task.id;
    const fileUpload = fileUploads[taskId];
    
    return (
      <div className="file-upload-section">
        {!fileUpload ? (
          <div className="file-upload" onClick={() => triggerFileInput(taskId)}>
            <div className="file-upload-content">
              <FaFile className="file-upload-icon" />
              <span className="file-upload-text">Klicke hier, um ein Bild oder Video hochzuladen</span>
          </div>
            <input
              ref={el => fileInputRefs.current[taskId] = el}
              id={`file-upload-${taskId}`}
              type="file"
              accept="image/*,video/*"
              onChange={(e) => handleFileSelect(e, taskId)}
              style={{ display: 'none' }}
            />
          </div>
        ) : (
          <div className="selected-file">
            {fileUpload.previewUrl ? (
              <img 
                src={fileUpload.previewUrl} 
                alt="Vorschau" 
                style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }} 
              />
            ) : fileUpload.file.type.startsWith('video/') ? (
              <div className="video-icon"><FaVideo size={40} /></div>
            ) : (
              <div className="file-icon"><FaFile size={40} /></div>
            )}
            <div className="file-info">
              <span className="file-name">{fileUpload.file.name}</span>
              <button 
                className="remove-file" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFile(taskId);
                }}
              >
                <FaTrash /> Entfernen
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSubmissionAttachment = (submission) => {
    if (!submission.file_url) return null;
    
    if (submission.file_url.match(/\.(jpg|jpeg|png|gif)$/i) || submission.file_url.startsWith('data:image')) {
      return (
        <div className="submission-attachment">
          <img src={submission.file_url} alt="Eingereichte Datei" />
        </div>
      );
    }
    
    if (submission.file_url.match(/\.(mp4|webm|ogg)$/i) || submission.file_url.startsWith('data:video')) {
      return (
        <div className="submission-attachment">
          <video controls>
            <source src={submission.file_url} type="video/mp4" />
            Ihr Browser unterstützt keine Videowiedergabe.
          </video>
        </div>
      );
    }

    return (
      <div className="submission-file">
        <FaFile /> Datei angehängt
      </div>
    );
  };

  const userSubmissions = submissions.filter(sub => 
    sub.user_email === user?.email && sub.status === 'pending'
  );

  const renderAdminSubmissionPreview = (submission) => {
    if (!submission.file_url) return null;
    
    if (submission.file_url.match(/\.(jpg|jpeg|png|gif)$/i) || submission.file_url.startsWith('data:image')) {
      return (
        <div className="admin-submission-preview">
          <img src={submission.file_url} alt="Eingereichte Datei" />
        </div>
      );
    }
    
    if (submission.file_url.match(/\.(mp4|webm|ogg)$/i) || submission.file_url.startsWith('data:video')) {
      return (
        <div className="admin-submission-preview">
          <video controls>
            <source src={submission.file_url} type="video/mp4" />
            Ihr Browser unterstützt keine Videowiedergabe.
          </video>
        </div>
      );
    }
    
    return null;
  };

  const handleDeleteSubmission = async (submissionId) => {
    if (!window.confirm('Möchtest du diese Einsendung wirklich löschen?')) {
      return;
    }

    try {
      await deleteSubmission(submissionId);
      await fetchSubmissions();
    } catch (error) {
      console.error('Fehler beim Löschen der Einsendung:', error);
      alert('Fehler beim Löschen der Einsendung');
    }
  };

  const renderTaskDetails = (task) => {
    return (
      <div className="task-details">
        <div className="task-description">
          {task.description}
        </div>

        <div className="points-section">
          {task.dynamic ? (
            <div className="dynamic-points">
              <FaMedal /> {task.multiplier} Punkte pro {' '}
              {task.category === 'cardio' ? 'Minute' : 'Kilometer'}
            </div>
          ) : (
            <div className="static-points">
              <FaMedal /> {task.points} Punkte
            </div>
          )}
        </div>

        <div className="task-info-grid">
          <div className="info-item">
            <FaTag className="info-icon" />
            <span>Kategorie: {task.category}</span>
          </div>
          
          <div className="info-item">
            <FaStar className="info-icon" />
            <span>Schwierigkeit: {task.difficulty}/3</span>
          </div>

          {task.expiration_date && (
            <div className="info-item">
              <FaClock className="info-icon" />
              <span>
                {task.expiration_date && new Date(task.expiration_date) < new Date() ? 'Abgelaufen am: ' : 'Läuft ab am: '}
                {new Date(task.expiration_date).toLocaleDateString('de-DE', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const TaskCard = ({ task }) => {
    console.log('Task Data:', {
      expiration_date: task.expiration_date,
      difficulty: task.difficulty,
      task: task
    });

    const [selectedFile, setSelectedFile] = useState(null);
    const [dynamicValue, setDynamicValue] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useAuth();
    const { submitTask, submissions } = useTasks();
    const isExpired = task.expiration_date && new Date(task.expiration_date) < new Date();

    // Zähle die Einreichungen des Benutzers für diese Aufgabe
    const userSubmissionsCount = submissions.filter(
      s => s.task_id === task.id && 
           s.user_email === user?.email && 
           (s.status === 'approved' || s.status === 'pending')
    ).length;

    // Prüfe, ob maximale Anzahl erreicht wurde
    const hasReachedMaxSubmissions = task.max_submissions && userSubmissionsCount >= task.max_submissions;

    const handleSubmit = async () => {
      if (!user) {
        alert('Bitte melde dich an, um eine Aufgabe einzureichen.');
        return;
      }

      if (isExpired) {
        alert('Diese Aufgabe ist bereits abgelaufen.');
        return;
      }

      if (hasReachedMaxSubmissions) {
        alert(`Du hast bereits die maximale Anzahl an Einreichungen (${task.max_submissions}) für diese Aufgabe erreicht.`);
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
            <span className={`task-category ${task.category.toLowerCase()}`}>
              {task.category}
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
          
          {task.max_submissions && (
            <div className="submission-count-info">
              <span className={hasReachedMaxSubmissions ? 'submissions-limit-reached' : ''}>
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
                    alert('Bitte nur Bilder oder Videos hochladen');
                  }
                }}
                style={{ display: 'none' }}
                disabled={hasReachedMaxSubmissions}
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
            disabled={!selectedFile || (task.dynamic && !dynamicValue) || hasReachedMaxSubmissions || isSubmitting}
          >
            {hasReachedMaxSubmissions ? 'Maximale Anzahl erreicht' : 'Aufgabe einreichen'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="tasks-container">
      <div className="tasks-header">
        <h1 className="tasks-title">Verfügbare Aufgaben</h1>
        <button className="tasks-info-button" onClick={() => setShowInfoModal(true)}>
          <FaInfoCircle /> Info
        </button>
        <div className="filter-section">
          <div className="filter-container">
            <div className="filter-group">
              <label><FaFilter /> Status:</label>
              <div className="filter-buttons">
                <button 
                  className={filter === 'all' ? 'active' : ''} 
                  onClick={() => setFilter('all')}
                >
                  Alle
                </button>
                <button 
                  className={filter === 'ausstehend' ? 'active' : ''} 
                  onClick={() => setFilter('ausstehend')}
                >
                  Ausstehend
                </button>
                <button 
                  className={filter === 'abgeschlossen' ? 'active' : ''} 
                  onClick={() => setFilter('abgeschlossen')}
                >
                  Abgeschlossen
                </button>
              </div>
            </div>
            
            <div className="filter-group">
              <label><FaTag /> Kategorie:</label>
              <select 
                className="category-filter"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {loading || !submissionsLoaded ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Aufgaben und Einreichungsdaten werden geladen...</p>
        </div>
      ) : (
        <>
          <div className="tasks-grid">
            {filteredTasks.length === 0 ? (
              <div className="no-tasks">Keine Aufgaben gefunden</div>
            ) : (
              filteredTasks.map(task => (
                <TaskCard key={task.id} task={task} />
              ))
            )}
          </div>

          <div className="submissions-section">
            <h2 className="submissions-header">
              <span className="submissions-title">Meine ausstehenden Einsendungen</span>
            </h2>
            
            {userSubmissions.length === 0 ? (
              <div className="no-submissions">
                Keine ausstehenden Einsendungen vorhanden.
              </div>
            ) : (
            <div className="submissions-grid">
                {userSubmissions.map(submission => {
                  const task = tasks.find(t => t.id === submission.task_id);
                return (
                    <div key={submission.id} className="submission-card">
                      <div className="submission-header">
                        <h4 className="submission-title">{task?.title || 'Unbekannte Aufgabe'}</h4>
                        <span className="submission-status pending">
                          <FaClock /> Ausstehend
                        </span>
                      </div>

                      {renderSubmissionAttachment(submission)}

                      <div className="submission-actions">
                        <button 
                          className="delete-button"
                          onClick={() => handleDeleteSubmission(submission.id)}
                        >
                          <FaTrash /> Löschen
                        </button>
                      </div>
                    </div>
                );
              })}
              </div>
            )}
          </div>

          {user?.role === 'admin' && (
            <div className="admin-section">
              <h1 className="admin-title">Aufgabenüberprüfung</h1>
              <div className="admin-submissions-grid">
                  {submissions
                    .filter(s => s.status === 'pending')
                  .map(submission => {
                    const task = tasks.find(t => t.id === submission.task_id);
                    return (
                      <div key={submission.id} className="admin-submission-card">
                        <div className="admin-submission-header">
                          <h3>{task?.title}</h3>
                          <div className="admin-submission-info">
                            <span className="admin-user">
                              <FaUser /> {submission.user_email}
                            </span>
                            <span className="admin-points">
                              {task?.dynamic ? (
                                `${submission.submission_details?.task_points || 0} Punkte (${task.multiplier} pro ${task.dynamic_type})`
                              ) : (
                                `${task?.points || 0} Punkte`
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="admin-submission-content">
                          {submission.file_url && (
                            <div className="admin-file-preview">
                              {submission.file_url.match(/\.(jpg|jpeg|png|gif)$/i) || 
                               submission.file_url.startsWith('data:image') ? (
                                <img 
                                  src={submission.file_url} 
                                  alt="Eingereichte Datei"
                                  className="admin-preview-image"
                                />
                              ) : (
                                <video controls className="admin-preview-video">
                                  <source src={submission.file_url} type="video/mp4" />
                                  Ihr Browser unterstützt keine Videowiedergabe.
                                </video>
                              )}
                            </div>
                          )}

                          <div className="admin-submission-details">
                            <textarea
                              className="admin-comment"
                              placeholder="Admin-Kommentar..."
                              value={submission.id === activeSubmissionId ? adminComment : ''}
                              onChange={(e) => {
                                setAdminComment(e.target.value);
                                setActiveSubmissionId(submission.id);
                              }}
                            />

                            <div className="admin-actions">
                              <button 
                                className="approve-button"
                                onClick={() => handleApproveSubmission(submission.id, adminComment)}
                              >
                                Genehmigen
                              </button>
                              <button 
                                className="reject-button"
                                onClick={() => handleRejectSubmission(submission.id, adminComment)}
                              >
                                Ablehnen
                              </button>
                            </div>
                            </div>
                          </div>
                        </div>
                    </div>
                  );
                })}
              </div>
          )}
        </>
      )}

      {/* Info Modal */}
      {showInfoModal && (
        <div className="modal-overlay" onClick={() => setShowInfoModal(false)}>
          <div className="modal-content task-info-modal" onClick={e => e.stopPropagation()}>
            <h2>Informationen zu den Aufgaben</h2>
            
            <div className="info-section">
              <h3>Punktevergabe</h3>
              <p>Die Vergabe von Punkten für eingereichte Aufgaben erfolgt nach manueller Überprüfung durch unser Team und kann daher etwas Zeit in Anspruch nehmen. Bitte habe etwas Geduld, nachdem du eine Aufgabe eingereicht hast.</p>
            </div>
            
            <div className="info-section">
              <h3>Neue Aufgaben</h3>
              <p>Jeden Sonntag werden neue Aufgaben freigeschaltet. Schau regelmäßig vorbei, um keine Chance auf Punkte zu verpassen!</p>
            </div>
            
            <div className="info-section">
              <h3>Kategorien</h3>
              <p>Die Aufgaben sind in verschiedene Kategorien unterteilt, damit du dich in unterschiedlichen Bereichen verbessern kannst.</p>
            </div>
            
            <button className="modal-close" onClick={() => setShowInfoModal(false)}>
              Verstanden
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
