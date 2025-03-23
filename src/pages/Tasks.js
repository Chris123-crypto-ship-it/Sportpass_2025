import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { FaRunning, FaHeartbeat, FaDumbbell, FaMedal, FaFire, FaStar, 
         FaUpload, FaFileImage, FaVideo, FaTrash, FaClock, FaCheck, FaTimes, FaFile, FaImage, FaCheckCircle, FaTimesCircle, FaUser, FaTag } from 'react-icons/fa';
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
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [activeSubmissionId, setActiveSubmissionId] = useState(null);
  const [fileUploads, setFileUploads] = useState({});
  const fileInputRefs = useRef({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTasks();
    fetchSubmissions();
  }, []);

  useEffect(() => {
    if (!tasks) return;

    let filtered = [...tasks];
    
    if (filter !== 'all') {
      filtered = tasks.filter(task => task.category.toLowerCase() === filter.toLowerCase());
    }

    setFilteredTasks(filtered);
  }, [tasks, filter]);

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

    // Formatierung des Ablaufdatums
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

    // Schwierigkeitsanzeige
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
            {/* Schwierigkeitsanzeige */}
            <div className="difficulty">
              <span>Schwierigkeit: </span>
              {renderDifficultyStars(task.difficulty)}
            </div>

            {/* Ablaufdatum */}
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
            disabled={!selectedFile || (task.dynamic && !dynamicValue)}
          >
            Aufgabe einreichen
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="tasks-container">
      <div className="tasks-header">
        <h1 className="tasks-title">Verfügbare Aufgaben</h1>
        <div className="filter-section">
          <button 
            className={`filter-button ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Alle
          </button>
          <button 
            className={`filter-button ${filter === 'running' ? 'active' : ''}`}
            onClick={() => setFilter('running')}
          >
            Laufen
          </button>
          <button 
            className={`filter-button ${filter === 'cardio' ? 'active' : ''}`}
            onClick={() => setFilter('cardio')}
          >
            Cardio
          </button>
          <button 
            className={`filter-button ${filter === 'strength' ? 'active' : ''}`}
            onClick={() => setFilter('strength')}
          >
            Kraft
          </button>
        </div>
      </div>

      <div className="tasks-grid">
        {loading ? (
          <div className="loading">Laden...</div>
        ) : filteredTasks.length === 0 ? (
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

      {/* Admin section with updated styling */}
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
                );
              })}
            </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
