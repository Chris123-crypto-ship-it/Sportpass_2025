import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { FaUser, FaMedal, FaCheckCircle, FaTimesCircle, FaTag, FaAngleLeft, FaAngleRight } from 'react-icons/fa';
import { toast } from 'react-toastify';
import '../styles/TaskApproval.css';

const TaskApproval = () => {
  const { user } = useAuth();
  const { tasks, submissions, fetchTasks, fetchSubmissions, handleApproveSubmission, handleRejectSubmission } = useTasks();
  const [adminComment, setAdminComment] = useState('');
  const [activeSubmissionId, setActiveSubmissionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        await fetchTasks();
        await fetchSubmissions();
      } catch (error) {
        console.error('Fehler beim Laden der Daten:', error);
        toast.error('Daten konnten nicht geladen werden. Bitte versuche es später erneut.');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  useEffect(() => {
    if (submissions && submissions.length > 0) {
      const pending = submissions.filter(s => s.status === 'pending');
      setFilteredSubmissions(pending);
    }
  }, [submissions]);

  if (!user || user.role !== 'admin') {
    return <p>Sie haben keine Berechtigung, auf diese Seite zuzugreifen.</p>;
  }

  // Paginierungslogik
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSubmissions = filteredSubmissions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

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
      
      // Aktualisiere die gefilterten Submissions nach dem Genehmigen
      setFilteredSubmissions(prevSubmissions => 
        prevSubmissions.filter(s => s.id !== submissionId)
      );
      
      // Überprüfe, ob die aktuelle Seite noch Elemente hat
      if (currentSubmissions.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
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
      
      // Aktualisiere die gefilterten Submissions nach der Ablehnung
      setFilteredSubmissions(prevSubmissions => 
        prevSubmissions.filter(s => s.id !== submissionId)
      );
      
      // Überprüfe, ob die aktuelle Seite noch Elemente hat
      if (currentSubmissions.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
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
      ) : filteredSubmissions.length === 0 ? (
        <div className="no-submissions">
          Keine ausstehenden Einsendungen zur Überprüfung vorhanden.
        </div>
      ) : (
        <>
          <div className="admin-submissions-grid">
            {currentSubmissions.map(submission => {
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

          {totalPages > 1 && (
            <div className="pagination">
              <button 
                onClick={() => paginate(currentPage - 1)} 
                disabled={currentPage === 1}
                className="pagination-button"
              >
                <FaAngleLeft />
              </button>
              <span className="page-info">{currentPage} / {totalPages}</span>
              <button 
                onClick={() => paginate(currentPage + 1)} 
                disabled={currentPage === totalPages}
                className="pagination-button"
              >
                <FaAngleRight />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TaskApproval; 