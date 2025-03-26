import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { FaRunning, FaHeartbeat, FaDumbbell, FaMedal, FaFire, FaStar, 
         FaUpload, FaFileImage, FaVideo, FaTrash, FaClock, FaCheck, FaTimes, FaFile, FaImage, FaCheckCircle, FaTimesCircle, FaUser, FaTag, FaFilter } from 'react-icons/fa';
import { toast } from 'react-toastify';
import '../styles/Tasks.css';

// Lazy Load der TaskCard Komponente
const TaskCard = lazy(() => import('../components/TaskCard'));

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [tasksPerPage] = useState(6); // 6 Aufgaben pro Seite

  const categories = [
    { value: 'all', label: 'Alle Kategorien' },
    ...Array.from(new Set(tasks.map(task => task.category)))
      .filter(Boolean)
      .sort()
      .map(category => ({ value: category, label: category }))
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await fetchTasks();
        await fetchSubmissions();
      } catch (error) {
        console.error("Fehler beim Laden der Daten:", error);
        setError("Daten konnten nicht geladen werden. Bitte versuche es später erneut.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [fetchTasks, fetchSubmissions]);

  useEffect(() => {
    if (!tasks) return;

    let filtered = [...tasks];
    
    if (filter !== 'all') {
      filtered = filtered.filter(task => {
        const userSubmission = submissions.find(s => s.task_id === task.id && s.user_email === user?.email);
        
        if (filter === 'completed') {
          return userSubmission && userSubmission.status === 'approved';
        } else if (filter === 'pending') {
          return userSubmission && userSubmission.status === 'pending';
        } else if (filter === 'active') {
          return !userSubmission || (userSubmission && userSubmission.status === 'rejected');
        }
        return true;
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
        <div className="submission-file-preview">
          <img 
            src={submission.file_url} 
            alt="Eingereichte Datei"
            className="submission-preview-image"
          />
        </div>
      );
    }
    
    if (submission.file_url.match(/\.(mp4|webm|ogg)$/i) || submission.file_url.startsWith('data:video')) {
      return (
        <div className="submission-file-preview">
          <video controls className="submission-preview-video">
            <source src={submission.file_url} type="video/mp4" />
            Ihr Browser unterstützt keine Videowiedergabe.
          </video>
        </div>
      );
    }
    
    return null;
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
    if (window.confirm('Möchtest du diese Einsendung wirklich löschen?')) {
      try {
        await deleteSubmission(submissionId);
      } catch (error) {
        console.error("Fehler beim Löschen der Einsendung:", error);
      }
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

  // Pagination für Tasks
  const indexOfLastTask = currentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = filteredTasks.slice(indexOfFirstTask, indexOfLastTask);
  const paginate = pageNumber => setCurrentPage(pageNumber);
  const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);

  return (
    <div className="tasks-container">
      <div className="tasks-header">
        <h1 className="tasks-title">Verfügbare Aufgaben</h1>
        <div className="filter-section">
          <div className="filter-container">
            <div className="filter-group">
              <label><FaFilter /> Status:</label>
              <div className="filter-buttons">
                <button 
                  className={filter === 'all' ? 'active' : ''} 
                  onClick={() => {setFilter('all'); setCurrentPage(1);}}
                >
                  Alle
                </button>
                <button 
                  className={filter === 'active' ? 'active' : ''} 
                  onClick={() => {setFilter('active'); setCurrentPage(1);}}
                >
                  Aktiv
                </button>
                <button 
                  className={filter === 'pending' ? 'active' : ''} 
                  onClick={() => {setFilter('pending'); setCurrentPage(1);}}
                >
                  Ausstehend
                </button>
                <button 
                  className={filter === 'completed' ? 'active' : ''} 
                  onClick={() => {setFilter('completed'); setCurrentPage(1);}}
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
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
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

      <div className="tasks-grid">
        {loading ? (
          <div className="loading">Laden...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="no-tasks">Keine Aufgaben gefunden</div>
        ) : (
          <>
            <Suspense fallback={<div className="loading">Laden der Aufgaben...</div>}>
              {currentTasks.map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
            </Suspense>
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="page-button"
                >
                  Zurück
                </button>
                <span className="page-info">Seite {currentPage} von {totalPages}</span>
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="page-button"
                >
                  Weiter
                </button>
              </div>
            )}
          </>
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

    </div>
  );
};

export default Tasks;
