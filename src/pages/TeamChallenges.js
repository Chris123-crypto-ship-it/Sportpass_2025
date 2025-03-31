import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';

const TeamChallenges = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [loading, setLoading] = useState(true);

  const dummyChallenges = [
    {
      id: 1,
      title: "Frühlingsaktivität",
      description: "Sammelt als Team 1000 Punkte in einer Woche",
      reward: "🏆 Team-Pokal + 100 Bonuspunkte pro Teammitglied",
      endDate: "2024-04-01",
      progress: 650,
      goal: 1000
    },
    {
      id: 2,
      title: "Cardio-König",
      description: "Schließt 20 Cardio-Aufgaben als Team ab",
      reward: "👑 Cardio-Krone + 50 Bonuspunkte",
      endDate: "2024-03-25",
      progress: 12,
      goal: 20
    }
  ];

  const dummyTeams = [
    {
      id: 1,
      name: "Die Sportlichen",
      members: ["Max M.", "Lisa K.", "Tom B."],
      points: 1250,
      rank: 1
    },
    {
      id: 2,
      name: "Power Team",
      members: ["Anna S.", "Peter W.", "Maria L."],
      points: 980,
      rank: 2
    }
  ];

  useEffect(() => {
    // Hier später die echte API-Anbindung
    setTeams(dummyTeams);
    setChallenges(dummyChallenges);
    setLoading(false);
  }, []);

  const handleCreateTeam = () => {
    if (!newTeamName.trim()) return;
    
    const newTeam = {
      id: teams.length + 1,
      name: newTeamName,
      members: [user.name],
      points: 0,
      rank: teams.length + 1
    };

    setTeams([...teams, newTeam]);
    setNewTeamName('');
  };

  const handleJoinTeam = (teamId) => {
    setTeams(teams.map(team => {
      if (team.id === teamId && !team.members.includes(user.name)) {
        return {
          ...team,
          members: [...team.members, user.name]
        };
      }
      return team;
    }));
  };

  if (loading) {
    return (
      <div className="loading-container" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '200px'
      }}>
        <div className="spinner" style={{
          width: '50px',
          height: '50px',
          border: '5px solid #f3f3f3',
          borderTop: '5px solid #3498db',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    );
  }

  return (
    <div className="team-challenges-container" style={{ padding: '20px' }}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .challenge-card {
            transition: transform 0.2s;
          }

          .challenge-card:hover {
            transform: scale(1.02);
          }

          .progress-bar {
            height: 10px;
            background: #eee;
            border-radius: 5px;
            overflow: hidden;
          }

          .progress-fill {
            height: 100%;
            background: #2193b0;
            transition: width 0.3s ease;
          }
        `}
      </style>

      <h2>Team-Challenges</h2>

      {/* Team-Verwaltung */}
      <div className="team-management" style={{
        background: 'white',
        borderRadius: '10px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3>Dein Team</h3>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <input
            type="text"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            placeholder="Team-Name"
            style={{
              padding: '8px',
              borderRadius: '5px',
              border: '1px solid #ddd'
            }}
          />
          <button
            onClick={handleCreateTeam}
            style={{
              padding: '8px 16px',
              borderRadius: '5px',
              border: 'none',
              background: '#4CAF50',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            Team erstellen
          </button>
        </div>

        {/* Team-Liste */}
        <div className="teams-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px'
        }}>
          {teams.map(team => (
            <div key={team.id} className="team-card" style={{
              background: '#f8f9fa',
              borderRadius: '8px',
              padding: '15px',
              border: '1px solid #eee'
            }}>
              <h4 style={{ marginTop: 0 }}>{team.name}</h4>
              <p>Rang: #{team.rank}</p>
              <p>Punkte: {team.points}</p>
              <p>Mitglieder: {team.members.join(', ')}</p>
              {!team.members.includes(user.name) && (
                <button
                  onClick={() => handleJoinTeam(team.id)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '5px',
                    border: 'none',
                    background: '#2196F3',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  Team beitreten
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Aktive Challenges */}
      <div className="active-challenges" style={{
        background: 'white',
        borderRadius: '10px',
        padding: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3>Aktive Herausforderungen</h3>
        <div className="challenges-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          {challenges.map(challenge => (
            <div key={challenge.id} className="challenge-card" style={{
              background: '#f8f9fa',
              borderRadius: '8px',
              padding: '20px',
              border: '1px solid #eee'
            }}>
              <h4 style={{ marginTop: 0 }}>{challenge.title}</h4>
              <p>{challenge.description}</p>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${(challenge.progress / challenge.goal) * 100}%`
                  }}
                />
              </div>
              <p style={{ fontSize: '0.9em', color: '#666' }}>
                {challenge.progress} / {challenge.goal}
              </p>
              <p style={{ marginTop: '10px' }}>
                <strong>Belohnung:</strong> {challenge.reward}
              </p>
              <p style={{ fontSize: '0.9em', color: '#666' }}>
                Endet am: {new Date(challenge.endDate).toLocaleDateString('de-DE')}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeamChallenges; 