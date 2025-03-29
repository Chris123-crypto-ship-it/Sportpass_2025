import { supabase } from '../../utils/supabaseClient'
import { handleApiError } from '../../utils/errorHandler'

export default async function handler(req, res) {
  // Cache-Header setzen für CDN-Caching
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600')
  
  const { page = 0, limit = 10, category, status, search } = req.query
  
  // Basisabfrage mit ausgewählten Feldern
  let query = supabase
    .from('tasks')
    .select('id, title, points, category, difficulty, multiplier, dynamic, description, expiration_date, is_hidden')
    .order('created_at', { ascending: false })
  
  // Filter hinzufügen, wenn sie vorhanden sind
  if (category) {
    query = query.eq('category', category)
  }
  
  // Status-Filter anwenden - neue Funktionalität
  if (status === 'ausstehend') {
    query = query.eq('is_hidden', false)
    query = query.gt('expiration_date', new Date().toISOString())
  } else if (status === 'abgeschlossen') {
    query = query.or(`is_hidden.eq.true,expiration_date.lt.${new Date().toISOString()}`)
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
    
    // Filter-Parameter für das Zählen anwenden
    let countQuery = supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
    
    if (category) {
      countQuery = countQuery.eq('category', category)
    }
    
    if (status === 'ausstehend') {
      countQuery = countQuery.eq('is_hidden', false)
      countQuery = countQuery.gt('expiration_date', new Date().toISOString())
    } else if (status === 'abgeschlossen') {
      countQuery = countQuery.or(`is_hidden.eq.true,expiration_date.lt.${new Date().toISOString()}`)
    }
    
    if (search) {
      countQuery = countQuery.ilike('title', `%${search}%`)
    }
    
    const { count: totalCount } = await countQuery
    
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