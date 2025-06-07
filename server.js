require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';

app.use(cors());
app.use(express.json());
app.use(`/${UPLOAD_DIR}`, express.static(path.join(__dirname, UPLOAD_DIR)));

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = file.fieldname + '-' + Date.now();
    cb(null, base + ext);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('audio/')) return cb(new Error('Seuls les fichiers audio sont acceptés'));
    cb(null, true);
  },
  limits: { fileSize: 50 * 1024 * 1024 }
});

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'belikanM',
  password: process.env.DB_PASS || 'Dieu19961991??!??!',
  database: process.env.DB_NAME || 'belikan_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Token manquant' });
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token manquant' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Token invalide' });
  }
};

app.post('/api/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) return res.status(400).json({ message: 'Email, mot de passe et nom requis' });

  try {
    const [existRows] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existRows.length > 0) return res.status(400).json({ message: 'Email déjà utilisé' });

    const hashedPass = await bcrypt.hash(password, 10);
    const [result] = await pool.query('INSERT INTO users (email, password, name) VALUES (?, ?, ?)', [email, hashedPass, name]);

    const token = jwt.sign({ id: result.insertId, email, name }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token });
  } catch (e) {
    console.error('Register error:', e);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email et mot de passe requis' });

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(400).json({ message: 'Utilisateur non trouvé' });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: 'Mot de passe incorrect' });

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.get('/api/profile', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, email, name, bio, avatar, created_at FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    res.json(rows[0]);
  } catch (e) {
    console.error('Profile error:', e);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.put('/api/profile', authenticate, async (req, res) => {
  const { name, bio } = req.body;
  try {
    await pool.query('UPDATE users SET name = ?, bio = ? WHERE id = ?', [name, bio, req.user.id]);
    res.json({ message: 'Profil mis à jour' });
  } catch (e) {
    console.error('Update profile error:', e);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.post('/api/tracks', authenticate, upload.single('audioFile'), async (req, res) => {
  const { title, artist, genre = null, year = null, album = null, isExplicit = false } = req.body;

  if (!title || !artist || !req.file) {
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(400).json({ message: 'Titre, artiste et fichier audio requis' });
  }

  try {
    const audio_path = req.file.path.replace(/\\/g, '/');
    const explicitBool = (isExplicit === 'true' || isExplicit === true) ? 1 : 0;
    const yearInt = year ? parseInt(year, 10) : null;

    await pool.query(
      `INSERT INTO tracks (title, artist, genre, year, album, audio_path, uploaded_by, is_explicit) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, artist, genre, yearInt, album, audio_path, req.user.id, explicitBool]
    );

    res.json({ message: 'Musique ajoutée' });
  } catch (e) {
    console.error('Upload track error:', e);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.get('/api/tracks', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tracks WHERE uploaded_by = ? ORDER BY created_at DESC', [req.user.id]);
    res.json(rows);
  } catch (e) {
    console.error('Get tracks error:', e);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.delete('/api/tracks/:id', authenticate, async (req, res) => {
  const trackId = req.params.id;
  try {
    const [rows] = await pool.query('SELECT audio_path FROM tracks WHERE id = ? AND uploaded_by = ?', [trackId, req.user.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Musique non trouvée' });

    const audioPath = rows[0].audio_path;

    await pool.query('DELETE FROM tracks WHERE id = ?', [trackId]);

    fs.unlink(audioPath, err => { if (err) console.error('Erreur suppression fichier audio:', err); });

    res.json({ message: 'Musique supprimée' });
  } catch (e) {
    console.error('Delete track error:', e);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.listen(PORT, () => {
  console.log(`Server démarré sur http://localhost:${PORT}`);
});

