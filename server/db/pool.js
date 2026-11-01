const { Pool } = require("pg");
const isProduction = require("../utils/isProduction");
const { logError } = require("../utils/safeError");
require("dotenv").config();

// DATABASE_URL must be set on the host (Vercel does not provide PostgreSQL).
// Locally, pg falls back to the PG* variables in .env when it is empty.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction()
    ? { rejectUnauthorized: false }
    : false,
});

// An idle client's connection error would otherwise crash the process
pool.on("error", (err) => logError("PG POOL ERROR:", err));

module.exports = pool;
