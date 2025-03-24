require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const mysql = require('mysql2/promise');

const app = express();

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

// 🔹 Registrierung
app.post("/register", async (req, res) => {
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

// 🔹 Login
app.post('/login', async (req, res) => {
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

// 🔹 Teilnehmerliste abrufen (nur Admins)
app.get('/api/participants', authenticateToken, isAdmin, async (req, res) => {
  const { data: users, error } = await supabase.from('users').select('id, name, email');
  if (error) return res.status(500).json({ message: 'Fehler beim Abrufen der Teilnehmer' });

  res.json(users);
});

// Benutzer abrufen (nur für Admins)
app.get('/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, role, points, class')
      .order('name');

    if (error) throw error;
    res.json(users);
  } catch (error) {
    console.error('Fehler beim Abrufen der Benutzer:', error);
    res.status(500).json({ message: 'Fehler beim Abrufen der Benutzer' });
  }
});

// Aufgabe erstellen (nur für Admins)
app.post('/add-task', authenticateToken, async (req, res) => {
  try {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Keine Admin-Rechte' });
  }

    const {
      title,
      description,
      category,
      dynamic_type,
      points_per_unit,
      static_points,
      difficulty,
      expiration_date
    } = req.body;

    // Debug-Log
    console.log('Received task data:', req.body);

    // Validierung
    if (!title) {
      return res.status(400).json({ message: 'Titel ist erforderlich' });
    }

    // Validierung für dynamische vs. statische Aufgaben
    const isDynamic = dynamic_type !== 'none';
    
    if (!isDynamic && (!static_points || static_points < 0)) {
      return res.status(400).json({ 
        message: 'Punkte müssen für statische Aufgaben definiert und nicht negativ sein' 
      });
    }
    
    if (isDynamic && (!points_per_unit || points_per_unit < 0)) {
      return res.status(400).json({ 
        message: 'Punkte pro Einheit müssen für dynamische Aufgaben definiert und nicht negativ sein' 
      });
    }

    // Aufgabendaten vorbereiten
    const taskData = {
      title: title.trim(),
      description: description?.trim() || '',
      category,
      dynamic: isDynamic,
      dynamic_type: isDynamic ? dynamic_type : null,
      multiplier: isDynamic ? parseFloat(points_per_unit) || 1 : null,
      points: !isDynamic ? parseInt(static_points) : 0, // 0 für dynamische Aufgaben
      difficulty: parseInt(difficulty) || 1,
      expiration_date: expiration_date ? new Date(expiration_date).toISOString() : null
    };

    // Debug-Log
    console.log('Prepared task data:', taskData);

    const { data, error } = await supabase
      .from('tasks')
      .insert([taskData])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
}

    // Debug-Log
    console.log('Task created successfully:', data);

    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      message: 'Fehler beim Erstellen der Aufgabe',
      error: error.message 
    });
  }
});

// 🔹 Alle Aufgaben abrufen
app.get('/tasks', authenticateToken, async (req, res) => {
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

    const { data: tasks, error } = await query;
    
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

// 🔹 Automatisches Ausblenden abgelaufener Aufgaben
app.post('/auto-hide-expired-tasks', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Keine Admin-Rechte' });
    }

    const currentDate = new Date().toISOString();
    
    // Aktualisiere alle abgelaufenen Aufgaben
    const { data, error } = await supabase
      .from('tasks')
      .update({ is_hidden: true })
      .lt('expiration_date', currentDate)
      .is('is_hidden', false)
      .select();

    if (error) {
      console.error('Fehler beim Ausblenden abgelaufener Aufgaben:', error);
      throw error;
    }

    res.json({ 
      message: 'Abgelaufene Aufgaben wurden ausgeblendet',
      updatedTasks: data?.length || 0
    });
  } catch (error) {
    console.error('Server-Fehler:', error);
    res.status(500).json({ 
      message: 'Fehler beim Ausblenden abgelaufener Aufgaben',
      error: error.message
    });
  }
});

// 🔹 Aufgabe ausblenden/einblenden
app.post('/toggle-task-visibility/:taskId', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Keine Admin-Rechte' });
    }

    const { taskId } = req.params;
    const { is_hidden } = req.body;

    // Aufgabe aktualisieren
    const { data, error } = await supabase
      .from('tasks')
      .update({ is_hidden })
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      console.error('Fehler beim Ändern der Sichtbarkeit:', error);
      throw error;
    }

    res.json({
      message: is_hidden ? 'Aufgabe ausgeblendet' : 'Aufgabe eingeblendet',
      task: data
    });
  } catch (error) {
    console.error('Server-Fehler:', error);
    res.status(500).json({ message: 'Fehler beim Ändern der Sichtbarkeit' });
  }
});

// 🔹 Aufgabe einsenden
app.post('/submit-task', authenticateToken, async (req, res) => {
  try {
    const { taskId, userEmail, details, file_url } = req.body;
    
    console.log('Aufgabeneinreichung erhalten:', { 
      taskId, 
      userEmail, 
      details, 
      hasFileUrl: !!file_url 
    });

    // Validiere die Eingaben
    if (!taskId || !userEmail || !file_url) {
      return res.status(400).json({ message: 'Fehlende Pflichtfelder' });
    }

    // Hole die Aufgabe aus der Datenbank
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();
    
    if (taskError || !task) {
      console.error('Fehler beim Abrufen der Aufgabe:', taskError);
      return res.status(404).json({ message: 'Aufgabe nicht gefunden' });
    }

    // Berechne die Punkte
    let calculatedPoints;
    if (task.dynamic && details?.dynamic_value) {
      // Für dynamische Aufgaben
      const dynamicValue = parseFloat(details.dynamic_value);
      calculatedPoints = Math.round(dynamicValue * task.multiplier);
      console.log('Dynamische Punkte berechnet:', {
        dynamicValue,
        multiplier: task.multiplier,
        calculatedPoints
      });
    } else {
      // Für statische Aufgaben
      calculatedPoints = task.points;
    }

    // Speichere die Submission mit allen relevanten Informationen
    const submissionData = {
      task_id: taskId,
      user_email: userEmail,
      status: 'pending',
      details: JSON.stringify({
        ...details,
        task_points: calculatedPoints,
        task_type: task.dynamic ? 'dynamic' : 'static',
        dynamic_value: details?.dynamic_value,
        multiplier: task.multiplier,
        base_points: task.points
      }),
      file_url,
      created_at: new Date().toISOString()
    };

    console.log('Speichere Submission:', submissionData);

    const { data, error } = await supabase
      .from('submissions')
      .insert([submissionData])
      .select();

    if (error) {
      console.error('Fehler beim Speichern der Submission:', error);
      throw error;
    }

    res.status(201).json({
      ...data[0],
      calculated_points: calculatedPoints,
      task: {
        title: task.title,
        dynamic: task.dynamic,
        points: calculatedPoints
      }
    });
  } catch (error) {
    console.error('Server-Fehler:', error);
    res.status(500).json({ 
      message: 'Fehler beim Speichern der Einsendung',
      error: error.message 
    });
  }
});

// 🔹 Einsendungen abrufen
app.get('/submissions', async (req, res) => {
  try {
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

    res.json(submissionsWithInfo);
  } catch (error) {
    console.error('Server-Fehler:', error);
    res.status(500).json({ message: 'Interner Serverfehler' });
  }
});

// 🔹 Einsendung löschen (nur wenn sie noch "pending" ist)
app.delete('/delete-submission/:id', async (req, res) => {
  const { id } = req.params;

  const { data: submission, error: fetchError } = await supabase.from('submissions').select('status').eq('id', id).single();
  if (!submission) return res.status(404).json({ message: 'Einsendung nicht gefunden' });

  if (submission.status !== 'pending') {
    return res.status(400).json({ message: 'Einsendung kann nicht mehr gelöscht werden' });
  }

  const { error } = await supabase.from('submissions').delete().eq('id', id);
  if (error) return res.status(500).json({ message: 'Fehler beim Löschen der Einsendung' });

  res.json({ message: 'Einsendung erfolgreich gelöscht' });
});

// 🔹 Genehmigung der Einsendung
app.post('/approve-submission', authenticateToken, isAdmin, async (req, res) => {
  const { submissionId, adminComment } = req.body;
  console.log('Approve Request:', { submissionId, adminComment });

  if (!submissionId) {
    return res.status(400).json({ message: 'Keine Submission ID angegeben' });
  }

  try {
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (submissionError) {
      console.error('Submission Error:', submissionError);
      return res.status(500).json({ message: 'Datenbankfehler bei der Suche nach der Einsendung' });
    }

    if (!submission) {
      return res.status(404).json({ message: 'Einsendung nicht gefunden' });
    }

    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', submission.task_id)
      .single();

    if (taskError) {
      console.error('Task Error:', taskError);
      return res.status(500).json({ message: 'Fehler beim Abrufen der Aufgabe' });
    }

    if (!task) {
      return res.status(404).json({ message: 'Zugehörige Aufgabe nicht gefunden' });
    }

    if (submission.status === 'approved') {
      return res.status(400).json({ message: 'Einsendung wurde bereits genehmigt' });
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('points')
      .eq('email', submission.user_email)
      .single();

    if (userError || !user) {
      console.error('User Error:', userError);
      return res.status(404).json({ message: 'Benutzer nicht gefunden' });
    }

    // Parsen der details mit Fallback
    let submissionDetails = {};
    try {
      submissionDetails = typeof submission.details === 'string' 
        ? JSON.parse(submission.details) 
        : (submission.details || {});
    } catch (e) {
      console.error('Fehler beim Parsen der Submission-Details:', e);
      submissionDetails = {};
    }

    // Punkte berechnen basierend auf den gespeicherten Details oder dem Task selbst
    let earnedPoints = task.points; // Standardwert für statische Aufgaben
    
    if (task.dynamic) {
      if (submissionDetails.calculated_points) {
        // Verwende vorberechnete Punkte, wenn verfügbar
        earnedPoints = parseInt(submissionDetails.calculated_points);
      } else if (submissionDetails.dynamic_value) {
        // Berechne die Punkte basierend auf dem dynamischen Wert
        earnedPoints = Math.round(parseFloat(submissionDetails.dynamic_value) * task.multiplier);
      }
    }
    
    console.log('Berechnete Punkte:', {
      earnedPoints,
      isDynamic: task.dynamic,
      details: submissionDetails
    });

    const newPoints = user.points + earnedPoints;

    const { error: updateUserError } = await supabase
      .from('users')
      .update({ points: newPoints })
      .eq('email', submission.user_email);

    if (updateUserError) {
      console.error('Update User Error:', updateUserError);
      return res.status(500).json({ message: 'Fehler beim Aktualisieren der Punkte' });
    }

    const { error: updateSubmissionError } = await supabase
      .from('submissions')
      .update({ 
        status: 'approved',
        admin_comment: adminComment
      })
      .eq('id', submissionId);

    if (updateSubmissionError) {
      console.error('Update Submission Error:', updateSubmissionError);
      await supabase
        .from('users')
        .update({ points: user.points })
        .eq('email', submission.user_email);
      return res.status(500).json({ message: 'Fehler beim Aktualisieren des Status' });
    }

    res.json({ 
      message: 'Einsendung genehmigt, Punkte vergeben',
      earnedPoints,
      newTotalPoints: newPoints,
      submission: {
        ...submission,
        status: 'approved',
        admin_comment: adminComment,
        task: task
      }
    });
  } catch (error) {
    console.error('Fehler bei der Genehmigung:', error);
    res.status(500).json({ message: 'Fehler bei der Genehmigung der Einsendung' });
  }
});

// 🔹 Ablehnung der Einsendung
app.post('/reject-submission', authenticateToken, isAdmin, async (req, res) => {
  const { submissionId, adminComment } = req.body;
  console.log('Reject Request:', { submissionId, adminComment });

  if (!submissionId) {
    return res.status(400).json({ message: 'Keine Submission ID angegeben' });
  }

  try {
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (submissionError) {
      console.error('Submission Error:', submissionError);
      return res.status(500).json({ message: 'Datenbankfehler bei der Suche nach der Einsendung' });
    }

    if (!submission) {
      return res.status(404).json({ message: 'Einsendung nicht gefunden' });
    }

    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', submission.task_id)
      .single();

    if (taskError) {
      console.error('Task Error:', taskError);
      return res.status(500).json({ message: 'Fehler beim Abrufen der Aufgabe' });
    }

    if (!task) {
      return res.status(404).json({ message: 'Zugehörige Aufgabe nicht gefunden' });
    }

    if (submission.status === 'rejected') {
      return res.status(400).json({ message: 'Einsendung wurde bereits abgelehnt' });
    }

    const { error: updateError } = await supabase
      .from('submissions')
      .update({ 
        status: 'rejected',
        admin_comment: adminComment
      })
      .eq('id', submissionId);

    if (updateError) {
      console.error('Update Error:', updateError);
      return res.status(500).json({ message: 'Fehler beim Ablehnen der Einsendung' });
    }

    res.json({ 
      message: 'Einsendung abgelehnt',
      submission: {
        ...submission,
        status: 'rejected',
        admin_comment: adminComment,
        task: task
      }
    });
  } catch (error) {
    console.error('Fehler bei der Ablehnung:', error);
    res.status(500).json({ message: 'Fehler bei der Ablehnung der Einsendung' });
  }
});

// 🔹 Leaderboard abrufen
app.get('/leaderboard', async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('name, points')
      .order('points', { ascending: false });

    if (error) throw error;
    res.json(users || []);
  } catch (error) {
    console.error('Fehler beim Abrufen des Leaderboards:', error);
    res.status(500).json({ message: 'Fehler beim Abrufen der Rangliste' });
  }
});

// Aufgabe löschen (nur für Admins)
app.delete('/delete-task/:id', authenticateToken, isAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    // Prüfe, ob die Aufgabe existiert
    const { data: task, error: checkError } = await supabase
      .from('tasks')
      .select()
      .eq('id', id)
      .single();

    if (checkError || !task) {
      return res.status(404).json({ message: 'Aufgabe nicht gefunden' });
    }

    // Lösche zuerst alle verknüpften Einsendungen
    await supabase
      .from('submissions')
      .delete()
      .eq('task_id', id);

    // Lösche die Aufgabe
    const { error: deleteError } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    res.json({ message: 'Aufgabe erfolgreich gelöscht' });
  } catch (error) {
    console.error('Fehler beim Löschen der Aufgabe:', error);
    res.status(500).json({ message: 'Fehler beim Löschen der Aufgabe' });
  }
});

// 🔹 Teams abrufen
app.get('/teams', async (req, res) => {
  try {
    const { data: teams, error } = await supabase
      .from('teams')
      .select('*')
      .order('points', { ascending: false });

    if (error) throw error;
    res.json(teams);
  } catch (error) {
    console.error('Fehler beim Abrufen der Teams:', error);
    res.status(500).json({ message: 'Fehler beim Abrufen der Teams' });
  }
});

// 🔹 Team erstellen
app.post('/teams', authenticateToken, isAdmin, async (req, res) => {
  const { name } = req.body;
  
  try {
    const { data: team, error } = await supabase
      .from('teams')
      .insert([{ 
        name,
        created_by: req.user.id,
        points: 0
      }])
      .select()
      .single();

    if (error) throw error;

    // Ersteller als erstes Teammitglied hinzufügen
    await supabase
      .from('team_members')
      .insert([{
        team_id: team.id,
        user_id: req.user.id,
        role: 'leader'
      }]);

    res.status(201).json(team);
  } catch (error) {
    console.error('Fehler beim Erstellen des Teams:', error);
    res.status(500).json({ message: 'Fehler beim Erstellen des Teams' });
  }
});

// 🔹 Team beitreten
app.post('/teams/:teamId/join', authenticateToken, isAdmin, async (req, res) => {
  const { teamId } = req.params;

  try {
    const { data: existingMember } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', teamId)
      .eq('user_id', req.user.id)
      .single();

    if (existingMember) {
      return res.status(400).json({ message: 'Du bist bereits Mitglied dieses Teams' });
    }

    const { error } = await supabase
      .from('team_members')
      .insert([{
        team_id: teamId,
        user_id: req.user.id,
        role: 'member'
      }]);

    if (error) throw error;

    res.json({ message: 'Erfolgreich dem Team beigetreten' });
  } catch (error) {
    console.error('Fehler beim Beitreten des Teams:', error);
    res.status(500).json({ message: 'Fehler beim Beitreten des Teams' });
  }
});

// 🔹 Aktive Challenges abrufen
app.get('/challenges', async (req, res) => {
  try {
    const { data: challenges, error } = await supabase
      .from('challenges')
      .select('*')
      .gt('end_date', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(challenges);
  } catch (error) {
    console.error('Fehler beim Abrufen der Challenges:', error);
    res.status(500).json({ message: 'Fehler beim Abrufen der Challenges' });
  }
});

// 🔹 Challenge-Fortschritt aktualisieren
app.post('/challenges/:challengeId/progress', authenticateToken, isAdmin, async (req, res) => {
  const { challengeId } = req.params;
  const { teamId, progress } = req.body;

  try {
    // Prüfen, ob der Benutzer Mitglied des Teams ist
    const { data: teamMember } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', teamId)
      .eq('user_id', req.user.id)
      .single();

    if (!teamMember) {
      return res.status(403).json({ message: 'Du bist kein Mitglied dieses Teams' });
    }

    // Challenge-Fortschritt aktualisieren
    const { error } = await supabase
      .from('challenge_progress')
      .upsert([{
        challenge_id: challengeId,
        team_id: teamId,
        progress: progress
      }]);

    if (error) throw error;

    res.json({ message: 'Fortschritt aktualisiert' });
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Fortschritts:', error);
    res.status(500).json({ message: 'Fehler beim Aktualisieren des Fortschritts' });
  }
});

// Benutzer-Profil Endpunkte
app.get('/users/:userId', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, goals, height, weight, profile_image, points, role')
      .eq('id', req.params.userId)
      .single();

    if (error) {
      console.error('Fehler beim Abrufen des Benutzerprofils:', error);
      throw error;
    }
    
    if (!data) {
      return res.status(404).json({ message: 'Benutzer nicht gefunden' });
    }

    res.json(data);
  } catch (error) {
    console.error('Fehler beim Abrufen des Benutzerprofils:', error);
    res.status(500).json({ message: error.message });
  }
});

// Benutzer aktualisieren Endpunkt
app.put('/users/:userId', authenticateToken, async (req, res) => {
  try {
    const { points, goals, height, weight, profile_image, name } = req.body;
    const userId = req.params.userId;
    
    console.log('Benutzeraktualisierung angefordert:', {
      userId,
      points,
      requestUser: req.user.id,
      requestRole: req.user.role
    });
    
    // Nur Admins oder der Benutzer selbst dürfen aktualisieren
    if (req.user.role !== 'admin' && req.user.id !== parseInt(userId)) {
      return res.status(403).json({ message: 'Keine Berechtigung zum Bearbeiten dieses Profils' });
    }
    
    // Überprüfe, ob der Benutzer existiert
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('id, email, points')
      .eq('id', userId)
      .single();

    if (userError || !existingUser) {
      console.error('Benutzer nicht gefunden:', userError);
      return res.status(404).json({ message: 'Benutzer nicht gefunden' });
    }

    // Aktualisierungsdaten vorbereiten
    const updateData = {};
    
    // Nur Felder hinzufügen, die tatsächlich aktualisiert werden sollen
    if (points !== undefined && req.user.role === 'admin') {
      updateData.points = parseInt(points);
    }
    
    if (name !== undefined) {
      updateData.name = name;
    }
    
    if (goals !== undefined) {
      updateData.goals = goals;
    }
    
    if (height !== undefined) {
      updateData.height = height;
    }
    
    if (weight !== undefined) {
      updateData.weight = weight;
    }
    
    if (profile_image !== undefined) {
      updateData.profile_image = profile_image;
    }
    
    console.log('Aktualisierungsdaten:', updateData);
    
    // Falls keine Aktualisierungen vorgenommen werden
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'Keine Daten zum Aktualisieren' });
    }

    // Aktualisierung durchführen
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select();

    if (error) {
      console.error('Fehler beim Aktualisieren:', error);
      return res.status(500).json({ message: 'Fehler beim Aktualisieren des Benutzerprofils', error: error.message });
    }

    console.log('Benutzer erfolgreich aktualisiert:', data);

    res.json({
      message: 'Benutzer erfolgreich aktualisiert',
      userId,
      email: data[0].email,
      points: data[0].points
    });
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Benutzers:', error);
    res.status(500).json({ 
      message: 'Fehler beim Aktualisieren des Benutzerprofils',
      error: error.message 
    });
  }
});

// Punkte aktualisieren (nur für Admins)
app.post('/update-points', authenticateToken, async (req, res) => {
  try {
    // Überprüfe, ob der Benutzer Admin-Rechte hat
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Keine Admin-Rechte' });
    }

    const { userId, points } = req.body;

    // Validierung
    if (!userId || isNaN(parseInt(points))) {
      return res.status(400).json({ message: 'Ungültige Daten' });
    }

    console.log('Aktualisiere Punkte:', { userId, points });

    // Aktuellen Benutzer abrufen
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email, points')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('Benutzer nicht gefunden:', userError);
      return res.status(404).json({ message: 'Benutzer nicht gefunden' });
    }

    // Punkte aktualisieren
    const { error: updateError } = await supabase
      .from('users')
      .update({ points: parseInt(points) })
      .eq('id', userId);

    if (updateError) {
      console.error('Fehler beim Aktualisieren der Punkte:', updateError);
      return res.status(500).json({ message: 'Fehler beim Aktualisieren der Punkte' });
    }

    res.json({
      message: 'Punkte erfolgreich aktualisiert',
      userId,
      email: user.email,
      previousPoints: user.points,
      newPoints: parseInt(points)
    });
  } catch (error) {
    console.error('Server-Fehler:', error);
    res.status(500).json({ message: 'Server-Fehler beim Aktualisieren der Punkte' });
  }
});

// E-Mail-Verifikation
app.post("/send-verification", async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: "E-Mail-Adresse ist erforderlich" });
    }

    // Prüfen, ob der Benutzer bereits existiert
    const existingUser = await supabase.from('users').select('*').eq('email', email).single();
    
    if (!existingUser) {
      return res.status(404).json({ error: "Benutzer nicht gefunden" });
    }

    // Verifizierungscode generieren (6-stelliger Code)
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Code in der Datenbank speichern
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ verification_code: verificationCode, is_verified: false })
      .eq('email', email)
      .select()
      .single();

    if (updateError) {
      console.error("Fehler beim Senden des Verifizierungscodes:", updateError);
      return res.status(500).json({ error: "Serverfehler beim Senden des Verifizierungscodes" });
    }

    // Da wir hier keine echte E-Mail senden, geben wir den Code zur Entwicklung zurück
    // (Im Produktionssystem sollte der Code nicht zurückgegeben werden)
    return res.status(200).json({ 
      message: "Verifizierungscode wurde gesendet", 
      code: verificationCode // Im Produktionssystem entfernen!
    });
    
  } catch (error) {
    console.error("Fehler beim Senden des Verifizierungscodes:", error);
    return res.status(500).json({ error: "Serverfehler beim Senden des Verifizierungscodes" });
  }
});

// Verifizierungscode überprüfen
app.post("/verify-code", async (req, res) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({ error: "E-Mail und Code sind erforderlich" });
    }

    // Benutzer und Code überprüfen
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('verification_code', code)
      .single();
    
    if (!user || userError) {
      return res.status(400).json({ error: "Ungültiger Verifizierungscode" });
    }

    // Benutzer als verifiziert markieren
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ is_verified: true })
      .eq('email', email)
      .select()
      .single();

    if (updateError) {
      console.error("Fehler bei der Verifizierung:", updateError);
      return res.status(500).json({ error: "Serverfehler bei der Verifizierung" });
    }

    return res.status(200).json({ message: "Verifizierung erfolgreich" });
    
  } catch (error) {
    console.error("Fehler bei der Verifizierung:", error);
    return res.status(500).json({ error: "Serverfehler bei der Verifizierung" });
  }
});

// Datenbankverbindung testen
app.get('/api/test-db', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1 as test');
    console.log('DB-Test erfolgreich:', rows);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('DB-Test fehlgeschlagen:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Testroute zum Überprüfen der Datenbankverbindung
app.get('/db-test', (req, res) => {
  db.query('SELECT 1 + 1 AS solution', (err, results) => {
    if (err) {
      console.error("Datenbankfehler:", err);
      return res.status(500).json({ error: "Datenbankfehler", details: err.message });
    }
    res.json({ 
      message: "Datenbankverbindung erfolgreich", 
      result: results[0].solution 
    });
  });
});

// E-Mail-Verifizierung
app.get("/verify-email", async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.status(400).json({ error: "Kein Verifizierungscode vorhanden" });
  }
  
  try {
    // Zuerst prüfen wir, ob ein Benutzer mit diesem Code existiert
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('verification_code', code)
      .single();

    if (findError || !user) {
      console.error("Fehler beim Finden des Benutzers:", findError);
      return res.status(400).json({ error: "Ungültiger oder abgelaufener Verifizierungscode" });
    }

    // Dann markieren wir den Benutzer als verifiziert, aber behalten den Code noch
    const { error: verifyError } = await supabase
      .from('users')
      .update({ is_verified: true })
      .eq('id', user.id);

    if (verifyError) {
      console.error("Fehler bei der E-Mail-Verifizierung:", verifyError);
      return res.status(500).json({ error: "Fehler bei der Verifizierung" });
    }

    // Erfolgreiche Verifizierung
    res.json({ message: "E-Mail erfolgreich verifiziert" });

    // Nach erfolgreicher Antwort löschen wir den Code
    const { error: updateError } = await supabase
      .from('users')
      .update({ verification_code: null })
      .eq('id', user.id);

    if (updateError) {
      console.error("Fehler beim Löschen des Verifizierungscodes:", updateError);
    }

  } catch (error) {
    console.error("Fehler bei der Verifizierung:", error);
    return res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// Verifizierungsstatus prüfen
app.get('/check-verification/:email', async (req, res) => {
  try {
    const { email } = req.params;

    const { data: user, error } = await supabase
      .from('users')
      .select('is_verified')
      .eq('email', email)
      .single();

    if (error) {
      console.error("Fehler beim Prüfen des Verifizierungsstatus:", error);
      return res.status(500).json({ error: "Datenbankfehler" });
    }

    if (!user) {
      return res.status(404).json({ error: "Benutzer nicht gefunden" });
    }

    res.json({ isVerified: user.is_verified });

  } catch (error) {
    console.error("Fehler beim Prüfen des Verifizierungsstatus:", error);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// E-Mail erneut senden
app.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    // Benutzer in der Datenbank suchen
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: "Benutzer nicht gefunden" });
    }

    if (user.is_verified) {
      return res.status(400).json({ error: "E-Mail bereits verifiziert" });
    }

    // Neuen Verifizierungscode generieren
    const verificationCode = crypto.randomBytes(32).toString('hex');

    // Verifizierungscode aktualisieren
    const { error: updateError } = await supabase
      .from('users')
      .update({ verification_code: verificationCode })
      .eq('email', email);

    if (updateError) {
      console.error("Fehler beim Aktualisieren des Verifizierungscodes:", updateError);
      return res.status(500).json({ error: "Datenbankfehler" });
    }

    // Neue Verifizierungs-E-Mail senden
    await sendVerificationEmail(email, verificationCode);

    res.json({ message: "Verifizierungs-E-Mail wurde erneut gesendet" });

  } catch (error) {
    console.error("Fehler beim Senden der Verifizierungs-E-Mail:", error);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// Passwort vergessen - Link anfordern
app.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    // Überprüfen, ob der Benutzer existiert
    const user = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (user.length === 0) {
      return res.status(404).json({ error: 'Benutzer mit dieser E-Mail-Adresse nicht gefunden.' });
    }

    // Generiere Token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 Stunde gültig

    // Speichere Token in der Datenbank
    await db.query(
      'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?',
      [resetToken, resetTokenExpiry, email]
    );

    // Link zum Zurücksetzen des Passworts senden
    const frontendUrl = process.env.NODE_ENV === 'production' 
      ? 'https://sportpass-2025.vercel.app' 
      : 'http://localhost:3000';
      
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Passwort zurücksetzen - Sportpass',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Passwort zurücksetzen</h2>
          <p>Du hast angefordert, dein Passwort zurückzusetzen. Klicke auf den folgenden Link, um ein neues Passwort zu erstellen:</p>
          <p style="margin: 20px 0;">
            <a href="${resetLink}" 
               style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Passwort zurücksetzen
            </a>
          </p>
          <p>Falls der Button nicht funktioniert, kopiere bitte diesen Link in deinen Browser:</p>
          <p style="word-break: break-all; color: #666;">${resetLink}</p>
          <p>Dieser Link ist 1 Stunde gültig.</p>
          <p>Falls du dein Passwort nicht zurücksetzen möchtest, ignoriere diese E-Mail bitte.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Passwort-Zurücksetz-E-Mail gesendet an:', email);

    res.json({ success: true, message: 'E-Mail zum Zurücksetzen des Passworts wurde gesendet.' });
  } catch (error) {
    console.error('Fehler beim Senden der Passwort-Zurücksetz-E-Mail:', error);
    res.status(500).json({ error: 'Ein Fehler ist aufgetreten. Bitte versuche es später erneut.' });
  }
});

// Passwort zurücksetzen
app.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    // Überprüfen, ob der Token existiert und noch gültig ist
    const users = await db.query(
      'SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > ?',
      [token, new Date()]
    );

    if (users.length === 0) {
      return res.status(400).json({ error: 'Ungültiger oder abgelaufener Token.' });
    }

    // Hash des neuen Passworts erstellen
    const hashedPassword = await bcrypt.hash(password, 10);

    // Passwort aktualisieren und Token löschen
    await db.query(
      'UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE reset_token = ?',
      [hashedPassword, token]
    );

    res.json({ success: true, message: 'Passwort erfolgreich zurückgesetzt.' });
  } catch (error) {
    console.error('Fehler beim Zurücksetzen des Passworts:', error);
    res.status(500).json({ error: 'Ein Fehler ist aufgetreten. Bitte versuche es später erneut.' });
  }
});

// Datenbanktabellen vorbereiten
async function setupDatabase() {
  try {
    // Users-Tabelle
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        class VARCHAR(255),
        points INT DEFAULT 0,
        role ENUM('user', 'admin') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        verified BOOLEAN DEFAULT false,
        verification_code VARCHAR(255),
        verification_expiry TIMESTAMP,
        reset_token VARCHAR(255),
        reset_token_expiry TIMESTAMP
      )
    `);
  } catch (error) {
    console.error('Fehler beim Einrichten der Datenbank:', error);
  }
}

// 🔹 Server starten
const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  console.log(`Server läuft auf Port ${PORT}`);
  await setupDatabase();
  console.log('Datenbank eingerichtet');
});
