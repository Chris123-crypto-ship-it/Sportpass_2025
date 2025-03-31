import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaTrophy, FaMedal, FaStar, FaChartLine } from 'react-icons/fa';
import './Leaderboard.css';
import config from '../config';

const Leaderboard = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [timeRange, setTimeRange] = useState('all'); // 'all', 'month', 'week'
  const [loading, setLoading] = useState(true);
  const [visibleUsers, setVisibleUsers] = useState(10);
  const [hasMore, setHasMore] = useState(true);
  const tableContainerRef = useRef(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch(`${config.API_URL}/leaderboard`);
        const data = await response.json();
        setLeaderboard(data);
      } catch (error) {
        console.error('Fehler beim Laden der Rangliste:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [timeRange]); // Neu laden wenn sich der Zeitraum ändert

  const loadMoreUsers = () => {
    if (leaderboard.length > visibleUsers) {
      setVisibleUsers(prev => prev + 10);
    } else {
      setHasMore(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (!tableContainerRef.current) return;
      
      const { scrollTop, scrollHeight, clientHeight } = tableContainerRef.current;
      
      if (scrollTop + clientHeight >= scrollHeight - 50 && leaderboard.length > visibleUsers) {
        loadMoreUsers();
      }
    };
    
    const tableContainer = tableContainerRef.current;
    if (tableContainer) {
      tableContainer.addEventListener('scroll', handleScroll);
      return () => tableContainer.removeEventListener('scroll', handleScroll);
    }
  }, [visibleUsers, leaderboard]);

  if (loading) {
    return (
      <div className="leaderboard-loading">
        <div className="loading-spinner"></div>
        <p>Lade Rangliste...</p>
      </div>
    );
  }

  // Berechne Statistiken für den Benutzer
  const userRank = leaderboard.findIndex(entry => entry.name === user?.name) + 1;
  const userStats = leaderboard.find(entry => entry.name === user?.name);

  const getAchievements = (points) => {
    const achievements = [];
    if (points >= 100) achievements.push('🎮');
    if (points >= 500) achievements.push('🎯');
    if (points >= 1000) achievements.push('🌟');
    return achievements;
  };

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <h1>🏆 Sportpass Rangliste</h1>
        <div className="time-range-selector">
          <button 
            className={timeRange === 'all' ? 'active' : ''} 
            onClick={() => setTimeRange('all')}
          >
            Gesamt
          </button>
          <button 
            className={timeRange === 'month' ? 'active' : ''} 
            onClick={() => setTimeRange('month')}
          >
            Dieser Monat
          </button>
          <button 
            className={timeRange === 'week' ? 'active' : ''} 
            onClick={() => setTimeRange('week')}
          >
            Diese Woche
          </button>
        </div>
      </div>

      {user && userStats && (
        <div className="user-stats">
          <div className="user-rank">
            <FaTrophy className="rank-icon" />
            <div className="rank-info">
              <h3>Dein Rang</h3>
              <p className="rank-value">#{userRank} von {leaderboard.length}</p>
            </div>
          </div>
          <div className="user-points">
            <FaMedal className="points-icon" />
            <div className="points-info">
              <h3>Deine Punkte</h3>
              <p className="points-value">{userStats.points}</p>
            </div>
          </div>
          <div className="next-rank">
            <FaChartLine className="next-rank-icon" />
            <div className="next-rank-info">
              <h3>Nächster Rang</h3>
              {userRank > 1 ? (
                <p className="next-rank-value">
                  Noch {leaderboard[userRank - 2].points - userStats.points} Punkte bis Rang {userRank - 1}
                </p>
              ) : (
                <p className="next-rank-value">Du bist auf Rang 1! 🎉</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="podium-section">
        {leaderboard.slice(0, 3).map((entry, index) => (
          <div 
            key={index} 
            className={`podium-place podium-${index + 1}`}
            style={{ order: index === 1 ? 0 : index === 0 ? 1 : 2 }}
          >
            <div className="podium-avatar">
              {index === 0 ? '👑' : index === 1 ? '🥈' : '🥉'}
            </div>
            <h3 className="podium-name">{entry.name}</h3>
            <p className="podium-points">{entry.points} Punkte</p>
            {entry.name === user?.name && <span className="podium-badge">Du!</span>}
          </div>
        ))}
      </div>

      <div className="leaderboard-table">
        <h2>Gesamtrangliste</h2>
        <div 
          className="table-container" 
          ref={tableContainerRef}
          style={{ maxHeight: '500px', overflowY: 'auto' }}
        >
          <table>
            <thead>
              <tr>
                <th>Rang</th>
                <th>Name</th>
                <th>Punkte</th>
                <th>Auszeichnungen</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.slice(0, visibleUsers).map((entry, index) => (
                <tr 
                  key={index}
                  className={entry.name === user?.name ? 'current-user' : ''}
                >
                  <td>{index + 1}</td>
                  <td>{entry.name}{entry.name === user?.name && ' (Du)'}</td>
                  <td>{entry.points}</td>
                  <td>
                    {index < 10 && <span>⭐</span>}
                    {entry.points >= 100 && <span>🎮</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {leaderboard.length > visibleUsers && (
            <div className="load-more-indicator">Scrolle für mehr Benutzer...</div>
          )}
        </div>
      </div>

      <div className="achievements-legend">
        <h3>Auszeichnungen</h3>
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-icon"><FaStar className="top-10-star" /></span>
            <span className="legend-text">Top 10 Platzierung</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon">🌟</span>
            <span className="legend-text">Sportass (1000+ Punkte)</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon">🎯</span>
            <span className="legend-text">Fortgeschritten (500+ Punkte)</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon">🎮</span>
            <span className="legend-text">Anfänger (100+ Punkte)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
