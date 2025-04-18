import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useTasks } from '../context/TaskContext';
import { FaTrash, FaPlus, FaClock, FaMedal, FaTag, FaEye, FaEyeSlash, FaUser } from 'react-icons/fa';
import './AdminDashboard.css';
import { toast } from 'react-toastify';
import config from '../config';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { tasks, fetchTasks, deleteTask, toggleTaskVisibility } = useTasks();
  const [users, setUsers] = useState([]);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    category: 'Ausdauer',
    difficulty: 1,
    points: 5,
    dynamic: false,
    dynamic_type: 'none',
    points_per_unit: 1,
    expiration_date: '',
    max_submissions: '',
    is_easter_egg: false
  });
  const [currentAdminComment, setCurrentAdminComment] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const categories = [
    { value: 'cardio', label: 'Cardio' },
    { value: 'strength', label: 'Kraft' },
    { value: 'flexibility', label: 'Flexibilität' },
    { value: 'endurance', label: 'Ausdauer' },
    { value: 'team', label: 'Team' },
    { value: 'coordination', label: 'Koordination' }
  ];

  // Debugging - log user object to see if token exists
  useEffect(() => {
    console.log("User in AdminDashboard:", user);
  }, [user]);

  useEffect(() => {
    fetchTasks('admin');
    
    // Only try to fetch users if user and token exist
    if (user && user.token) {
      fetchUsers();
    }
  }, [user]); // Add user as a dependency

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

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${config.API_URL}/users`, {
        headers: getHeaders()
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Fehler beim Laden der Benutzer:', error);
      setError('Fehler beim Laden der Benutzer');
    }
  };

  // Nutze useEffect für das initiale Laden
  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers();
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewTask(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      if (!newTask.title.trim()) {
        throw new Error('Bitte geben Sie einen Titel ein');
      }

      const isDynamic = newTask.dynamic_type !== 'none';
      
      // Validierung je nach Aufgabentyp
      if (!isDynamic && (!newTask.points || parseInt(newTask.points) <= 0)) {
        throw new Error('Bitte geben Sie eine positive Punktzahl ein');
      }
      
      if (isDynamic && (!newTask.points_per_unit || parseFloat(newTask.points_per_unit) <= 0)) {
        throw new Error('Bitte geben Sie einen positiven Punktwert pro Einheit für dynamische Aufgaben ein');
      }

      // Debug-Log
      console.log('Sending task data:', newTask);

      let taskData = {
        title: newTask.title.trim(),
        description: newTask.description.trim(),
        category: newTask.category,
        dynamic_type: newTask.dynamic_type,
        points_per_unit: parseFloat(newTask.points_per_unit) || 1,
        points: parseInt(newTask.points) || 5,
        difficulty: parseInt(newTask.difficulty) || 1,
        expiration_date: newTask.expiration_date,
        max_submissions: newTask.max_submissions ? parseInt(newTask.max_submissions) : null,
        is_easter_egg: newTask.is_easter_egg
      };

      // Bei Oster-Eiern werden einige Werte fest gesetzt
      if (taskData.is_easter_egg) {
        taskData.category = 'Ostern';
        taskData.points = 5;
        taskData.dynamic = false;
        taskData.dynamic_type = 'none';
      }

      // Format für das Ablaufdatum anpassen
      if (taskData.expiration_date) {
        taskData.expiration_date = new Date(taskData.expiration_date).toISOString();
      }

      const response = await axios.post(`${config.API_URL}/add-task`, taskData, {
        headers: getHeaders()
      });

      toast.success('Aufgabe erfolgreich erstellt!');

      // Formular zurücksetzen
      setNewTask({
        title: '',
        description: '',
        category: 'Ausdauer',
        difficulty: 1,
        points: 5,
        dynamic: false,
        dynamic_type: 'none',
        points_per_unit: 1,
        expiration_date: '',
        max_submissions: '',
        is_easter_egg: false
      });

      // Tasks neu laden
      await fetchTasks('admin');
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error(error.response?.data?.message || error.message || 'Fehler beim Erstellen der Aufgabe');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Möchten Sie diese Aufgabe wirklich löschen?')) {
      try {
        await deleteTask(taskId);
        // fetchTasks wird automatisch in deleteTask aufgerufen
      } catch (error) {
        alert('Fehler beim Löschen der Aufgabe');
      }
    }
  };

  const handleApproveSubmission = async (submissionId) => {
    // ... bestehender Code ...
    await handleApproveSubmission(submissionId, currentAdminComment);
    setCurrentAdminComment(''); // Kommentar zurücksetzen
  };

  // Füge diese Funktion hinzu, um Punkte zu vergeben
  const handlePointsChange = async (userId, points) => {
    try {
      setError(null);
      
      if (!points || isNaN(parseInt(points))) {
        throw new Error('Bitte gebe eine gültige Punktzahl ein');
      }
      
      const response = await fetch(`${config.API_URL}/update-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          userId,
          points: parseInt(points)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Fehler beim Aktualisieren der Punkte');
      }

      const data = await response.json();
      setSuccess(`Punkte für Benutzer ${data.email} erfolgreich aktualisiert`);
      
      // Aktualisiere die Benutzerliste
      fetchUsers();
    } catch (error) {
      console.error('Error updating points:', error);
      setError(error.message);
    }
  };

  const handleToggleVisibility = async (taskId, currentVisibility) => {
    try {
      await toggleTaskVisibility(taskId, !currentVisibility);
    } catch (error) {
      console.error('Fehler beim Ändern der Sichtbarkeit:', error);
    }
  };

  // Show a login message if user is not logged in or not an admin
  if (!user) {
    return <p>Bitte logge dich ein, um auf das Admin-Dashboard zuzugreifen.</p>;
  }
  
  if (user.role !== 'admin') {
    return <p>Du hast keine Berechtigung, auf dieses Dashboard zuzugreifen.</p>;
  }

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      
      {/* Aufgabenverwaltung und andere Bereiche */}
      <section className="tasks-section">
        <h2><FaPlus /> Neue Aufgabe erstellen</h2>
        <form onSubmit={handleSubmit} className="task-form">
          <div className="form-group">
            <label>Titel: *</label>
            <input
              type="text"
              value={newTask.title}
              onChange={handleChange}
              name="title"
              required
            />
          </div>

          <div className="form-group">
            <label>Beschreibung:</label>
            <textarea
              value={newTask.description}
              onChange={handleChange}
              name="description"
              rows="4"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Kategorie:</label>
              <select 
                name="category" 
                value={newTask.category} 
                onChange={handleChange}
                disabled={newTask.is_easter_egg}
              >
                <option value="Ausdauer">Ausdauer</option>
                <option value="Kraft">Kraft</option>
                <option value="Beweglichkeit">Beweglichkeit</option>
                <option value="Koordination">Koordination</option>
                <option value="Spiel & Sport">Spiel & Sport</option>
                <option value="Ernährung">Ernährung</option>
                <option value="Sonstiges">Sonstiges</option>
              </select>
            </div>

            <div className="form-group">
              <label>Punkteart:</label>
              <select
                value={newTask.dynamic_type}
                onChange={handleChange}
                name="dynamic_type"
              >
                <option value="none">Feste Punkte</option>
                <option value="minutes">Punkte pro Minute</option>
                <option value="distance">Punkte pro Kilometer</option>
              </select>
            </div>
          </div>

          {newTask.dynamic_type === 'none' ? (
            <div className="form-group">
              <label>Punkte:</label>
              <input 
                type="number" 
                name="points" 
                value={newTask.points} 
                onChange={handleChange} 
                min="0"
                disabled={newTask.is_easter_egg || newTask.dynamic}
              />
            </div>
          ) : (
            <div className="form-group">
              <label>Punkte pro {newTask.dynamic_type === 'minutes' ? 'Minute' : 'Kilometer'}: *</label>
              <input
                type="number"
                value={newTask.points_per_unit}
                onChange={handleChange}
                name="points_per_unit"
                min="0.1"
                step="0.1"
                required
              />
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>Schwierigkeit:</label>
              <select
                value={newTask.difficulty}
                onChange={handleChange}
                name="difficulty"
              >
                <option value="1">Leicht</option>
                <option value="2">Mittel</option>
                <option value="3">Schwer</option>
              </select>
            </div>

            <div className="form-group">
              <label>Ablaufdatum:</label>
              <input
                type="datetime-local"
                value={newTask.expiration_date}
                onChange={handleChange}
                name="expiration_date"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>Maximale Anzahl an Einreichungen pro Benutzer:</label>
            <input
              type="number"
              value={newTask.max_submissions}
              onChange={handleChange}
              name="max_submissions"
              min="1"
              placeholder="Unbegrenzt, wenn leer"
            />
            <small className="form-text text-muted">Leer lassen für unbegrenzte Einreichungen.</small>
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="is_easter_egg"
                checked={newTask.is_easter_egg}
                onChange={(e) => {
                  const isEasterEgg = e.target.checked;
                  setNewTask({
                    ...newTask,
                    is_easter_egg: isEasterEgg,
                    ...(isEasterEgg && {
                      category: 'Ostern',
                      points: 5,
                      dynamic: false,
                      dynamic_type: 'none'
                    })
                  });
                }}
              />
              <span>Oster-Ei</span>
            </label>
            {newTask.is_easter_egg && (
              <div className="easter-egg-info">
                Oster-Eier sind spezielle Aufgaben für die Oster-Challenge. 
                Sie haben immer 5 Punkte und sind nicht dynamisch.
              </div>
            )}
          </div>

          <button type="submit" className="submit-button">
            Aufgabe erstellen
          </button>
        </form>
      </section>

      <section className="existing-tasks">
        <h2>Vorhandene Aufgaben</h2>
        <div className="tasks-grid">
          {tasks.map(task => (
            <div key={task.id} className={`task-card ${task.is_hidden ? 'hidden' : ''}`}>
              <div className="task-header">
                <h3>{task.title}</h3>
                <div className="task-actions">
                  <button 
                    className={`visibility-button ${task.is_hidden ? 'hidden' : ''}`}
                    onClick={() => handleToggleVisibility(task.id, task.is_hidden)}
                    title={task.is_hidden ? 'Aufgabe einblenden' : 'Aufgabe ausblenden'}
                  >
                    {task.is_hidden ? <FaEyeSlash /> : <FaEye />}
                  </button>
                  <button 
                    className="delete-button"
                    onClick={() => handleDeleteTask(task.id)}
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
              
              <p className="task-description">{task.description}</p>
              
              <div className="task-details">
                <span className="points">
                  <FaMedal /> {task.points} Punkte
                </span>
                {task.dynamic && (
                  <span className="multiplier">
                    × {task.multiplier} pro Einheit
                  </span>
                )}
                {task.expiration_date && (
                  <span className="expiration">
                    <FaClock /> Läuft ab: {new Date(task.expiration_date).toLocaleDateString()}
                  </span>
                )}
                {task.max_submissions && (
                  <span className="max-submissions">
                    <FaUser /> Max. Einreichungen: {task.max_submissions}
                  </span>
                )}
              </div>

              {task.is_hidden && (
                <div className="hidden-badge">
                  Ausgeblendet
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;