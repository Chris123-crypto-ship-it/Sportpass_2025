// src/components/BMICalculator.js
import React, { useState } from 'react';

const BMICalculator = () => {
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [bmi, setBmi] = useState(null);

  const calculateBMI = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (w > 0 && h > 0) {
      const calculatedBMI = w / (h * h);
      setBmi(calculatedBMI.toFixed(2));
    }
  };

  return (
    <div className="bmi-calculator" style={{ marginTop: '20px', padding: '10px', backgroundColor: '#e3f2fd', borderRadius: '5px' }}>
      <h3>BMI Rechner</h3>
      <div>
        <label>Gewicht (kg):</label>
        <input
          type="number"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
        />
      </div>
      <div>
        <label>Größe (m):</label>
        <input
          type="number"
          value={height}
          onChange={(e) => setHeight(e.target.value)}
        />
      </div>
      <button onClick={calculateBMI}>BMI berechnen</button>
      {bmi && <p>Dein BMI: {bmi}</p>}
    </div>
  );
};

export default BMICalculator;
