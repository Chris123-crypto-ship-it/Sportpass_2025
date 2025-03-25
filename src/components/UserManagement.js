import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';
import '../styles/UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${config.API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (err) {
      setError('Fehler beim Laden der Benutzer');
      console.error('Fehler:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyUser = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${config.API_URL}/api/users/${userId}/verify`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccessMessage('Benutzer erfolgreich verifiziert');
      fetchUsers(); // Aktualisiere die Liste
    } catch (err) {
      setError('Fehler beim Verifizieren des Benutzers');
      console.error('Fehler:', err);
    }
  };

  if (loading) return <div className="loading">Lade Benutzer...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="user-management-container">
      <h2>Benutzerverwaltung</h2>
      {successMessage && (
        <div className="success-message">{successMessage}</div>
      )}
      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>E-Mail</th>
              <th>Klasse</th>
              <th>Status</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.class || '-'}</td>
                <td>
                  <span className={`status ${user.is_verified ? 'verified' : 'unverified'}`}>
                    {user.is_verified ? 'Verifiziert' : 'Nicht verifiziert'}
                  </span>
                </td>
                <td>
                  {!user.is_verified && (
                    <button
                      onClick={() => handleVerifyUser(user.id)}
                      className="verify-button"
                    >
                      Verifizieren
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement; 