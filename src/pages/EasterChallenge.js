import React, { useState, useEffect } from 'react';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { FaGift } from 'react-icons/fa';
import TaskCard from '../components/TaskCard';
import './EasterChallenge.css'; // Wir brauchen später noch eine CSS-Datei

const EasterChallenge = () => {
  const { tasks, fetchTasks, loading } = useTasks();
  const { user } = useAuth();
  const [todaysEggs, setTodaysEggs] = useState([]);

  useEffect(() => {
    // Aufgaben laden, falls noch nicht geschehen
    if (!tasks || tasks.length === 0) {
      fetchTasks();
    }
  }, [fetchTasks, tasks]);

  useEffect(() => {
    if (tasks && tasks.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const currentEggs = tasks.filter(task =>
        task.is_easter_egg === true && task.available_date === today
      );
      setTodaysEggs(currentEggs);
    }
  }, [tasks]);

  if (loading) {
    return <div className="loading-container">Lade Challenge-Daten...</div>;
  }

  return (
    <div className="easter-challenge-container">
      <h1 className="easter-challenge-title">
        <FaGift /> Oster-Challenge <FaGift />
      </h1>
      <div className="challenge-info">
        <p>Willkommen zur Oster-Challenge! Finde und sammle jeden Tag die versteckten Ostereier, um Punkte zu sammeln.</p>
        <p>Jedes gesammelte Ei gibt <strong>5 Punkte</strong>. Wer am Ende die meisten Eier gesammelt hat, erhält zusätzlich <strong>70 Bonuspunkte!</strong></p>
        {/* Hier könnten noch Start-/Enddatum angezeigt werden */}
      </div>

      <h2 className="section-title">Heutige Ostereier</h2>
      {todaysEggs.length === 0 ? (
        <p className="no-eggs">Heute sind keine Ostereier verfügbar oder du hast sie schon gefunden!</p>
      ) : (
        <div className="easter-eggs-grid">
          {/* Hier werden die TaskCards für die heutigen Eier eingefügt */}
          {todaysEggs.map(egg => (
            <TaskCard key={egg.id} task={egg} isChallengeView={true} />
          ))}
        </div>
      )}

       {/* Optional: Bereich für gesammelte Eier des Users */}
       {/* <h2 className="section-title">Deine Sammlung</h2> */}
       {/* ... Logik zur Anzeige gesammelter Eier ... */}

       {/* Optional: Bereich für die Rangliste nach der Challenge */}
       {/* <h2 className="section-title">Rangliste</h2> */}
       {/* ... Logik zur Anzeige der Rangliste ... */}

    </div>
  );
};

export default EasterChallenge; 