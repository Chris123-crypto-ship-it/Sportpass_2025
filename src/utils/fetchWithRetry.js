import config from '../config';

/**
 * Führt einen Fetch-Aufruf mit Timeout und automatischen Wiederholungsversuchen durch
 * 
 * @param {string} url - Die URL für den Fetch-Aufruf
 * @param {Object} options - Die Optionen für den Fetch-Aufruf
 * @param {number} timeout - Timeout in Millisekunden, nach dem der Aufruf abgebrochen wird
 * @param {number} maxRetries - Maximale Anzahl an Wiederholungsversuchen
 * @param {number} retryDelay - Verzögerung zwischen Wiederholungsversuchen in Millisekunden
 * @returns {Promise<Response>} - Die Fetch-Response
 */
export const fetchWithRetry = async (
  url,
  options = {},
  timeout = config.PERFORMANCE.TIMEOUTS.DEFAULT_TIMEOUT,
  maxRetries = config.PERFORMANCE.RETRY.MAX_RETRIES,
  retryDelay = config.PERFORMANCE.RETRY.RETRY_DELAY
) => {
  // Abbruch-Controller für Timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  // Optionen mit Abbruch-Signal erweitern
  const fetchOptions = {
    ...options,
    signal: controller.signal
  };

  // Versuche mit Wiederholungen
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, fetchOptions);
      
      // Timeout-Timer löschen
      clearTimeout(timeoutId);
      
      // HTTP-Fehler als eigene Exceptions werfen
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP Error ${response.status}: ${errorText}`);
      }
      
      return response;
    } catch (error) {
      // Speichere den letzten Fehler
      lastError = error;
      
      // Bei Abbruch nicht erneut versuchen
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      // Beim letzten Versuch keine Verzögerung mehr
      if (attempt === maxRetries) {
        break;
      }
      
      // Warte zwischen den Versuchen
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      
      // Bei jedem neuen Versuch die Wartezeit erhöhen (exponentielles Backoff)
      retryDelay *= 1.5;
    }
  }
  
  // Nach allen Versuchen noch Timeout-Timer aufräumen
  clearTimeout(timeoutId);
  
  // Werfe den letzten Fehler
  throw lastError || new Error('Request failed after multiple attempts');
};

/**
 * Führt einen Fetch-Aufruf für JSON-Daten mit Retry-Logik durch
 */
export const fetchJsonWithRetry = async (url, options = {}, timeout, maxRetries, retryDelay) => {
  const response = await fetchWithRetry(url, options, timeout, maxRetries, retryDelay);
  return response.json();
};

export default fetchWithRetry; 