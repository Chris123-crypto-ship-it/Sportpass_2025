require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const NodeCache = require('node-cache');

const app = express();

// Cache für API-Antworten
const apiCache = new NodeCache({ 
  stdTTL: 300, // 5 Minuten Standardzeit
  checkperiod: 120 // Überprüfung alle 2 Minuten
});

// Komprimierung für alle Antworten
app.use(compression());

// API-Ratenbegrenzung
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 100, // 100 Anfragen pro IP
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Zu viele Anfragen von dieser IP, bitte versuche es später erneut.'
});

// Ratenbegrenzung nur auf Authentifizierungs-Endpoints anwenden
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 Minuten
  max: 10, // 10 Anfragen pro IP
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Zu viele Anmeldeversuche, bitte versuche es später erneut.'
});

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

// Cache-Middleware
const cacheMiddleware = (duration) => {
  return (req, res, next) => {
    // Nur GET-Anfragen cachen
    if (req.method !== 'GET') {
      return next();
    }

    const key = req.originalUrl || req.url;
    const cachedResponse = apiCache.get(key);

    if (cachedResponse) {
      res.send(cachedResponse);
      return;
    }

    // Originale send-Methode speichern
    const originalSend = res.send;

    // Überschreibe die send-Methode, um das Ergebnis zu cachen
    res.send = function(body) {
      apiCache.set(key, body, duration);
      originalSend.call(this, body);
    };

    next();
  };
};

// Funktion zum Invalidieren des Caches
const invalidateCache = (pattern) => {
  const keys = apiCache.keys();
  const matchingKeys = keys.filter(key => key.includes(pattern));
  matchingKeys.forEach(key => apiCache.del(key));
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

// Überprüfung auf Datenbank-Timeouts
const withTimeout = (promise, ms = 10000) => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error('Datenbankabfrage hat das Zeitlimit überschritten'));
    }, ms);
  });

  return Promise.race([
    promise,
    timeoutPromise
  ]).finally(() => clearTimeout(timeoutId));
};

// 🔹 Registrierung (mit Rate-Limiting)
app.post("/register", authLimiter, async (req, res) => {
  try {
    console.log("Registrierungsdaten erhalten:", req.body);
    
    const { name, email, password, class: userClass } = req.body;
    
    // Validierung
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, E-Mail und Passwort sind erforderlich" });
    }
    
    // Generiere Verifizierungscode
    const verificationCode = crypto.randomBytes(32).toString('hex');
    
    // Prüfe, ob E-Mail bereits existiert
    const { data: existingUsers, error: searchError } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single();

    if (searchError && searchError.code !== 'PGRST116') {
      console.error("Fehler bei der E-Mail-Überprüfung:", searchError);
      return res.status(500).json({ error: "Datenbankfehler", details: searchError.message });
    }

    if (existingUsers) {
        return res.status(400).json({ error: "Diese E-Mail-Adresse wird bereits verwendet" });
      }
      
      // Passwort hashen
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Benutzer in Supabase einfügen
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([{
          name,
          email,
        password: hashedPassword,
        class: userClass || '',
        role: 'user',
        points: 0,
        goals: [],
        verification_code: verificationCode,
        is_verified: false
      }])
      .select()
      .single();

    if (insertError) {
      console.error("Fehler beim Einfügen des Benutzers:", insertError);
            return res.status(500).json({ 
              error: "Fehler beim Erstellen des Benutzers", 
        details: insertError.message 
            });
          }
          
    // Verifizierungs-E-Mail senden
    await sendVerificationEmail(email, verificationCode);
    
    console.log("Benutzer erfolgreich registriert und Verifizierungs-E-Mail gesendet");
          return res.status(201).json({ 
      message: "Benutzer erfolgreich registriert. Bitte überprüfen Sie Ihre E-Mails.",
            success: true
    });
    
  } catch (error) {
    console.error("Fehler bei der Registrierung:", error);
    return res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// 🔹 Login (mit Rate-Limiting)
app.post('/login', authLimiter, async (req, res) => {
  try {
  const { email, password } = req.body;

    // Benutzer in der Datenbank suchen
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      console.error("Fehler beim Suchen des Benutzers:", error);
      return res.status(500).json({ error: "Datenbankfehler" });
    }

    if (!user) {
      return res.status(401).json({ error: "E-Mail oder Passwort falsch" });
    }

    // Überprüfen, ob die E-Mail verifiziert wurde
    if (!user.is_verified) {
      return res.status(403).json({ 
        error: "E-Mail-Adresse nicht verifiziert", 
        message: "Bitte überprüfen Sie Ihre E-Mails und verifizieren Sie Ihre E-Mail-Adresse."
      });
    }

    // Passwort überprüfen
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "E-Mail oder Passwort falsch" });
    }

    // JWT Token generieren
  const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email, 
        role: user.role 
      },
    SECRET_KEY,
      { expiresIn: '24h' }
  );
  
    // Erfolgreiche Anmeldung
  res.json({
      message: "Erfolgreich eingeloggt",
      token,
    user: {
      id: user.id,
      name: user.name,
        email: user.email,
      role: user.role,
        class: user.class
    }
  });

  } catch (error) {
    console.error("Fehler beim Login:", error);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// 🔹 Teilnehmerliste abrufen (nur Admins, mit Caching)
app.get('/api/participants', authenticateToken, isAdmin, cacheMiddleware(60 * 5), async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, class, points, is_verified')
      .order('name', { ascending: true });
      
    if (error) {
      console.error("Fehler beim Abrufen der Teilnehmer:", error);
      return res.status(500).json({ error: "Fehler beim Abrufen der Teilnehmer" });
    }
    
    res.json(users);
  } catch (error) {
    console.error("Serverfehler bei Teilnehmerliste:", error);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// 🔹 Leaderboard abrufen (mit Caching)
app.get('/api/leaderboard', cacheMiddleware(60 * 5), async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, class, points, achievements')
      .order('points', { ascending: false })
      .limit(100); // Limitiere Ergebnisse auf 100 Einträge
      
    if (error) {
      console.error("Fehler beim Abrufen des Leaderboards:", error);
      return res.status(500).json({ error: "Fehler beim Abrufen des Leaderboards" });
    }
    
    res.json(users);
  } catch (error) {
    console.error("Serverfehler bei Leaderboard:", error);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// 🔹 Aufgaben abrufen (mit Caching)
app.get('/api/tasks', cacheMiddleware(60 * 5), async (req, res) => {
  try {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Fehler beim Abrufen der Aufgaben:", error);
      return res.status(500).json({ error: "Fehler beim Abrufen der Aufgaben" });
}

    res.json(tasks);
  } catch (error) {
    console.error("Serverfehler bei Aufgaben:", error);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// 🔹 Einsendungen abrufen (mit Validierung)
app.get('/api/submissions', authenticateToken, async (req, res) => {
  try {
    let query = supabase.from('submissions').select('*');
    
    // Admin sieht alle Einsendungen, normale Benutzer nur ihre eigenen
    if (req.user.role !== 'admin') {
      query = query.eq('user_email', req.user.email);
    }
    
    // Füge eine Begrenzung hinzu für bessere Performance
    query = query.order('created_at', { ascending: false }).limit(100);
    
    const { data, error } = await query;

    if (error) {
      console.error("Fehler beim Abrufen der Einsendungen:", error);
      return res.status(500).json({ error: "Fehler beim Abrufen der Einsendungen" });
    }

    res.json(data);
  } catch (error) {
    console.error("Serverfehler bei Einsendungen:", error);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// 🔹 Einsendung genehmigen
app.post('/api/submissions/:id/approve', authenticateToken, isAdmin, async (req, res) => {
  try {
  const { id } = req.params;
    const { admin_comment } = req.body;
    
    // Bestehende Einsendung abrufen
    const { data: submission, error: fetchError } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error("Fehler beim Abrufen der Einsendung:", fetchError);
      return res.status(500).json({ error: "Fehler beim Abrufen der Einsendung" });
    }

    if (!submission) {
      return res.status(404).json({ error: "Einsendung nicht gefunden" });
    }
    
    // Einsendung aktualisieren
    const { data: updatedSubmission, error: updateError } = await supabase
      .from('submissions')
      .update({ 
        status: 'approved',
        admin_comment: admin_comment || '',
        updated_at: new Date()
      })
      .eq('id', id)
      .select()
      .single();
      
    if (updateError) {
      console.error("Fehler beim Aktualisieren der Einsendung:", updateError);
      return res.status(500).json({ error: "Fehler beim Aktualisieren der Einsendung" });
    }
    
    // Cache invalidieren
    invalidateCache('/api/submissions');
    invalidateCache('/api/leaderboard');
    
    res.json(updatedSubmission);
  } catch (error) {
    console.error("Serverfehler bei Genehmigung:", error);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// 🔹 Einsendung ablehnen
app.post('/api/submissions/:id/reject', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_comment } = req.body;
    
    // Einsendung aktualisieren
    const { data: updatedSubmission, error } = await supabase
      .from('submissions')
      .update({ 
        status: 'rejected',
        admin_comment: admin_comment || '',
        updated_at: new Date()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error("Fehler beim Ablehnen der Einsendung:", error);
      return res.status(500).json({ error: "Fehler beim Ablehnen der Einsendung" });
    }
    
    // Cache invalidieren
    invalidateCache('/api/submissions');
    
    res.json(updatedSubmission);
  } catch (error) {
    console.error("Serverfehler bei Ablehnung:", error);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// Optimierte Datenbank-Abfrage für Submissions
app.get('/submissions', async (req, res) => {
  try {
    // Originalfunktion beibehalten
    const { data: submissions, error } = await withTimeout(supabase
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
      .order('created_at', { ascending: false }), 8000);

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

    res.json(submissionsWithInfo);
  } catch (error) {
    console.error('Server-Fehler:', error);
    res.status(500).json({ message: 'Interner Serverfehler', error: error.message });
  }
});

// Leaderboard mit besserer Fehlerbehandlung
app.get('/leaderboard', async (req, res) => {
  try {
    const { data: users, error } = await withTimeout(supabase
      .from('users')
      .select('name, points')
      .eq('is_verified', true)
      .order('points', { ascending: false }), 5000);

    if (error) {
      console.error('Fehler beim Abrufen des Leaderboards:', error);
      return res.status(500).json({ message: 'Fehler beim Abrufen der Rangliste', error: error.message });
    }
    res.json(users || []);
  } catch (error) {
    console.error('Fehler beim Abrufen des Leaderboards:', error);
    res.status(500).json({ message: 'Fehler beim Abrufen der Rangliste', error: error.message });
  }
});

// Tasks mit Fehlerbehandlung und Timeout
app.get('/tasks', async (req, res) => {
  try {
    const currentDate = new Date().toISOString();
    const { view } = req.query;
    
    // Basis-Query erstellen
    let query = supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    // Nur in der normalen Tasks-Ansicht (wenn kein view Parameter) ausgeblendete Aufgaben filtern
    if (!view) {
      query = query.eq('is_hidden', false);
    }

    const { data: tasks, error } = await withTimeout(query, 8000);

    if (error) {
      console.error('Fehler beim Abrufen der Aufgaben:', error);
      return res.status(500).json({ 
        message: 'Fehler beim Abrufen der Aufgaben',
      error: error.message 
    });
  }
    
    // Aufgaben direkt zurückgeben, ohne Modifikationen
    res.json(tasks);
  } catch (error) {
    console.error('Server-Fehler:', error);
    res.status(500).json({ 
      message: 'Interner Serverfehler',
      error: error.message
    });
  }
});

// Benutzer löschen (nur für Admins)
app.delete('/users/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Prüfen, ob der Benutzer existiert
    const { data: userExists, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError || !userExists) {
      return res.status(404).json({ message: 'Benutzer nicht gefunden' });
    }

    // Benutzer löschen
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    res.json({ message: 'Benutzer erfolgreich gelöscht' });
  } catch (error) {
    console.error('Fehler beim Löschen des Benutzers:', error);
    res.status(500).json({ message: 'Fehler beim Löschen des Benutzers' });
  }
});

// Port
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
