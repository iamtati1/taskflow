// Runs the startup migration after the server is listening.
// On failure: logs a sanitized summary and runs the connection diagnostic once.
// Always resolves, so nothing here can crash the server.
const { logError } = require("../utils/safeError");

const runStartupMigration = ({ migrate, diagnose }) =>
  Promise.resolve()
    .then(migrate)
    .then(() => console.log("✅ DB migration complete"))
    .catch((err) => {
      logError("⚠️ Migration skipped/failed:", err);
      return Promise.resolve()
        .then(diagnose)
        .catch(() => {});
    });

module.exports = runStartupMigration;
