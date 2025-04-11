import React, { useEffect, useState } from 'react';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { FaCheckCircle, FaTimesCircle, FaFile, FaImage, FaVideo, FaClock, FaInfoCircle, FaEye, FaSpinner } from 'react-icons/fa';
import './Archive.css';

const Archive = () => {
  const {
    allArchiveSubmissions,
    fetchAllArchiveSubmissions,
    selectedSubmission,
    fetchSubmissionDetails,
    loadingArchive,
    loadingDetails,
    error
  } = useTasks();
  const { user } = useAuth();
  const [viewingSubmissionId, setViewingSubmissionId] = useState(null);

  useEffect(() => {
    if (user) {
      fetchAllArchiveSubmissions();
    }
  }, [user, fetchAllArchiveSubmissions]);

  const getTaskTitle = (submission) => {
    return submission.task_title || 'Unbekannte Aufgabe';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Kein Datum';
    try {
      return new Date(dateString).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Fehler beim Formatieren des Datums:', error);
      return 'Ungültiges Datum';
    }
  };

  const handleViewDetails = (submissionId) => {
    if (viewingSubmissionId === submissionId) {
      setViewingSubmissionId(null);
    } else {
      setViewingSubmissionId(submissionId);
      fetchSubmissionDetails(submissionId);
    }
  };

  const renderAttachmentPreview = (submissionData) => {
    if (!submissionData || !submissionData.file_url) return null;

    const url = submissionData.file_url;
    if (url.startsWith('data:image')) {
      return <img src={url} alt="Anhang" className="archive-file-preview-image" />;
    } else if (url.startsWith('data:video')) {
      return (
        <video controls className="archive-file-preview-video">
          <source src={url} /> Ihr Browser unterstützt das Video nicht.
        </video>
      );
    }
    return <div className="archive-file-preview-other"><FaFile /> Anhang</div>;
  };

  const userFilteredArchive = allArchiveSubmissions.filter(submission =>
    submission.user_email === user?.email
  );

  if (error && !userFilteredArchive.length) {
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
        <FaInfoCircle />
        <div className="info-text">
          Hier findest du eine Übersicht deiner genehmigten oder abgelehnten Einsendungen.
          <strong>Beachte:</strong> Einträge werden nach 7 Tagen automatisch aus dieser Ansicht entfernt, deine erreichten Punkte bleiben jedoch bestehen.
        </div>
      </div>
      <h1 className="archive-header">Mein Archiv</h1>

      {loadingArchive ? (
        <div className="loading-container"><div className="spinner"></div><p>Archiv wird geladen...</p></div>
      ) : !userFilteredArchive || userFilteredArchive.length === 0 ? (
        <div className="no-archive">Keine archivierten Einsendungen gefunden.</div>
      ) : (
        <>
          <div className="archive-grid">
            {userFilteredArchive.map((submission) => {
              const isViewing = viewingSubmissionId === submission.id;
              const detailsData = (isViewing && selectedSubmission?.id === submission.id) ? selectedSubmission : null;

              return (
                <div key={submission.id} className={`archive-card ${isViewing ? 'details-visible' : ''}`}>
                  <div className="archive-card-header">
                    <h2 className="archive-task-title">
                      {getTaskTitle(submission)}
                    </h2>
                    <span className={`archive-status ${submission.status}`}>
                      {submission.status === 'approved' ? <FaCheckCircle /> : <FaTimesCircle />}
                      {submission.status === 'approved' ? ' Genehmigt' : ' Abgelehnt'}
                    </span>
                  </div>

                  <div className="archive-meta">
                    <div className="archive-date">
                      <FaClock /> {formatDate(submission.created_at)}
                    </div>
                  </div>

                  {submission.admin_comment && (
                    <div className="archive-comment">
                      <strong>Admin:</strong> {submission.admin_comment}
                    </div>
                  )}

                  <button onClick={() => handleViewDetails(submission.id)} className="view-details-button archive-details-button">
                    {loadingDetails && isViewing ? <FaSpinner className="spin" /> : <FaEye />}
                    {isViewing ? ' Details verbergen' : ' Details anzeigen'}
                  </button>

                  {isViewing && (
                    <div className="archive-details-content">
                      {loadingDetails ? (
                        <div className="loading-details"><FaSpinner className="spin"/> Lade Details...</div>
                      ) : !detailsData ? (
                         <div className="error-details">Details nicht verfügbar oder werden geladen...</div>
                      ) : (
                         <>
                          <div className="archive-file-container">
                             {renderAttachmentPreview(detailsData)}
                          </div>
                          {detailsData.details && typeof detailsData.details === 'object' && Object.keys(detailsData.details).length > 0 && (
                            <div className="additional-details">
                              <h4>Zusätzliche Informationen:</h4>
                              <ul>
                                {Object.entries(detailsData.details).map(([key, value]) => {
                                  if (!['task_points', 'task_type', 'base_points', 'calculated_points', 'dynamic_value', 'multiplier'].includes(key) && value !== null && value !== '') {
                                    return <li key={key}><strong>{key.replace(/_/g, ' ')}:</strong> {String(value)}</li>;
                                  }
                                  return null;
                                })}
                              </ul>
                            </div>
                          )}
                         </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default Archive;
