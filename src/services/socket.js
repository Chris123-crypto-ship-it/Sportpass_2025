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
