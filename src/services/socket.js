// src/services/taskService.js
const taskService = {
  fetchTasks: async () => {
    // Beispiel für das Abrufen von Aufgaben von einer API
    const response = await fetch('/api/tasks');
    const tasks = await response.json();
    return tasks;
  },
  submitTask: async (taskData) => {
    const response = await fetch('/api/submitTask', {
      method: 'POST',
      body: JSON.stringify(taskData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return await response.json();
  },
};

export default taskService;

// Keep-Alive Mechanismus für Render
const PING_INTERVAL = 840000; // 14 Minuten (unter den 15 Minuten Timeout von Render)

export const keepServerAlive = () => {
  const pingServer = async () => {
    try {
      const response = await fetch('https://sportpass-2025.onrender.com/ping');
      console.log('Server ping erfolgreich:', response.ok);
    } catch (error) {
      console.warn('Server ping fehlgeschlagen:', error);
    }
  };

  // Initial ping
  pingServer();

  // Regelmäßiger ping
  setInterval(pingServer, PING_INTERVAL);
};
