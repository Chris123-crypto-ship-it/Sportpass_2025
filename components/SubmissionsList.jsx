import { useCallback } from 'react'
import { useSubmissions } from '../hooks/useSubmissions'

export default function SubmissionsList({ userEmail, taskId, status }) {
  const { 
    submissions, 
    loading, 
    error, 
    pagination, 
    loadMore, 
    refresh 
  } = useSubmissions({ 
    initialPage: 0, 
    limit: 10, 
    userEmail, 
    taskId, 
    status 
  })

  // Intersection Observer für unendliches Scrollen
  const lastSubmissionRef = useCallback(node => {
    if (loading) return
    
    if (node) {
      const observer = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && pagination.hasMore) {
          loadMore()
        }
      }, { threshold: 0.5 })
      
      observer.observe(node)
      
      return () => observer.disconnect()
    }
  }, [loading, pagination.hasMore, loadMore])

  if (error) {
    return <div className="error-message">Fehler: {error}</div>
  }

  return (
    <div className="submissions-list">
      {submissions.map((submission, index) => (
        <div 
          key={submission.id} 
          ref={index === submissions.length - 1 ? lastSubmissionRef : null}
          className="submission-item"
        >
          <div className="submission-header">
            <h3>{submission.tasks?.title || 'Aufgabe'}</h3>
            <span className={`status-badge status-${submission.status}`}>
              {submission.status}
            </span>
          </div>
          <div className="submission-details">
            <p>Benutzer: {submission.user_email}</p>
            <p>Datum: {submission.formattedDate}</p>
          </div>
        </div>
      ))}
      
      {loading && (
        <div className="loading-indicator">Lädt weitere Einreichungen...</div>
      )}
      
      {!pagination.hasMore && submissions.length > 0 && (
        <div className="end-message">Keine weiteren Einreichungen verfügbar</div>
      )}
      
      {submissions.length === 0 && !loading && (
        <div className="empty-message">Keine Einreichungen gefunden</div>
      )}
    </div>
  )
} 