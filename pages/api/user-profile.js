import { supabase } from '../../utils/supabaseClient'
import { handleApiError } from '../../utils/errorHandler'

export default async function handler(req, res) {
  const { email } = req.query
  
  if (!email) {
    return res.status(400).json({ error: 'Email ist erforderlich' })
  }
  
  try {
    // Nur benötigte Felder abrufen
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, role, points, goals')
      .eq('email', email)
      .single()
    
    if (error) throw error
    
    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' })
    }
    
    // Cache-Header für authentifizierte Benutzer (kürzere Zeit)
    res.setHeader('Cache-Control', 'private, max-age=60')
    return res.status(200).json(user)
  } catch (error) {
    return handleApiError(res, error)
  }
} 