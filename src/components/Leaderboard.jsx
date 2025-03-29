import { useState, useEffect, useRef } from 'react'
import { supabase } from '../utils/supabaseClient'
import { fetchWithCache } from '../utils/cacheUtils'

export default function Leaderboard() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const scrollContainerRef = useRef(null)
  const USERS_PER_PAGE = 10

  const fetchUsers = async (currentPage = 0) => {
    try {
      setLoading(true)
      
      const cacheKey = `leaderboard-${currentPage}`
      
      const data = await fetchWithCache(
        cacheKey,
        async () => {
          const { data, error } = await supabase
            .from('users')
            .select('id, name, email, points')
            .order('points', { ascending: false })
            .range(currentPage * USERS_PER_PAGE, (currentPage + 1) * USERS_PER_PAGE - 1)
          
          if (error) throw error
          
          return data
        },
        5 * 60 * 1000 // 5 Minuten Cache
      )
      
      if (currentPage === 0) {
        setUsers(data)
      } else {
        setUsers(prev => [...prev, ...data])
      }
      
      setHasMore(data.length === USERS_PER_PAGE)
      
    } catch (err) {
      console.error('Fehler beim Laden des Leaderboards:', err)
      setError('Leaderboard konnte nicht geladen werden')
    } finally {
      setLoading(false)
    }
  }

  // Initialer Abruf
  useEffect(() => {
    fetchUsers()
  }, [])

  // Scroll-Handler
  const handleScroll = () => {
    if (!scrollContainerRef.current) return
    
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
    
    // Wenn der Nutzer nahe am Ende ist und mehr Daten verfügbar sind
    if (scrollTop + clientHeight >= scrollHeight - 100 && hasMore && !loading) {
      setPage(prev => prev + 1)
      fetchUsers(page + 1)
    }
  }

  // Scroll-Event-Listener
  useEffect(() => {
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [hasMore, loading, page])

  return (
    <div className="leaderboard-container">
      <h2 className="leaderboard-title">Bestenliste</h2>
      
      <div 
        ref={scrollContainerRef} 
        className="leaderboard-scroll-container"
        style={{
          maxHeight: '500px',
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: '#ccc #f5f5f5'
        }}
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

      <style jsx>{`
        .leaderboard-container {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          padding: 15px;
          margin-bottom: 30px;
        }
        
        .leaderboard-title {
          font-size: 1.5rem;
          margin-bottom: 15px;
          color: #333;
          text-align: center;
        }
        
        .leaderboard-scroll-container::-webkit-scrollbar {
          width: 8px;
        }
        
        .leaderboard-scroll-container::-webkit-scrollbar-track {
          background: #f5f5f5;
          border-radius: 4px;
        }
        
        .leaderboard-scroll-container::-webkit-scrollbar-thumb {
          background-color: #ccc;
          border-radius: 4px;
        }
        
        .leaderboard-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .leaderboard-table th,
        .leaderboard-table td {
          padding: 12px 15px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }
        
        .leaderboard-table th {
          background-color: #f5f5f5;
          font-weight: 500;
          color: #555;
          position: sticky;
          top: 0;
          z-index: 1;
        }
        
        .leaderboard-table tbody tr:hover {
          background-color: #f9f9f9;
        }
        
        .rank-1 {
          background-color: rgba(255, 215, 0, 0.1);
        }
        
        .rank-2 {
          background-color: rgba(192, 192, 192, 0.1);
        }
        
        .rank-3 {
          background-color: rgba(205, 127, 50, 0.1);
        }
        
        .rank-1 td:first-child {
          color: #FFD700;
          font-weight: bold;
        }
        
        .rank-2 td:first-child {
          color: #C0C0C0;
          font-weight: bold;
        }
        
        .rank-3 td:first-child {
          color: #CD7F32;
          font-weight: bold;
        }
        
        .loading-more {
          text-align: center;
          padding: 15px;
          color: #666;
          font-style: italic;
        }
        
        .no-data-message {
          text-align: center;
          padding: 30px;
          color: #888;
          font-style: italic;
        }
      `}</style>
    </div>
  )
} 