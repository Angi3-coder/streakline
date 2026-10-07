import { useEffect, useState } from 'react';
import { api } from './api.js';

function Auth({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  async function submit(e) {
    e.preventDefault();
    try {
      const { token } = await api(`/auth/${mode}`, { method: 'POST', body: f });
      localStorage.setItem('token', token);
      onAuth();
    } catch (e2) { setErr(e2.message); }
  }
  return (
    <form className="auth" onSubmit={submit}>
      <h1>Streakline</h1>
      <p>Check in once a day. Keep the chain unbroken.</p>
      <input type="email" placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required />
      <input type="password" placeholder="Password (8+ characters)" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required />
      {err && <div className="error" role="alert">{err}</div>}
      <button className="primary">{mode === 'login' ? 'Sign in' : 'Create account'}</button>
      <button type="button" className="link" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErr(''); }}>
        {mode === 'login' ? 'Need an account? Register' : 'Have an account? Sign in'}
      </button>
    </form>
  );
}

function Habits({ onSignOut }) {
  const [habits, setHabits] = useState(null);
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const load = () => api('/habits').then(setHabits).catch((e) => (e.message.startsWith('Sign in') ? onSignOut() : setErr(e.message)));
  useEffect(() => { load(); }, []);

  const act = (fn) => fn().then(load).catch((e) => setErr(e.message));
  const add = (e) => { e.preventDefault(); act(() => api('/habits', { method: 'POST', body: { name } })).then(() => setName('')); };

  return (
    <main className="habits">
      <header><h1>Today</h1><button className="link" onClick={onSignOut}>Sign out</button></header>
      <form onSubmit={add} className="add">
        <input placeholder="New habit, e.g. Read 20 pages" value={name} onChange={(e) => setName(e.target.value)} required maxLength={60} />
        <button className="primary">Add habit</button>
      </form>
      {err && <div className="error" role="alert">{err}</div>}
      {habits?.length === 0 && <p className="empty">No habits yet. Add one above and check it off today.</p>}
      <ul>
        {habits?.map((h) => (
          <li key={h.id} className={h.doneToday ? 'done' : ''}>
            <button className="check" aria-pressed={h.doneToday} aria-label={`Mark ${h.name} ${h.doneToday ? 'not done' : 'done'}`}
              onClick={() => act(() => api(`/habits/${h.id}/toggle`, { method: 'POST', body: {} }))}>{h.doneToday ? '✓' : ''}</button>
            <span className="name">{h.name}</span>
            <button className="link" onClick={() => act(() => api(`/habits/${h.id}`, { method: 'DELETE' }))}>Delete</button>
            <span className="streak"><b>{h.current}</b> day streak · best {h.best}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}

export default function App() {
  const [authed, setAuthed] = useState(!!localStorage.getItem('token'));
  const out = () => { localStorage.removeItem('token'); setAuthed(false); };
  return authed ? <Habits onSignOut={out} /> : <Auth onAuth={() => setAuthed(true)} />;
}
