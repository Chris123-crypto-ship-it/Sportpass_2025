import React, { useEffect } from 'react';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext'; // Für den eingeloggten Benutzer
import { FaCheckCircle, FaTimesCircle, FaFile, FaImage, FaVideo, FaUser, FaClock, FaInfoCircle } from 'react-icons/fa';
import './Archive.css';

const Archive = () => {
  const { archive, tasks, fetchArchive, fetchTasks, loading, error } = useTasks();
  const { user } = useAuth();

  useEffect(() => {
    fetchArchive();
    fetchTasks('archive'); // Wir brauchen auch die Tasks für die Titel
  }, []);

  const getTaskTitle = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    return task ? task.title : 'Unbekannte Aufgabe';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Kein Datum';
    try {
      const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
      return new Date(dateString).toLocaleDateString('de-DE', options);
    } catch (error) {
      return 'Ungültiges Datum';
    }
  };

  const renderFilePreview = (fileUrl, fileName) => {
    if (!fileUrl) return null;
    
    if (fileUrl.match(/\.(jpg|jpeg|png|gif)$/i) || fileUrl.startsWith('data:image')) {
      return (
        <div className="archive-file-preview">
          <img src={fileUrl} alt={fileName || "Eingereichte Datei"} />
          <div className="archive-file-name">{fileName || "Bild"}</div>
        </div>
      );
    }
    
    if (fileUrl.match(/\.(mp4|webm|ogg)$/i) || fileUrl.startsWith('data:video')) {
      return (
        <div className="archive-file-preview">
          <video controls>
            <source src={fileUrl} type="video/mp4" />
            Ihr Browser unterstützt keine Videowiedergabe.
          </video>
          <div className="archive-file-name">{fileName || "Video"}</div>
        </div>
      );
    }

    return (
      <div className="archive-file">
        <FaFile className="archive-file-icon" /> 
        <span className="archive-file-name">{fileName || "Datei angehängt"}</span>
      </div>
    );
  };

  const formatDetails = (details) => {
    if (!details) return '';
    try {
      // Falls details ein String ist, der ein JSON enthält
      const detailsObj = typeof details === 'string' ? JSON.parse(details) : details;
      
      // Wenn es ein duration-Objekt ist
      if (detailsObj.duration) {
        return `Dauer: ${detailsObj.duration} Minuten`;
      }
      
      // Wenn es ein normaler String ist
      if (typeof detailsObj === 'string') {
        return detailsObj;
      }
      
      // Fallback: Objekt in lesbaren String umwandeln
      return JSON.stringify(detailsObj);
    } catch (e) {
      // Falls JSON.parse fehlschlägt oder andere Fehler auftreten
      return String(details);
    }
  };

  // Filter für benutzerspezifische, archivierte Submissions
  const userArchive = archive.filter(submission => 
    submission.user_email === user?.email && 
    (submission.status === 'approved' || submission.status === 'rejected')
  );

  const renderSubmissionAttachment = (submission) => {
    if (!submission.file_url) return null;

    if (submission.file_url.match(/\.(jpg|jpeg|png|gif)$/i) || submission.file_url.startsWith('data:image')) {
      return (
        <div className="archive-file-preview">
          <img src={submission.file_url} alt="Eingereichte Datei" />
        </div>
      );
    }

    if (submission.file_url.match(/\.(mp4|webm|ogg)$/i) || submission.file_url.startsWith('data:video')) {
      return (
        <div className="archive-file-preview">
          <video controls>
            <source src={submission.file_url} type="video/mp4" />
            Ihr Browser unterstützt keine Videowiedergabe.
          </video>
        </div>
      );
    }

    return null;
  };

  if (error) {
    return (
      <div className="archive-container">
        <h1 className="archive-header">Fehler</h1>
        <div className="no-archive">{error}</div>
      </div>
    );
  }

  return (
    <div className="archive-container">
      <div className="archive-info">
        <FaInfoCircle className="info-icon" />
        <div className="info-text">
          Hier findest du deine letzten akzeptierten und abgelehnten Einsendungen mit Datum. Aufgaben werden automatisch nach einer Woche aus dem Archiv gelöscht. Deine erreichten Punkte in der Rangliste bleiben davon unberührt und werden dauerhaft gespeichert.
        </div>
      </div>
      <h1 className="archive-header">Mein Archiv</h1>
      {loading ? (
        <div className="no-archive">Archiv wird geladen...</div>
      ) : !userArchive || userArchive.length === 0 ? (
        <div className="no-archive">Keine archivierten Einsendungen vorhanden</div>
      ) : (
        <div className="archive-grid">
          {userArchive.map((submission) => (
            <div key={submission.id} className="archive-card">
              <div className="archive-card-header">
                <h2 className="archive-task-title">
                  {getTaskTitle(submission.task_id)}
                </h2>
                <span className={`archive-status ${submission.status}`}>
                  {submission.status === 'approved' ? (
                    <React.Fragment>
                      <FaCheckCircle /> Genehmigt
                    </React.Fragment>
                  ) : (
                    <React.Fragment>
                      <FaTimesCircle /> Abgelehnt
                    </React.Fragment>
                  )}
                </span>
              </div>
              
              {submission.file_url && (
                <div className="archive-file-container">
                  {renderSubmissionAttachment(submission)}
                </div>
              )}

              {submission.admin_comment && (
                <div className="archive-comment">
                  <strong>Admin-Kommentar:</strong> {submission.admin_comment}
                </div>
              )}

              <div className="archive-meta">
                <div className="archive-date">
                  <FaClock />
                  {formatDate(submission.created_at)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Archive;
