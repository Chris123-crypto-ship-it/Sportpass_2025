// src/components/Navbar.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FaTachometerAlt, FaMedal, FaTasks, FaChartBar, FaArchive, FaSignInAlt, FaUserPlus, FaSignOutAlt
} from 'react-icons/fa';
import logo from '../assets/logo.png';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav>
      <div className="logo">
        <img src={logo} alt="Sportpass Logo" />
        <span>Sportpass</span>
      </div>
      <ul>
        {user ? (
          // Angemeldeter Benutzer sieht alle Navigationspunkte
          <>
            <li><Link to="/dashboard"><FaTachometerAlt /> Dashboard</Link></li>
            <li><Link to="/leaderboard"><FaMedal /> Leaderboard</Link></li>
            <li><Link to="/tasks"><FaTasks /> Aufgaben</Link></li>
            <li><Link to="/stats"><FaChartBar /> Statistiken</Link></li>
            <li><Link to="/archive"><FaArchive /> Archiv</Link></li>
            <li><Link to="/profile">Profil</Link></li>
            {/* Nur Admins sehen den Admin-Dashboard-Link und den zusätzlichen Teilnehmer-Link */}
            {user.role === 'admin' && (
              <>
                <li><Link to="/admin-dashboard">Admin Dashboard</Link></li>
                <li><Link to="/participants">Teilnehmer</Link></li>
              </>
            )}
            <li>{user.name}</li>
            <li><button onClick={handleLogout}><FaSignOutAlt /> Logout</button></li>
          </>
        ) : (
          // Nicht angemeldeter Benutzer sieht nur Leaderboard, Login, Registrieren
          <>
            <li><Link to="/leaderboard"><FaMedal /> Leaderboard</Link></li>
            <li><Link to="/login"><FaSignInAlt /> Login</Link></li>
            <li><Link to="/register"><FaUserPlus /> Registrieren</Link></li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
