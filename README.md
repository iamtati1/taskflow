# TaskFlow

**PLAN. FOCUS. FINISH.** TaskFlow is a full-stack task manager with a calm, focused workspace. Create an account, capture what you need to do, check it off, and see your progress at a glance, with every task saved to PostgreSQL and tied to your own session.

<p align="center">
  <a href="https://taskflow-zeta-ivory.vercel.app/"><strong>▶ Try the live demo</strong></a>
  &nbsp; · &nbsp;
  <a href="#getting-started">Run locally</a>
</p>

> **Project focus:** A small, dependable full-stack app: secure sessions, ownership-checked task APIs, and a polished React interface, deployed as one Vercel project.

## Product Screenshots

![TaskFlow Tasks page with total and completed counts, a Planning Horizon calendar, and the task list split into Active and Completed sections](screenshots/taskflow-tasks.png)

*Tasks: your active and completed work side by side with a calendar of the month.*

![TaskFlow Edit Task form, prefilled with the title "Draft the Q3 roadmap" and an Update Task button, below the task list](screenshots/taskflow-edit-task.png)

*Editing: Edit opens the task's title in place, and the change is saved straight to the database.*

![TaskFlow Dashboard showing 2 completed and 2 active tasks, 50% progress, today's focus, a workflow insight, upcoming tasks and workspace status](screenshots/taskflow-dashboard.png)

*Dashboard: a summary of where your work stands, computed from your tasks.*

![TaskFlow Analytics page showing completed, active, completion rate and total counts, a reflection message and a focus rating bar](screenshots/taskflow-analytics.png)

*Analytics: completion stats and a short reflection based on how much you've finished.*

![TaskFlow sign-in page with username and password fields, an Enter Workspace button and a link to register](screenshots/taskflow-login.png)

*Sign in: create an account or return to your workspace.*

## What you can do

- **Create an account and stay signed in:** Register with a username and password; your session survives page refreshes until you log out.
- **Capture tasks:** Add a task with a title and it appears at the top of your list.
- **Edit task titles:** Fix or refine a task's title; the update is saved and shown immediately.
- **Complete and reopen tasks:** Tick a task to move it to Completed, or untick it to bring it back.
- **Delete tasks:** Remove tasks you no longer need.
- **See your progress:** The Dashboard and Analytics pages summarise completed and active tasks, your completion rate, and overdue tasks.
- **Browse by date:** The calendar shows tasks that have a due date on the day you select; tasks without a date are always listed.
- **Focus Mode:** Dim the navigation from Settings; the preference is saved in your browser.

## Built with

| Area | Technologies |
| --- | --- |
| Frontend | React 18, Vite, React Router, Tailwind CSS, Framer Motion, lucide-react, react-calendar |
| Backend | Node.js, Express |
| Database | PostgreSQL (Neon in production), node-postgres (`pg`) |
| Authentication & sessions | bcrypt password hashing, cookie-session (signed, HTTP-only cookies) |
| Testing | Node's built-in test runner, pg-mem, Vitest, Testing Library, jsdom |
| Deployment | Vercel (static frontend + serverless API in one project) |

## How it fits together

TaskFlow is two applications in one repository. The React client lives in `frontend/`; the Express API lives in `server/`. The API is defined once in `server/app.js` and runs in two ways:

- **Locally:** `server/index.js` starts the Express app on port 8080, and Vite's dev server proxies `/api` requests to it.
- **On Vercel:** `frontend/api/index.js` exports the same Express app as a serverless function. `frontend/vercel.json` routes `/api/*` to that function and every other path to the React app, so the browser and API share one origin and no CORS or cross-site cookie setup is needed.

```text
TaskFlow
├── frontend/              React + Vite client (the Vercel project root)
│   ├── src/               pages, components, hooks, API client
│   ├── api/index.js       Vercel serverless entry: exports server/app.js
│   └── vercel.json        /api/* → function, everything else → index.html
└── server/                Express API
    ├── app.js             middleware, routes, error handling (no listen())
    ├── index.js           local server: app.js + built frontend + listen()
    ├── controllers/       auth and task request handlers
    ├── models/            SQL for users and tasks
    ├── middleware/        authentication check, request logging
    └── db/                connection pool, schema.sql, setup script
```

### API

All task routes require a signed-in session. Users can only read and change their own tasks.

| Method | Endpoint | Body | Response |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | `{ username, password }` | `201 { user: { user_id, username } }` |
| `POST` | `/api/auth/login` | `{ username, password }` | `{ user: { user_id, username } }` |
| `GET` | `/api/auth/me` | — | `{ user }`, or `401` when signed out |
| `DELETE` | `/api/auth/logout` | — | `{ message }` |
| `GET` | `/api/tasks` | — | `[task]`, newest first |
| `POST` | `/api/tasks` | `{ title, due_date? }` | `201 task` |
| `PATCH` | `/api/tasks/:task_id` | `{ title?, is_complete?, due_date? }` | the updated `task` |
| `DELETE` | `/api/tasks/:task_id` | — | the deleted `task` |

A `task` looks like:

```json
{
  "task_id": 12,
  "user_id": 3,
  "title": "Draft and share the Q3 roadmap",
  "is_complete": false,
  "due_date": null
}
```

Errors return a JSON `{ error }` or `{ message }` with `400` (invalid input), `401` (not signed in), `403` (another user's task), `404` (no such task) or `500`. Server errors are logged without request bodies, passwords or connection details.

### Authentication

- Passwords are hashed with bcrypt; the hash is never returned by the API.
- The session is a signed cookie (`cookie-session`) that is HTTP-only, `SameSite=Lax`, and `Secure` in production. The server refuses to start in production without a real `SESSION_SECRET`.
- Updates and deletes check task ownership, and the SQL itself is scoped to the signed-in user.

### Database

Two tables, defined in [`server/db/schema.sql`](server/db/schema.sql). A user has many tasks; deleting a user deletes their tasks.

| Table | Columns |
| --- | --- |
| `users` | `id`, `username` (unique), `password_hash` |
| `tasks` | `id`, `user_id` → `users.id`, `title`, `is_complete`, `due_date` |

The API returns these ids as `user_id` and `task_id`.

## Getting started

### Prerequisites

- Node.js 20 or later
- PostgreSQL
- npm

### 1. Clone the repository

```bash
git clone https://github.com/iamtati1/taskflow.git
cd taskflow
```

### 2. Create a database and configure the server

Create a local PostgreSQL database:

```bash
createdb taskflow
```

Copy the environment template:

```bash
cp server/.env.template server/.env
```

In `server/.env`, set either `DATABASE_URL` or the `PG*` variables for your local database, plus a session secret:

```env
DATABASE_URL=postgresql://YOUR_USER@localhost:5432/taskflow
SESSION_SECRET=replace-with-a-long-random-string
```

Generate a secret with `openssl rand -hex 32`.

### 3. Install dependencies

The client and server have separate package files:

```bash
cd server && npm install
cd ../frontend && npm install
```

### 4. Create the tables

```bash
cd server
npm run db:setup
```

This runs `schema.sql`, which only creates tables that don't exist yet. It never drops or changes existing tables or rows.

### 5. Run the app

Open two terminals from the repository root.

**Terminal 1 — API server** (http://localhost:8080)

```bash
cd server
npm run dev
```

**Terminal 2 — Vite client**

```bash
cd frontend
npm run dev
```

Open http://localhost:5173 and register an account. The Vite dev server proxies `/api` requests to the Express server.

## Run tests

```bash
cd server && npm test
cd ../frontend && npm test
```

- **Server** (`node --test`): API tests run the real Express app against an in-memory PostgreSQL (pg-mem) with the production schema. They cover registration, login, session restore, logout, task create/edit/complete/delete, ownership checks, error responses, and that existing records are never modified. Unit tests cover the models, session-secret checks and log sanitising.
- **Frontend** (`vitest`): component and page tests for the task list and editor: editing saves and shows the new title, failed saves show an error, completing a task reaches the API, and buttons inside draggable cards still receive clicks.

To build the production frontend:

```bash
cd frontend && npm run build
```

## Deployment

The Vercel project uses `frontend` as its root directory. `frontend/vercel.json` installs the server's dependencies too, so the serverless function can load `server/app.js`.

Set these environment variables in Vercel:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string (Vercel doesn't provide a database) |
| `SESSION_SECRET` | Long random string used to sign session cookies |

Create the tables once with `npm run db:setup` pointed at the production `DATABASE_URL`.

## Engineering highlights

- One Express app, two runtimes: a local server and a Vercel serverless function, with the same routes and middleware.
- Same-origin deployment, so session cookies work without cross-site cookie settings or CORS.
- Ownership enforced twice: a check in the controller and a `user_id` condition in the SQL.
- Optimistic UI updates that roll back on failure and show the server's saved result on success.
- Error logs that never include passwords, request bodies or database connection details.
- End-to-end behaviour tested against an in-memory PostgreSQL with the production schema.

## Known limitations

- Tasks have a title, completion state and optional due date only; there are no descriptions, priorities or categories.
- Due dates can be stored and are shown on the calendar, but the interface has no control for setting them.
- Drag-to-reorder changes the order on screen only; the order isn't saved.
- The theme picker in Settings is saved but doesn't change the appearance yet.
- The Dashboard's "AI Recommendation" and Analytics' reflection are rule-based messages, not AI.

---

Built by [Tatiana Barmer](https://github.com/iamtati1).
