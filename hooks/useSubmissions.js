import { useState, useEffect, useCallback } from 'react'
import { fetchWithCache } from '../utils/cacheUtils'
import { supabase } from '../utils/supabaseClient'

export function useSubmissions({ initialPage = 0, limit = 10, userEmail = null, taskId = null, status = null }) {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({
    page: initialPage,
    limit,
    hasMore: true
  })

  const fetchSubmissions = useCallback(async (page = pagination.page) => {
    setLoading(true)
    
    try {
      // Cache-Key basierend auf Parametern
      const cacheKey = `submissions-${page}-${limit}-${userEmail || 'all'}-${taskId || 'all'}-${status || 'all'}`
      
      const data = await fetchWithCache(
        cacheKey,
        async () => {
          // Basisabfrage
          let query = supabase
            .from('submissions')
            .select(`id, task_id, user_email, status, created_at, tasks(id, title)`)
            .order('created_at', { ascending: false })
            .range(page * limit, (page + 1) * limit - 1)
          
          // Filter hinzufügen
          if (userEmail) {
            query = query.eq('user_email', userEmail)
          }
          
          if (taskId) {
            query = query.eq('task_id', taskId)
          }
          
          if (status) {
            query = query.eq('status', status)
          }
          
          const { data, error } = await query
          
          if (error) throw error
          
          return data
        },
        3 * 60 * 1000 // 3 Minuten Cache
      )
      
      // Daten formatieren
      const formatted = data.map(item => ({
        ...item,
        formattedDate: new Date(item.created_at).toLocaleDateString('de-DE')
      }))
      
      setSubmissions(prev => page === 0 ? formatted : [...prev, ...formatted])
      setPagination(prev => ({
        ...prev,
        page,
        hasMore: data.length === limit
      }))
      
    } catch (err) {
      console.error('Fehler beim Laden der Submissions:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [pagination.page, limit, userEmail, taskId, status])

  // Initialer Abruf
  useEffect(() => {
    fetchSubmissions(initialPage)
  }, [initialPage, userEmail, taskId, status])

  // Mehr Daten laden
  const loadMore = useCallback(() => {
    if (pagination.hasMore && !loading) {
      fetchSubmissions(pagination.page + 1)
    }
  }, [pagination.hasMore, pagination.page, loading, fetchSubmissions])

  return {
    submissions,
    loading,
    error,
    pagination,
    loadMore,
    refresh: () => fetchSubmissions(0)
  }
} 