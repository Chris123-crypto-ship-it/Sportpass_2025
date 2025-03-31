// Keep-Alive-Skript um Cold Starts zu vermeiden
// Diese Datei kannst du auf einem kostenlosen Cron-Dienst wie cron-job.org ausführen

// Ersetze diese URLs mit deinen eigenen
const URLS_TO_PING = [
  'https://deine-vercel-domain.vercel.app',
  'https://deine-vercel-domain.vercel.app/api/tasks',
  'https://deine-render-domain.onrender.com'
];

async function pingAll() {
  console.log(`Pinging ${URLS_TO_PING.length} URLs um ${new Date().toISOString()}`);
  
  const promises = URLS_TO_PING.map(async (url) => {
    try {
      const start = Date.now();
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Keep-Alive-Ping': 'true' }
      });
      const time = Date.now() - start;
      
      console.log(`✅ ${url} - ${response.status} (${time}ms)`);
      return { url, success: true, status: response.status, time };
    } catch (error) {
      console.error(`❌ ${url} - ${error.message}`);
      return { url, success: false, error: error.message };
    }
  });
  
  return Promise.all(promises);
}

// Selbstaufruf der Funktion
pingAll().catch(console.error);

// Falls du dieses Skript auf einem anderen System ausführst, stelle sicher, dass du die Ausführung planst. 