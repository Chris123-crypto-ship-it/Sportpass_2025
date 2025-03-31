import { useState, useEffect } from 'react'
import { fetchWithCache } from '../utils/cacheUtils'
import { supabase } from '../utils/supabaseClient'

export function useUser(email) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchUser() {
      if (!email) {
        setLoading(false)
        return
      }

      setLoading(true)
      
      try {
        const data = await fetchWithCache(
          `user-${email}`,
          async () => {
            const { data, error } = await supabase
              .from('users')
              .select('id, name, email, role, points, goals')
              .eq('email', email)
              .single()
            
            if (error) throw error
            
            return data
          },
          60 * 1000 // 1 Minute Cache (kurz für Benutzerdaten)
        )
        
        setUser(data)
      } catch (err) {
        console.error('Fehler beim Laden des Benutzers:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [email])

  return { user, loading, error }
} 