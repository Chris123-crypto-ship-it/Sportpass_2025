// src/components/Navbar.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FaTachometerAlt, FaMedal, FaTasks, FaChartBar, FaArchive, 
  FaSignInAlt, FaUserPlus, FaSignOutAlt, FaBell, FaUser, FaCog, FaQuestion
} from 'react-icons/fa';
import logo from '../assets/logo.png';
import '../styles/Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Scroll-Effekt für Navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Klick außerhalb der Dropdowns schließt sie
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications || showProfileMenu) {
        if (!event.target.closest('.notifications-wrapper') && 
            !event.target.closest('.profile-wrapper')) {
          setShowNotifications(false);
          setShowProfileMenu(false);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showNotifications, showProfileMenu]);

  // Schließe Dropdowns bei Routenwechsel
  useEffect(() => {
    setShowNotifications(false);
    setShowProfileMenu(false);
  }, [location]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Beispiel-Benachrichtigungen (in echter App dynamisch laden)
  const notifications = [
    { id: 1, type: 'success', message: 'Neue Aufgabe freigeschaltet', isNew: true },
    { id: 2, type: 'info', message: 'Deine Punkte wurden aktualisiert', isNew: false }
  ];

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-content">
        <Link to="/" className="logo">
          <img src={logo} alt="Sportpass Logo" />
          <span>SportPass</span>
        </Link>

        {user && (
          <ul className="nav-links navbar-center">
            <li>
              <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>
                <FaTachometerAlt />
                <span>Dashboard</span>
              </Link>
            </li>
            <li>
              <Link to="/leaderboard" className={location.pathname === '/leaderboard' ? 'active' : ''}>
                <FaMedal />
                <span>Leaderboard</span>
              </Link>
            </li>
            <li>
              <Link to="/tasks" className={location.pathname === '/tasks' ? 'active' : ''}>
                <FaTasks />
                <span>Aufgaben</span>
                <div className="task-info">Wöchentliche Aufgaben</div>
              </Link>
            </li>
            <li>
              <Link to="/stats" className={location.pathname === '/stats' ? 'active' : ''}>
                <FaChartBar />
                <span>Statistiken</span>
              </Link>
            </li>
            <li>
              <Link to="/archive" className={location.pathname === '/archive' ? 'active' : ''}>
                <FaArchive />
                <span>Archiv</span>
              </Link>
            </li>
          </ul>
        )}

        <div className="navbar-right">
          {user ? (
            <>
              <div className="notifications-wrapper">
                <button 
                  className="nav-icon-button" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowNotifications(!showNotifications);
                    setShowProfileMenu(false);
                  }}
                >
                  <FaBell />
                  {notifications.some(n => n.isNew) && <span className="notification-badge"></span>}
                </button>

                {showNotifications && (
                  <div className="notifications-dropdown">
                    <h3>Benachrichtigungen</h3>
                    {notifications.length > 0 ? (
                      notifications.map(notification => (
                        <div 
                          key={notification.id} 
                          className={`notification-item ${notification.isNew ? 'new' : ''} ${notification.type}`}
                        >
                          <span className="notification-icon">
                            {notification.type === 'success' ? <FaTasks /> : <FaBell />}
                          </span>
                          <span>{notification.message}</span>
                        </div>
                      ))
                    ) : (
                      <p>Keine neuen Benachrichtigungen</p>
                    )}
                  </div>
                )}
              </div>

              <div className="profile-wrapper">
                <button 
                  className="profile-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowProfileMenu(!showProfileMenu);
                    setShowNotifications(false);
                  }}
                >
                  <FaUser />
                  <span>{user.name || 'Benutzer'}</span>
                </button>

                {showProfileMenu && (
                  <div className="profile-dropdown">
                    <div className="profile-header">
                      <div className="profile-avatar">
                        <FaUser />
                      </div>
                      <div className="profile-info">
                        <strong>{user.name}</strong>
                        <small>{user.email}</small>
                      </div>
                    </div>
                    <ul>
                      <li>
                        <Link to="/profile">
                          <FaUser /> Mein Profil
                        </Link>
                      </li>
                      <li>
                        <Link to="/settings">
                          <FaCog /> Einstellungen
                        </Link>
                      </li>
                      <li>
                        <Link to="/help">
                          <FaQuestion /> Hilfe
                        </Link>
                      </li>
                      {user.role === 'admin' && (
                        <>
                          <div className="divider"></div>
                          <li>
                            <Link to="/admin-dashboard">
                              <FaTachometerAlt /> Admin Dashboard
                            </Link>
                          </li>
                          <li>
                            <Link to="/participants">
                              <FaUser /> Teilnehmer
                            </Link>
                          </li>
                        </>
                      )}
                      <div className="divider"></div>
                      <li>
                        <button onClick={handleLogout}>
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
                <FaSignInAlt /> Anmelden
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
