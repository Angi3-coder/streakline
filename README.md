# Streakline

A full-stack habit tracker with JWT auth, a REST API, SQLite persistence, streak logic covered by unit tests, and a React UI.

**Stack:** React 18 + Vite · Node 20 + Express · SQLite (better-sqlite3) · JWT + bcrypt · node:test

## Run it
```bash
# terminal 1
cd server && npm install && npm run dev      # http://localhost:4000
# terminal 2
cd client && npm install && npm run dev      # http://localhost:5173 (proxies /api)
# tests
cd server && npm test
```

## API
| Method | Route | Description |
|---|---|---|
| POST | /api/auth/register, /api/auth/login | returns `{ token }` |
| GET | /api/habits | habits with current/best streak and today's status |
| POST | /api/habits | create `{ name }` |
| DELETE | /api/habits/:id | delete a habit |
| POST | /api/habits/:id/toggle | check in / undo for today (`{ date? }`) |

## Design decisions to talk about
- Streak logic is a pure function (`server/src/streak.js`) so it is unit-tested without the DB.
- Every habit query is scoped by `user_id`, so users can never read each other's data.
- Passwords hashed with bcrypt; JWTs expire in 7 days; inputs validated on the server.
- Check-ins use a unique `(habit_id, date)` constraint, making toggles idempotent.

## Ideas to extend
Docker + CI, Postgres, refresh tokens, weekly charts, React Testing Library tests, deploy to Render/Fly + Netlify.
