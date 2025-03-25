import React from 'react';
import '../styles/Support.css';

const Support = () => {
  return (
    <div className="support-container">
      <h1>Support</h1>
      
      <div className="support-content">
        <p>Bei Fragen oder Problemen mit der SportPass-App können Sie uns gerne kontaktieren:</p>
        
        <div className="support-contact">
          <h2>Kontakt</h2>
          <p>
            <strong>E-Mail:</strong> <a href="mailto:sportpass146@gmail.com">sportpass146@gmail.com</a>
          </p>
        </div>

        <div className="support-info">
          <h2>Hilfreiche Informationen</h2>
          <p>Um Ihnen schneller helfen zu können, geben Sie bitte folgende Informationen an:</p>
          <ul>
            <li>Ihr Benutzername</li>
            <li>Eine detaillierte Beschreibung des Problems</li>
            <li>Screenshots (falls möglich)</li>
            <li>Welchen Browser und welches Gerät Sie verwenden</li>
          </ul>
        </div>
        
        <div className="support-faq">
          <h2>Häufig gestellte Fragen</h2>
          
          <div className="faq-item">
            <h3>Wie kann ich mein Passwort zurücksetzen?</h3>
            <p>Klicken Sie auf der Login-Seite auf "Passwort vergessen" und folgen Sie den Anweisungen.</p>
          </div>
          
          <div className="faq-item">
            <h3>Wie kann ich meine E-Mail-Adresse verifizieren?</h3>
            <p>Nach der Registrierung erhalten Sie eine E-Mail mit einem Verifizierungslink. Klicken Sie auf diesen Link, um Ihre E-Mail-Adresse zu bestätigen.</p>
          </div>
          
          <div className="faq-item">
            <h3>Ich habe keine Verifizierungs-E-Mail erhalten</h3>
            <p>Überprüfen Sie bitte Ihren Spam-Ordner. Falls Sie dort auch keine E-Mail finden, kontaktieren Sie uns.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support; 