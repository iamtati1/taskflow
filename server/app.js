// The Express API, without app.listen().
// Used by index.js (local server) and by frontend/api/index.js (Vercel function).
require('dotenv').config();

const express = require('express');
const cookieSession = require('cookie-session');
const cors = require('cors');
const pool = require("./db/pool");

const logRoutes = require('./middleware/logRoutes');
const authControllers = require('./controllers/authControllers');
const userControllers = require('./controllers/userControllers');
const checkAuthentication = require('./middleware/checkAuthentication');
const taskRoutes = require("./routes/taskRoutes");
const isProduction = require('./utils/isProduction');
const sessionKeys = require('./utils/sessionKeys');
const { logError } = require('./utils/safeError');
const { createAuthLimiter } = require('./middleware/authRateLimit');

const app = express();

// Vercel and Render terminate HTTPS at a proxy; needed for Secure cookies
app.set('trust proxy', 1);

// ====================================
// Middleware
// ====================================
// On Vercel the frontend and API share one origin, so CORS is only needed
// for a separately hosted frontend (CLIENT_URL) or direct calls in development
const allowedOrigins = [
  "http://localhost:5173",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    // Other origins get no CORS headers (same-origin requests don't need them);
    // throwing here would turn every same-origin POST into a 500
    return callback(null, allowedOrigins.includes(origin));
  },
  credentials: true,
}));

app.use(express.json());

app.use(cookieSession({
  name: "session",
  keys: sessionKeys(), // throws in production without a real SESSION_SECRET
  maxAge: 24 * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: "lax", // same-origin on Vercel, so Lax is enough
  secure: isProduction(),
}));

// Signed-in requests re-send the session cookie (at most once a minute, when
// this value changes), so the 24 hours count from the last activity rather
// than from sign-in
app.use((req, res, next) => {
  if (req.session && req.session.user_id) {
    req.session.lastActive = Math.floor(Date.now() / 60000);
  }
  next();
});

app.use(logRoutes);

// ====================================
// Auth routes
// ====================================
// One shared limiter: register and login attempts count against the same budget
const authLimiter = createAuthLimiter();
app.post('/api/auth/register', authLimiter, authControllers.register);
app.post('/api/auth/login', authLimiter, authControllers.login);
app.get('/api/auth/me', authControllers.getMe);
app.delete('/api/auth/logout', authControllers.logout);

// ====================================
// Account routes (signed-in user only)
// ====================================
app.patch('/api/users/me', checkAuthentication, userControllers.updateProfile);
// Password changes count against the same limit as logins (they check a password)
app.post('/api/users/me/password', authLimiter, checkAuthentication, userControllers.changePassword);

// ====================================
// Task Routes
// ====================================
app.use("/api/tasks", taskRoutes);

// ====================================
// DB Check (debug route, development only)
// ====================================
if (!isProduction()) {
  app.get("/db-check", async (req, res, next) => {
    try {
      const result = await pool.query("SELECT current_database()");
      res.send(result.rows);
    } catch (err) {
      next(err);
    }
  });
}

// Unknown API routes get JSON, not the React app
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'Not found' });
});

// ====================================
// Global Error Handler
// ====================================
const handleError = (err, req, res, next) => {
  // A body that isn't valid JSON is the client's mistake, not a server error
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'The request body must be valid JSON.' });
  }

  // Never let a submitted password appear in a log line
  const body = req.body || {};
  logError("SERVER ERROR:", err, [body.password, body.currentPassword, body.newPassword]);
  res.status(500).send({ message: 'Internal Server Error' });
};

app.use(handleError);

module.exports = app;
