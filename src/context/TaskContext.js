import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import config from '../config';

const TaskContext = createContext();

export const TaskProvider = ({ children }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [allUserSubmissions, setAllUserSubmissions] = useState([]);
  const [allArchiveSubmissions, setAllArchiveSubmissions] = useState([]);
  const [userStatsSubmissions, setUserStatsSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingArchive, setLoadingArchive] = useState(false);
  const [loadingUserSubmissions, setLoadingUserSubmissions] = useState(false);
  const [error, setError] = useState(null);

  const getHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      return null;
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }, []);

  const checkUserAndToken = useCallback(() => {
    const token = localStorage.getItem('token');
    return user && token;
  }, [user]);

  const fetchTasks = useCallback(async (view) => {
    if (!checkUserAndToken()) return;
    const headers = getHeaders();
    if (!headers) return;

    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${config.API_URL}/tasks${view ? `?view=${view}` : ''}`, {
        headers
      });
      setTasks(response.data);
    } catch (error) {
      console.error('Fehler beim Abrufen der Aufgaben:', error);
      setError('Fehler beim Laden der Aufgaben');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [checkUserAndToken, getHeaders]);

  const fetchSubmissions = useCallback(async (page = 1, limit = 50) => {
    if (!checkUserAndToken()) return;
    const headers = getHeaders();
    if (!headers) return;

    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${config.API_URL}/submissions?page=${page}&limit=${limit}`, {
        headers
      });
      setSubmissions(response.data.submissions || []);
      setPagination(response.data.pagination || null);
    } catch (error) {
      console.error('Fehler beim Abrufen der Einsendungsliste (Admin):', error);
      setError('Fehler beim Laden der Admin-Einsendungsliste');
      setSubmissions([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [checkUserAndToken, getHeaders]);

  const fetchAllUserSubmissions = useCallback(async () => {
    if (!checkUserAndToken()) return;
    const headers = getHeaders();
    if (!headers) return;

    try {
      setLoadingUserSubmissions(true);
      setError(null);
      const response = await axios.get(`${config.API_URL}/user-all-submissions`, { headers });
      setAllUserSubmissions(response.data || []);
    } catch (error) {
      console.error('Fehler beim Abrufen aller User-Submissions:', error);
      setError('Fehler beim Laden deiner Einsendungen');
      setAllUserSubmissions([]);
    } finally {
      setLoadingUserSubmissions(false);
    }
  }, [checkUserAndToken, getHeaders]);

  const fetchAllArchiveSubmissions = useCallback(async () => {
    if (!checkUserAndToken()) return;
    const headers = getHeaders();
    if (!headers) return;

    try {
      setLoadingArchive(true);
      setError(null);
      const response = await axios.get(`${config.API_URL}/archive-submissions`, { headers });
      setAllArchiveSubmissions(response.data || []);
    } catch (error) {
      console.error('Fehler beim Abrufen der Archiv-Submissions:', error);
      setError('Fehler beim Laden des Archivs');
      setAllArchiveSubmissions([]);
    } finally {
      setLoadingArchive(false);
    }
  }, [checkUserAndToken, getHeaders]);

  const fetchSubmissionDetails = useCallback(async (id) => {
    if (!id) {
      setSelectedSubmission(null);
      return null;
    }
    if (!checkUserAndToken()) return null;
    const headers = getHeaders();
    if (!headers) return null;

    try {
      setLoadingDetails(true);
      setError(null);
      const response = await axios.get(`${config.API_URL}/submissions/${id}`, { headers });
      setSelectedSubmission(response.data);
      return response.data;
    } catch (error) {
      console.error(`Fehler beim Abrufen der Submission-Details (ID: ${id}):`, error);
      setError('Fehler beim Laden der Submission-Details');
      setSelectedSubmission(null);
      return null;
    } finally {
      setLoadingDetails(false);
    }
  }, [checkUserAndToken, getHeaders]);

  const fetchUserStatsSubmissions = useCallback(async () => {
    if (!checkUserAndToken()) return;
    const headers = getHeaders();
    if (!headers) return;

    try {
      setLoadingStats(true);
      setError(null);
      const response = await axios.get(`${config.API_URL}/user-stats-submissions`, { headers });
      setUserStatsSubmissions(response.data || []);
    } catch (error) {
      console.error('Fehler beim Abrufen der Statistik-Submissions:', error);
      setError('Fehler beim Laden der Statistikdaten');
      setUserStatsSubmissions([]);
    } finally {
      setLoadingStats(false);
    }
  }, [checkUserAndToken, getHeaders]);

  const submitTask = async (taskId, userEmail, file, details) => {
    if (!checkUserAndToken()) throw new Error("Nicht eingeloggt");
    const headers = getHeaders();
    if (!headers) throw new Error("Kein Token");

    try {
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
      }, { headers });

      await fetchAllUserSubmissions();
      if (user?.role === 'admin') {
         await fetchSubmissions(pagination?.page || 1);
      }

      return true;
    } catch (error) {
      console.error('Fehler beim Einreichen der Aufgabe:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleApproveSubmission = async (submissionId, adminComment = '') => {
    if (!checkUserAndToken()) throw new Error("Nicht eingeloggt");
    const headers = getHeaders();
    if (!headers) throw new Error("Kein Token");

    try {
      const response = await axios.post(`${config.API_URL}/approve-submission`, 
        { submissionId, adminComment },
        { headers }
      );
      
      await fetchSubmissions(pagination?.page || 1);
      await fetchAllUserSubmissions();
      await fetchAllArchiveSubmissions();
      await fetchUserStatsSubmissions();

      if (selectedSubmission?.id === submissionId) {
        setSelectedSubmission(prev => ({ ...prev, status: 'approved', admin_comment: adminComment }));
      }
      return response.data;
    } catch (error) {
      console.error('Fehler bei der Genehmigung:', error);
      throw error;
    }
  };

  const handleRejectSubmission = async (submissionId, adminComment = '') => {
    if (!checkUserAndToken()) throw new Error("Nicht eingeloggt");
    const headers = getHeaders();
    if (!headers) throw new Error("Kein Token");
    
    try {
      const response = await axios.post(`${config.API_URL}/reject-submission`,
        { submissionId, adminComment },
        { headers }
      );
      
      await fetchSubmissions(pagination?.page || 1);
      await fetchAllUserSubmissions();
      await fetchAllArchiveSubmissions();

      if (selectedSubmission?.id === submissionId) {
        setSelectedSubmission(prev => ({ ...prev, status: 'rejected', admin_comment: adminComment }));
      }
      return response.data;
    } catch (error) {
      console.error('Fehler bei der Ablehnung:', error);
      setError(error.message || 'Fehler bei der Ablehnung');
      throw error;
    }
  };

  const deleteSubmission = async (submissionId) => {
    if (!checkUserAndToken()) throw new Error("Nicht eingeloggt");
    const headers = getHeaders();
    if (!headers) throw new Error("Kein Token");

    try {
      setLoading(true);
      setError(null);

      const response = await axios.delete(`${config.API_URL}/delete-submission/${submissionId}`, { headers });

      console.log('Einsendung erfolgreich gelöscht');
      await fetchAllUserSubmissions();
      await fetchSubmissions(pagination?.page || 1);
      
    } catch (error) {
      console.error('Fehler beim Löschen der Einsendung:', error);
      setError('Fehler beim Löschen der Einsendung');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (taskId) => {
    if (!checkUserAndToken()) throw new Error("Nicht eingeloggt");
    const headers = getHeaders();
    if (!headers) throw new Error("Kein Token");

    try {
      setLoading(true);
      const response = await axios.delete(`${config.API_URL}/delete-task/${taskId}`, { headers });
      await fetchTasks();
    } catch (error) {
      console.error('Fehler beim Löschen der Aufgabe:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskVisibility = async (taskId, isHidden) => {
    if (!checkUserAndToken()) throw new Error("Nicht eingeloggt");
    const headers = getHeaders();
    if (!headers) throw new Error("Kein Token");

    try {
      setLoading(true);
      setError(null);
      const response = await axios.post(
        `${config.API_URL}/toggle-task-visibility/${taskId}`,
        { is_hidden: isHidden },
        { headers }
      );
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
    user,
    tasks,
    submissions,
    pagination,
    allUserSubmissions,
    allArchiveSubmissions,
    userStatsSubmissions,
    selectedSubmission,
    loading,
    loadingDetails,
    loadingStats,
    loadingArchive,
    loadingUserSubmissions,
    error,
    fetchTasks,
    fetchSubmissions,
    fetchAllUserSubmissions,
    fetchAllArchiveSubmissions,
    fetchSubmissionDetails,
    fetchUserStatsSubmissions,
    submitTask,
    handleApproveSubmission,
    handleRejectSubmission,
    deleteSubmission,
    deleteTask,
    toggleTaskVisibility,
  };

  return (
    <TaskContext.Provider value={contextValue}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => useContext(TaskContext);