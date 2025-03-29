import { useEffect } from 'react'

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // Service Worker registrieren
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('/service-worker.js')
          .then(registration => {
            console.log('ServiceWorker erfolgreich registriert:', registration.scope);
          })
          .catch(error => {
            console.log('ServiceWorker Registrierung fehlgeschlagen:', error);
          });
      });
    }
  }, []);

  return <Component {...pageProps} />
}

export default MyApp 