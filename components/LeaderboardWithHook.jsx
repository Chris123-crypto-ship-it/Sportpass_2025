import { useRef, useEffect } from 'react'
import { useLeaderboard } from '../hooks/useLeaderboard'

export default function Leaderboard() {
  const { 
    users, 
    loading, 
    error, 
    pagination, 
    loadMore 
  } = useLeaderboard(10)
  
  const scrollContainerRef = useRef(null)

  // Scroll-Handler
  const handleScroll = () => {
    if (!scrollContainerRef.current) return
    
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
    
    // Wenn der Nutzer nahe am Ende ist und mehr Daten verfügbar sind
    if (scrollTop + clientHeight >= scrollHeight - 100 && pagination.hasMore && !loading) {
      loadMore()
    }
  }

  // Scroll-Event-Listener
  useEffect(() => {
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [pagination.hasMore, loading])

  if (error) {
    return <div className="error-message">Fehler: {error}</div>
  }

  return (
    <div className="leaderboard-container">
      <h2 className="leaderboard-title">Bestenliste</h2>
      
      <div 
        ref={scrollContainerRef} 
        className="leaderboard-scroll-container"
      >
        {users.length > 0 ? (
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Rang</th>
                <th>Name</th>
                <th>Punkte</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={user.id} className={index < 3 ? `rank-${index + 1}` : ''}>
                  <td>{index + 1}</td>
                  <td>{user.name}</td>
                  <td>{user.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-data-message">
            {loading ? 'Lade Bestenliste...' : 'Keine Benutzer gefunden'}
          </div>
        )}
        
        {loading && users.length > 0 && (
          <div className="loading-more">Lade weitere Benutzer...</div>
        )}
      </div>
    </div>
  )
} 