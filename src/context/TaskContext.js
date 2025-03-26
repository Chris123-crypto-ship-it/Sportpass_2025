<<<<<<< HEAD
import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
=======
import React, { createContext, useState, useContext, useCallback } from 'react';
>>>>>>> dcb46b5 (neustart)
import { useAuth } from './AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import config from '../config';

const TaskContext = createContext();

<<<<<<< HEAD
export const useCache = () => {
  const [cache, setCache] = useState({});

  const getCacheKey = (url, params = {}) => {
    return `${url}:${JSON.stringify(params)}`;
  };

  const fetchWithCache = async (url, options = {}, cacheTime = 60000) => {
    const cacheKey = getCacheKey(url, options);
    const cachedResponse = cache[cacheKey];

    if (cachedResponse && Date.now() - cachedResponse.timestamp < cacheTime) {
      return cachedResponse.data;
    }

    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`Fetch fehlgeschlagen: ${response.statusText}`);
      }
      const data = await response.json();
      
      setCache(prevCache => ({
        ...prevCache,
        [cacheKey]: { data, timestamp: Date.now() }
      }));
      
      return data;
    } catch (error) {
      console.error("Fehler beim Fetch mit Cache:", error);
      throw error;
    }
  };

  const invalidateCache = (url, params = {}) => {
    const cacheKey = getCacheKey(url, params);
    setCache(prevCache => {
      const newCache = { ...prevCache };
      delete newCache[cacheKey];
      return newCache;
    });
  };

  const clearCache = () => {
    setCache({});
  };

  return { fetchWithCache, invalidateCache, clearCache };
};

export const TaskProvider = ({ children }) => {
  const { user, token } = useAuth();
=======
export const TaskProvider = ({ children }) => {
  const { user } = useAuth();
>>>>>>> dcb46b5 (neustart)
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [archive, setArchive] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [submissionDetails, setSubmissionDetails] = useState('');
<<<<<<< HEAD
  const { fetchWithCache, invalidateCache, clearCache } = useCache();

  const BASE_URL = config.API_URL;
=======
>>>>>>> dcb46b5 (neustart)

  const getHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Kein Token vorhanden');
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }, []);

  const checkToken = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Kein Token vorhanden');
    }
    return token;
  }, []);

<<<<<<< HEAD
  const fetchTasks = async () => {
    try {
      setLoading(true);
      
      const url = `${BASE_URL}/api/tasks`;
      // Cache für 5 Minuten behalten
      const data = await fetchWithCache(url, {}, 300000);
      
      setTasks(data);
      setError(null);
    } catch (error) {
      console.error('Fehler beim Abrufen der Aufgaben:', error);
      setError('Fehler beim Abrufen der Aufgaben: ' + (error.message || JSON.stringify(error)));
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Optimierte Abfrage - nur die notwendigen Felder
      const url = `${BASE_URL}/api/submissions`;
      const options = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      // Cache für 1 Minute behalten
      const data = await fetchWithCache(url, options, 60000);
      
      setSubmissions(data);
      setError(null);
    } catch (error) {
      console.error('Fehler beim Abrufen der Einsendungen:', error);
      setError('Fehler beim Abrufen der Einsendungen: ' + (error.message || JSON.stringify(error)));
=======
  const fetchTasks = useCallback(async (view) => {
    try {
      checkToken();
      setLoading(true);
      setError(null);

      const response = await axios.get(`${config.API_URL}/tasks${view ? `?view=${view}` : ''}`, {
        headers: getHeaders()
      });

      setTasks(response.data);
    } catch (error) {
      console.error('Fehler beim Abrufen der Aufgaben:', error);
      setError('Fehler beim Laden der Aufgaben');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [checkToken, getHeaders]);

  const fetchSubmissions = async () => {
    try {
      checkToken();
      setLoading(true);
      setError(null);

      const response = await axios.get(`${config.API_URL}/submissions`, {
        headers: getHeaders()
      });
      
      setSubmissions(response.data);
    } catch (error) {
      console.error('Fehler beim Abrufen der Einsendungen:', error);
      setError('Fehler beim Laden der Einsendungen');
      setSubmissions([]);
>>>>>>> dcb46b5 (neustart)
    } finally {
      setLoading(false);
    }
  };

  const fetchArchive = useCallback(async () => {
    try {
      checkToken();
      setLoading(true);
      setError(null);

      const response = await axios.get(`${config.API_URL}/submissions`, {
        headers: getHeaders()
      });
      
      // Nur genehmigte oder abgelehnte Submissions in das Archiv
      const archivedSubmissions = response.data.filter(sub => 
        ['approved', 'rejected'].includes(sub.status)
      );
      setArchive(archivedSubmissions);
    } catch (error) {
      console.error('Fehler beim Abrufen des Archivs:', error);
      setError('Fehler beim Laden des Archivs');
      setArchive([]);
    } finally {
      setLoading(false);
    }
  }, [checkToken, getHeaders]);

<<<<<<< HEAD
  const addTask = async (taskData) => {
    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/api/tasks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(taskData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const newTask = await response.json();
      setTasks([...tasks, newTask]);
      
      // Cache invalidieren
      invalidateCache(`${BASE_URL}/api/tasks`);
      
      return newTask;
    } catch (error) {
      console.error('Fehler beim Hinzufügen der Aufgabe:', error);
      setError('Fehler beim Hinzufügen der Aufgabe: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Aktualisiere den lokalen State
      setTasks(tasks.filter(task => task.id !== taskId));
      
      // Cache invalidieren
      invalidateCache(`${BASE_URL}/api/tasks`);
      
      return true;
    } catch (error) {
      console.error('Fehler beim Löschen der Aufgabe:', error);
      setError('Fehler beim Löschen der Aufgabe: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const submitTask = async (taskId, userEmail, file, submissionDetails = {}) => {
    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('task_id', taskId);
      formData.append('user_email', userEmail);
      formData.append('file', file);
      formData.append('submission_details', JSON.stringify(submissionDetails));

      const response = await fetch(`${BASE_URL}/api/submissions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const newSubmission = await response.json();
      
      // Aktualisiere den lokalen State
      setSubmissions([...submissions, newSubmission]);
      
      // Cache invalidieren
      invalidateCache(`${BASE_URL}/api/submissions`);
      
      return true;
    } catch (error) {
      console.error('Fehler beim Einreichen der Aufgabe:', error);
      setError('Fehler beim Einreichen der Aufgabe: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteSubmission = async (submissionId) => {
    try {
      setLoading(true);
      
      const response = await fetch(`${BASE_URL}/api/submissions/${submissionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Aktualisiere den lokalen State
      setSubmissions(submissions.filter(submission => submission.id !== submissionId));
      
      // Cache invalidieren
      invalidateCache(`${BASE_URL}/api/submissions`);
      
      return true;
    } catch (error) {
      console.error('Fehler beim Löschen der Einsendung:', error);
      setError('Fehler beim Löschen der Einsendung: ' + error.message);
=======
  const submitTask = async (taskId, userEmail, file, details) => {
    try {
      checkToken();
      setLoading(true);
      let file_url = null;

      if (file) {
        const reader = new FileReader();
        file_url = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
      }

      const task = tasks.find(t => t.id === taskId);
      
      let calculatedPoints = task?.points || 0;
      let dynamicValue = null;
      
      if (task?.dynamic && details?.dynamic_value) {
        dynamicValue = parseFloat(details.dynamic_value);
        calculatedPoints = Math.round(dynamicValue * (task.multiplier || 1));
      }

      const response = await axios.post(`${config.API_URL}/submit-task`, {
        taskId,
        userEmail,
        details: {
          ...details,
          dynamic_value: dynamicValue,
          calculated_points: calculatedPoints
        },
        file_url,
        fileName: file?.name
      }, {
        headers: getHeaders()
      });

      await fetchSubmissions();
      return true;
    } catch (error) {
      console.error('Fehler beim Einreichen der Aufgabe:', error);
>>>>>>> dcb46b5 (neustart)
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleApproveSubmission = async (submissionId, adminComment = '') => {
    try {
<<<<<<< HEAD
      setLoading(true);
      
      const response = await fetch(`${BASE_URL}/api/submissions/${submissionId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ admin_comment: adminComment })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Aktualisiere den lokalen State
      const updatedSubmission = await response.json();
      setSubmissions(submissions.map(sub => 
        sub.id === submissionId ? updatedSubmission : sub
      ));
      
      // Cache invalidieren
      invalidateCache(`${BASE_URL}/api/submissions`);
      
      return true;
    } catch (error) {
      console.error('Fehler beim Genehmigen der Einsendung:', error);
      setError('Fehler beim Genehmigen der Einsendung: ' + error.message);
=======
      checkToken();
      const response = await axios.post(`${config.API_URL}/approve-submission`, 
        { 
          submissionId, 
          adminComment
        },
        {
          headers: getHeaders()
        }
      );

      await fetchSubmissions();
      await fetchArchive();
      return response.data;
    } catch (error) {
      console.error('Fehler bei der Genehmigung:', error);
      throw error;
    }
  };

  const handleRejectSubmission = async (submissionId, adminComment = '') => {
    try {
      checkToken();
      const response = await axios.post(`${config.API_URL}/reject-submission`,
        { 
          submissionId, 
          adminComment
        },
        {
          headers: getHeaders()
        }
      );

      await fetchSubmissions();
      await fetchArchive();
      return response.data;
    } catch (error) {
      console.error('Fehler bei der Ablehnung:', error);
      setError(error.message || 'Fehler bei der Ablehnung');
      throw error;
    }
  };

  const deleteSubmission = async (submissionId) => {
    try {
      checkToken();
      setLoading(true);
      setError(null);

      const response = await axios.delete(`${config.API_URL}/delete-submission/${submissionId}`, {
        headers: getHeaders()
      });

      console.log('Einsendung erfolgreich gelöscht');
      await fetchSubmissions();
    } catch (error) {
      console.error('Fehler beim Löschen der Einsendung:', error);
      setError('Fehler beim Löschen der Einsendung');
>>>>>>> dcb46b5 (neustart)
      throw error;
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
  const handleRejectSubmission = async (submissionId, adminComment = '') => {
    try {
      setLoading(true);
      
      const response = await fetch(`${BASE_URL}/api/submissions/${submissionId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ admin_comment: adminComment })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Aktualisiere den lokalen State
      const updatedSubmission = await response.json();
      setSubmissions(submissions.map(sub => 
        sub.id === submissionId ? updatedSubmission : sub
      ));
      
      // Cache invalidieren
      invalidateCache(`${BASE_URL}/api/submissions`);
      
      return true;
    } catch (error) {
      console.error('Fehler beim Ablehnen der Einsendung:', error);
      setError('Fehler beim Ablehnen der Einsendung: ' + error.message);
=======
  const deleteTask = async (taskId) => {
    try {
      checkToken();
      setLoading(true);
      
      const response = await axios.delete(`${config.API_URL}/delete-task/${taskId}`, {
        headers: getHeaders()
      });

      await fetchTasks();
    } catch (error) {
      console.error('Fehler beim Löschen der Aufgabe:', error);
      setError(error.message);
>>>>>>> dcb46b5 (neustart)
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handlePointChange = (userId, newPoints) => {
    // Logik zum Aktualisieren der Punkte
  };

  const sendConfirmationEmail = (email, code) => {
    // Logik zum Senden der E-Mail
  };

  const toggleTaskVisibility = async (taskId, isHidden) => {
    try {
      checkToken();
      setLoading(true);
      setError(null);

      const response = await axios.post(
        `${config.API_URL}/toggle-task-visibility/${taskId}`,
        { is_hidden: isHidden },
        { headers: getHeaders() }
      );

      // Aktualisiere die lokale Tasks-Liste
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId 
            ? { ...task, is_hidden: isHidden }
            : task
        )
      );

      toast.success(isHidden ? 'Aufgabe ausgeblendet' : 'Aufgabe wieder eingeblendet');
    } catch (error) {
      console.error('Fehler beim Ändern der Sichtbarkeit:', error);
      setError('Fehler beim Ändern der Sichtbarkeit');
      toast.error('Fehler beim Ändern der Sichtbarkeit');
    } finally {
      setLoading(false);
    }
  };

  const contextValue = {
    tasks,
    submissions,
    archive,
    loading,
    error,
    fetchTasks,
    fetchSubmissions,
    fetchArchive,
<<<<<<< HEAD
    addTask,
    deleteTask,
    submitTask,
    deleteSubmission,
    handleApproveSubmission,
    handleRejectSubmission,
    handlePointChange,
    sendConfirmationEmail,
    toggleTaskVisibility,
    clearCache
=======
    submitTask,
    handleApproveSubmission,
    handleRejectSubmission,
    deleteSubmission,
    deleteTask,
    handlePointChange,
    sendConfirmationEmail,
    toggleTaskVisibility,
>>>>>>> dcb46b5 (neustart)
  };

  return (
    <TaskContext.Provider value={contextValue}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => useContext(TaskContext);