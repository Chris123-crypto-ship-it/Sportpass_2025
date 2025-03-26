require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const compression = require('compression');

const app = express();

// Kompression für alle Anfragen aktivieren
app.use(compression());

// Einfacher In-Memory Cache
const cache = {
  data: {},
  timeouts: {},
  set: function(key, value, ttl) {
    this.data[key] = value;
    
    // Bestehenden Timeout löschen, falls vorhanden
    if (this.timeouts[key]) {
      clearTimeout(this.timeouts[key]);
    }
    
    // Timeout setzen für TTL
    this.timeouts[key] = setTimeout(() => {
      delete this.data[key];
      delete this.timeouts[key];
    }, ttl * 1000);
  },
  get: function(key) {
    return this.data[key];
  },
  del: function(key) {
    delete this.data[key];
    if (this.timeouts[key]) {
      clearTimeout(this.timeouts[key]);
      delete this.timeouts[key];
    }
  },
  has: function(key) {
    return !!this.data[key];
  }
};

// Funktion zum Invalidieren bestimmter Cache-Einträge
const invalidateCache = (keys) => {
  if (Array.isArray(keys)) {
    keys.forEach(key => {
      if (cache.has(key)) {
        console.log(`Invalidating cache key: ${key}`);
        cache.del(key);
      }
    });
  } else if (typeof keys === 'string') {
    if (cache.has(keys)) {
      console.log(`Invalidating cache key: ${keys}`);
      cache.del(keys);
    }
  }
};

// Erhöhe das Limit für JSON-Payloads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Konfiguriere CORS
app.use(cors({
  origin: '*', // Erlaubt Anfragen von jeder Domain
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true
}));

// Supabase Client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const SECRET_KEY = process.env.SECRET_KEY || 'geheimes_token';

// Authentifizierungs-Middleware
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Kein Token vorhanden' });
    }

    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth Error:', error);
    return res.status(403).json({ message: 'Ungültiger Token' });
  }
};

// Middleware für Admin-Rechte
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Keine Admin-Rechte' });
  }
  next();
};

// E-Mail-Konfiguration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Funktion zum Senden der Verifizierungs-E-Mail
const sendVerificationEmail = async (email, verificationCode) => {
  const frontendUrl = process.env.NODE_ENV === 'production' 
    ? 'https://sportpass-2025.vercel.app' 
    : 'http://localhost:3000';
    
  const verificationLink = `${frontendUrl}/verify-email?code=${verificationCode}`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'E-Mail Verifizierung - Sportpass',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Willkommen bei Sportpass!</h2>
        <p>Vielen Dank für deine Registrierung. Bitte verifiziere deine E-Mail-Adresse, indem du auf den folgenden Link klickst:</p>
        <p style="margin: 20px 0;">
          <a href="${verificationLink}" 
             style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            E-Mail verifizieren
          </a>
        </p>
        <p>Falls der Button nicht funktioniert, kopiere bitte diesen Link in deinen Browser:</p>
        <p style="word-break: break-all; color: #666;">${verificationLink}</p>
        <p>Dieser Link ist 24 Stunden gültig.</p>
        <p>Falls du dich nicht registriert hast, ignoriere diese E-Mail bitte.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Verifizierungs-E-Mail gesendet an:', email);
    return true;
  } catch (error) {
    console.error('Fehler beim Senden der Verifizierungs-E-Mail:', error);
    throw error;
  }
};

// 🔹 Alle Aufgaben abrufen
app.get('/tasks', authenticateToken, async (req, res) => {
  try {
    const currentDate = new Date().toISOString();
    const { view } = req.query;
    
    // Cache-Key erstellen, der vom view-Parameter abhängt
    const cacheKey = `tasks_${view || 'default'}`;
    
    // Prüfen, ob Daten im Cache sind
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      console.log(`Serving tasks (view: ${view || 'default'}) from cache`);
      return res.json(cachedData);
    }
    
    // Basis-Query erstellen
    let query = supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    // Nur in der normalen Tasks-Ansicht (wenn kein view Parameter) ausgeblendete Aufgaben filtern
    if (!view) {
      query = query.eq('is_hidden', false);
    }

    const { data: tasks, error } = await query;
    
    if (error) {
      console.error('Fehler beim Abrufen der Aufgaben:', error);
      return res.status(500).json({ 
        message: 'Fehler beim Abrufen der Aufgaben',
        error: error.message
      });
    }

    // Im Cache speichern (TTL: 2 Minuten)
    cache.set(cacheKey, tasks, 120);
    
    // Aufgaben zurückgeben
    res.json(tasks);
  } catch (error) {
    console.error('Server-Fehler:', error);
    res.status(500).json({ 
      message: 'Interner Serverfehler',
      error: error.message
    });
  }
});

// 🔹 Einsendungen abrufen
app.get('/submissions', async (req, res) => {
  try {
    // Cache-Key erstellen
    const cacheKey = 'all_submissions';
    
    // Prüfen, ob Daten im Cache sind
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      console.log('Serving submissions from cache');
      return res.json(cachedData);
    }
    
    const { data: submissions, error } = await supabase
      .from('submissions')
      .select(`
        *,
        tasks:task_id (
          id,
          title,
          dynamic,
          dynamic_type,
          multiplier,
          points,
          expiration_date
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fehler beim Abrufen der Einsendungen:', error);
      return res.status(500).json({ message: 'Fehler beim Abrufen der Einsendungen' });
    }

    // Einsendungen mit berechneten Punkten anreichern
    const submissionsWithInfo = submissions.map(submission => {
      let submissionDetails;
      try {
        submissionDetails = typeof submission.details === 'string' 
          ? JSON.parse(submission.details) 
          : submission.details;
      } catch (e) {
        console.error('Fehler beim Parsen der Submission-Details:', e);
        submissionDetails = {};
      }

      // Punkte aus den gespeicherten Details verwenden
      const calculatedPoints = submissionDetails.task_points || 0;
      
      const isExpired = submission.tasks.expiration_date && 
        new Date(submission.tasks.expiration_date) < new Date();

      return {
        ...submission,
        calculated_points: calculatedPoints,
        task_status: isExpired ? 'expired' : 'active',
        submission_details: {
          ...submissionDetails,
          task_type: submission.tasks.dynamic ? 'dynamic' : 'static',
          base_points: submission.tasks.points,
          multiplier: submission.tasks.multiplier
        }
      };
    });

    // Im Cache speichern (TTL: 2 Minuten)
    cache.set(cacheKey, submissionsWithInfo, 120);
    
    res.json(submissionsWithInfo);
  } catch (error) {
    console.error('Server-Fehler:', error);
    res.status(500).json({ message: 'Interner Serverfehler' });
  }
});

// 🔹 Leaderboard abrufen
app.get('/leaderboard', async (req, res) => {
  try {
    // Cache-Key für Leaderboard
    const cacheKey = 'leaderboard';
    
    // Prüfen, ob Daten im Cache sind
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      console.log('Serving leaderboard from cache');
      return res.json(cachedData);
    }
    
    const { data: users, error } = await supabase
      .from('users')
      .select('name, points')
      .eq('is_verified', true)  // Nur verifizierte Benutzer
      .order('points', { ascending: false });

    if (error) throw error;
    
    // Im Cache speichern (TTL: 5 Minuten)
    cache.set(cacheKey, users || [], 300);
    
    res.json(users || []);
  } catch (error) {
    console.error('Fehler beim Abrufen des Leaderboards:', error);
    res.status(500).json({ message: 'Fehler beim Abrufen der Rangliste' });
  }
});

// 🔹 Alle Benutzer abrufen (nur Admin)
app.get('/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    // Cache-Key erstellen
    const cacheKey = 'all_users';
    
    // Prüfen, ob Daten im Cache sind
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      console.log('Serving users from cache');
      return res.json(cachedData);
    }
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('name');

    if (error) {
      console.error('Fehler beim Abrufen der Benutzer:', error);
      return res.status(500).json({ message: 'Datenbankfehler', error: error.message });
    }

    // Im Cache speichern (TTL: 2 Minuten)
    cache.set(cacheKey, data, 120);
    
    res.json(data);
  } catch (error) {
    console.error('Server-Fehler:', error);
    res.status(500).json({ message: 'Interner Serverfehler' });
  }
});

// Registrierung, Login, und andere Endpunkte hier hinzufügen...
// (Sie sollten aus server.js kopiert werden)

// 🔹 Server starten
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
  console.log(`Umgebung: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Supabase URL: ${process.env.SUPABASE_URL || 'nicht gesetzt'}`);
}); 