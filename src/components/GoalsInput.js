// src/components/GoalsInput.js
import React, { useState } from 'react';

const GoalsInput = ({ onSave }) => {
  const [goalText, setGoalText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if(goalText.trim()){
      onSave(goalText);
      setGoalText('');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Neues Ziel:</label>
        <input
          type="text"
          value={goalText}
          onChange={(e) => setGoalText(e.target.value)}
        />
      </div>
      <button type="submit">Ziel hinzufügen</button>
    </form>
  );
};

export default GoalsInput;
