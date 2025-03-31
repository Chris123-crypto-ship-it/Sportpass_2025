import React, { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { FaTrophy, FaRunning, FaDumbbell, FaRunning as FaFlexibility, FaCalendarCheck, FaMedal, FaUserCircle, FaInfoCircle } from 'react-icons/fa';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import './Dashboard.css';

// ChartJS registrieren
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const { user } = useAuth();
  const { tasks, submissions, archive } = useTasks();

  // Lade-Status prüfen
  const isLoading = !user || !tasks || !submissions;

  // Berechne Statistiken
  const stats = useMemo(() => {
    if (!archive || !tasks) return null;

    const approvedSubmissions = archive.filter(
      sub => sub.status === 'approved' && sub.user_email === user?.email
    );

    const totalPoints = approvedSubmissions.reduce((sum, sub) => {
      // Versuche die Punkte aus den Submission-Details zu holen
      let points = 0;
      try {
        const details = typeof sub.details === 'string' 
          ? JSON.parse(sub.details) 
          : sub.details;
        
        // Verwende die berechneten Punkte aus den Details
        points = details?.task_points || details?.calculated_points || 0;
      } catch (e) {
        console.error('Fehler beim Parsen der Submission-Details:', e);
        const task = tasks.find(t => t.id === sub.task_id);
        points = task?.points || 0;
      }
      return sum + points;
    }, 0);

    const categoryStats = approvedSubmissions.reduce((acc, sub) => {
      const task = tasks.find(t => t.id === sub.task_id);
      const category = task?.category || 'Sonstige';
      
      // Punkte aus den Details holen
      let points = 0;
      try {
        const details = typeof sub.details === 'string' 
          ? JSON.parse(sub.details) 
          : sub.details;
        points = details?.task_points || details?.calculated_points || 0;
      } catch (e) {
        console.error('Fehler beim Parsen der Submission-Details:', e);
        points = task?.points || 0;
      }
      
      // Summiere die Punkte pro Kategorie
      acc[category] = (acc[category] || 0) + points;
      return acc;
    }, {});

    const recentActivity = approvedSubmissions
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5)
      .map(sub => {
        const task = tasks.find(t => t.id === sub.task_id);
        let points = 0;
        
        try {
          const details = typeof sub.details === 'string' 
            ? JSON.parse(sub.details) 
            : sub.details;
          points = details?.task_points || details?.calculated_points || 0;
        } catch (e) {
          console.error('Fehler beim Parsen der Submission-Details:', e);
          points = task?.points || 0;
        }

        return {
          title: task?.title || 'Unbekannte Aufgabe',
          category: task?.category || 'Sonstige',
          date: new Date(sub.created_at).toLocaleDateString('de-DE'),
          points: points
        };
      });

    return {
      totalPoints,
      categoryStats,
      recentActivity
    };
  }, [archive, tasks, user]);

  // Diagrammdaten vorbereiten
  const chartData = useMemo(() => {
    if (!archive || !tasks) return null;

    const last7Days = [...Array(7)].map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    const approvedSubmissions = archive.filter(
      sub => sub.status === 'approved' && sub.user_email === user?.email
    );

    const dailyPoints = last7Days.map(date => {
      return approvedSubmissions
        .filter(sub => sub.created_at.startsWith(date))
        .reduce((sum, sub) => {
          let points = 0;
          try {
            const details = typeof sub.details === 'string' 
              ? JSON.parse(sub.details) 
              : sub.details;
            points = details?.task_points || details?.calculated_points || 0;
          } catch (e) {
            console.error('Fehler beim Parsen der Submission-Details:', e);
            const task = tasks.find(t => t.id === sub.task_id);
            points = task?.points || 0;
          }
          return sum + points;
        }, 0);
    });

    return {
      labels: last7Days.map(date => new Date(date).toLocaleDateString('de-DE', { weekday: 'short' })),
      datasets: [
        {
          label: 'Punkte pro Tag',
          data: dailyPoints,
          borderColor: '#2196f3',
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          tension: 0.3,
          fill: true
        }
      ]
    };
  }, [archive, tasks, user]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: false }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 10 }
      }
    }
  };

  // Ladezustand anzeigen
  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Lade Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-info">
        <FaInfoCircle className="info-icon" />
        <div className="info-text">
          Willkommen in deinem persönlichen Dashboard! Hier siehst du eine Übersicht deiner Aktivitäten und Leistungen. Beachte, dass detaillierte Aufgabenstatistiken nach einer Woche automatisch aus der Übersicht entfernt werden. Deine gesammelten Punkte bleiben davon unberührt und werden dauerhaft gespeichert.
        </div>
      </div>
      <div className="dashboard-header">
        <div className="user-welcome">
          <FaUserCircle className="user-icon" />
          <div className="welcome-text">
            <h1>Willkommen zurück, {user.name || 'Sportler'}!</h1>
            <p className="subtitle">Hier ist dein aktueller Fortschritt</p>
          </div>
        </div>
      </div>

      <div className="stats-overview">
        <div className="stat-card">
          <FaTrophy className="stat-icon" />
          <div className="stat-info">
            <h3>Gesamtpunkte</h3>
            <p className="stat-value">{stats?.totalPoints || 0}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <FaRunning className="stat-icon" />
          <div className="stat-info">
            <h3>Cardio</h3>
            <p className="stat-value">{stats?.categoryStats?.cardio || 0}</p>
          </div>
        </div>

        <div className="stat-card">
          <FaDumbbell className="stat-icon" />
          <div className="stat-info">
            <h3>Kraft</h3>
            <p className="stat-value">{stats?.categoryStats?.strength || 0}</p>
          </div>
        </div>

        <div className="stat-card">
          <FaFlexibility className="stat-icon" />
          <div className="stat-info">
            <h3>Flexibilität</h3>
            <p className="stat-value">{stats?.categoryStats?.flexibility || 0}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="chart-section">
          <h2>Deine Aktivitäten</h2>
          <div className="chart-container">
            {chartData && <Line data={chartData} options={chartOptions} />}
          </div>
        </div>

        <div className="recent-activities">
          <h2>Letzte Aktivitäten</h2>
          <div className="activities-list">
            {stats?.recentActivity.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-icon">
                  {activity.category === 'cardio' && <FaRunning />}
                  {activity.category === 'strength' && <FaDumbbell />}
                  {activity.category === 'flexibility' && <FaFlexibility />}
                  {!['cardio', 'strength', 'flexibility'].includes(activity.category) && <FaCalendarCheck />}
                </div>
                <div className="activity-info">
                  <div className="activity-header">
                    <h4>{activity.title}</h4>
                    <div className="activity-points">
                      <FaMedal className="points-icon" />
                      <span>{activity.points} Punkte</span>
                    </div>
                  </div>
                  <div className="activity-details">
                    <span className="activity-date">
                      <FaCalendarCheck className="date-icon" />
                      {activity.date}
                    </span>
                    <span className={`activity-category ${activity.category}`}>
                      {activity.category}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {(!stats?.recentActivity || stats.recentActivity.length === 0) && (
              <div className="no-activities">
                <p>Noch keine Aktivitäten vorhanden. Zeit, aktiv zu werden! 💪</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="pending-submissions">
        <h2>Ausstehende Einsendungen</h2>
        <div className="submissions-list">
          {submissions
            .filter(sub => sub.status === 'pending' && sub.user_email === user.email)
            .map(sub => {
              const task = tasks.find(t => t.id === sub.task_id);
              return (
                <div key={sub.id} className="submission-item">
                  <span>{task?.title || 'Unbekannte Aufgabe'}</span>
                  <span className="pending-status">⏳ Ausstehend</span>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
