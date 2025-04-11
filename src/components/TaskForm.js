import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const TaskForm = () => {
  const [maxSubmissions, setMaxSubmissions] = useState('');
  const [detailsLink, setDetailsLink] = useState('');
  const [isHidden, setIsHidden] = useState(false);
  const [isEasterEgg, setIsEasterEgg] = useState(false);
  const [availableDate, setAvailableDate] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { token } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();

    const taskData = {
      dynamic_type: dynamicType,
      points_per_unit: dynamicType !== 'none' ? parseFloat(pointsPerUnit) : null,
      static_points: dynamicType === 'none' ? parseInt(staticPoints) : null,
      difficulty: parseInt(difficulty) || 1,
      is_easter_egg: isEasterEgg,
      available_date: isEasterEgg ? availableDate : null
    };

    console.log('Sende Task-Daten:', taskData);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ... existing form fields ... */}
      <label htmlFor="isEasterEgg">Osterei?</label>
      <input
        type="checkbox"
        id="isEasterEgg"
        checked={isEasterEgg}
        onChange={(e) => setIsEasterEgg(e.target.checked)}
      />
      {isEasterEgg && (
        <>
          <label htmlFor="availableDate">Verfügbar am:</label>
          <input
            type="date"
            id="availableDate"
            value={availableDate}
            onChange={(e) => setAvailableDate(e.target.value)}
            required={isEasterEgg}
          />
        </>
      )}
      <label htmlFor="maxSubmissions">Maximale Einreichungen (optional):</label>
      <input
        type="number"
        id="maxSubmissions"
        value={maxSubmissions}
        onChange={(e) => setMaxSubmissions(e.target.value)}
      />
      {/* ... rest of the form ... */}
    </form>
  );
};

export default TaskForm; 