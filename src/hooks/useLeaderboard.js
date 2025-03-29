import { useState, useEffect, useCallback } from 'react'
import { fetchWithCache } from '../utils/cacheUtils'
import { supabase } from '../utils/supabaseClient'

export function useLeaderboard(limit = 10) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({
    page: 0,
    hasMore: true
  })

  const fetchUsers = useCallback(async (page = 0) => {
    setLoading(true)
    
    try {
      const cacheKey = `leaderboard-${page}-${limit}`
      
      const data = await fetchWithCache(
        cacheKey,
        async () => {
          const { data, error } = await supabase
            .from('users')
            .select('id, name, email, points')
            .order('points', { ascending: false })
            .range(page * limit, (page + 1) * limit - 1)
          
          if (error) throw error
          
          return data
        },
        3 * 60 * 1000 // 3 Minuten Cache
      )
      
      if (page === 0) {
        setUsers(data)
      } else {
        setUsers(prev => [...prev, ...data])
      }
      
      setPagination({
        page,
        hasMore: data.length === limit
      })
      
    } catch (err) {
      console.error('Fehler beim Laden des Leaderboards:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [limit])

  // Initialer Abruf
  useEffect(() => {
    fetchUsers(0)
  }, [])

  // Mehr Daten laden
  const loadMore = useCallback(() => {
    if (pagination.hasMore && !loading) {
      fetchUsers(pagination.page + 1)
    }
  }, [pagination.hasMore, pagination.page, loading, fetchUsers])

  return {
    users,
    loading,
    error,
    pagination,
    loadMore,
    refresh: () => fetchUsers(0)
  }
} 