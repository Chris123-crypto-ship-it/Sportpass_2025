// src/components/Navbar.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FaTachometerAlt, FaMedal, FaTasks, FaChartBar, FaArchive, 
  FaSignInAlt, FaUserPlus, FaSignOutAlt
} from 'react-icons/fa';
import logo from '../assets/logo.png';
import '../styles/Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
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

  // Klick außerhalb des Profil-Dropdowns schließt es
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileMenu) {
        if (!event.target.closest('.profile-wrapper')) {
          setShowProfileMenu(false);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showProfileMenu]);

  // Schließe Dropdown bei Routenwechsel
  useEffect(() => {
    setShowProfileMenu(false);
  }, [location]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
              <div className="profile-wrapper">
                <button 
                  className="profile-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowProfileMenu(!showProfileMenu);
                  }}
                >
                  <span>{user.name || 'Benutzer'}</span>
                </button>

                {showProfileMenu && (
                  <div className="profile-dropdown">
                    <div className="profile-header">
                      <div className="profile-info">
                        <strong>{user.name}</strong>
                        <small>{user.email}</small>
                      </div>
                    </div>
                    <ul>
                      <li>
                        <Link to="/profile">
                          Mein Profil
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
                              Teilnehmer
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
