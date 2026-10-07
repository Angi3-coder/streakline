import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Database from 'better-sqlite3';
import { computeStreaks } from './streak.js';

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const db = new Database(process.env.DB_FILE || 'streakline.db');
db.pragma('foreign_keys = ON');
db.exec(`
CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS habits (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, name TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS checkins (habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE, date TEXT NOT NULL, UNIQUE(habit_id, date));
`);

const app = express();
app.use(cors());
app.use(express.json());

const today = () => new Date().toISOString().slice(0, 10);
const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s);
const sign = (u) => jwt.sign({ id: u.id }, SECRET, { expiresIn: '7d' });

function auth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  try { req.userId = jwt.verify(token, SECRET).id; next(); }
  catch { res.status(401).json({ error: 'Sign in to continue.' }); }
}

function credentials(req, res) {
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email) || typeof password !== 'string' || password.length < 8) {
    res.status(400).json({ error: 'Enter a valid email and a password of at least 8 characters.' });
    return null;
  }
  return { email: email.toLowerCase(), password };
}

app.post('/api/auth/register', (req, res) => {
  const c = credentials(req, res); if (!c) return;
  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(c.email)) return res.status(409).json({ error: 'That email is already registered.' });
  const info = db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)').run(c.email, bcrypt.hashSync(c.password, 10));
  res.status(201).json({ token: sign({ id: info.lastInsertRowid }) });
});

app.post('/api/auth/login', (req, res) => {
  const c = credentials(req, res); if (!c) return;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(c.email);
  if (!user || !bcrypt.compareSync(c.password, user.password_hash)) return res.status(401).json({ error: 'Email or password is incorrect.' });
  res.json({ token: sign(user) });
});

app.get('/api/habits', auth, (req, res) => {
  const t = today();
  const habits = db.prepare('SELECT id, name FROM habits WHERE user_id = ? ORDER BY id').all(req.userId);
  const dates = db.prepare('SELECT date FROM checkins WHERE habit_id = ?');
  res.json(habits.map((h) => {
    const ds = dates.all(h.id).map((r) => r.date);
    return { ...h, ...computeStreaks(ds, t), doneToday: ds.includes(t) };
  }));
});

app.post('/api/habits', auth, (req, res) => {
  const name = String(req.body?.name || '').trim();
  if (!name || name.length > 60) return res.status(400).json({ error: 'Name must be 1-60 characters.' });
  const info = db.prepare('INSERT INTO habits (user_id, name) VALUES (?, ?)').run(req.userId, name);
  res.status(201).json({ id: info.lastInsertRowid, name, current: 0, best: 0, doneToday: false });
});

const owned = (req) => db.prepare('SELECT id FROM habits WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);

app.delete('/api/habits/:id', auth, (req, res) => {
  if (!owned(req)) return res.status(404).json({ error: 'Habit not found.' });
  db.prepare('DELETE FROM habits WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

app.post('/api/habits/:id/toggle', auth, (req, res) => {
  if (!owned(req)) return res.status(404).json({ error: 'Habit not found.' });
  const date = req.body?.date || today();
  if (!isDate(date)) return res.status(400).json({ error: 'Date must be YYYY-MM-DD.' });
  const del = db.prepare('DELETE FROM checkins WHERE habit_id = ? AND date = ?').run(req.params.id, date);
  if (!del.changes) db.prepare('INSERT INTO checkins (habit_id, date) VALUES (?, ?)').run(req.params.id, date);
  res.json({ done: !del.changes });
});

app.listen(process.env.PORT || 4000, () => console.log('API on :4000'));
