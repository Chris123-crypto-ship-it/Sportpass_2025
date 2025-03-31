// src/components/Navbar.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FaTachometerAlt, FaMedal, FaTasks, FaChartBar, FaArchive, 
  FaSignInAlt, FaUserPlus, FaSignOutAlt, FaBell, FaCog,
  FaUserCircle, FaCaretDown, FaAward, FaCalendarCheck,
  FaUsers
} from 'react-icons/fa';
import logo from '../assets/logo.png';
import '../styles/Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Beispiel-Benachrichtigungen (später durch echte Daten ersetzen)
  const notifications = [
    { id: 1, message: "Neue Aufgaben verfügbar!", type: "info", isNew: true },
    { id: 2, message: "Deine letzte Aufgabe wurde genehmigt!", type: "success", isNew: true },
    { id: 3, message: "Nächste Woche neue Herausforderungen", type: "info", isNew: false }
  ];

  // Scroll-Handler für Navbar-Schatten
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setShowProfileMenu(false);
  };

  // Aktiver Link-Checker
  const isActiveLink = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="navbar-content">
        <div className="navbar-left">
          <Link to="/" className="logo">
            <img src={logo} alt="Sportpass Logo" />
            <span>Sportpass</span>
          </Link>
        </div>

        <div className="navbar-center">
          {user && (
            <ul className="nav-links">
              <li>
                <Link to="/dashboard" className={isActiveLink('/dashboard') ? 'active' : ''}>
                  <FaTachometerAlt /> <span>Dashboard</span>
                </Link>
              </li>
              <li>
                <Link to="/leaderboard" className={isActiveLink('/leaderboard') ? 'active' : ''}>
                  <FaMedal /> <span>Leaderboard</span>
                </Link>
              </li>
              <li>
                <Link to="/tasks" className={isActiveLink('/tasks') ? 'active' : ''}>
                  <FaTasks /> <span>Aufgaben</span>
                  <div className="task-info">Neue Aufgaben jeden Sonntag!</div>
                </Link>
              </li>
              <li>
                <Link to="/stats" className={isActiveLink('/stats') ? 'active' : ''}>
                  <FaChartBar /> <span>Statistiken</span>
                </Link>
              </li>
              <li>
                <Link to="/archive" className={isActiveLink('/archive') ? 'active' : ''}>
                  <FaArchive /> <span>Archiv</span>
                </Link>
              </li>
            </ul>
          )}
        </div>

        <div className="navbar-right">
          {user ? (
            <>
              {/* Benachrichtigungen */}
              <div className="notifications-wrapper">
                <button 
                  className="nav-icon-button"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <FaBell />
                  {notifications.some(n => n.isNew) && <span className="notification-badge" />}
                </button>
                
                {showNotifications && (
                  <div className="notifications-dropdown">
                    <h3>Benachrichtigungen</h3>
                    {notifications.length > 0 ? (
                      <ul>
                        {notifications.map(notification => (
                          <li 
                            key={notification.id} 
                            className={`notification-item ${notification.type} ${notification.isNew ? 'new' : ''}`}
                          >
                            {notification.type === 'success' && <FaAward className="notification-icon" />}
                            {notification.type === 'info' && <FaCalendarCheck className="notification-icon" />}
                            <span>{notification.message}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="no-notifications">Keine neuen Benachrichtigungen</p>
                    )}
                  </div>
                )}
              </div>

              {/* Profilmenü */}
              <div className="profile-wrapper">
                <button 
                  className="profile-button"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                >
                  <FaUserCircle />
                  <span>{user.name}</span>
                  <FaCaretDown />
                </button>
                
                {showProfileMenu && (
                  <div className="profile-dropdown">
                    <div className="profile-header">
                      <FaUserCircle className="profile-avatar" />
                      <div className="profile-info">
                        <strong>{user.name}</strong>
                        <small>{user.email}</small>
                      </div>
                    </div>
                    
                    <ul>
                      <li>
                        <Link to="/profile" onClick={() => setShowProfileMenu(false)}>
                          <FaUserCircle /> Profil
                        </Link>
                      </li>
                      {user?.role === 'admin' && (
                        <>
                          <li>
                            <Link to="/admin-dashboard" onClick={() => setShowProfileMenu(false)}>
                              <FaTachometerAlt /> Admin Dashboard
                            </Link>
                          </li>
                          <li>
                            <Link to="/participants" onClick={() => setShowProfileMenu(false)}>
                              <FaUsers /> Teilnehmer
                            </Link>
                          </li>
                        </>
                      )}
                      <li>
                        <Link to="/settings" onClick={() => setShowProfileMenu(false)}>
                          <FaCog /> Einstellungen
                        </Link>
                      </li>
                      <li className="divider" />
                      <li>
                        <button className="logout-button" onClick={handleLogout}>
                          <FaSignOutAlt /> Abmelden
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="login-button">
                <FaSignInAlt /> Login
              </Link>
              <Link to="/register" className="register-button">
                <FaUserPlus /> Registrieren
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
