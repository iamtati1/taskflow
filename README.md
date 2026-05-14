# TaskFlow 
## A full-stack task management app built with React, Express, and PostgreSQL. 

`TaskFlow` is a full-stack productivity application that allows users to create, manage, update, and delete personal tasks through a responsive and interactive interface. 

The application was built to practice core full-stack development concepts including authentication, `CRUD` operations, session management, API communication, and persistent database storage. Users can register for an account, securely log in, and manage personalized task data stored in `PostgreSQL`. 

The frontend was developed using `React` and `Vite`, while the backend server was built with `Express` and `Node.js`. The application demonstrates session based authentication, session rehydration, auth dependent data fetching, and conditional rendering to create a secure and dynamic user experience. 

## Tech Stack
 + Frontend: React + Vite 
 + Backend: Node.js + Express 
 + Database: PostgreSQL 
 + Authentication: cookie-session 
 + Version Control: Git + GitHub 
 + API Testing: Postman 

## Features 
- Secure session-based authentication 
- Persistent PostgreSQL storage 
- CRUD task management 
- Task priorities and due dates 
- Category organization 
- Activity logging 
- Session rehydration 
## User Stories 
**Auth** 
- A user can register for an account with a username and password 
- A user can log in to an existing account 
- A user can log out 
- A returning user who has an active session is automatically logged in when they revisit the app 

**Tasks** 
- A logged-in user can view all of their tasks 
- A logged-in user can create a new task by entering a title 
- A logged-in user can update a task - A logged-in user can mark a task as complete or incomplete 
- A logged-in user can delete a task - A logged-in user can organize tasks into categories 
- A logged-in user can assign priorities to tasks 
- A logged-in user can assign due dates to tasks 
- A logged-in user can view task activity history 

## Schema
```
users
─────────────────────────────
user_id       SERIAL PRIMARY KEY
username      TEXT UNIQUE NOT NULL
password_hash TEXT NOT NULL

categories
─────────────────────────────
category_id SERIAL PRIMARY KEY
name        TEXT NOT NULL
user_id     INTEGER REFERENCES users(user_id) ON DELETE CASCADE

tasks
─────────────────────────────
task_id     SERIAL PRIMARY KEY
title       TEXT NOT NULL
due_date    TIMESTAMP
created_at  TIMESTAMP DEFAULT NOW()
is_complete BOOLEAN DEFAULT FALSE

priority    TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium'

user_id     INTEGER REFERENCES users(user_id) ON DELETE CASCADE

category_id INTEGER REFERENCES categories(category_id) ON DELETE SET NULL

activity_log
─────────────────────────────
log_id      SERIAL PRIMARY KEY
user_id     INTEGER REFERENCES users(user_id) ON DELETE CASCADE
task_id     INTEGER REFERENCES tasks(task_id) ON DELETE CASCADE

action      TEXT CHECK (
    action IN (
        'TASK_CREATED',
        'TASK_UPDATED',
        'TASK_COMPLETED',
        'TASK_DELETED'
    )
) NOT NULL

meta        JSONB
created_at  TIMESTAMP DEFAULT NOW()
```
A user has many tasks. Deleting a user cascades to delete all of their tasks. 


## Schema Entity Relationship Diagram
```
┌──────────────┐
│    users     │
├──────────────┤
│ user_id (PK) │
│ username     │
│ password_hash│
└──────┬───────┘
       │
       │ 1-to-many
       │
┌──────▼───────┐
│    tasks     │
├──────────────┤
│ task_id (PK) │
│ title        │
│ due_date     │
│ priority     │
│ is_complete  │
│ user_id (FK) │
│ category_id  │
└──────┬───────┘
       │
       │ many-to-1
       │
┌──────▼──────────┐
│   categories    │
├─────────────────┤
│ category_id (PK)│
│ name            │
│ user_id (FK)    │
└─────────────────┘


┌─────────────────┐
│  activity_log   │
├─────────────────┤
│ log_id (PK)     │
│ task_id (FK)    │
│ user_id (FK)    │
│ action          │
│ meta            │
└─────────────────┘
```

## API Contract

### Auth endpoints 

| Method | Endpoint | Request Body | Response |
| ------ | -------- | ------------ | -------- |
| POST   | `/api/auth/register` | { username, password } | { user_id, username } |
| POST   | `/api/auth/login`    | { username, password } | { user_id, username } |
| DELETE | `/api/auth/logout`   | — | { message } |
| GET    | `/api/auth/me`       | — | { user_id, username } or null |

 ### Task endpoints (all require authentication) 


| Method | Endpoint | Request Body | Response |
| ------ | -------- | ------------ | -------- |
| GET    | `/api/tasks` | — | [{ task_id, title, due_date, created_at, is_complete, priority, user_id, category_id }] |
| POST   | `/api/tasks` | { title, priority, due_date, category_id } | { task_id, title, due_date, created_at, is_complete, priority, user_id, category_id } |
| PATCH  | `/api/tasks/:task_id` | { title, is_complete, priority, due_date, category_id } | { task_id, title, due_date, created_at, is_complete, priority, user_id, category_id } |
| DELETE | `/api/tasks/:task_id` | — | { task_id, title, due_date, created_at, is_complete, priority, user_id, category_id } |


#### Example Task Response
```
json
{
  "task_id": 1,
  "title": "Finish backend",
  "due_date": "2026-05-20T00:00:00Z",
  "created_at": "2026-05-13T12:00:00Z",
  "is_complete": true,
  "priority": "high",
  "user_id": 1,
  "category_id": 2
}
```
## Setup 
### 1. Database Create a local Postgres database:
1. `sh`

2. `createdb tasks_casestudy`

### 2. Server
1. `sh`

2. `cd server`

3. `npm install`

4. `cp .env.template .env`

Open .env and fill in your Postgres credentials and a session secret. Then seed the database:

1. `sh`
2. `npm run db:seed`

Start the server:

1. `sh`
2. `npm run dev`

The server runs on http://localhost:8080. 

### 3. Frontend 
In a second terminal:

1. `sh`
2. `cd frontend`
3. `npm install`
4. `npm run dev`


The frontend runs on http://localhost:5173. The Vite dev proxy forwards all /api requests to the Express server so session cookies work correctly. 

## Seed Users 

After running `npm run db:seed`, these accounts are available: 

```
| Username | Password | | -------- | ----------- | | alice | password123 | | bob | password123 | 
```

## Application Structure

```
swe-casestudy-7-task-app/
├── frontend/               # React app (Vite)
│   ├── src/
│   │   ├── App.jsx         # Root component: currentUser state, session rehydration, auth handlers
│   │   ├── adapters/
│   │   │   ├── auth-adapters.js  # Fetch adapters for /api/auth/* endpoints
│   │   │   └── task-adapters.js  # Fetch adapters for /api/tasks/* endpoints
│   │   └── components/
│   │       ├── AuthPage.jsx    # Login + Register forms (shown when logged out)
│   │       ├── TaskPage.jsx    # Main app container (shown when logged in)
│   │       ├── AddTaskForm.jsx # Form to create a new task
│   │       ├── TaskList.jsx    # Renders a list of TaskItems
│   │       └── TaskItem.jsx    # Single task: checkbox, title, delete button
│   └── vite.config.js      # Proxies /api requests to Express in development
└── server/                 # Express + Postgres API
    ├── index.js            # App entry point, route definitions
    ├── controllers/
    │   ├── authControllers.js  # register, login, logout, getMe
    │   └── taskControllers.js  # list, create, update, delete tasks
    ├── models/
    │   ├── userModel.js    # SQL queries for the users table
    │   └── taskModel.js    # SQL queries for the tasks table
    ├── middleware/
    │   ├── checkAuthentication.js  # Blocks unauthenticated requests
    │   └── logRoutes.js            # Logs each incoming request
    └── db/
        ├── pool.js         # Postgres connection pool
        └── seed.js         # Creates tables and inserts sample data
```

## Future Improvements 
### UX Improvements 
- Drag and drop task reordering
- Task filters and sorting 
### Authentication 
- Password reset flow 
- Email verification 

### Productivity Features
 - Recurring tasks 
 - Notifications/reminders 
 - Shared team workspaces 

 ## API Testing API endpoints were tested using Thunder Client to verify: 
 - authentication flow 
 - session persistence 
 - CRUD functionality 
 - category ownership validation 
 - protected route behavior 
 - activity log creation 
 - relational database integrity