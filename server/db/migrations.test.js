// The migration runner and the real migration files, against an in-memory
// Postgres (pg-mem) shaped like production, with rows already in it.
// db/migrations.pg.test.js runs the same files against a real PostgreSQL.
const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { newDb } = require("pg-mem");

const { listMigrations, pendingMigrations, applyMigrations, checkDatabase } = require("./migrations");

const ALL = [
  "001_task_timestamps.sql",
  "002_task_priority_and_description.sql",
  "003_categories.sql",
  "004_task_activity.sql",
];

// The production schema (db/schema.sql) with existing users and tasks.
// pg-mem rejects re-running CREATE TABLE IF NOT EXISTS on an existing table
// unless its AST coverage check is off; real PostgreSQL accepts it.
const productionLike = () => {
  const db = newDb({ noAstCoverageCheck: true });
  db.public.none(fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8"));
  db.public.none(`
    INSERT INTO users (username, password_hash) VALUES ('legacy', 'hash-1'), ('other', 'hash-2');
    INSERT INTO tasks (user_id, title, is_complete, due_date) VALUES
      (1, 'Old task one', false, '2026-01-10'),
      (1, 'Old task two', true, NULL),
      (2, 'Someone else''s task', false, NULL);
  `);
  const { Pool } = db.adapters.createPg();
  return { db, pool: new Pool() };
};

const ORIGINAL_COLUMNS = "id, user_id, title, is_complete, due_date";
const originalRows = (db) => db.public.many(`SELECT ${ORIGINAL_COLUMNS} FROM tasks ORDER BY id`);
const users = (db) => db.public.many("SELECT * FROM users ORDER BY id");

test("the migrations are the four recovery files, in order", () => {
  assert.deepStrictEqual(listMigrations().map((m) => m.name), ALL);
});

test("every migration file is additive: no DROP, TRUNCATE, DELETE, UPDATE or type change", () => {
  for (const { name, sql } of listMigrations()) {
    const code = sql.replace(/--.*$/gm, "");
    // Statements that remove or rewrite data (ON DELETE / ON UPDATE rules on
    // a foreign key are allowed: they only apply to future deletes)
    assert.doesNotMatch(code, /(^|;)\s*(DELETE|UPDATE|TRUNCATE|INSERT)\b/im, name);
    assert.doesNotMatch(code, /\b(DROP|RENAME)\b/i, name);
    assert.doesNotMatch(code, /ALTER\s+COLUMN\s+\w+\s+(TYPE|SET\s+NOT\s+NULL)/i, name);
  }
});

test("a database that has never been migrated has all four pending", async () => {
  const { pool } = productionLike();
  assert.deepStrictEqual(await pendingMigrations(pool), ALL);
});

test("applying keeps every existing user and task value and gives old tasks honest defaults", async () => {
  const { db, pool } = productionLike();
  const tasksBefore = originalRows(db);
  const usersBefore = users(db);

  assert.deepStrictEqual(await applyMigrations(pool), ALL);

  assert.deepStrictEqual(originalRows(db), tasksBefore);
  assert.deepStrictEqual(users(db), usersBefore);
  for (const task of db.public.many("SELECT created_at, completed_at, priority, description, category_id FROM tasks")) {
    // When old tasks were created or completed was never recorded
    assert.deepStrictEqual(task, {
      created_at: null,
      completed_at: null,
      priority: "medium",
      description: null,
      category_id: null,
    });
  }
  assert.deepStrictEqual(db.public.many("SELECT * FROM categories"), []);
  assert.deepStrictEqual(db.public.many("SELECT * FROM task_activity"), []);
});

test("applying again does nothing and changes nothing", async () => {
  const { db, pool } = productionLike();
  await applyMigrations(pool);
  const after = db.public.many("SELECT * FROM tasks ORDER BY id");

  assert.deepStrictEqual(await applyMigrations(pool), []);
  assert.deepStrictEqual(await pendingMigrations(pool), []);
  assert.deepStrictEqual(db.public.many("SELECT * FROM tasks ORDER BY id"), after);
});

test("each file can be re-run on its own without error (safe if applied by hand)", async () => {
  const { db, pool } = productionLike();
  await applyMigrations(pool);
  for (const { sql } of listMigrations()) db.public.none(sql);
});

test("new tasks get created_at automatically; priority only accepts low, medium or high", async () => {
  const { db, pool } = productionLike();
  await applyMigrations(pool);

  const [fresh] = db.public.many("INSERT INTO tasks (user_id, title) VALUES (1, 'New') RETURNING created_at, priority");
  assert.ok(fresh.created_at instanceof Date);
  assert.strictEqual(fresh.priority, "medium");
  assert.throws(() => db.public.none("INSERT INTO tasks (user_id, title, priority) VALUES (1, 'Bad', 'urgent')"));
});

test("the code running today keeps working after the migration (safe to migrate before deploying)", async () => {
  const { db, pool } = productionLike();
  await applyMigrations(pool);

  // The queries the current taskModel sends
  const [created] = db.public.many(
    "INSERT INTO tasks (title, is_complete, due_date, user_id) VALUES ('Today''s code', FALSE, NULL, 1) RETURNING id AS task_id, user_id, title, is_complete, due_date"
  );
  assert.strictEqual(created.title, "Today's code");
  db.public.none(`UPDATE tasks SET is_complete = true WHERE id = ${created.task_id} AND user_id = 1`);
  db.public.none(`DELETE FROM tasks WHERE id = ${created.task_id} AND user_id = 1`);
});

test("deleting a category uncategorises its tasks; deleting a task keeps its history", async () => {
  const { db, pool } = productionLike();
  await applyMigrations(pool);

  db.public.none("INSERT INTO categories (user_id, name) VALUES (1, 'Work')");
  db.public.none("UPDATE tasks SET category_id = 1 WHERE id = 1");
  db.public.none("DELETE FROM categories WHERE id = 1");
  assert.strictEqual(db.public.one("SELECT category_id FROM tasks WHERE id = 1").category_id, null);

  db.public.none("INSERT INTO task_activity (user_id, task_id, task_title, action) VALUES (1, 1, 'Old task one', 'completed')");
  db.public.none("DELETE FROM tasks WHERE id = 1");
  assert.deepStrictEqual(db.public.many("SELECT task_id, task_title, action FROM task_activity"), [
    { task_id: null, task_title: "Old task one", action: "completed" },
  ]);
});

// pg-mem doesn't roll back transactions; that the failed file's statements
// are undone is checked against real PostgreSQL in migrations.pg.test.js
test("a failing migration is reported by name, recorded as not applied, and stops the run", async () => {
  const { db, pool } = productionLike();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tf-migrations-"));
  fs.writeFileSync(path.join(dir, "001_ok.sql"), "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS ok_col TEXT;");
  fs.writeFileSync(path.join(dir, "002_bad.sql"), "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS half_done TEXT; SELECT * FROM no_such_table;");
  fs.writeFileSync(path.join(dir, "003_never.sql"), "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS never_col TEXT;");

  await assert.rejects(applyMigrations(pool, { dir }), /002_bad\.sql/);

  const columns = db.public.many("SELECT column_name FROM information_schema.columns WHERE table_name = 'tasks'").map((c) => c.column_name);
  assert.ok(columns.includes("ok_col"));
  assert.ok(!columns.includes("never_col"), "later files did not run");
  assert.deepStrictEqual(await pendingMigrations(pool, { dir }), ["002_bad.sql", "003_never.sql"]);
});

test("the check reports columns and pending files without creating anything", async () => {
  const { db, pool } = productionLike();

  const report = await checkDatabase(pool);

  assert.deepStrictEqual(report.pending, ALL);
  assert.deepStrictEqual(report.applied, []);
  assert.deepStrictEqual(
    report.taskColumns.map((c) => c.name).sort(),
    ["due_date", "id", "is_complete", "title", "user_id"]
  );
  const tables = db.public.many("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'").map((t) => t.table_name);
  assert.ok(!tables.includes("schema_migrations"), "a check must not create the tracking table");
});
