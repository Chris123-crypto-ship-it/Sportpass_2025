import { supabase } from '../../utils/supabaseClient'
import { handleApiError } from '../../utils/errorHandler'

export default async function handler(req, res) {
  // Cache-Header setzen für CDN-Caching
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600')
  
  const { page = 0, limit = 10, category, search } = req.query
  
  // Basisabfrage mit ausgewählten Feldern
  let query = supabase
    .from('tasks')
    .select('id, title, points, category, difficulty, multiplier, dynamic, description')
    .order('created_at', { ascending: false })
  
  // Filter hinzufügen, wenn sie vorhanden sind
  if (category) {
    query = query.eq('category', category)
  }
  
  if (search) {
    query = query.ilike('title', `%${search}%`)
  }
  
  // Paginierung
  const from = parseInt(page) * parseInt(limit)
  const to = from + parseInt(limit) - 1
  query = query.range(from, to)
  
  try {
    const { data, error, count } = await query
    
    if (error) throw error
    
    // Gesamtanzahl der Tasks abrufen (für Paginierung im Frontend)
    const { count: totalCount } = await supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
    
    return res.status(200).json({
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount
      }
    })
  } catch (error) {
    return handleApiError(res, error)
  }
} 