require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const compression = require('compression');

// Die folgenden Module werden nur verwendet, wenn sie verfügbar sind
let NodeCache;
let rateLimit;
try {
  NodeCache = require('node-cache');
} catch (e) {
  // Fallback, wenn node-cache nicht verfügbar ist
  NodeCache = class {
    constructor() {
      this.cache = {};
      this.timeouts = {};
    }
    
    set(key, value, ttl) {
      this.cache[key] = value;
      
      if (this.timeouts[key]) {
        clearTimeout(this.timeouts[key]);
      }
      
      this.timeouts[key] = setTimeout(() => {
        delete this.cache[key];
        delete this.timeouts[key];
      }, ttl * 1000);
    }
    
    get(key) {
      return this.cache[key];
    }
    
    del(key) {
      delete this.cache[key];
      if (this.timeouts[key]) {
        clearTimeout(this.timeouts[key]);
        delete this.timeouts[key];
      }
    }
    
    has(key) {
      return Object.prototype.hasOwnProperty.call(this.cache, key);
    }
  };
}

try {
  rateLimit = require('express-rate-limit');
} catch (e) {
  // Fallback, wenn express-rate-limit nicht verfügbar ist
  rateLimit = () => (req, res, next) => next();
}

const app = express();

// Kompression für alle Anfragen aktivieren
app.use(compression());

// Cache mit einer Standard-TTL von 5 Minuten initialisieren
const cache = new NodeCache({ stdTTL: 300 });

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

// Rate Limiting für alle Anfragen
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 100, // Limit jede IP auf 100 Anfragen pro Fenster
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

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

// Die Einbindung aller anderen Endpunkte aus server.js folgt hier...

// 🔹 Server starten
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
  console.log(`Umgebung: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Supabase URL: ${process.env.SUPABASE_URL || 'nicht gesetzt'}`);
}); 