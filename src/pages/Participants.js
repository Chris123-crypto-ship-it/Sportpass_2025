import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import '../styles/Participants.css';
import { toast } from 'react-toastify';
import { FaSort, FaSortUp, FaSortDown, FaCheckCircle, FaTimesCircle, FaPlusCircle } from 'react-icons/fa';
import config from '../config';

const Participants = () => {
  const { user } = useAuth();
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingPoints, setEditingPoints] = useState({});
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [nameFilter, setNameFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [availableClasses, setAvailableClasses] = useState([]);
  const [selectedParticipantIds, setSelectedParticipantIds] = useState(new Set());
  const [loadingBulkUpdate, setLoadingBulkUpdate] = useState(false);

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Kein Token vorhanden');
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchParticipants = async () => {
    try {
      setLoading(true);
      setError(null);
      setSelectedParticipantIds(new Set());

      const response = await axios.get(`${config.API_URL}/users`, {
        headers: getHeaders()
      });

      const data = response.data;
      console.log('Geladene Teilnehmer:', data); // Debug für Teilnehmer
      
      // Prüfen, ob is_verified in den Daten vorhanden ist
      if (data.length > 0) {
        console.log('is_verified in erstem Eintrag:', data[0].is_verified);
      }
      
      setParticipants(data);

      const classes = [...new Set(data.map(p => p.class).filter(Boolean))];
      setAvailableClasses(classes);
    } catch (error) {
      console.error('Error fetching participants:', error);
      setError('Fehler beim Laden der Teilnehmer');
      toast.error('Fehler beim Laden der Teilnehmer');
    } finally {
      setLoading(false);
    }
  };

  const handlePointsChange = async (userId, newPoints) => {
    try {
      await axios.put(
        `${config.API_URL}/users/${userId}`,
        { points: parseInt(newPoints) },
        { headers: getHeaders() }
      );

      setParticipants(prevParticipants =>
        prevParticipants.map(p =>
          p.id === userId ? { ...p, points: parseInt(newPoints) } : p
        )
      );

      setEditingPoints(prev => ({ ...prev, [userId]: undefined }));
      toast.success('Punkte erfolgreich aktualisiert');
    } catch (error) {
      console.error('Error updating points:', error);
      toast.error('Fehler beim Aktualisieren der Punkte');
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return <FaSort />;
    return sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  const handleVerifyUser = async (userId) => {
    try {
      const response = await axios.put(
        `${config.API_URL}/verify-user/${userId}`,
        {},
        { headers: getHeaders() }
      );

      console.log('Verifizierungsantwort:', response.data);

      setParticipants(prevParticipants =>
        prevParticipants.map(p =>
          p.id === userId ? { ...p, is_verified: true } : p
        )
      );

      toast.success('Benutzer erfolgreich verifiziert');
    } catch (error) {
      console.error('Error verifying user:', error);
      toast.error('Fehler beim Verifizieren des Benutzers');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (window.confirm(`Möchten Sie den Benutzer "${userName}" wirklich löschen?`)) {
      try {
        await axios.delete(
          `${config.API_URL}/users/${userId}`,
          { headers: getHeaders() }
        );

        setParticipants(prevParticipants =>
          prevParticipants.filter(p => p.id !== userId)
        );
        setSelectedParticipantIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });

        toast.success('Benutzer erfolgreich gelöscht');
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error('Fehler beim Löschen des Benutzers');
      }
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchParticipants();
    }
  }, [user]);

  const filteredParticipants = useMemo(() => {
    const sorted = [...participants].sort((a, b) => {
        let comparison = 0;
        if (sortField === 'name') {
          comparison = (a.name || '').localeCompare(b.name || '');
        } else if (sortField === 'email') {
          comparison = (a.email || '').localeCompare(b.email || '');
        } else if (sortField === 'class') {
          comparison = (a.class || '').localeCompare(b.class || '');
        } else if (sortField === 'points') {
          comparison = (b.points || 0) - (a.points || 0);
        }
        return sortDirection === 'asc' ? comparison : -comparison;
      });

    return sorted.filter(participant => {
      const nameMatch = (participant.name?.toLowerCase() || '').includes(nameFilter.toLowerCase()) ||
                       (participant.email?.toLowerCase() || '').includes(nameFilter.toLowerCase());
      const classMatch = !classFilter || participant.class === classFilter;
      return nameMatch && classMatch;
    });
  }, [participants, sortField, sortDirection, nameFilter, classFilter]);

  const handleSelectOne = (participantId) => {
    setSelectedParticipantIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(participantId)) {
        newSet.delete(participantId);
      } else {
        newSet.add(participantId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allFilteredIds = new Set(filteredParticipants.map(p => p.id));
      setSelectedParticipantIds(allFilteredIds);
    } else {
      setSelectedParticipantIds(new Set());
    }
  };

  const handleAdd20Points = async () => {
    if (selectedParticipantIds.size === 0) {
      toast.info('Bitte wählen Sie zuerst Teilnehmer aus.');
      return;
    }
    if (!window.confirm(`Möchten Sie wirklich ${selectedParticipantIds.size} Teilnehmern 20 Punkte hinzufügen?`)) {
      return;
    }

    setLoadingBulkUpdate(true);
    try {
      const response = await axios.post(
        `${config.API_URL}/bulk-update-points`,
        { 
          userIds: Array.from(selectedParticipantIds),
          pointsToAdd: 20
        },
        { headers: getHeaders() }
      );
      
      await fetchParticipants();
      
      toast.success(response.data.message || 'Punkte erfolgreich hinzugefügt.');
      setSelectedParticipantIds(new Set());
    } catch (error) {
      console.error('Error adding points:', error);
      toast.error(error.response?.data?.message || 'Fehler beim Hinzufügen der Punkte.');
    } finally {
      setLoadingBulkUpdate(false);
    }
  };

  const isAllSelected = filteredParticipants.length > 0 && selectedParticipantIds.size === filteredParticipants.length;

  if (!user || user.role !== 'admin') {
    return <div className="participants-error">Nur für Administratoren zugänglich</div>;
  }

  if (loading) {
    return <div className="participants-loading">Lade Teilnehmer...</div>;
  }

  if (error) {
    return <div className="participants-error">{error}</div>;
  }

  return (
    <div className="participants-container">
      <h1>Teilnehmerverwaltung</h1>
      
      <div className="filter-controls participants-filter-controls">
        <div className="filter-group">
          <input
            type="text"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            placeholder="Name oder Email eingeben..."
          />
        </div>
        
        <div className="filter-group">
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
          >
            <option value="">Alle Klassen</option>
            {availableClasses.map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
        </div>

        <div className="filter-actions">
            <button 
              className="bulk-action-button add-points-button"
              onClick={handleAdd20Points}
              disabled={selectedParticipantIds.size === 0 || loadingBulkUpdate}
            >
              <FaPlusCircle /> {loadingBulkUpdate ? 'Wird hinzugefügt...' : `+20 Punkte (${selectedParticipantIds.size})`}
            </button>
            <button className="refresh-button" onClick={fetchParticipants} disabled={loadingBulkUpdate}>
              Aktualisieren
            </button>
        </div>
      </div>

      <div className="participants-table-container">
        <table className="participants-table">
          <thead>
            <tr>
              <th className="checkbox-column">
                <input 
                  type="checkbox" 
                  onChange={handleSelectAll}
                  checked={isAllSelected}
                  disabled={filteredParticipants.length === 0}
                  title="Alle auf dieser Seite auswählen"
                />
              </th>
              <th>
                <div className="sortable-header" onClick={() => handleSort('name')}>
                  Name {getSortIcon('name')}
                </div>
              </th>
              <th>
                <div className="sortable-header" onClick={() => handleSort('email')}>
                  Email {getSortIcon('email')}
                </div>
              </th>
              <th>
                <div className="sortable-header" onClick={() => handleSort('class')}>
                  Klasse {getSortIcon('class')}
                </div>
              </th>
              <th>
                <div className="sortable-header" onClick={() => handleSort('points')}>
                  Punkte {getSortIcon('points')}
                </div>
              </th>
              <th>Status</th>
              <th className="actions-header">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {filteredParticipants.map(participant => (
              <tr 
                key={participant.id} 
                className={selectedParticipantIds.has(participant.id) ? 'selected-row' : ''}
              >
                <td className="checkbox-cell">
                  <input 
                    type="checkbox" 
                    onChange={() => handleSelectOne(participant.id)}
                    checked={selectedParticipantIds.has(participant.id)}
                  />
                </td>
                <td>{participant.name || '-'}</td>
                <td>{participant.email}</td>
                <td>{participant.class || '-'}</td>
                <td className="points-cell">
                  {editingPoints[participant.id] !== undefined ? (
                    <input
                      type="number"
                      value={editingPoints[participant.id]}
                      onChange={(e) => setEditingPoints(prev => ({
                        ...prev,
                        [participant.id]: e.target.value
                      }))}
                      min="0"
                    />
                  ) : (
                    <span>{participant.points || 0}</span>
                  )}
                </td>
                <td>
                  {participant.is_verified === true ? (
                    <span className="verified-status">
                      <FaCheckCircle className="verified-icon" />
                      Verifiziert
                    </span>
                  ) : (
                    <span className="unverified-status">
                      <FaTimesCircle className="unverified-icon" />
                      Nicht verifiziert
                    </span>
                  )}
                </td>
                <td className="actions-cell">
                  <div className="actions-container">
                    {editingPoints[participant.id] !== undefined ? (
                      <div className="button-group">
                        <button
                          className="save-button"
                          onClick={() => handlePointsChange(participant.id, editingPoints[participant.id])}
                        >
                          Speichern
                        </button>
                        <button
                          className="cancel-button"
                          onClick={() => setEditingPoints(prev => ({
                            ...prev,
                            [participant.id]: undefined
                          }))}
                        >
                          Abbrechen
                        </button>
                      </div>
                    ) : (
                      <div className="button-group">
                        <button
                          className="edit-button"
                          onClick={() => setEditingPoints(prev => ({
                            ...prev,
                            [participant.id]: participant.points || 0
                          }))}
                        >
                          Bearbeiten
                        </button>
                        {participant.is_verified !== true && (
                          <button
                            className="verify-button"
                            onClick={() => handleVerifyUser(participant.id)}
                          >
                            Verifizieren
                          </button>
                        )}
                        <button
                          className="delete-button"
                          onClick={() => handleDeleteUser(participant.id, participant.name)}
                        >
                          Löschen
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Participants;
