// npm run db:migrate         applies pending migrations (db/migrations)
// npm run db:migrate:check   read-only: shows the tasks columns and what is
//                            applied or pending; creates and changes nothing
//
// Uses DATABASE_URL like the server. Run the check first, and apply to a
// Neon branch before production.
const pool = require("./pool");
const { applyMigrations, checkDatabase } = require("./migrations");
const { logError } = require("../utils/safeError");

const check = async () => {
  const report = await checkDatabase(pool);

  console.log("Tables:", report.tables.join(", ") || "(none)");
  console.log("\ntasks columns:");
  for (const c of report.taskColumns) {
    const notes = [c.nullable ? "nullable" : "not null", c.default ? `default ${c.default}` : null]
      .filter(Boolean)
      .join(", ");
    console.log(`  ${c.name.padEnd(14)} ${c.type.padEnd(28)} ${notes}`);
  }
  console.log("\nApplied:", report.applied.join(", ") || "(none)");
  console.log("Pending:", report.pending.join(", ") || "(none)");
};

const apply = async () => {
  const done = await applyMigrations(pool, { log: (line) => console.log(line) });
  console.log(done.length ? `Done: ${done.length} applied.` : "Nothing to apply; the database is up to date.");
};

(process.argv.includes("--check") ? check() : apply())
  .catch((err) => {
    logError("Migration run failed:", err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
