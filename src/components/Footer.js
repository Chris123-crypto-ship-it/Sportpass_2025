// src/components/Footer.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaShoppingCart, FaHandshake, FaInfoCircle, FaUserFriends, 
         FaBook, FaShieldAlt, FaNewspaper, FaChevronUp, FaFacebookF, 
         FaInstagram, FaTwitter } from 'react-icons/fa';
import '../styles/Footer.css';

const Footer = () => {
  const [showSponsorsModal, setShowSponsorsModal] = useState(false);
  const [showShopModal, setShowShopModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const sponsors = [
    { name: 'Sport GmbH', logo: 'https://via.placeholder.com/100x50?text=Sport+GmbH', description: 'Unterstützt uns seit 2022 mit Sportgeräten', website: 'https://example-sport.com' },
    { name: 'Health AG', logo: 'https://via.placeholder.com/100x50?text=Health+AG', description: 'Offizieller Gesundheitspartner', website: 'https://example-health.com' },
    { name: 'Fitness Pro', logo: 'https://via.placeholder.com/100x50?text=Fitness+Pro', description: 'Stellt Trainingsmaterialien zur Verfügung', website: 'https://example-fitness.com' }
  ];

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
            <div className="social-icons">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><FaFacebookF /></a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><FaInstagram /></a>
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
              <Link to="/news" className="footer-link">
                <FaNewspaper /> Neuigkeiten
              </Link>
            </div>
          </div>
          
          <div className="footer-column">
            <h4 className="footer-heading">Kontakt</h4>
            <div className="footer-links-column">
              <Link to="/support" className="footer-link">Support</Link>
              <a href="mailto:sportpass146@gmail.com" className="footer-link">sportpass146@gmail.com</a>
              <div className="newsletter-signup">
                <p>Newsletter abonnieren:</p>
                <div className="newsletter-form">
                  <input type="email" placeholder="E-Mail-Adresse" />
                  <button type="button">Abonnieren</button>
                </div>
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
              <p>Das Projekt entstand 2023 aus der Idee heraus, die Motivation für sportliche Aktivitäten durch spielerische Elemente und Gemeinschaft zu steigern.</p>
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
    </footer>
  );
};

export default Footer;
