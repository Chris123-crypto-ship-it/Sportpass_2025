// API-Konfiguration für verschiedene Umgebungen
const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://sportpass-app.onrender.com' // Render verwendet seinen eigenen Port-Mapping
  : 'http://localhost:3001';

export default {
  API_URL
}; 