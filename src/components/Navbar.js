// src/components/Navbar.js
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FaTachometerAlt, FaMedal, FaTasks, FaChartBar, FaArchive, FaSignInAlt, 
  FaUserPlus, FaSignOutAlt, FaUser, FaAngleDown, FaUserCog, FaUserFriends,
  FaBars, FaTimes
} from 'react-icons/fa';
import logo from '../assets/logo.png';
import '../styles/Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Behandle Scroll-Effekt
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setShowProfileDropdown(false);
    setIsMobileMenuOpen(false);
  };

  const toggleProfileDropdown = () => {
    setShowProfileDropdown(!showProfileDropdown);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    if (showProfileDropdown) setShowProfileDropdown(false);
  };

  const handleMobileNavClick = () => {
    setIsMobileMenuOpen(false);
    setShowProfileDropdown(false);
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-content">
        <Link to="/" className="logo">
          <img src={logo} alt="Sportpass Logo" />
          <span>SportPass</span>
        </Link>

        <button className="mobile-menu-button" onClick={toggleMobileMenu}>
          {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>

        <div className={`nav-container ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          <ul className="nav-links">
            {user ? (
              <>
                <li>
                  <Link 
                    to="/dashboard" 
                    className={location.pathname === '/dashboard' ? 'active' : ''}
                    onClick={handleMobileNavClick}
                  >
                    <FaTachometerAlt />
                    <span>Dashboard</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/leaderboard" 
                    className={location.pathname === '/leaderboard' ? 'active' : ''}
                    onClick={handleMobileNavClick}
                  >
                    <FaMedal />
                    <span>Leaderboard</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/tasks" 
                    className={location.pathname === '/tasks' ? 'active' : ''}
                    onClick={handleMobileNavClick}
                  >
                    <FaTasks />
                    <span>Aufgaben</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/stats" 
                    className={location.pathname === '/stats' ? 'active' : ''}
                    onClick={handleMobileNavClick}
                  >
                    <FaChartBar />
                    <span>Statistiken</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/archive" 
                    className={location.pathname === '/archive' ? 'active' : ''}
                    onClick={handleMobileNavClick}
                  >
                    <FaArchive />
                    <span>Archiv</span>
                  </Link>
                </li>
                {user.role === 'admin' && (
                  <>
                    <li>
                      <Link 
                        to="/admin-dashboard" 
                        className={location.pathname === '/admin-dashboard' ? 'active' : ''}
                        onClick={handleMobileNavClick}
                      >
                        <FaUserCog />
                        <span>Admin</span>
                      </Link>
                    </li>
                    <li>
                      <Link 
                        to="/participants" 
                        className={location.pathname === '/participants' ? 'active' : ''}
                        onClick={handleMobileNavClick}
                      >
                        <FaUserFriends />
                        <span>Teilnehmer</span>
                      </Link>
                    </li>
                  </>
                )}
              </>
            ) : (
              <li>
                <Link 
                  to="/leaderboard" 
                  className={location.pathname === '/leaderboard' ? 'active' : ''}
                  onClick={handleMobileNavClick}
                >
                  <FaMedal />
                  <span>Leaderboard</span>
                </Link>
              </li>
            )}
          </ul>

          <div className="navbar-right">
            {user ? (
              <>
                <button onClick={handleLogout} className="logout-button">
                  <FaSignOutAlt />
                  <span>Logout</span>
                </button>
                <div className="profile-wrapper">
                  <button className="profile-button" onClick={toggleProfileDropdown}>
                    <FaUser className="profile-icon" />
                    <span>{user.name || user.email}</span>
                    <FaAngleDown className={`dropdown-arrow ${showProfileDropdown ? 'open' : ''}`} />
                  </button>
                  
                  {showProfileDropdown && (
                    <div className="profile-dropdown">
                      <div className="profile-header">
                        <div className="profile-avatar">
                          <FaUser />
                        </div>
                        <div className="profile-info">
                          <strong>{user.name || 'Benutzer'}</strong>
                          <small>{user.email}</small>
                        </div>
                      </div>
                      
                      <ul>
                        <li>
                          <Link 
                            to="/profile" 
                            onClick={() => {
                              setShowProfileDropdown(false);
                              handleMobileNavClick();
                            }}
                          >
                            <FaUser /> Profil
                          </Link>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="login-button" onClick={handleMobileNavClick}>
                  <FaSignInAlt /> Login
                </Link>
                <Link to="/register" className="register-button" onClick={handleMobileNavClick}>
                  <FaUserPlus /> Registrieren
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
