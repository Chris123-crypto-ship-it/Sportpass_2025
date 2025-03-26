import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { FaUser, FaMedal, FaAngleLeft, FaAngleRight } from 'react-icons/fa';
import { toast } from 'react-toastify';
import '../styles/Leaderboard.css';
import config from '../config';

const Leaderboard = () => {
  const { user } = useAuth();
  const { clearCache } = useTasks();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15); // 15 Teilnehmer pro Seite
  const [cachedData, setCachedData] = useState(null);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 Minuten Cache

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        // Prüfe, ob wir gecachte Daten haben, die noch frisch sind
        const now = Date.now();
        if (cachedData && (now - lastFetchTime < CACHE_DURATION)) {
          setLeaderboard(cachedData);
          setLoading(false);
          return;
        }

        setLoading(true);
        const response = await fetch(`${config.API_URL}/api/leaderboard`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Fehler beim Abrufen der Leaderboard-Daten: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Sortiere nach Punkten und dann nach Benutername (falls Punkte gleich sind)
        const sortedData = data.sort((a, b) => {
          if (b.points !== a.points) {
            return b.points - a.points;
          }
          return a.name.localeCompare(b.name);
        });
        
        // Füge jedem Eintrag seinen Rang hinzu und identifiziere Top-10
        const rankedData = sortedData.map((entry, index) => ({
          ...entry,
          rank: index + 1,
          isTop10: index < 10
        }));
        
        setLeaderboard(rankedData);
        setCachedData(rankedData);
        setLastFetchTime(now);
        setError(null);
      } catch (err) {
        console.error('Fehler beim Laden der Leaderboard-Daten:', err);
        setError('Leaderboard konnte nicht geladen werden. Bitte versuche es später erneut.');
        toast.error('Fehler beim Laden der Leaderboard-Daten');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  // Manuelle Aktualisierung der Daten
  const handleRefresh = async () => {
    try {
      setLoading(true);
      clearCache(); // Cache in TaskContext leeren
      setCachedData(null); // Lokalen Cache leeren
      
      const response = await fetch(`${config.API_URL}/api/leaderboard`, {
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store' // Verhindert Browser-Caching
      });

      if (!response.ok) {
        throw new Error(`Fehler beim Abrufen der Leaderboard-Daten: ${response.statusText}`);
      }

      const data = await response.json();
      const sortedData = data.sort((a, b) => {
        if (b.points !== a.points) {
          return b.points - a.points;
        }
        return a.name.localeCompare(b.name);
      });
      
      const rankedData = sortedData.map((entry, index) => ({
        ...entry,
        rank: index + 1,
        isTop10: index < 10
      }));
      
      setLeaderboard(rankedData);
      setCachedData(rankedData);
      setLastFetchTime(Date.now());
      toast.success('Leaderboard erfolgreich aktualisiert');
    } catch (err) {
      console.error('Fehler beim Aktualisieren der Leaderboard-Daten:', err);
      toast.error('Fehler beim Aktualisieren des Leaderboards');
    } finally {
      setLoading(false);
    }
  };

  // Pagination Logik
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = leaderboard.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(leaderboard.length / itemsPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Wenn der Benutzer abgemeldet ist, wird nur eine einfachere Version angezeigt
  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <h1 className="leaderboard-title">Rangliste</h1>
        {user && (
          <button 
            className="refresh-button" 
            onClick={handleRefresh} 
            disabled={loading}
          >
            Aktualisieren
          </button>
        )}
      </div>

      {error ? (
        <div className="error-message">{error}</div>
      ) : loading ? (
        <div className="loading">Laden...</div>
      ) : leaderboard.length === 0 ? (
        <div className="no-data">Noch keine Daten verfügbar</div>
      ) : (
        <>
          <div className="leaderboard-table-container">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th className="rank-column">Rang</th>
                  <th className="user-column">Teilnehmer</th>
                  <th className="class-column">Klasse</th>
                  <th className="points-column">Punkte</th>
                  <th className="achievements-column">Auszeichnungen</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((entry) => (
                  <tr key={entry.id} className={entry.rank <= 3 ? `top-${entry.rank}` : ''}>
                    <td className="rank-cell">
                      {entry.rank <= 3 ? (
                        <div className={`medal rank-${entry.rank}`}>
                          {entry.rank}
                        </div>
                      ) : (
                        entry.rank
                      )}
                    </td>
                    <td className="user-cell">
                      <div className="user-info">
                        <FaUser className="user-icon" />
                        <span>{entry.name}</span>
                      </div>
                    </td>
                    <td className="class-cell">{entry.class}</td>
                    <td className="points-cell">{entry.points}</td>
                    <td className="achievements-cell">
                      {entry.isTop10 && <span className="top-10-star">⭐</span>}
                      {entry.achievements && entry.achievements.includes('beginner') && (
                        <span className="achievement-icon">🎮</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button 
                onClick={() => paginate(currentPage - 1)} 
                disabled={currentPage === 1}
                className="pagination-button"
              >
                <FaAngleLeft />
              </button>
              <span className="page-info">{currentPage} / {totalPages}</span>
              <button 
                onClick={() => paginate(currentPage + 1)} 
                disabled={currentPage === totalPages}
                className="pagination-button"
              >
                <FaAngleRight />
              </button>
            </div>
          )}
        </>
      )}

      <div className="leaderboard-info">
        <h3>Auszeichnungen:</h3>
        <ul>
          <li><span className="top-10-star">⭐</span> Top 10 in der Rangliste</li>
          <li><span className="achievement-icon">🎮</span> Einsteiger (hat erste Aufgabe abgeschlossen)</li>
        </ul>
      </div>
    </div>
  );
};

export default Leaderboard;
