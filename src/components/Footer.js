// src/components/Footer.js
import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <p>&copy; 2025 SportPass</p>
        <div className="footer-links">
          <Link to="/support" className="support-link">Support</Link>
          <a href="mailto:sportpass146@gmail.com" className="support-email">sportpass146@gmail.com</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
