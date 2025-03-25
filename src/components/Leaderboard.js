import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';
import '../styles/Leaderboard.css';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await axios.get(`${config.API_URL}/api/leaderboard`);
        setLeaderboard(response.data);
      } catch (err) {
        setError('Fehler beim Laden des Leaderboards');
        console.error('Fehler:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  if (loading) return <div className="loading">Lade Leaderboard...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="leaderboard-container">
      <h2>Rangliste</h2>
      <div className="leaderboard-table">
        <table>
          <thead>
            <tr>
              <th>Platz</th>
              <th>Name</th>
              <th>Klasse</th>
              <th>Punkte</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((user, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{user.name}</td>
                <td>{user.class || '-'}</td>
                <td>{user.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Leaderboard; 