// Creates the tables from schema.sql if they don't exist yet, and adds the
// optional task columns if they are missing. Never drops, renames, or writes
// rows, so it is safe on an existing database. Run it on a Neon branch before
// production.
const fs = require("fs");
const path = require("path");
const pool = require("./pool");
const { logError } = require("../utils/safeError");

const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");

pool
  .query(schema)
  .then(() => console.log("Database tables are ready."))
  .catch((err) => {
    logError("Database setup failed:", err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
