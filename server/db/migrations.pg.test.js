// The migrations and the task API against a real PostgreSQL, for what pg-mem
// can't show: transactions rolling back, real column types and constraints.
// Runs when TEST_DATABASE_URL points at a local server (CI starts one) and is
// skipped otherwise. Every test uses its own new database, dropped afterwards.
const { test, before, after } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { Pool } = require("pg");

require("./pool"); // the app's type parsers (DATE as "YYYY-MM-DD")
const { listMigrations, pendingMigrations, applyMigrations, checkDatabase } = require("./migrations");

const url = process.env.TEST_DATABASE_URL;
const LOCAL_HOSTS = ["localhost", "127.0.0.1", "::1", "[::1]"];
const skip = !url
  ? "set TEST_DATABASE_URL to a local PostgreSQL to run"
  : !LOCAL_HOSTS.includes(new URL(url).hostname)
    ? "TEST_DATABASE_URL must point at a local server; these tests create and drop databases"
    : false;

let admin;
let server; // the API server, started by the first API test
const databases = [];
const pools = [];

before(() => {
  if (!skip) admin = new Pool({ connectionString: url });
});

after(async () => {
  if (skip) return;
  if (server) await new Promise((resolve) => server.close(resolve));
  await Promise.all(pools.map((pool) => pool.end()));
  for (const name of databases) await admin.query(`DROP DATABASE IF EXISTS ${name} WITH (FORCE)`);
  await admin.end();
});

// A new database shaped like production today, with existing rows
const productionLike = async () => {
  const name = `taskflow_test_${process.pid}_${databases.length}`;
  await admin.query(`DROP DATABASE IF EXISTS ${name} WITH (FORCE)`);
  await admin.query(`CREATE DATABASE ${name}`);
  databases.push(name);

  const dbUrl = new URL(url);
  dbUrl.pathname = `/${name}`;
  const pool = new Pool({ connectionString: dbUrl.toString() });
  pools.push(pool);

  await pool.query(fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8"));
  await pool.query(`
    INSERT INTO users (username, password_hash) VALUES ('legacy', 'hash-1'), ('other', 'hash-2');
    INSERT INTO tasks (user_id, title, is_complete, due_date) VALUES
      (1, 'Old task one', false, '2026-01-10'),
      (1, 'Old task two', true, NULL),
      (2, 'Someone else''s task', false, NULL);
  `);
  return pool;
};

const rows = async (pool, sql, params) => (await pool.query(sql, params)).rows;
const originalTasks = (pool) => rows(pool, "SELECT id, user_id, title, is_complete, due_date FROM tasks ORDER BY id");

test("the check reads the schema and creates nothing", { skip }, async () => {
  const pool = await productionLike();

  const report = await checkDatabase(pool);

  assert.deepStrictEqual(report.taskColumns.map((c) => c.name), ["id", "user_id", "title", "is_complete", "due_date"]);
  assert.deepStrictEqual(report.pending, listMigrations().map((m) => m.name));
  assert.deepStrictEqual(report.tables, ["tasks", "users"]);
  assert.deepStrictEqual((await checkDatabase(pool)).tables, ["tasks", "users"]);
});

test("applying keeps existing data, adds honest defaults, and is safe to repeat", { skip }, async () => {
  const pool = await productionLike();
  const before = await originalTasks(pool);

  assert.strictEqual((await applyMigrations(pool)).length, 4);
  assert.deepStrictEqual(await originalTasks(pool), before);
  assert.deepStrictEqual(
    await rows(pool, "SELECT created_at, completed_at, priority, description, category_id FROM tasks"),
    Array(3).fill({ created_at: null, completed_at: null, priority: "medium", description: null, category_id: null })
  );

  assert.deepStrictEqual(await applyMigrations(pool), []);
  assert.deepStrictEqual(await pendingMigrations(pool), []);
  for (const { sql } of listMigrations()) await pool.query(sql); // as if re-applied by hand
  assert.deepStrictEqual(await originalTasks(pool), before);

  const columns = (await checkDatabase(pool)).taskColumns;
  const type = (name) => columns.find((c) => c.name === name).type;
  assert.strictEqual(type("created_at"), "timestamp with time zone");
  assert.strictEqual(type("completed_at"), "timestamp with time zone");
});

test("a failing migration is rolled back completely and stops the run", { skip }, async () => {
  const pool = await productionLike();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tf-migrations-"));
  fs.writeFileSync(path.join(dir, "001_ok.sql"), "ALTER TABLE tasks ADD COLUMN ok_col TEXT;");
  fs.writeFileSync(path.join(dir, "002_bad.sql"), "ALTER TABLE tasks ADD COLUMN half_done TEXT; SELECT * FROM no_such_table;");
  fs.writeFileSync(path.join(dir, "003_never.sql"), "ALTER TABLE tasks ADD COLUMN never_col TEXT;");

  await assert.rejects(applyMigrations(pool, { dir }), /002_bad\.sql failed and was rolled back/);

  const names = (await checkDatabase(pool, { dir })).taskColumns.map((c) => c.name);
  assert.ok(names.includes("ok_col"));
  assert.ok(!names.includes("half_done"), "the failed file's first statement was undone");
  assert.ok(!names.includes("never_col"));
  assert.deepStrictEqual(await pendingMigrations(pool, { dir }), ["002_bad.sql", "003_never.sql"]);
});

test("the code running today keeps working on the migrated database", { skip }, async () => {
  const pool = await productionLike();
  await applyMigrations(pool);

  const [task] = await rows(
    pool,
    "INSERT INTO tasks (title, is_complete, due_date, user_id) VALUES ($1, FALSE, $2, $3) RETURNING id AS task_id, user_id, title, is_complete, due_date",
    ["Today's code", "2026-12-01", 1]
  );
  assert.deepStrictEqual(task, { task_id: 4, user_id: 1, title: "Today's code", is_complete: false, due_date: "2026-12-01" });
  await pool.query("UPDATE tasks SET title = $1, is_complete = $2 WHERE id = $3 AND user_id = $4", ["Edited", true, 4, 1]);
  await pool.query("DELETE FROM tasks WHERE id = $1 AND user_id = $2", [4, 1]);
});

test("constraints: priority values, category and task deletes, user deletes", { skip }, async () => {
  const pool = await productionLike();
  await applyMigrations(pool);

  await assert.rejects(pool.query("INSERT INTO tasks (user_id, title, priority) VALUES (1, 'x', 'urgent')"), /check constraint/);
  await assert.rejects(pool.query("INSERT INTO task_activity (user_id, task_title, action) VALUES (1, 'x', 'viewed')"), /check constraint/);
  await assert.rejects(pool.query("INSERT INTO categories (user_id, name) VALUES (1, 'Work'), (1, 'Work')"), /unique/);

  const [work] = await rows(pool, "INSERT INTO categories (user_id, name) VALUES (1, 'Work') RETURNING id");
  await pool.query("UPDATE tasks SET category_id = $1 WHERE id = 1", [work.id]);
  await pool.query("INSERT INTO task_activity (user_id, task_id, task_title, action) VALUES (1, 2, 'Old task two', 'completed')");

  await pool.query("DELETE FROM categories WHERE id = $1", [work.id]);
  assert.strictEqual((await rows(pool, "SELECT category_id FROM tasks WHERE id = 1"))[0].category_id, null);

  await pool.query("DELETE FROM tasks WHERE id = 2");
  assert.deepStrictEqual(await rows(pool, "SELECT task_id, task_title FROM task_activity"), [{ task_id: null, task_title: "Old task two" }]);

  await pool.query("DELETE FROM users WHERE id = 1");
  assert.deepStrictEqual(await rows(pool, "SELECT * FROM task_activity"), []);
  assert.deepStrictEqual(await rows(pool, "SELECT title FROM tasks"), [{ title: "Someone else's task" }]);
});

// ---------- The API over HTTP, on a migrated real database ----------

let api; // set by the first API test
const startApp = async () => {
  if (api) return api;
  const pool = await productionLike();
  await applyMigrations(pool);
  require.cache[require.resolve("./pool")] = { exports: pool };
  process.env.AUTH_RATE_LIMIT = "100000";
  const app = require("../app");
  server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });

  const base = `http://127.0.0.1:${server.address().port}`;
  let cookie = "";
  const call = async (method, route, body) => {
    const res = await fetch(base + route, {
      method,
      headers: { ...(body ? { "Content-Type": "application/json" } : {}), Cookie: cookie },
      body: body ? JSON.stringify(body) : undefined,
    });
    const set = res.headers.getSetCookie().map((c) => c.split(";")[0]);
    if (set.length) cookie = set.join("; ");
    return { status: res.status, data: await res.json().catch(() => null) };
  };
  await call("POST", "/api/auth/register", { username: "pguser", password: "pguser-pass" });
  api = { call, pool };
  return api;
};

test("API on real PostgreSQL: recovered fields, completion time and history", { skip }, async () => {
  const { call, pool } = await startApp();

  const created = await call("POST", "/api/tasks", { title: "Ship R1", priority: "high", description: "Notes", due_date: "2026-12-01" });
  assert.strictEqual(created.status, 201);
  assert.strictEqual(created.data.priority, "high");
  assert.strictEqual(created.data.due_date, "2026-12-01");
  assert.match(created.data.created_at, /^\d{4}-\d{2}-\d{2}T.*Z$/);
  const id = created.data.task_id;

  const done = await call("PATCH", `/api/tasks/${id}`, { is_complete: true });
  assert.match(done.data.completed_at, /Z$/);
  const reopened = await call("PATCH", `/api/tasks/${id}`, { is_complete: false });
  assert.strictEqual(reopened.data.completed_at, null);
  await call("PATCH", `/api/tasks/${id}`, { title: "Ship R1 now", due_date: "2026-12-01", priority: "high" });
  await call("DELETE", `/api/tasks/${id}`);

  assert.deepStrictEqual(
    (await rows(pool, "SELECT task_id, task_title, action FROM task_activity ORDER BY id")).map((a) => [a.task_id, a.task_title, a.action]),
    [
      [null, "Ship R1", "created"],
      [null, "Ship R1", "completed"],
      [null, "Ship R1", "reopened"],
      [null, "Ship R1 now", "updated"],
      [null, "Ship R1 now", "deleted"],
    ]
  );
});

test("API on real PostgreSQL: if the history entry can't be saved, the change isn't either", { skip }, async () => {
  const { call, pool } = await startApp();
  const id = (await call("POST", "/api/tasks", { title: "Atomic" })).data.task_id;
  const historyBefore = await rows(pool, "SELECT * FROM task_activity ORDER BY id");

  // Make every new history entry fail (this test database only)
  await pool.query("ALTER TABLE task_activity ADD CONSTRAINT refuse_all CHECK (false) NOT VALID");
  try {
    const edit = await call("PATCH", `/api/tasks/${id}`, { title: "Changed", is_complete: true });
    assert.strictEqual(edit.status, 500);
    const removed = await call("DELETE", `/api/tasks/${id}`);
    assert.strictEqual(removed.status, 500);
  } finally {
    await pool.query("ALTER TABLE task_activity DROP CONSTRAINT refuse_all");
  }

  const [task] = await rows(pool, "SELECT title, is_complete, completed_at FROM tasks WHERE id = $1", [id]);
  assert.deepStrictEqual(task, { title: "Atomic", is_complete: false, completed_at: null }, "the edit was rolled back");
  assert.deepStrictEqual(await rows(pool, "SELECT * FROM task_activity ORDER BY id"), historyBefore);
});
