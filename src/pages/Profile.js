// src/pages/Profile.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaEnvelope, FaUpload, FaTrash, FaPlus, FaChartLine, FaEdit } from 'react-icons/fa';
import './Profile.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faWeight, 
  faWalking, 
  faDumbbell,
  faBullseye,
  faRunning,
  faBicycle 
} from '@fortawesome/free-solid-svg-icons';
import config from '../config';

const Profile = () => {
  const { user } = useAuth();
  const [profileImage, setProfileImage] = useState(null);
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [bmi, setBmi] = useState(null);
  const [goals, setGoals] = useState([]);
  const [newGoal, setNewGoal] = useState('');
  const [editingGoal, setEditingGoal] = useState(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [userName, setUserName] = useState(localStorage.getItem('userName') || user?.name || 'Sportpass Nutzer');
  const [age, setAge] = useState('');

  useEffect(() => {
    // Lade gespeicherte Daten
    const savedImage = localStorage.getItem('profileImage');
    const savedGoals = JSON.parse(localStorage.getItem('goals') || '[]');
    const savedWeight = localStorage.getItem('weight');
    const savedHeight = localStorage.getItem('height');

    if (savedImage) setProfileImage(savedImage);
    if (savedGoals) setGoals(savedGoals);
    if (savedWeight) setWeight(savedWeight);
    if (savedHeight) setHeight(savedHeight);
  }, []);

  useEffect(() => {
    // Font Awesome CSS dynamisch laden
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
    document.head.appendChild(link);

    // Cleanup beim Unmount
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  const handleNameChange = async () => {
    if (!userName.trim()) {
      alert('Bitte geben Sie einen Namen ein.');
      return;
    }

    try {
      // Speichern Sie den Namen zunächst lokal
      localStorage.setItem('userName', userName.trim());
      
      // Holen Sie sich die Benutzerinformationen - versuche verschiedene Möglichkeiten
      const token = localStorage.getItem('token');
      
      // Versuche user aus verschiedenen Quellen zu laden
      let userData = null;
      
      // 1. Versuche aus dem direkten user-Objekt in localStorage
      try {
        userData = JSON.parse(localStorage.getItem('user') || '{}');
      } catch (e) {
        console.warn('Fehler beim Parsen der Benutzerinformationen aus localStorage', e);
      }
      
      // 2. Falls user-Objekt nicht vollständig ist, versuche das aktuelle user-Objekt aus dem Context
      if (!userData || !userData.id) {
        if (user && user.id) {
          userData = user;
          console.log('Verwende Benutzerinformationen aus dem AuthContext');
        }
      }
      
      // Benutzer die user_id aus dem Kontext, falls vorhanden und id fehlt
      if (!userData.id && user && user.id) {
        userData.id = user.id;
      }
      
      // Prüfen ob wir eine Benutzer-ID haben
      if (!userData || !userData.id) {
        console.warn('Keine Benutzer-ID gefunden, Name wurde nur lokal gespeichert');
        alert('Der Name wurde lokal gespeichert, aber nicht mit dem Server synchronisiert. Bitte später erneut versuchen oder neu anmelden.');
        setIsEditingName(false);
        return;
      }
      
      // Name in Datenbank aktualisieren
      console.log(`Aktualisiere Benutzer mit ID: ${userData.id}`);
      const response = await fetch(`${config.API_URL}/users/${userData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: userName.trim() })
      });

      if (!response.ok) {
        console.warn('Backend-Update fehlgeschlagen, Name wurde nur lokal gespeichert');
        alert('Der Name wurde lokal gespeichert, aber nicht mit dem Server synchronisiert.');
      } else {
        // Aktualisiere alle lokalen Speicherorte mit dem neuen Namen
        
        // 1. Aktualisiere user im localStorage
        if (userData) {
          userData.name = userName.trim();
          localStorage.setItem('user', JSON.stringify(userData));
        }
        
        // 2. Versuche authContext zu aktualisieren, falls vorhanden
        try {
          const authContext = JSON.parse(localStorage.getItem('authContext') || '{}');
          if (authContext && authContext.user) {
            authContext.user.name = userName.trim();
            localStorage.setItem('authContext', JSON.stringify(authContext));
          }
        } catch (e) {
          console.warn('AuthContext konnte nicht aktualisiert werden', e);
        }
        
        alert('Name erfolgreich aktualisiert!');
      }

      setIsEditingName(false);
    } catch (error) {
      console.error('Fehler beim Speichern des Namens:', error);
      alert('Es gab ein Problem beim Speichern des Namens. Bitte versuchen Sie es erneut.');
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result;
        setProfileImage(imageData);
        localStorage.setItem('profileImage', imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddGoal = (e) => {
    e.preventDefault();
    if (newGoal.trim()) {
      const newGoalItem = {
        id: Date.now(),
        text: newGoal,
        completed: false
      };
      const updatedGoals = [...goals, newGoalItem];
      setGoals(updatedGoals);
      localStorage.setItem('goals', JSON.stringify(updatedGoals));
      setNewGoal('');
    }
  };

  const toggleGoal = (id) => {
    const updatedGoals = goals.map(goal => 
      goal.id === id ? { ...goal, completed: !goal.completed } : goal
    );
    setGoals(updatedGoals);
    localStorage.setItem('goals', JSON.stringify(updatedGoals));
  };

  const deleteGoal = (id) => {
    const updatedGoals = goals.filter(goal => goal.id !== id);
    setGoals(updatedGoals);
    localStorage.setItem('goals', JSON.stringify(updatedGoals));
  };

  const startEditGoal = (goal) => {
    setEditingGoal(goal);
    setNewGoal(goal.text);
  };

  const saveEditGoal = () => {
    if (newGoal.trim() && editingGoal) {
      const updatedGoals = goals.map(goal =>
        goal.id === editingGoal.id ? { ...goal, text: newGoal } : goal
      );
      setGoals(updatedGoals);
      localStorage.setItem('goals', JSON.stringify(updatedGoals));
      setEditingGoal(null);
      setNewGoal('');
    }
  };

  const calculateBMI = () => {
    if (weight && height) {
      const heightInMeters = height / 100;
      const bmiValue = (weight / (heightInMeters * heightInMeters)).toFixed(1);
      setBmi(bmiValue);
      localStorage.setItem('weight', weight);
      localStorage.setItem('height', height);
      localStorage.setItem('age', age);
    }
  };

  const getBMICategory = (bmiValue) => {
    const bmi = parseFloat(bmiValue);
    if (bmi < 18.5) return { text: 'Untergewicht', color: '#3498db', description: 'BMI liegt unter dem empfohlenen Bereich.' };
    if (bmi < 25) return { text: 'Normalgewicht', color: '#2ecc71', description: 'BMI liegt im gesunden Bereich.' };
    if (bmi < 30) return { text: 'Übergewicht', color: '#f39c12', description: 'BMI liegt leicht über dem empfohlenen Bereich.' };
    if (bmi < 35) return { text: 'Adipositas Grad I', color: '#e67e22', description: 'BMI liegt deutlich über dem empfohlenen Bereich.' };
    if (bmi < 40) return { text: 'Adipositas Grad II', color: '#e74c3c', description: 'BMI liegt stark über dem empfohlenen Bereich.' };
    return { text: 'Adipositas Grad III', color: '#c0392b', description: 'BMI liegt sehr stark über dem empfohlenen Bereich.' };
  };

  const getBMIRecommendation = (bmiValue, ageValue) => {
    const bmi = parseFloat(bmiValue);
    const age = parseInt(ageValue);
    
    let recommendation = '';
    
    if (!age) {
      return 'Gib dein Alter ein, um eine genauere Bewertung zu erhalten.';
    }
    
    if (age < 18) {
      return 'Der BMI allein ist für Personen unter 18 Jahren nicht zuverlässig. Bitte konsultiere einen Arzt für eine genauere Bewertung.';
    }
    
    if (age > 65) {
      if (bmi < 22) {
        recommendation = 'Bei älteren Erwachsenen ist ein etwas höherer BMI-Wert oft empfohlen. Dein BMI könnte zu niedrig sein.';
      } else if (bmi > 27 && bmi < 30) {
        recommendation = 'Für Personen über 65 ist ein leicht erhöhter BMI oft unbedenklich.';
      }
    }
    
    if (bmi < 18.5) {
      recommendation += 'Versuche deine Kalorienzufuhr zu erhöhen und spreche mit einem Ernährungsberater.';
    } else if (bmi >= 25) {
      recommendation += 'Eine ausgewogene Ernährung und regelmäßige Bewegung können helfen, einen gesünderen BMI zu erreichen.';
    } else {
      recommendation += 'Dein BMI liegt im gesunden Bereich. Halte deine ausgewogene Ernährung und deinen aktiven Lebensstil bei.';
    }
    
    return recommendation;
  };

  const renderGoals = () => {
    if (!user.goals) return null;

    return (
      <div className="goals-section">
        <h2>Meine Ziele</h2>
        <div className="goals-grid">
          {Object.entries(user.goals).map(([key, value]) => (
            <div className="goal-card" key={key}>
              <div className="goal-icon">
                <FontAwesomeIcon icon={getGoalIcon(key)} />
              </div>
              <div className="goal-content">
                <h3>{translateGoal(key)}</h3>
                <p className="goal-value">{formatGoalValue(key, value)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const getGoalIcon = (key) => {
    const icons = {
      weight: faWeight,
      steps: faWalking,
      workout: faDumbbell,
      cardio: faRunning,
      distance: faBicycle,
      goals: faBullseye
      // Weitere Icons können hier hinzugefügt werden
    };
    return icons[key] || faBullseye; // Standard-Icon falls kein passendes gefunden wird
  };

  const translateGoal = (key) => {
    const translations = {
      weight: 'Gewichtsziel',
      steps: 'Tägliche Schritte',
      workout: 'Workout pro Woche',
      cardio: 'Cardio-Training',
      distance: 'Distanz',
      goals: 'Allgemeines Ziel'
      // Weitere Übersetzungen hier hinzufügen
    };
    return translations[key] || key;
  };

  const formatGoalValue = (key, value) => {
    switch (key) {
      case 'weight':
        return `${value} kg`;
      case 'steps':
        return `${value.toLocaleString()} Schritte`;
      case 'workout':
        return `${value}x pro Woche`;
      case 'distance':
        return `${value} km`;
      case 'cardio':
        return `${value} min`;
      default:
        return value;
    }
  };

  if (!user) {
    return <p>Bitte logge dich ein, um dein Profil zu sehen.</p>;
  }

  return (
    <div className="profile-container" style={{
      padding: '20px',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <div className="profile-header">
        <div className="profile-image-section">
          <div className="profile-image-container">
            <img 
              src={profileImage || 'default-profile.jpg'} 
              alt="Profilbild"
              className="profile-image"
            />
            <label className="profile-image-upload">
              <FaUpload />
              <input
                type="file"
                onChange={handleImageUpload}
                accept="image/*"
                style={{ display: 'none' }}
              />
            </label>
            </div>
        </div>

        <div className="profile-info">
          {isEditingName ? (
            <form onSubmit={handleNameChange} className="name-edit-form">
                <input
                  type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="name-edit-input"
                placeholder="Name eingeben"
                autoFocus
              />
              <div className="name-edit-buttons">
                <button type="submit" className="name-save-btn">
                  Speichern
                </button>
                <button 
                  type="button" 
                  className="name-cancel-btn"
                  onClick={() => {
                    setIsEditingName(false);
                    setUserName(localStorage.getItem('userName') || user?.name || 'Sportpass Nutzer');
                  }}
                >
                  Abbrechen
                </button>
              </div>
            </form>
          ) : (
            <div className="name-display">
              <h1 className="profile-name">{userName}</h1>
              <button 
                onClick={() => setIsEditingName(true)} 
                className="name-edit-btn"
              >
                <FaEdit />
              </button>
            </div>
          )}
          <div className="profile-email">
            <FaEnvelope />
            {user.email}
          </div>
          <div className="profile-role">
            <FaUser />
            {user.role === 'admin' ? 'Administrator' : 'Mitglied'}
          </div>
        </div>
      </div>

      <div className="profile-content">
        <div className="main-content">
          <div className="section-card">
            <h2 className="section-title">
              <FaPlus />
              Meine Ziele
            </h2>
            <form onSubmit={editingGoal ? saveEditGoal : handleAddGoal}>
              <div className="goal-item">
                <input
                  type="text"
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  placeholder="Neues Ziel eingeben..."
                  className="goal-input"
                />
                <button type="submit" className="add-goal-button">
                  {editingGoal ? 'Speichern' : 'Hinzufügen'}
                </button>
                {editingGoal && (
                  <button
                    type="button"
                    className="add-goal-button"
                    onClick={() => {
                      setEditingGoal(null);
                      setNewGoal('');
                    }}
                  >
                    Abbrechen
                  </button>
                )}
              </div>
            </form>
            <div className="goals-list">
              {goals.map(goal => (
                <div key={goal.id} className="goal-item">
                <input
                  type="checkbox"
                  checked={goal.completed}
                    onChange={() => toggleGoal(goal.id)}
                    className="goal-checkbox"
                  />
                  <span
                    style={{
                      textDecoration: goal.completed ? 'line-through' : 'none',
                      flex: 1
                    }}
                  >
                  {goal.text}
                </span>
                  <div className="goal-actions">
                    <button
                      onClick={() => startEditGoal(goal)}
                      className="add-goal-button"
                    >
                      Bearbeiten
                    </button>
                    <button
                      onClick={() => deleteGoal(goal.id)}
                      className="goal-delete-btn"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="section-card">
            <h2 className="section-title">
              <FaChartLine />
              BMI-Rechner
            </h2>
            <div className="bmi-calculator">
              <div className="bmi-inputs">
                <div className="input-group">
                  <label htmlFor="weight">Gewicht (kg)</label>
                  <input
                    id="weight"
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="z.B. 70"
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="height">Größe (cm)</label>
                  <input
                    id="height"
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="z.B. 175"
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="age">Alter</label>
                  <input
                    id="age"
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="z.B. 30"
                  />
                </div>
              </div>

              <button className="calculate-button" onClick={calculateBMI}>
                BMI berechnen
              </button>

              {bmi && (
                <div className="bmi-result">
                  <div className="bmi-value" style={{ color: getBMICategory(bmi).color }}>
                    {bmi}
                  </div>
                  <div className="bmi-category" style={{ color: getBMICategory(bmi).color, fontWeight: 'bold' }}>
                    {getBMICategory(bmi).text}
                  </div>
                  <div className="bmi-description">
                    {getBMICategory(bmi).description}
                  </div>
                  <div className="bmi-scale">
                    <div className="bmi-scale-bar">
                      <div className="bmi-marker" style={{ left: `${Math.min(Math.max(parseFloat(bmi) - 10, 0) * 100 / 30, 100)}%` }}></div>
                      <div className="bmi-zones">
                        <div className="bmi-zone" style={{ backgroundColor: '#3498db' }}></div>
                        <div className="bmi-zone" style={{ backgroundColor: '#2ecc71' }}></div>
                        <div className="bmi-zone" style={{ backgroundColor: '#f39c12' }}></div>
                        <div className="bmi-zone" style={{ backgroundColor: '#e67e22' }}></div>
                        <div className="bmi-zone" style={{ backgroundColor: '#c0392b' }}></div>
                      </div>
                    </div>
                    <div className="bmi-scale-labels">
                      <span>15</span>
                      <span>18.5</span>
                      <span>25</span>
                      <span>30</span>
                      <span>35</span>
                      <span>40+</span>
                    </div>
                  </div>
                  <div className="bmi-recommendation">
                    {getBMIRecommendation(bmi, age)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
