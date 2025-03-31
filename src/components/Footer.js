// src/components/Footer.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaShoppingCart, FaHandshake, FaInfoCircle, FaUserFriends, 
         FaBook, FaShieldAlt, FaNewspaper, FaChevronUp, FaFacebookF, 
         FaInstagram, FaTwitter, FaCalendarAlt, FaTrophy, FaQuestion } from 'react-icons/fa';
import '../styles/Footer.css';

const Footer = () => {
  const [showSponsorsModal, setShowSponsorsModal] = useState(false);
  const [showShopModal, setShowShopModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showFaqModal, setShowFaqModal] = useState(false);

  const sponsors = [
    { name: 'Sport GmbH', logo: 'https://via.placeholder.com/100x50?text=Sport+GmbH', description: 'Unterstützt uns seit 2022 mit Sportgeräten', website: 'https://example-sport.com' },
    { name: 'Health AG', logo: 'https://via.placeholder.com/100x50?text=Health+AG', description: 'Offizieller Gesundheitspartner', website: 'https://example-health.com' },
    { name: 'Fitness Pro', logo: 'https://via.placeholder.com/100x50?text=Fitness+Pro', description: 'Stellt Trainingsmaterialien zur Verfügung', website: 'https://example-fitness.com' }
  ];

  // Zufälliger Motivationsspruch
  const motivationalQuotes = [
    "Der Weg zum Erfolg beginnt mit einem ersten Schritt.",
    "Deine einzige Konkurrenz ist die Person, die du gestern warst.",
    "Fitness ist kein Ziel, sondern ein Lebensstil.",
    "Gib jedem Tag die Chance, der schönste deines Lebens zu werden.",
    "Erfolg hat drei Buchstaben: TUN."
  ];
  
  const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="footer">
      <button className="scroll-to-top" onClick={handleScrollToTop}>
        <FaChevronUp />
      </button>
      
      <div className="footer-content">
        <div className="footer-columns">
          <div className="footer-column">
            <h4 className="footer-heading">SportPass</h4>
            <p className="footer-description">Dein digitaler Begleiter für sportliche Aktivitäten und Herausforderungen.</p>
            <div className="quote-box">
              <q>{randomQuote}</q>
            </div>
            <div className="social-icons">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><FaFacebookF /></a>
              <a href="https://instagram.com/sportpass_2025" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><FaInstagram /></a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter"><FaTwitter /></a>
            </div>
          </div>
          
          <div className="footer-column">
            <h4 className="footer-heading">Links</h4>
            <div className="footer-links-column">
              <button className="footer-link-button" onClick={() => setShowAboutModal(true)}>
                <FaUserFriends /> Über uns
              </button>
              <button className="footer-link-button" onClick={() => setShowSponsorsModal(true)}>
                <FaHandshake /> Sponsoren
              </button>
              <button className="footer-link-button" onClick={() => setShowShopModal(true)}>
                <FaShoppingCart /> Shop
              </button>
              <button className="footer-link-button" onClick={() => setShowPrivacyModal(true)}>
                <FaShieldAlt /> Datenschutz
              </button>
              <button className="footer-link-button" onClick={() => setShowFaqModal(true)}>
                <FaQuestion /> FAQ
              </button>
            </div>
          </div>
          
          <div className="footer-column">
            <h4 className="footer-heading">Wichtige Infos</h4>
            <div className="important-info-box">
              <div className="info-item">
                <FaCalendarAlt />
                <div>
                  <h5>Neue Aufgaben</h5>
                  <p>Jeden Sonntag werden neue Aufgaben freigeschaltet!</p>
                </div>
              </div>
              
              <div className="info-item">
                <FaTrophy />
                <div>
                  <h5>Leaderboard-Update</h5>
                  <p>Die Bestenliste wird täglich aktualisiert.</p>
                </div>
              </div>
              
              <div className="contact-info">
                <Link to="/support" className="footer-link">Support</Link>
                <a href="mailto:sportpass146@gmail.com" className="footer-link">sportpass146@gmail.com</a>
              </div>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} SportPass. Alle Rechte vorbehalten.</p>
        </div>
      </div>

      {/* Sponsoren Modal */}
      {showSponsorsModal && (
        <div className="modal-overlay" onClick={() => setShowSponsorsModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Unsere Sponsoren</h2>
            <p>Wir danken unseren Sponsoren für die Unterstützung des Sportpass-Projekts:</p>
            
            <div className="sponsors-grid">
              {sponsors.map((sponsor, index) => (
                <div key={index} className="sponsor-card">
                  <div className="sponsor-logo">
                    <img src={sponsor.logo} alt={`${sponsor.name} Logo`} />
                  </div>
                  <h3>{sponsor.name}</h3>
                  <p>{sponsor.description}</p>
                  <a href={sponsor.website} target="_blank" rel="noopener noreferrer" className="sponsor-link">
                    Website besuchen
                  </a>
                </div>
              ))}
            </div>
            
            <p className="sponsor-info">
              Möchtest du auch Sponsor werden? <a href="mailto:sportpass146@gmail.com">Kontaktiere uns</a>
            </p>
            
            <button className="modal-close" onClick={() => setShowSponsorsModal(false)}>
              Schließen
            </button>
          </div>
        </div>
      )}

      {/* Shop Modal */}
      {showShopModal && (
        <div className="modal-overlay" onClick={() => setShowShopModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Sportpass Shop</h2>
            
            <div className="out-of-service-notice">
              <FaInfoCircle />
              <p>Unser Shop befindet sich derzeit außer Betrieb.<br />Wir arbeiten daran, ihn so schnell wie möglich für dich verfügbar zu machen.</p>
            </div>
            
            <p className="coming-soon-message">Bald erhältlich:</p>
            <div className="shop-grid">
              <div className="shop-item coming-soon">
                <div className="shop-item-image">
                  <img src="https://via.placeholder.com/150?text=T-Shirt" alt="Sport T-Shirt" />
                  <div className="coming-soon-overlay">Bald verfügbar</div>
                </div>
                <h3>Sport T-Shirt</h3>
                <p className="shop-item-price">24,99 €</p>
              </div>
              <div className="shop-item coming-soon">
                <div className="shop-item-image">
                  <img src="https://via.placeholder.com/150?text=Flasche" alt="Trinkflasche" />
                  <div className="coming-soon-overlay">Bald verfügbar</div>
                </div>
                <h3>Trinkflasche</h3>
                <p className="shop-item-price">14,99 €</p>
              </div>
              <div className="shop-item coming-soon">
                <div className="shop-item-image">
                  <img src="https://via.placeholder.com/150?text=Hoodie" alt="Sportpass Hoodie" />
                  <div className="coming-soon-overlay">Bald verfügbar</div>
                </div>
                <h3>Sportpass Hoodie</h3>
                <p className="shop-item-price">39,99 €</p>
              </div>
            </div>
            
            <p className="shop-info">
              Alle Einnahmen aus dem Shop werden das Sportpass-Projekt unterstützen.
            </p>
            
            <button className="modal-close" onClick={() => setShowShopModal(false)}>
              Schließen
            </button>
          </div>
        </div>
      )}

      {/* Über uns Modal */}
      {showAboutModal && (
        <div className="modal-overlay" onClick={() => setShowAboutModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Über Sportpass</h2>
            <p>Sportpass ist ein innovatives Projekt, das Menschen dabei unterstützt, einen aktiveren und gesünderen Lebensstil zu führen.</p>
            
            <div className="about-section">
              <h3>Unsere Mission</h3>
              <p>Wir möchten Menschen jeden Alters motivieren, regelmäßig Sport zu treiben und sich körperlich zu betätigen. Durch unser Aufgabensystem und die Vergabe von Punkten schaffen wir Anreize und machen Bewegung zu einem spannenden Erlebnis.</p>
            </div>
            
            <div className="about-section">
              <h3>Das Team</h3>
              <p>Hinter Sportpass steht ein engagiertes Team aus Sportenthusiasten, Entwicklern und Gesundheitsexperten, die gemeinsam daran arbeiten, die Plattform stetig zu verbessern und zu erweitern.</p>
            </div>
            
            <div className="about-section">
              <h3>Entstehung</h3>
              <p>Das Projekt entstand 2025 aus der Idee heraus, die Motivation für sportliche Aktivitäten durch spielerische Elemente und Gemeinschaft zu steigern.</p>
            </div>
            
            <button className="modal-close" onClick={() => setShowAboutModal(false)}>
              Schließen
            </button>
          </div>
        </div>
      )}

      {/* Datenschutz Modal */}
      {showPrivacyModal && (
        <div className="modal-overlay" onClick={() => setShowPrivacyModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Datenschutzerklärung</h2>
            
            <div className="privacy-section">
              <h3>1. Allgemeine Informationen</h3>
              <p>Diese Datenschutzerklärung informiert über die Art, den Umfang und die Zwecke der Erhebung und Verwendung personenbezogener Daten durch Sportpass.</p>
            </div>
            
            <div className="privacy-section">
              <h3>2. Verantwortliche Stelle</h3>
              <p>Verantwortlich für die Datenerhebung und -verarbeitung ist das Sportpass-Team, erreichbar unter sportpass146@gmail.com.</p>
            </div>
            
            <div className="privacy-section">
              <h3>3. Erhobene Daten</h3>
              <p>Bei der Nutzung von Sportpass erheben wir folgende Daten:</p>
              <ul>
                <li>Nutzername und E-Mail-Adresse für die Registrierung</li>
                <li>Aufgabeneinsendungen und deren Inhalte</li>
                <li>Erreichte Punkte und Aktivitätsdaten</li>
              </ul>
            </div>
            
            <div className="privacy-section">
              <h3>4. Zweck der Datenverarbeitung</h3>
              <p>Die Daten werden ausschließlich zur Bereitstellung der Sportpass-Funktionen, zur Verwaltung der Nutzerkonten und zur Verbesserung des Dienstes verwendet.</p>
            </div>
            
            <button className="modal-close" onClick={() => setShowPrivacyModal(false)}>
              Schließen
            </button>
          </div>
        </div>
      )}

      {/* FAQ Modal */}
      {showFaqModal && (
        <div className="modal-overlay" onClick={() => setShowFaqModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Häufig gestellte Fragen</h2>
            
            <div className="faq-section">
              <div className="faq-item">
                <h3>Wie funktioniert Sportpass?</h3>
                <p>Sportpass bietet dir regelmäßig neue sportliche Aufgaben, die du erfüllen und dokumentieren kannst. Für jede erfolgreich abgeschlossene Aufgabe erhältst du Punkte, die in der Bestenliste angezeigt werden.</p>
              </div>
              
              <div className="faq-item">
                <h3>Wann werden Punkte vergeben?</h3>
                <p>Nachdem du eine Aufgabe eingereicht hast, wird sie von unserem Team überprüft. Nach erfolgreicher Prüfung werden die Punkte deinem Konto gutgeschrieben. Dieser Prozess kann etwas Zeit in Anspruch nehmen.</p>
              </div>
              
              <div className="faq-item">
                <h3>Wann gibt es neue Aufgaben?</h3>
                <p>Jeden Sonntag werden neue Aufgaben freigeschaltet.</p>
              </div>
              
              <div className="faq-item">
                <h3>Kann ich auch frühere Aufgaben erledigen?</h3>
                <p>Ja, du kannst auch ältere Aufgaben bearbeiten, solange sie nicht abgelaufen sind. Bei jeder Aufgabe ist ein Ablaufdatum angegeben.</p>
              </div>
              
              <div className="faq-item">
                <h3>Wie kann ich mein Passwort zurücksetzen?</h3>
                <p>Auf der Login-Seite findest du einen "Passwort vergessen" Link. Gib dort deine E-Mail-Adresse ein, und wir senden dir einen Link zum Zurücksetzen deines Passworts.</p>
              </div>
            </div>
            
            <p className="faq-more-help">Weitere Fragen? <Link to="/support">Kontaktiere unseren Support</Link></p>
            
            <button className="modal-close" onClick={() => setShowFaqModal(false)}>
              Schließen
            </button>
          </div>
        </div>
      )}
    </footer>
  );
};

export default Footer;
