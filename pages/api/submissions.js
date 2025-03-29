import { supabase } from '../../utils/supabaseClient'
import { handleApiError } from '../../utils/errorHandler'

export default async function handler(req, res) {
  // Cache-Header setzen
  res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=120')
  
  const { 
    page = 0, 
    limit = 10, 
    task_id, 
    user_email, 
    status 
  } = req.query
  
  // Basisabfrage mit ausgewählten Feldern
  let query = supabase
    .from('submissions')
    .select(`
      id, 
      task_id, 
      user_email, 
      status, 
      created_at,
      tasks(id, title)
    `)
    .order('created_at', { ascending: false })
  
  // Filter hinzufügen
  if (task_id) {
    query = query.eq('task_id', task_id)
  }
  
  if (user_email) {
    query = query.eq('user_email', user_email)
  }
  
  if (status) {
    query = query.eq('status', status)
  }
  
  // Paginierung
  const from = parseInt(page) * parseInt(limit)
  const to = from + parseInt(limit) - 1
  query = query.range(from, to)
  
  try {
    const { data, error } = await query
    
    if (error) throw error
    
    // Datumsformatierung ohne große Bibliotheken
    const formatted = data.map(item => ({
      ...item,
      formattedDate: new Date(item.created_at).toLocaleDateString('de-DE')
    }))
    
    return res.status(200).json(formatted)
  } catch (error) {
    return handleApiError(res, error)
  }
} 