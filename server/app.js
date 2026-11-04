// The Express API, without app.listen().
// Used by index.js (local server) and by frontend/api/index.js (Vercel function).
require('dotenv').config();

const express = require('express');
const cookieSession = require('cookie-session');
const cors = require('cors');
const pool = require("./db/pool");

const logRoutes = require('./middleware/logRoutes');
const authControllers = require('./controllers/authControllers');
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
  logError("SERVER ERROR:", err, [req.body && req.body.password]);
  res.status(500).send({ message: 'Internal Server Error' });
};

app.use(handleError);

module.exports = app;
