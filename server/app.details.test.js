// Task descriptions and scheduled times, end to end, against an in-memory
// Postgres (pg-mem) that starts in the production shape WITH rows, then gets
// the ALTER TABLE statements from the real db/schema.sql: the additive step a
// deployed database gets. (pg-mem can't re-run its CREATE TABLE IF NOT EXISTS
// on existing tables, which Postgres skips.) app.test.js covers the database
// before that step.
const { test, before, after } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const { newDb } = require("pg-mem");

const db = newDb();
db.public.none(`
  CREATE TABLE users (id SERIAL PRIMARY KEY, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL);
  CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title TEXT NOT NULL,
    is_complete BOOLEAN NOT NULL DEFAULT FALSE,
    due_date DATE
  );
`);
const { Pool } = db.adapters.createPg();
require.cache[require.resolve("./db/pool")] = { exports: new Pool() };

process.env.AUTH_RATE_LIMIT = "100000";
process.env.BCRYPT_COST = "4";
const app = require("./app");

const schema = fs.readFileSync(path.join(__dirname, "db/schema.sql"), "utf8");
const migration = schema.match(/^ALTER TABLE[^;]+;/gm).join("\n");
const existingRows = () => db.public.many("SELECT id, user_id, title, is_complete, due_date FROM tasks WHERE user_id = 1 ORDER BY id");

let server;
let base;
let rowsBeforeMigration;

before(async () => {
  const hash = await bcrypt.hash("legacy-password", 4);
  db.public.none(`
    INSERT INTO users (username, password_hash) VALUES ('legacy', '${hash}');
    INSERT INTO tasks (user_id, title, is_complete, due_date) VALUES
      (1, 'Old task one', false, '2026-01-10'),
      (1, 'Old task two', true, NULL);
  `);
  rowsBeforeMigration = existingRows();

  // The migration, twice: running it again must change nothing
  assert.strictEqual(migration.match(/ALTER TABLE/g).length, 2);
  db.public.none(migration);
  db.public.none(migration);

  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

const client = () => {
  const cookies = {};
  return async (method, urlPath, body) => {
    const res = await fetch(base + urlPath, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        Cookie: Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join("; "),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    for (const c of res.headers.getSetCookie()) {
      const [pair] = c.split(";");
      const eq = pair.indexOf("=");
      cookies[pair.slice(0, eq)] = pair.slice(eq + 1);
    }
    const text = await res.text();
    return { status: res.status, data: text ? JSON.parse(text) : null };
  };
};

const signedIn = async (username) => {
  const api = client();
  const res = await api("POST", "/api/auth/register", { username, password: `${username}-pass` });
  assert.strictEqual(res.status, 201);
  return api;
};

// ---------- The migration ----------

test("the migration keeps every existing task and gives it no description or time", async () => {
  assert.deepStrictEqual(existingRows(), rowsBeforeMigration);

  const api = client();
  await api("POST", "/api/auth/login", { username: "legacy", password: "legacy-password" });
  const { status, data } = await api("GET", "/api/tasks");
  assert.strictEqual(status, 200);
  assert.deepStrictEqual(
    data.map(({ title, description, scheduled_time, due_date }) => ({ title, description, scheduled_time, due_date })),
    [
      { title: "Old task two", description: null, scheduled_time: null, due_date: null },
      { title: "Old task one", description: null, scheduled_time: null, due_date: "2026-01-10" },
    ]
  );
});

// ---------- Descriptions ----------

test("descriptions are optional: a task without one has none", async () => {
  const api = await signedIn("plain");
  const created = await api("POST", "/api/tasks", { title: "No notes" });
  assert.strictEqual(created.status, 201);
  assert.strictEqual(created.data.description, null);
});

test("a multi-line description is saved exactly, and Windows line endings become newlines", async () => {
  const api = await signedIn("notes");
  const text = "Bring:\n- passport\n- two photos\n\nOffice opens at 9.";
  const created = await api("POST", "/api/tasks", { title: "Renew passport", description: text });
  assert.strictEqual(created.status, 201);
  assert.strictEqual(created.data.description, text);

  const crlf = await api("PATCH", `/api/tasks/${created.data.task_id}`, { description: "one\r\ntwo" });
  assert.strictEqual(crlf.data.description, "one\ntwo");
});

test("a description can be added, edited and cleared, and other fields are never touched", async () => {
  const api = await signedIn("editnotes");
  const { data: task } = await api("POST", "/api/tasks", { title: "Plan trip", due_date: "2026-12-05" });
  await api("PATCH", `/api/tasks/${task.task_id}`, { is_complete: true });

  const added = await api("PATCH", `/api/tasks/${task.task_id}`, { description: "Book the train" });
  assert.strictEqual(added.status, 200);
  assert.deepStrictEqual(
    { title: added.data.title, due_date: added.data.due_date, is_complete: added.data.is_complete, description: added.data.description },
    { title: "Plan trip", due_date: "2026-12-05", is_complete: true, description: "Book the train" }
  );

  // Editing the title alone keeps the description
  const renamed = await api("PATCH", `/api/tasks/${task.task_id}`, { title: "Plan the trip" });
  assert.strictEqual(renamed.data.description, "Book the train");

  const edited = await api("PATCH", `/api/tasks/${task.task_id}`, { description: "Book the train and hotel" });
  assert.strictEqual(edited.data.description, "Book the train and hotel");

  // Cleared with null, with an empty string, or with only spaces
  for (const empty of [null, "", "   \n "]) {
    await api("PATCH", `/api/tasks/${task.task_id}`, { description: "temporary" });
    const cleared = await api("PATCH", `/api/tasks/${task.task_id}`, { description: empty });
    assert.strictEqual(cleared.status, 200);
    assert.strictEqual(cleared.data.description, null, JSON.stringify(empty));
  }
  const after = (await api("GET", "/api/tasks")).data[0];
  assert.deepStrictEqual([after.title, after.due_date, after.is_complete], ["Plan the trip", "2026-12-05", true]);
});

test("descriptions must be text of at most 2000 characters", async () => {
  const api = await signedIn("longnotes");
  const ok = await api("POST", "/api/tasks", { title: "Long", description: "x".repeat(2000) });
  assert.strictEqual(ok.status, 201);

  const tooLong = await api("POST", "/api/tasks", { title: "Too long", description: "x".repeat(2001) });
  assert.strictEqual(tooLong.status, 400);
  assert.match(tooLong.data.error, /at most 2000/);

  const notText = await api("PATCH", `/api/tasks/${ok.data.task_id}`, { description: 42 });
  assert.strictEqual(notText.status, 400);
  assert.strictEqual((await api("GET", "/api/tasks")).data[0].description, "x".repeat(2000), "refused edits change nothing");
});

test("descriptions persist across sign-out and sign-in", async () => {
  const api = await signedIn("persist");
  await api("POST", "/api/tasks", { title: "Call the bank", description: "Ask about\nthe fee" });
  await api("DELETE", "/api/auth/logout");
  assert.strictEqual((await api("GET", "/api/tasks")).status, 401);

  await api("POST", "/api/auth/login", { username: "persist", password: "persist-pass" });
  const { data } = await api("GET", "/api/tasks");
  assert.strictEqual(data[0].description, "Ask about\nthe fee");
});

test("another user can neither read nor change a task's description", async () => {
  const owner = await signedIn("owner");
  const { data: task } = await owner("POST", "/api/tasks", { title: "Private", description: "secret plans" });

  const other = await signedIn("intruder");
  assert.deepStrictEqual((await other("GET", "/api/tasks")).data, []);
  const attempt = await other("PATCH", `/api/tasks/${task.task_id}`, { description: "changed" });
  assert.strictEqual(attempt.status, 403);
  assert.strictEqual((await owner("GET", "/api/tasks")).data[0].description, "secret plans");
});

// ---------- Scheduled times ----------

test("a due date stays a deadline unless a time is set; a time is HH:MM", async () => {
  const api = await signedIn("times");
  const deadline = await api("POST", "/api/tasks", { title: "Submit form", due_date: "2026-12-01" });
  assert.strictEqual(deadline.data.scheduled_time, null);

  const meeting = await api("POST", "/api/tasks", { title: "Dentist", due_date: "2026-12-01", scheduled_time: "09:30" });
  assert.strictEqual(meeting.status, 201);
  assert.strictEqual(meeting.data.scheduled_time, "09:30");
  assert.strictEqual(meeting.data.due_date, "2026-12-01", "the day is not shifted by the time");

  for (const bad of ["9:30", "24:00", "12:60", "noon", 930]) {
    const res = await api("POST", "/api/tasks", { title: "Bad", due_date: "2026-12-01", scheduled_time: bad });
    assert.strictEqual(res.status, 400, String(bad));
  }
});

test("a time needs a due date, and removing the date removes its time", async () => {
  const api = await signedIn("timedate");
  const undated = await api("POST", "/api/tasks", { title: "Someday", scheduled_time: "10:00" });
  assert.strictEqual(undated.status, 400);
  assert.match(undated.data.error, /needs a due date/);

  const { data: task } = await api("POST", "/api/tasks", { title: "Call", due_date: "2026-12-02", scheduled_time: "15:00" });

  // Moving to another day keeps the time
  const moved = await api("PATCH", `/api/tasks/${task.task_id}`, { due_date: "2026-12-04" });
  assert.deepStrictEqual([moved.data.due_date, moved.data.scheduled_time], ["2026-12-04", "15:00"]);

  // The time alone can be changed or cleared
  const changed = await api("PATCH", `/api/tasks/${task.task_id}`, { scheduled_time: "16:45" });
  assert.strictEqual(changed.data.scheduled_time, "16:45");
  const noTime = await api("PATCH", `/api/tasks/${task.task_id}`, { scheduled_time: null });
  assert.deepStrictEqual([noTime.data.due_date, noTime.data.scheduled_time], ["2026-12-04", null]);

  // Clearing the date clears a time with it
  await api("PATCH", `/api/tasks/${task.task_id}`, { scheduled_time: "08:00" });
  const cleared = await api("PATCH", `/api/tasks/${task.task_id}`, { due_date: null });
  assert.deepStrictEqual([cleared.data.due_date, cleared.data.scheduled_time], [null, null]);

  // And a time can't be added to an undated task
  const refused = await api("PATCH", `/api/tasks/${task.task_id}`, { scheduled_time: "09:00" });
  assert.strictEqual(refused.status, 400);
});
