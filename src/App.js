// src/App.js
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { TaskProvider } from './context/TaskContext';
import { keepServerAlive } from './services/socket';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Seiten
import Dashboard from './pages/Dashboard';
import Leaderboard from './pages/Leaderboard';
import Tasks from './pages/Tasks';
import Stats from './pages/Stats';
import Archive from './pages/Archive';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import Participants from './pages/Participants';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Support from './pages/Support';
import './App.css';
import './styles/Layout.css';

function App() {
  useEffect(() => {
    // Starte den Keep-Alive-Mechanismus
    keepServerAlive();
  }, []);

  return (
    <AuthProvider>
      <TaskProvider>
        <Router>
          <div className="app page-background">
            <Navbar />
            <div className="page-container">
              <Routes>
                {/* Startseite umleiten zum Login */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                
                {/* Öffentliche Routen */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                
                {/* Geschützte Routen */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/stats" element={<Stats />} />
                <Route path="/archive" element={<Archive />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                <Route path="/participants" element={<Participants />} />
                <Route path="/support" element={<Support />} />
              </Routes>
            </div>
            <Footer />
            <ToastContainer 
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
            />
          </div>
        </Router>
      </TaskProvider>
    </AuthProvider>
  );
}

export default App;
