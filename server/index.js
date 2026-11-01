// ====================================
// ENV
// ====================================
try {
  require("dotenv").config();
} catch (e) {
  console.log("dotenv missing - continuing");
}

// ====================================
// CORE IMPORTS
// ====================================
const express = require("express");
const path = require("path");
const fs = require("fs");
const cookieSession = require("cookie-session");

// DB + MIGRATION
const migrate = require("./db/migrate");
const pool = require("./db/pool");
const { diagnoseOnStartup } = require("./db/diagnose");
const runStartupMigration = require("./db/startup");
const { logError } = require("./utils/safeError");
const sessionKeys = require("./utils/sessionKeys");

// ROUTES / CONTROLLERS
const logRoutes = require("./middleware/logRoutes");
const authControllers = require("./controllers/authControllers");
const taskRoutes = require("./routes/taskRoutes");

// ====================================
// APP INIT
// ====================================
const app = express();
const PORT = process.env.PORT || 8080;

const isProduction = process.env.NODE_ENV === "production";

// ====================================
// TRUST PROXY (Render requirement)
// ====================================
app.set("trust proxy", 1);

// No CORS: the frontend is served from this same origin (and proxied by Vite in dev)

// ====================================
// MIDDLEWARE
// ====================================
app.use(express.json());

app.use(
  cookieSession({
    name: "session",
    keys: sessionKeys(), // throws in production without a real SESSION_SECRET
    maxAge: 24 * 60 * 60 * 1000,
    secure: isProduction,
    httpOnly: true,
    sameSite: "lax",
  })
);

// Request logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.use(logRoutes);

// ====================================
// STATIC FRONTEND SETUP
// ====================================
const distPath = path.join(__dirname, "public");
const indexPath = path.join(distPath, "index.html");

console.log("📦 DIST PATH:", distPath);
console.log("📄 INDEX EXISTS:", fs.existsSync(indexPath));

// Serve static assets FIRST
app.use(
  express.static(distPath, {
    maxAge: "1d",
    etag: true,
  })
);

// ====================================
// AUTH ROUTES
// ====================================
app.post("/api/auth/register", authControllers.register);
app.post("/api/auth/login", authControllers.login);
app.get("/api/auth/me", authControllers.getMe);
app.delete("/api/auth/logout", authControllers.logout);

// ====================================
// TASK ROUTES
// ====================================
app.use("/api/tasks", taskRoutes);

// ====================================
// FRONTEND FALLBACK (MUST BE LAST)
// ====================================
app.get("*", (req, res) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ message: "Not found" });
  }

  if (!fs.existsSync(indexPath)) {
    return res.status(500).json({ error: "Frontend not built" });
  }

  res.sendFile(indexPath);
});

// ====================================
// GLOBAL ERROR HANDLER
// ====================================
app.use((err, req, res, next) => {
  logError("🔥 SERVER ERROR:", err);

  res.status(500).json({
    message: isProduction ? "Internal Server Error" : err.message,
    stack: isProduction ? undefined : err.stack,
  });
});

// ====================================
// START SERVER (SAFE FOR RENDER)
// ====================================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Run migrations AFTER server starts (prevents Render crash loops)
runStartupMigration({ migrate, diagnose: () => diagnoseOnStartup(pool) });