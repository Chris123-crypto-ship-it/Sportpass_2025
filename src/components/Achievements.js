import React from 'react';
import { useTasks } from '../context/TaskContext';
import './Achievements.css';

const availableBadges = [
  { title: 'Bronze Badge', icon: '🥉', threshold: 10 },
  { title: 'Silber Badge', icon: '🥈', threshold: 50 },
  { title: 'Gold Badge', icon: '🥇', threshold: 100 },
];

const Achievements = () => {
  const { userPoints } = useTasks(); // Punkte direkt aus Context holen

  return (
    <div className="achievements">
      <h3>Abzeichen</h3>
      <div className="badges">
        {availableBadges.map((badge) => {
          const unlocked = userPoints >= badge.threshold;
          return (
            <div
              key={badge.title}
              className={`badge ${unlocked ? 'unlocked' : 'locked'}`}
            >
              <span className="icon">{badge.icon}</span>
              <span className="title">{badge.title}</span>
              {!unlocked && (
                <span className="locked-text">
                  (Erhältlich bei {badge.threshold} Punkten)
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Achievements;
