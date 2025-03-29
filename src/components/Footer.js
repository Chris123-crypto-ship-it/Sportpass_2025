// src/components/Footer.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaShoppingCart, FaHandshakeAlt, FaInfoCircle } from 'react-icons/fa';
import '../styles/Footer.css';

const Footer = () => {
  const [showSponsorsModal, setShowSponsorsModal] = useState(false);
  const [showShopModal, setShowShopModal] = useState(false);

  const sponsors = [
    { name: 'Sport GmbH', logo: 'https://via.placeholder.com/100x50?text=Sport+GmbH', description: 'Unterstützt uns seit 2022 mit Sportgeräten', website: 'https://example-sport.com' },
    { name: 'Health AG', logo: 'https://via.placeholder.com/100x50?text=Health+AG', description: 'Offizieller Gesundheitspartner', website: 'https://example-health.com' },
    { name: 'Fitness Pro', logo: 'https://via.placeholder.com/100x50?text=Fitness+Pro', description: 'Stellt Trainingsmaterialien zur Verfügung', website: 'https://example-fitness.com' }
  ];

  const shopItems = [
    { name: 'Sport T-Shirt', image: 'https://via.placeholder.com/150?text=T-Shirt', price: '24,99 €', link: '/shop/tshirt' },
    { name: 'Trinkflasche', image: 'https://via.placeholder.com/150?text=Flasche', price: '14,99 €', link: '/shop/bottle' },
    { name: 'Sportpass Hoodie', image: 'https://via.placeholder.com/150?text=Hoodie', price: '39,99 €', link: '/shop/hoodie' }
  ];

  return (
    <footer className="footer">
      <div className="footer-content">
        <p>&copy; {new Date().getFullYear()} SportPass</p>
        <div className="footer-links">
          <Link to="/support" className="support-link">Support</Link>
          <a href="mailto:sportpass146@gmail.com" className="support-email">sportpass146@gmail.com</a>
          
          {/* Neue Links für Shop und Sponsoren */}
          <button 
            className="footer-link-button" 
            onClick={() => setShowShopModal(true)}
          >
            <FaShoppingCart /> Shop
          </button>
          <button 
            className="footer-link-button" 
            onClick={() => setShowSponsorsModal(true)}
          >
            <FaHandshakeAlt /> Sponsoren
          </button>
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
            <p>Entdecke unsere exklusiven Sportpass-Produkte:</p>
            
            <div className="shop-grid">
              {shopItems.map((item, index) => (
                <div key={index} className="shop-item">
                  <div className="shop-item-image">
                    <img src={item.image} alt={item.name} />
                  </div>
                  <h3>{item.name}</h3>
                  <p className="shop-item-price">{item.price}</p>
                  <Link to={item.link} className="shop-item-link">
                    Zum Produkt
                  </Link>
                </div>
              ))}
            </div>
            
            <p className="shop-info">
              Alle Einnahmen aus dem Shop unterstützen das Sportpass-Projekt.
            </p>
            
            <button className="modal-close" onClick={() => setShowShopModal(false)}>
              Schließen
            </button>
          </div>
        </div>
      )}
    </footer>
  );
};

export default Footer;
