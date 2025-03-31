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