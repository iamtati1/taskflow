const { Pool, types } = require("pg");
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

// Return DATE (1082) and TIMESTAMP-without-time-zone (1114) values as the text
// Postgres sends. Parsing them into JS Dates applies the server's time zone,
// which shifts calendar days (a due date of the 20th showing as the 19th).
types.setTypeParser(1082, (value) => value);
types.setTypeParser(1114, (value) => value);

// An idle client's connection error would otherwise crash the process
pool.on("error", (err) => logError("PG POOL ERROR:", err));

module.exports = pool;
