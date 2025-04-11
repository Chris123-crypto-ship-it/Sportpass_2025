// src/pages/Stats.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { FaRunning, FaHeartbeat, FaDumbbell, FaMedal, FaFire, FaCalendarCheck, FaInfoCircle } from 'react-icons/fa';
import './Stats.css';

const Stats = () => {
  const { user } = useAuth();
  const { tasks, userStatsSubmissions, fetchUserStatsSubmissions, fetchTasks, loadingStats } = useTasks();
  const [timeFilter, setTimeFilter] = useState('all');
  const [stats, setStats] = useState({
    totalPoints: 0,
    activities: 0,
    activeDays: 0,
    categories: {},
    achievements: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
    fetchUserStatsSubmissions();
  }, [fetchTasks, fetchUserStatsSubmissions]);

  useEffect(() => {
    if (loadingStats || !tasks || !userStatsSubmissions) {
        setIsLoading(true);
        return;
    }
    setIsLoading(false);

    const now = new Date();
    const msPerDay = 24 * 60 * 60 * 1000;
    
    let filteredSubmissions = userStatsSubmissions;

    if (timeFilter !== 'all') {
      const days = timeFilter === 'week' ? 7 : 30;
      filteredSubmissions = filteredSubmissions.filter(sub => 
        (now - new Date(sub.created_at)) <= days * msPerDay
      );
    }

    const totalPoints = filteredSubmissions.reduce((sum, sub) => {
      return sum + (sub.calculated_points || 0);
    }, 0);

    const activities = filteredSubmissions.length;

    const uniqueDays = new Set(
      filteredSubmissions.map(sub => 
        new Date(sub.created_at).toISOString().split('T')[0]
      )
    );
    const activeDays = uniqueDays.size;

    const categories = filteredSubmissions.reduce((acc, sub) => {
      const task = tasks.find(t => t.id === sub.task_id);
      const category = task?.category || 'Sonstige';
      if (!acc[category]) {
        acc[category] = {
          count: 0,
          points: 0,
          icon: getCategoryIcon(category)
        };
      }
      
      const points = sub.calculated_points || 0;
      
      acc[category].count++;
      acc[category].points += points;
      return acc;
    }, {});

    const achievements = calculateAchievements(totalPoints, activities, activeDays, categories);

    setStats({ totalPoints, activities, activeDays, categories, achievements });

  }, [user, userStatsSubmissions, tasks, timeFilter, loadingStats]);

  const getCategoryIcon = (category) => {
    switch (category.toLowerCase()) {
      case 'running':
        return FaRunning;
      case 'cardio':
        return FaHeartbeat;
      case 'strength':
        return FaDumbbell;
      default:
        return FaFire;
    }
  };

  const calculateAchievements = (points, activities, days, categories) => {
    return [
      {
        icon: '🏃',
        name: 'Ausdauer-Champion',
        details: `${activities} Aktivitäten absolviert`,
        unlocked: activities >= 10
      },
      {
        icon: '🏆',
        name: 'Punktesammler',
        details: `${points} Punkte gesammelt`,
        unlocked: points >= 100
      },
      {
        icon: '🔥',
        name: 'Streak Master',
        details: `${days} aktive Tage`,
        unlocked: days >= 7
      },
      {
        icon: '⭐',
        name: 'All-Star',
        details: 'Alle Kategorien gemeistert',
        unlocked: Object.keys(categories).length >= 3
      }
    ];
  };

  if (isLoading) {
    return (
      <div className="stats-container stats-loading">
        <div className="loading-spinner"></div>
        <p>Lade Statistiken...</p>
      </div>
    );
  }

  return (
    <div className="stats-container">
      <div className="stats-info">
        <FaInfoCircle className="info-icon" />
        <div className="info-text">
          Hier siehst du deine persönlichen Statistiken. Aufgaben und detaillierte Statistiken werden nach einer Woche automatisch aus der Übersicht entfernt. Deine gesammelten Punkte bleiben davon unberührt und werden dauerhaft in deinem Konto gespeichert. Falls keine Statistiken angezeigt werden, gehe bitte kurz zum Archiv und warte, bis die Daten dort geladen sind. Kehre dann zur Statistik-Seite zurück.
        </div>
      </div>

      <div className="stats-header">
        <h1 className="stats-title">Deine Sportpass-Statistiken</h1>
        <div className="time-filter">
          <button 
            className={`time-filter-button ${timeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setTimeFilter('all')}
          >
            Gesamt
          </button>
          <button 
            className={`time-filter-button ${timeFilter === 'month' ? 'active' : ''}`}
            onClick={() => setTimeFilter('month')}
          >
            Dieser Monat
          </button>
          <button 
            className={`time-filter-button ${timeFilter === 'week' ? 'active' : ''}`}
            onClick={() => setTimeFilter('week')}
          >
            Diese Woche
          </button>
        </div>
      </div>

      <div className="main-stats">
        <div className="stat-card">
          <div className="stat-icon-container">
            <div className="stat-icon">
              <FaMedal />
            </div>
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.totalPoints}</div>
            <div className="stat-label">Gesamtpunkte</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-container">
            <div className="stat-icon">
              <FaFire />
            </div>
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.activities}</div>
            <div className="stat-label">Aktivitäten</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-container">
            <div className="stat-icon">
              <FaCalendarCheck />
            </div>
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.activeDays}</div>
            <div className="stat-label">Aktive Tage</div>
            <div className="stat-sublabel">in Folge</div>
          </div>
        </div>
      </div>

      <div className="stats-details">
        <div className="category-stats">
          <div className="category-stats-header">
            <h2 className="category-stats-title">Aktivitäten nach Kategorie</h2>
          </div>
          <div className="category-list">
            {Object.entries(stats.categories).map(([category, data]) => {
              const Icon = data.icon;
              const percentage = (data.count / stats.activities) * 100;
              return (
                <div key={category} className="category-item">
                  <div className="category-icon">
                    <Icon />
                  </div>
                  <div className="category-info">
                    <div className="category-name">{category}</div>
                    <div className="category-progress">
                      <div 
                        className="progress-bar"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="category-count">{data.count}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="achievements">
          <div className="achievements-header">
            <h2 className="achievements-title">Deine Bestleistungen</h2>
          </div>
          <div className="achievement-list">
            {stats.achievements.map((achievement, index) => (
              <div 
                key={index} 
                className={`achievement-card ${achievement.unlocked ? 'unlocked' : ''}`}
              >
                <div className="achievement-icon">{achievement.icon}</div>
                <div className="achievement-name">{achievement.name}</div>
                <div className="achievement-details">{achievement.details}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stats;
