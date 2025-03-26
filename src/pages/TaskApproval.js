import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { FaUser, FaMedal, FaCheckCircle, FaTimesCircle, FaTag } from 'react-icons/fa';
import { toast } from 'react-toastify';
import '../styles/TaskApproval.css';

const TaskApproval = () => {
  const { user } = useAuth();
  const { tasks, submissions, fetchTasks, fetchSubmissions, handleApproveSubmission, handleRejectSubmission } = useTasks();
  const [adminComment, setAdminComment] = useState('');
  const [activeSubmissionId, setActiveSubmissionId] = useState(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    fetchTasks();
    fetchSubmissions();
  }, []);

  if (!user || user.role !== 'admin') {
    return <p>Sie haben keine Berechtigung, auf diese Seite zuzugreifen.</p>;
  }

  const pendingSubmissions = submissions.filter(s => s.status === 'pending');

  const renderAdminSubmissionPreview = (submission) => {
    if (!submission.file_url) return null;
    
    if (submission.file_url.match(/\.(jpg|jpeg|png|gif)$/i) || submission.file_url.startsWith('data:image')) {
      return (
        <div className="admin-submission-preview">
          <img 
            src={submission.file_url} 
            alt="Eingereichte Datei"
            className="admin-preview-image"
          />
        </div>
      );
    }
    
    if (submission.file_url.match(/\.(mp4|webm|ogg)$/i) || submission.file_url.startsWith('data:video')) {
      return (
        <div className="admin-submission-preview">
          <video controls className="admin-preview-video">
            <source src={submission.file_url} type="video/mp4" />
            Ihr Browser unterstützt keine Videowiedergabe.
          </video>
        </div>
      );
    }
    
    return null;
  };

  const handleApprove = async (submissionId) => {
    try {
      setLoading(true);
      await handleApproveSubmission(submissionId, adminComment);
      toast.success('Aufgabe erfolgreich genehmigt!');
      setAdminComment('');
      setActiveSubmissionId(null);
    } catch (error) {
      console.error('Fehler bei der Genehmigung:', error);
      toast.error('Fehler bei der Genehmigung der Aufgabe');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (submissionId) => {
    try {
      setLoading(true);
      await handleRejectSubmission(submissionId, adminComment);
      toast.success('Aufgabe erfolgreich abgelehnt!');
      setAdminComment('');
      setActiveSubmissionId(null);
    } catch (error) {
      console.error('Fehler bei der Ablehnung:', error);
      toast.error('Fehler bei der Ablehnung der Aufgabe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="task-approval-container">
      <h1 className="task-approval-title">Aufgabenüberprüfung</h1>
      
      {loading ? (
        <div className="loading">Laden...</div>
      ) : pendingSubmissions.length === 0 ? (
        <div className="no-submissions">
          Keine ausstehenden Einsendungen zur Überprüfung vorhanden.
        </div>
      ) : (
        <div className="admin-submissions-grid">
          {pendingSubmissions.map(submission => {
            const task = tasks.find(t => t.id === submission.task_id);
            return (
              <div key={submission.id} className="admin-submission-card">
                <div className="admin-submission-header">
                  <h3>{task?.title || 'Unbekannte Aufgabe'}</h3>
                  <div className="admin-submission-info">
                    <span className="admin-user">
                      <FaUser /> {submission.user_email}
                    </span>
                    <span className="admin-category">
                      <FaTag /> {task?.category || 'Keine Kategorie'}
                    </span>
                    <span className="admin-points">
                      <FaMedal />
                      {task?.dynamic ? (
                        `${submission.submission_details?.calculated_points || 0} Punkte (${task.multiplier} pro ${task.dynamic_type === 'minutes' ? 'Minute' : 'Kilometer'})`
                      ) : (
                        `${task?.points || 0} Punkte`
                      )}
                    </span>
                  </div>
                </div>

                <div className="admin-submission-content">
                  {renderAdminSubmissionPreview(submission)}

                  <div className="admin-submission-details">
                    <textarea
                      className="admin-comment"
                      placeholder="Admin-Kommentar..."
                      value={submission.id === activeSubmissionId ? adminComment : ''}
                      onChange={(e) => {
                        setAdminComment(e.target.value);
                        setActiveSubmissionId(submission.id);
                      }}
                      onClick={() => setActiveSubmissionId(submission.id)}
                    />

                    <div className="admin-actions">
                      <button 
                        className="approve-button"
                        onClick={() => handleApprove(submission.id)}
                        disabled={loading}
                      >
                        <FaCheckCircle /> Genehmigen
                      </button>
                      <button 
                        className="reject-button"
                        onClick={() => handleReject(submission.id)}
                        disabled={loading}
                      >
                        <FaTimesCircle /> Ablehnen
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TaskApproval; 