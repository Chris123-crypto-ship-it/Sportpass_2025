import { useState, useEffect, useCallback } from 'react'
import { fetchWithCache } from '../utils/cacheUtils'
import { supabase } from '../utils/supabaseClient'

export function useTasks({ 
  initialPage = 0, 
  limit = 10, 
  category = null,
  status = null 
}) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({
    page: initialPage,
    limit,
    total: 0,
    hasMore: true
  })

  const fetchTasks = useCallback(async (page = pagination.page) => {
    setLoading(true)
    
    try {
      // Cache-Key basierend auf Parametern
      const cacheKey = `tasks-${page}-${limit}-${category || 'all'}-${status || 'all'}`
      
      const response = await fetchWithCache(
        cacheKey,
        async () => {
          // Optimierte Abfrage
          let query = supabase
            .from('tasks')
            .select('id, title, points, category, difficulty, description, dynamic', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(page * limit, (page + 1) * limit - 1)
          
          // Kategorie-Filter anwenden, wenn vorhanden
          if (category) {
            query = query.eq('category', category)
          }
          
          // Status-Filter anwenden, wenn vorhanden
          if (status === 'ausstehend') {
            // Nur Aufgaben mit is_hidden=false und Aufgaben, die noch nicht abgelaufen sind
            query = query.eq('is_hidden', false)
            query = query.gt('expiration_date', new Date().toISOString())
          } else if (status === 'abgeschlossen') {
            // Abgeschlossene oder abgelaufene Aufgaben
            query = query.or(`is_hidden.eq.true,expiration_date.lt.${new Date().toISOString()}`)
          }
          
          const { data, error, count } = await query
          
          if (error) throw error
          
          return { data, count }
        },
        3 * 60 * 1000 // 3 Minuten Cache
      )
      
      const { data, count } = response
      
      setTasks(prev => page === 0 ? data : [...prev, ...data])
      setPagination(prev => ({
        ...prev,
        page,
        total: count,
        hasMore: (page + 1) * limit < count
      }))
      
    } catch (err) {
      console.error('Fehler beim Laden der Tasks:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [pagination.page, limit, category, status])

  // Initialer Abruf
  useEffect(() => {
    fetchTasks(initialPage)
  }, [initialPage, category, status])

  // Mehr Daten laden
  const loadMore = useCallback(() => {
    if (pagination.hasMore && !loading) {
      fetchTasks(pagination.page + 1)
    }
  }, [pagination.hasMore, pagination.page, loading, fetchTasks])

  return {
    tasks,
    loading,
    error,
    pagination,
    loadMore,
    refresh: () => fetchTasks(0)
  }
} 