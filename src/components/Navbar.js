// src/components/Navbar.js
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FaTachometerAlt, FaMedal, FaTasks, FaChartBar, FaArchive, 
  FaBell, FaUserCircle, FaCaretDown, FaSignOutAlt, FaCog, FaUsers
} from 'react-icons/fa';
import logo from '../assets/logo.png';
import '../styles/Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setShowProfileMenu(false);
  };

  const isActiveLink = (path) => {
    return location.pathname === path;
  };

  // Schließt alle Menüs wenn außerhalb geklickt wird
  React.useEffect(() => {
    const closeMenus = (e) => {
      if (!e.target.closest('.profile-wrapper') && !e.target.closest('.notifications-wrapper')) {
        setShowProfileMenu(false);
        setShowNotifications(false);
      }
    };
    
    document.addEventListener('click', closeMenus);
    return () => document.removeEventListener('click', closeMenus);
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo Teil */}
        <div className="navbar-logo">
          <Link to="/">
            <img src={logo} alt="Sportpass Logo" />
            <span>Sportpass</span>
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="navbar-links">
          <Link to="/dashboard" className={isActiveLink('/dashboard') ? 'active' : ''}>
            <FaTachometerAlt /> Dashboard
          </Link>
          <Link to="/leaderboard" className={isActiveLink('/leaderboard') ? 'active' : ''}>
            <FaMedal /> Leaderboard
          </Link>
          <Link to="/tasks" className={isActiveLink('/tasks') ? 'active' : ''}>
            <FaTasks /> Aufgaben
          </Link>
          <Link to="/stats" className={isActiveLink('/stats') ? 'active' : ''}>
            <FaChartBar /> Statistiken
          </Link>
          <Link to="/archive" className={isActiveLink('/archive') ? 'active' : ''}>
            <FaArchive /> Archiv
          </Link>
        </div>

        {/* Benutzer-Controls */}
        <div className="navbar-controls">
          {/* Benachrichtigungen */}
          <div className="notifications-wrapper">
            <button className="icon-button" onClick={(e) => {
              e.stopPropagation();
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}>
              <FaBell />
              <span className="notification-dot"></span>
            </button>
            
            {showNotifications && (
              <div className="dropdown notifications-dropdown">
                <h4>Benachrichtigungen</h4>
                <div className="notification-item">
                  <p>Neue Aufgabe verfügbar!</p>
                </div>
                <div className="notification-item">
                  <p>Deine letzte Aufgabe wurde genehmigt.</p>
                </div>
              </div>
            )}
          </div>

          {/* Admin Dropdown */}
          <div className="profile-wrapper">
            <button className="profile-button" onClick={(e) => {
              e.stopPropagation();
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}>
              <FaUserCircle /> Admin <FaCaretDown />
            </button>
            
            {showProfileMenu && (
              <div className="dropdown profile-dropdown">
                <Link to="/profile" onClick={() => setShowProfileMenu(false)}>
                  <FaUserCircle /> Profil
                </Link>
                {user?.role === 'admin' && (
                  <Link to="/participants" onClick={() => setShowProfileMenu(false)}>
                    <FaUsers /> Teilnehmer
                  </Link>
                )}
                <Link to="/settings" onClick={() => setShowProfileMenu(false)}>
                  <FaCog /> Einstellungen
                </Link>
                <button className="logout-button" onClick={handleLogout}>
                  <FaSignOutAlt /> Abmelden
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
