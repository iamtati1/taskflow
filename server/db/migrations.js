// Applies the SQL files in db/migrations, in name order, each once.
// Every file runs in its own transaction together with its row in
// schema_migrations, so a file is either fully applied and recorded or not
// at all. A failure stops the run. Migrations are additive (see
// migrations.test.js), so they can be applied before the code that uses them.
const fs = require("fs");
const path = require("path");

const MIGRATIONS_DIR = path.join(__dirname, "migrations");

const TRACKING_TABLE = `
  CREATE TABLE IF NOT EXISTS schema_migrations (
    name TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`;

const listMigrations = (dir = MIGRATIONS_DIR) =>
  fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".sql"))
    .sort()
    .map((name) => ({ name, sql: fs.readFileSync(path.join(dir, name), "utf8") }));

const tableExists = async (db, table) => {
  const { rows } = await db.query(
    "SELECT 1 FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = $1",
    [table]
  );
  return rows.length > 0;
};

// Read-only: an unmigrated database has no tracking table yet
const appliedNames = async (db) => {
  if (!(await tableExists(db, "schema_migrations"))) return [];
  const { rows } = await db.query("SELECT name FROM schema_migrations ORDER BY name");
  return rows.map((row) => row.name);
};

const pendingMigrations = async (pool, { dir } = {}) => {
  const applied = new Set(await appliedNames(pool));
  return listMigrations(dir).map((m) => m.name).filter((name) => !applied.has(name));
};

// Returns the names applied by this run
const applyMigrations = async (pool, { dir, log = () => {} } = {}) => {
  await pool.query(TRACKING_TABLE);
  const applied = new Set(await appliedNames(pool));
  const done = [];

  for (const { name, sql } of listMigrations(dir)) {
    if (applied.has(name)) continue;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [name]);
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK").catch(() => {});
      const failure = new Error(`Migration ${name} failed and was rolled back: ${err.message}`, { cause: err });
      failure.code = err.code; // keeps logError's categories (e.g. schema_mismatch)
      throw failure;
    } finally {
      client.release();
    }

    log(`Applied ${name}`);
    done.push(name);
  }

  return done;
};

// Read-only summary of the database: its tables, the tasks columns, and
// which migrations are applied or pending. Creates and changes nothing.
const checkDatabase = async (pool, { dir } = {}) => {
  const { rows: tables } = await pool.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema() ORDER BY table_name"
  );
  const { rows: columns } = await pool.query(
    `SELECT column_name, data_type, is_nullable, column_default
     FROM information_schema.columns
     WHERE table_schema = current_schema() AND table_name = 'tasks'
     ORDER BY ordinal_position`
  );
  const applied = await appliedNames(pool);
  const appliedSet = new Set(applied);

  return {
    tables: tables.map((t) => t.table_name),
    taskColumns: columns.map((c) => ({
      name: c.column_name,
      type: c.data_type,
      nullable: c.is_nullable === "YES",
      default: c.column_default,
    })),
    applied,
    pending: listMigrations(dir).map((m) => m.name).filter((name) => !appliedSet.has(name)),
  };
};

module.exports = { MIGRATIONS_DIR, listMigrations, pendingMigrations, applyMigrations, checkDatabase };
