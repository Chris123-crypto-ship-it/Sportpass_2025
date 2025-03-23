const login = async (email, password) => {
  try {
    const response = await fetch('http://localhost:3001/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login fehlgeschlagen');
    }

    const data = await response.json();
    
    // Speichere User-Daten und Token
    setUser({
      email: data.user.email,
      role: data.user.role,
      token: data.token
    });

    // Token im localStorage speichern
    localStorage.setItem('user', JSON.stringify({
      email: data.user.email,
      role: data.user.role,
      token: data.token
    }));

    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}; 