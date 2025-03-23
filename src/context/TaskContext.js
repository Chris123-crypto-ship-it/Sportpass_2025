import React, { createContext, useState, useContext, useCallback } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const TaskContext = createContext();

export const TaskProvider = ({ children }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [archive, setArchive] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [submissionDetails, setSubmissionDetails] = useState('');

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

  const fetchTasks = useCallback(async (view) => {
    try {
      checkToken();
      setLoading(true);
      setError(null);

      const response = await axios.get(`http://localhost:3001/tasks${view ? `?view=${view}` : ''}`, {
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

      const response = await axios.get('http://localhost:3001/submissions', {
        headers: getHeaders()
      });
      
      setSubmissions(response.data);
    } catch (error) {
      console.error('Fehler beim Abrufen der Einsendungen:', error);
      setError('Fehler beim Laden der Einsendungen');
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchArchive = useCallback(async () => {
    try {
      checkToken();
      setLoading(true);
      setError(null);

      const response = await axios.get('http://localhost:3001/submissions', {
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

      const response = await axios.post('http://localhost:3001/submit-task', {
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
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleApproveSubmission = async (submissionId, adminComment = '') => {
    try {
      checkToken();
      const response = await axios.post('http://localhost:3001/approve-submission', 
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
      const response = await axios.post('http://localhost:3001/reject-submission',
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

      const response = await axios.delete(`http://localhost:3001/delete-submission/${submissionId}`, {
        headers: getHeaders()
      });

      console.log('Einsendung erfolgreich gelöscht');
      await fetchSubmissions();
    } catch (error) {
      console.error('Fehler beim Löschen der Einsendung:', error);
      setError('Fehler beim Löschen der Einsendung');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      checkToken();
      setLoading(true);
      
      const response = await axios.delete(`http://localhost:3001/delete-task/${taskId}`, {
        headers: getHeaders()
      });

      await fetchTasks();
    } catch (error) {
      console.error('Fehler beim Löschen der Aufgabe:', error);
      setError(error.message);
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
        `http://localhost:3001/toggle-task-visibility/${taskId}`,
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
    submitTask,
    handleApproveSubmission,
    handleRejectSubmission,
    deleteSubmission,
    deleteTask,
    handlePointChange,
    sendConfirmationEmail,
    toggleTaskVisibility,
  };

  return (
    <TaskContext.Provider value={contextValue}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => useContext(TaskContext);