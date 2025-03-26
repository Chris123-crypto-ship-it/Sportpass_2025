// API-Konfiguration für verschiedene Umgebungen
<<<<<<< HEAD
const config = {
  // API-URL je nach Umgebung
  API_URL: process.env.NODE_ENV === 'production' 
    ? 'https://sportpass-2025.onrender.com'
    : 'http://localhost:10000',
  
  // Performance-Konfiguration
  PERFORMANCE: {
    // Cache-Einstellungen
    CACHE: {
      // Standard-Cache-Dauer in Millisekunden (5 Minuten)
      DEFAULT_TTL: 5 * 60 * 1000,
      
      // Cache-Dauer für Leaderboard-Daten
      LEADERBOARD_TTL: 5 * 60 * 1000,
      
      // Cache-Dauer für Tasks
      TASKS_TTL: 10 * 60 * 1000,
      
      // Cache-Dauer für Submissions (kürzer, da diese häufiger aktualisiert werden)
      SUBMISSIONS_TTL: 60 * 1000
    },
    
    // Paginierung
    PAGINATION: {
      // Anzahl der Einträge pro Seite für verschiedene Komponenten
      TASKS_PER_PAGE: 6,
      LEADERBOARD_ITEMS_PER_PAGE: 15,
      SUBMISSIONS_PER_PAGE: 5
    },
    
    // Timeouts für Anfragen in Millisekunden
    TIMEOUTS: {
      DEFAULT_TIMEOUT: 10000,
      SUBMISSIONS_TIMEOUT: 15000,
      FILE_UPLOAD_TIMEOUT: 30000
    },
    
    // Retry-Konfiguration
    RETRY: {
      MAX_RETRIES: 3,
      RETRY_DELAY: 1000  // 1 Sekunde Wartezeit zwischen Versuchen
    }
  }
};

export default config; 
=======
const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://sportpass-2025.onrender.com' // Aktualisierte URL für den gehosteten Backend
  : 'http://localhost:3001';

export default {
  API_URL
}; 
>>>>>>> dcb46b5 (neustart)
