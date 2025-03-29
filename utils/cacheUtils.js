// Simples Frontend-Cache-System
const CACHE = {}
const DEFAULT_EXPIRY = 5 * 60 * 1000 // 5 Minuten

export function clearCache() {
  Object.keys(CACHE).forEach(key => delete CACHE[key])
}

export function invalidateCache(keyPattern) {
  Object.keys(CACHE).forEach(key => {
    if (key.includes(keyPattern)) {
      delete CACHE[key]
    }
  })
}

export async function fetchWithCache(key, fetcher, expiryMs = DEFAULT_EXPIRY) {
  // Prüfe, ob der Cache gültig ist
  if (CACHE[key] && Date.now() < CACHE[key].expiry) {
    return CACHE[key].data
  }
  
  try {
    // Hole neue Daten
    const data = await fetcher()
    
    // Speichere im Cache
    CACHE[key] = {
      data,
      expiry: Date.now() + expiryMs
    }
    
    return data
  } catch (error) {
    console.error(`Fehler beim Abruf von ${key}:`, error)
    
    // Bei Fehler: Verwende abgelaufene Cache-Daten falls vorhanden 
    if (CACHE[key]) {
      console.log(`Verwende veraltete Cache-Daten für ${key}`)
      return CACHE[key].data
    }
    
    throw error
  }
} 