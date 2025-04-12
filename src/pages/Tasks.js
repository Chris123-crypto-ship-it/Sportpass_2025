import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { FaRunning, FaHeartbeat, FaDumbbell, FaMedal, FaFire, FaStar, 
         FaUpload, FaFileImage, FaVideo, FaTrash, FaClock, FaCheck, FaTimes, FaFile, FaImage, FaCheckCircle, FaTimesCircle, FaUser, FaTag, FaFilter, FaInfoCircle, FaEye, FaSpinner } from 'react-icons/fa';
import { toast } from 'react-toastify';
import '../styles/Tasks.css';

const Tasks = () => {
  const { user } = useAuth();
  const { 
    tasks, 
    submissions, 
    pagination,
    allUserSubmissions,
    selectedSubmission,
    loading: loadingTasks,
    loadingDetails,
    loadingUserSubmissions,
    error, 
    fetchTasks, 
    fetchSubmissions, 
    fetchAllUserSubmissions,
    fetchSubmissionDetails,
    submitTask, 
    handleApproveSubmission, 
    handleRejectSubmission, 
    deleteTask, 
    deleteSubmission 
  } = useTasks();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [currentTaskId, setCurrentTaskId] = useState(null);
  const [duration, setDuration] = useState('');
  const [message, setMessage] = useState('');
  const [adminComment, setAdminComment] = useState({});
  const [filter, setFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [activeSubmissionId, setActiveSubmissionId] = useState(null);
  const [fileUploads, setFileUploads] = useState({});
  const fileInputRefs = useRef({});
  const [loadingPage, setLoadingPage] = useState(true);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [viewingSubmissionId, setViewingSubmissionId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

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
      setLoadingPage(true);
      try {
        await fetchTasks();
        if (user) {
          await fetchAllUserSubmissions();
          if (user.role === 'admin') {
            await fetchSubmissions(currentPage);
          }
        }
      } catch (error) {
        console.error('Fehler beim Laden der Daten:', error);
        toast.error('Fehler beim Laden der Aufgaben oder Einreichungen');
      } finally {
        setLoadingPage(false);
      }
    };
    
    loadData();
  }, [user, fetchTasks, fetchAllUserSubmissions, fetchSubmissions, currentPage]);

  useEffect(() => {
    if (!tasks || !allUserSubmissions) return;

    let filtered = [...tasks];
    
    if (filter === 'ausstehend') {
      filtered = filtered.filter(task => {
        const userSubmission = allUserSubmissions.find(s => s.task_id === task.id);
        return !userSubmission || userSubmission.status === 'rejected';
      });
    } else if (filter === 'abgeschlossen') {
      filtered = filtered.filter(task => {
        const userSubmission = allUserSubmissions.find(s => s.task_id === task.id && s.status === 'approved');
        return !!userSubmission;
      });
    }
    
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(task => 
        task.category && task.category.toLowerCase() === categoryFilter.toLowerCase()
      );
    }

    setFilteredTasks(filtered);
  }, [tasks, filter, categoryFilter, allUserSubmissions, user]);

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
      setLoadingPage(true);
      
      const success = await submitTask(taskId, user.email, fileUpload.file, {});
      
      handleRemoveFile(taskId);
      
      await fetchSubmissions(currentPage);
      
      setLoadingPage(false);
      
      toast.success('Aufgabe erfolgreich eingereicht!');
    } catch (error) {
      console.error('Fehler beim Einreichen:', error);
      setLoadingPage(false);
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

  const pendingUserSubmissions = allUserSubmissions.filter(sub => 
    sub.status === 'pending'
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
      await fetchSubmissions(currentPage);
      toast.success("Einsendung gelöscht.");
    } catch (error) {
      console.error('Fehler beim Löschen der Einsendung:', error);
      toast.error('Fehler beim Löschen der Einsendung');
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

  const handleAdminCommentChange = (submissionId, value) => {
    setAdminComment(prev => ({ ...prev, [submissionId]: value }));
  };

  const handleViewDetails = (submissionId) => {
    if (viewingSubmissionId === submissionId) {
      setViewingSubmissionId(null);
      fetchSubmissionDetails(null);
    } else {
      setViewingSubmissionId(submissionId);
      fetchSubmissionDetails(submissionId);
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

  const TaskCard = ({ task }) => {
    const userSubmissions = allUserSubmissions?.filter(s => s.task_id === task.id) || [];
    const hasApprovedSubmission = userSubmissions.some(s => s.status === 'approved');
    const hasPendingSubmission = userSubmissions.some(s => s.status === 'pending');
    const isExpired = task.expiration_date && new Date(task.expiration_date) < new Date();
    
    const CategoryIcon = getCategoryIcon(task.category || 'default');
    
    // Render approved submission or task
    return (
      <div className={`task-card ${isExpired ? 'expired' : ''} ${hasApprovedSubmission ? 'completed' : ''}`}>
        <div className="task-header">
          <div className="task-title-section">
            <h3 className="task-title">{task.title}</h3>
            <span className="task-category">{task.category}</span>
          </div>
          <div className="task-points">
            <div className="points">
              <span className="points-value">{task.points}</span>
              <span className="points-label">Punkte</span>
            </div>
          </div>
        </div>
        <div className="task-content">
          <p className="task-description">{task.description}</p>
          <div className="task-meta">
            <div className="difficulty">
              <span>Schwierigkeit:</span>
              <div className="difficulty-dots">
                {renderDifficultyStars(task.difficulty || 1)}
              </div>
            </div>
            {task.expiration_date && (
              <div className="expiration">
                <FaClock />
                <span>{formatExpirationDate(task.expiration_date)}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Submissions section */}
        {userSubmissions.length > 0 && (
          <div className="user-submissions">
            <h4>Deine Einsendungen</h4>
            {userSubmissions.map(submission => (
              <div key={submission.id} className={`submission-item ${submission.status}`}>
                <div className="submission-header">
                  <span className="submission-title">
                    {submission.task_title || task.title}
                  </span>
                  <span className={`submission-status ${submission.status}`}>
                    {submission.status === 'approved' ? <FaCheckCircle /> : 
                     submission.status === 'rejected' ? <FaTimesCircle /> : <FaClock />}
                    {submission.status === 'approved' ? ' Genehmigt' : 
                     submission.status === 'rejected' ? ' Abgelehnt' : ' Ausstehend'}
                  </span>
                </div>
                
                {submission.status === 'pending' && (
                  <button 
                    onClick={() => handleDeleteSubmission(submission.id)}
                    className="delete-submission-button"
                  >
                    <FaTrash /> Löschen
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* File upload section */}
        {!hasApprovedSubmission && !hasPendingSubmission && !isExpired && renderFileUploadSection(task)}
      </div>
    );
  };

  const renderAttachmentPreview = (submissionData) => {
    if (!submissionData || !submissionData.file_url) return <div className="no-attachment">Kein Anhang vorhanden.</div>;
    
    const url = submissionData.file_url;
    if (url.startsWith('data:image')) {
      return <img src={url} alt="Anhang" className="admin-preview-image" />;
    } else if (url.startsWith('data:video')) {
      return (
        <video controls className="admin-preview-video">
          <source src={url} /> Ihr Browser unterstützt das Video nicht.
        </video>
      );
    } else {
      return <div className="no-attachment"><FaFile /> Anhang vorhanden (Typ unbekannt)</div>;
    }
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

      {loadingPage ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p className="loading-text">Aufgaben und Einreichungsdaten werden geladen...</p>
        </div>
      ) : (
        <div className="tasks-content">
          <div className="tasks-grid">
            {filteredTasks.length === 0 ? (
              <div className="no-tasks">Keine Aufgaben gefunden</div>
            ) : (
              <>
                {filteredTasks.map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </>
            )}
          </div>

          <div className="submissions-section">
            <h2 className="submissions-header">
              <span className="submissions-title">Meine ausstehenden Einsendungen</span>
            </h2>
            
            {loadingUserSubmissions ? (
              <div className="loading-container small"><div className="spinner small"></div></div>
            ) : pendingUserSubmissions.length === 0 ? (
              <div className="no-submissions">
                Keine ausstehenden Einsendungen vorhanden.
              </div>
            ) : (
              <div className="submissions-grid">
                {pendingUserSubmissions.map(submission => {
                  const task = tasks.find(t => t.id === submission.task_id);
                  return (
                    <div key={submission.id} className="submission-card">
                      <div className="submission-header">
                        <h4 className="submission-title">{submission.task_title || task?.title || 'Unbekannte Aufgabe'}</h4>
                        <span className="submission-status pending">
                          <FaClock /> Ausstehend
                        </span>
                      </div>
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
              {loadingTasks ? (
                 <div className="loading-container small"><div className="spinner small"></div></div>
              ) : (
                <div className="admin-submissions-grid">
                  {submissions
                    .filter(s => s.status === 'pending')
                    .map(submission => {
                      const task = tasks.find(t => t.id === submission.task_id);
                      const isViewing = viewingSubmissionId === submission.id;
                      const currentAdminComment = adminComment[submission.id] || '';
                      
                      const detailsData = isViewing ? selectedSubmission : null;
                      
                      return (
                        <div key={submission.id} className={`admin-submission-card ${isViewing ? 'details-visible' : ''}`}>
                          <div className="admin-submission-header">
                            <h3>{submission.task_title || task?.title || 'Unbekannte Aufgabe'}</h3>
                            <div className="admin-submission-info">
                              <span className="admin-user">
                                <FaUser /> {submission.user_email}
                              </span>
                            </div>
                          </div>

                          <button onClick={() => handleViewDetails(submission.id)} className="view-details-button">
                            {loadingDetails && isViewing ? <FaSpinner className="spin" /> : <FaEye />}
                            {isViewing ? ' Details verbergen' : ' Details anzeigen'}
                          </button>

                          {isViewing && (
                            <div className="admin-submission-content">
                              {loadingDetails ? (
                                <div className="loading-details">Details werden geladen... <FaSpinner className="spin"/></div>
                              ) : !selectedSubmission || selectedSubmission.id !== submission.id ? (
                                <div className="error-details">Details konnten nicht geladen werden.</div>
                              ) : (
                                <> 
                                  <div className="admin-file-preview">
                                    {renderAttachmentPreview(selectedSubmission)}
                                  </div>
                                  
                                  <div className="admin-submission-details">
                                    <div className="admin-points-details"> 
                                      <strong>Punkte: </strong>
                                      {selectedSubmission.calculated_points !== undefined 
                                        ? `${selectedSubmission.calculated_points}`
                                        : (task?.dynamic ? 'Dynamisch' : `${task?.points || '?'}`) 
                                      }
                                      {task?.dynamic && task.multiplier && ` (${task.multiplier} / ${task.dynamic_type === 'minutes' ? 'Min' : 'Km'})`}
                                    </div>
                                    <textarea
                                      className="admin-comment"
                                      placeholder="Admin-Kommentar..."
                                      value={currentAdminComment}
                                      onChange={(e) => handleAdminCommentChange(submission.id, e.target.value)}
                                    />
                                    <div className="admin-actions">
                                      <button className="approve-button" onClick={() => handleApproveSubmission(submission.id, currentAdminComment)}><FaCheckCircle /> Genehmigen</button>
                                      <button className="reject-button" onClick={() => handleRejectSubmission(submission.id, currentAdminComment)}><FaTimesCircle /> Ablehnen</button>
                                    </div>
                                  </div>
                                </> 
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

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
