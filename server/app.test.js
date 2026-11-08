// End-to-end API tests against an in-memory Postgres (pg-mem) shaped exactly like
// the production schema: users(id, username, password_hash) and
// tasks(id, user_id, title, is_complete, due_date). A query naming any other
// column fails here as it would in production.
const { test, before, after, mock } = require("node:test");
const assert = require("node:assert");
const bcrypt = require("bcrypt");
const { newDb } = require("pg-mem");

const db = newDb();
db.public.none(`
  CREATE TABLE users (id SERIAL PRIMARY KEY, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL);
  CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title TEXT NOT NULL,
    is_complete BOOLEAN,
    due_date TIMESTAMP
  );
`);
const { Pool } = db.adapters.createPg();
require.cache[require.resolve("./db/pool")] = { exports: new Pool() };

// Many tests log in from the same address; the limiter itself is tested separately
process.env.AUTH_RATE_LIMIT = "100000";
// Fast hashing for the many test accounts. Existing accounts below are hashed
// at the same cost, so signing in doesn't upgrade (rewrite) their hashes;
// the upgrade is tested in models/userModel.test.js.
process.env.BCRYPT_COST = "4";
const app = require("./app");

let server;
let base;
let legacy; // records that existed before the app touched the database
let snapshotBefore;

const snapshot = () => ({
  users: db.public.many("SELECT * FROM users WHERE username IN ('legacy', 'other') ORDER BY id"),
  tasks: db.public.many("SELECT * FROM tasks WHERE user_id IN (1, 2) ORDER BY id"),
});

before(async () => {
  const hash = await bcrypt.hash("legacy-password", 4);
  db.public.none(`
    INSERT INTO users (username, password_hash) VALUES ('legacy', '${hash}'), ('other', '${hash}');
    INSERT INTO tasks (user_id, title, is_complete, due_date) VALUES
      (1, 'Old task one', false, '2026-01-10'),
      (1, 'Old task two', true, NULL),
      (2, 'Someone else''s task', false, NULL);
  `);
  legacy = { user_id: 1, otherTaskId: 3 };
  snapshotBefore = snapshot();

  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

// A tiny cookie-keeping client, like a browser tab
const client = () => {
  let cookies = {};
  return async (method, path, body) => {
    const res = await fetch(base + path, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        Cookie: Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join("; "),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    for (const c of res.headers.getSetCookie()) {
      const [pair] = c.split(";");
      const eq = pair.indexOf("="); // values are base64 and may contain "="
      cookies[pair.slice(0, eq)] = pair.slice(eq + 1);
    }
    const text = await res.text();
    let data = null;
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = text;
    }
    const cookieHeader = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join("; ");
    return { status: res.status, data, headers: res.headers, cookieHeader };
  };
};

test("GET /api/auth/me is 401 when logged out", async () => {
  const res = await client()("GET", "/api/auth/me");
  assert.strictEqual(res.status, 401);
});

test("register creates a user, starts a session, and rejects duplicates", async () => {
  const api = client();
  const reg = await api("POST", "/api/auth/register", { username: "newbie", password: "newbie-pass" });
  assert.strictEqual(reg.status, 201);
  assert.deepStrictEqual(Object.keys(reg.data.user).sort(), ["user_id", "username"]);
  assert.strictEqual(reg.data.user.username, "newbie");

  // The session cookie restores the user on the next request (a page refresh)
  const me = await api("GET", "/api/auth/me");
  assert.strictEqual(me.status, 200);
  assert.deepStrictEqual(me.data.user, reg.data.user);

  const dup = await client()("POST", "/api/auth/register", { username: "newbie", password: "another-pass" });
  assert.strictEqual(dup.status, 400);
  assert.match(dup.data.error, /already taken/);
});

test("register rejects missing fields", async () => {
  const res = await client()("POST", "/api/auth/register", { username: "nopass" });
  assert.strictEqual(res.status, 400);
});

test("an existing user logs in with their existing password hash", async () => {
  const api = client();
  const login = await api("POST", "/api/auth/login", { username: "legacy", password: "legacy-password" });
  assert.strictEqual(login.status, 200);
  assert.deepStrictEqual(login.data.user, { user_id: legacy.user_id, username: "legacy" });

  const me = await api("GET", "/api/auth/me");
  assert.deepStrictEqual(me.data.user, login.data.user);
});

test("login rejects a wrong password or unknown user without a session", async () => {
  const api = client();
  assert.strictEqual((await api("POST", "/api/auth/login", { username: "legacy", password: "nope" })).status, 401);
  assert.strictEqual((await api("POST", "/api/auth/login", { username: "ghost", password: "nope" })).status, 401);
  assert.strictEqual((await api("GET", "/api/auth/me")).status, 401);
});

test("an existing user's existing tasks are listed with task_id, newest first, and only theirs", async () => {
  const api = client();
  await api("POST", "/api/auth/login", { username: "legacy", password: "legacy-password" });
  const res = await api("GET", "/api/tasks");
  assert.strictEqual(res.status, 200);
  const titles = res.data.filter((t) => t.title.startsWith("Old")).map((t) => t.title);
  assert.deepStrictEqual(titles, ["Old task two", "Old task one"]);
  for (const t of res.data) {
    assert.deepStrictEqual(Object.keys(t).sort(), ["due_date", "is_complete", "task_id", "title", "user_id"]);
    assert.strictEqual(t.user_id, legacy.user_id);
  }
});

test("task CRUD: create, update, toggle, and delete", async () => {
  const api = client();
  await api("POST", "/api/auth/register", { username: "crud", password: "crud-pass" });

  // Extra fields the UI sends (priority, description) are accepted and ignored
  const created = await api("POST", "/api/tasks", { title: "Write tests", priority: "high", description: "x", due_date: "2026-12-01" });
  assert.strictEqual(created.status, 201);
  assert.strictEqual(created.data.title, "Write tests");
  assert.strictEqual(created.data.is_complete, false);
  assert.ok(created.data.task_id);
  const id = created.data.task_id;

  const toggled = await api("PATCH", `/api/tasks/${id}`, { is_complete: true });
  assert.strictEqual(toggled.status, 200);
  assert.strictEqual(toggled.data.is_complete, true);
  assert.strictEqual(toggled.data.title, "Write tests");

  const renamed = await api("PATCH", `/api/tasks/${id}`, { title: "Write more tests", priority: "low" });
  assert.strictEqual(renamed.data.title, "Write more tests");
  assert.strictEqual(renamed.data.is_complete, true, "fields not sent stay unchanged");

  const list = await api("GET", "/api/tasks");
  assert.deepStrictEqual(list.data.map((t) => t.task_id), [id]);

  const removed = await api("DELETE", `/api/tasks/${id}`);
  assert.strictEqual(removed.status, 200);
  assert.strictEqual(removed.data.task_id, id);
  assert.deepStrictEqual((await api("GET", "/api/tasks")).data, []);
});

test("task create requires a title", async () => {
  const api = client();
  await api("POST", "/api/auth/register", { username: "notitle", password: "notitle-pass" });
  assert.strictEqual((await api("POST", "/api/tasks", { title: "  " })).status, 400);
});

test("users cannot change or delete another user's task", async () => {
  const api = client();
  await api("POST", "/api/auth/login", { username: "legacy", password: "legacy-password" });
  assert.strictEqual((await api("PATCH", `/api/tasks/${legacy.otherTaskId}`, { title: "hijacked" })).status, 403);
  assert.strictEqual((await api("DELETE", `/api/tasks/${legacy.otherTaskId}`)).status, 403);
});

test("unknown and non-numeric task ids are 404, not 500", async () => {
  const api = client();
  await api("POST", "/api/auth/login", { username: "legacy", password: "legacy-password" });
  assert.strictEqual((await api("PATCH", "/api/tasks/9999", { title: "x" })).status, 404);
  assert.strictEqual((await api("PATCH", "/api/tasks/temp-123", { title: "x" })).status, 404);
  assert.strictEqual((await api("DELETE", "/api/tasks/abc")).status, 404);
});

test("task routes require a session", async () => {
  const api = client();
  assert.strictEqual((await api("GET", "/api/tasks")).status, 401);
  assert.strictEqual((await api("POST", "/api/tasks", { title: "x" })).status, 401);
  assert.strictEqual((await api("PATCH", "/api/tasks/1", { title: "x" })).status, 401);
  assert.strictEqual((await api("DELETE", "/api/tasks/1")).status, 401);
});

test("logout ends the session", async () => {
  const api = client();
  await api("POST", "/api/auth/login", { username: "legacy", password: "legacy-password" });
  assert.strictEqual((await api("DELETE", "/api/auth/logout")).status, 200);
  assert.strictEqual((await api("GET", "/api/auth/me")).status, 401);
});

test("session cookies are httpOnly and SameSite=Lax", async () => {
  const res = await client()("POST", "/api/auth/login", { username: "legacy", password: "legacy-password" });
  const cookies = res.headers.getSetCookie();
  assert.ok(cookies.length > 0);
  for (const c of cookies) {
    assert.match(c, /httponly/i);
    assert.match(c, /samesite=lax/i);
  }
});

test("unknown API routes return JSON 404", async () => {
  const res = await client()("GET", "/api/nope");
  assert.strictEqual(res.status, 404);
  assert.deepStrictEqual(res.data, { message: "Not found" });
});

// ---------- Editing a task ----------

const signedInWithTasks = async (username, titles) => {
  const api = client();
  await api("POST", "/api/auth/register", { username, password: `${username}-pass` });
  const ids = [];
  for (const title of titles) ids.push((await api("POST", "/api/tasks", { title })).data.task_id);
  return { api, ids };
};

test("edit: updating a title saves it and returns the task in the API shape", async () => {
  const { api, ids } = await signedInWithTasks("editor1", ["Draft"]);
  const res = await api("PATCH", `/api/tasks/${ids[0]}`, { title: "Final draft" });
  assert.strictEqual(res.status, 200);
  assert.deepStrictEqual(Object.keys(res.data).sort(), ["due_date", "is_complete", "task_id", "title", "user_id"]);
  assert.strictEqual(res.data.task_id, ids[0]);
  assert.strictEqual(res.data.title, "Final draft");

  // Persists: a fresh read (as after a page refresh) shows the new title
  const list = await api("GET", "/api/tasks");
  assert.strictEqual(list.data.find((t) => t.task_id === ids[0]).title, "Final draft");
});

test("edit: only the task with the given id changes", async () => {
  const { api, ids } = await signedInWithTasks("editor2", ["One", "Two", "Three"]);
  await api("PATCH", `/api/tasks/${ids[1]}`, { title: "Two (edited)" });
  const titles = Object.fromEntries((await api("GET", "/api/tasks")).data.map((t) => [t.task_id, t.title]));
  assert.deepStrictEqual(titles, { [ids[0]]: "One", [ids[1]]: "Two (edited)", [ids[2]]: "Three" });
});

test("edit: the form's extra fields (description, priority) are accepted and don't break the save", async () => {
  const { api, ids } = await signedInWithTasks("editor3", ["Task"]);
  const res = await api("PATCH", `/api/tasks/${ids[0]}`, { title: "Task v2", description: "notes", priority: "high" });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.data.title, "Task v2");
});

test("edit: another user's task is rejected and left unchanged", async () => {
  const owner = await signedInWithTasks("owner4", ["Mine"]);
  const intruder = await signedInWithTasks("intruder4", []);
  const res = await intruder.api("PATCH", `/api/tasks/${owner.ids[0]}`, { title: "Stolen" });
  assert.strictEqual(res.status, 403);
  const mine = (await owner.api("GET", "/api/tasks")).data;
  assert.strictEqual(mine[0].title, "Mine");
});

test("edit: a nonexistent task id is 404", async () => {
  const { api } = await signedInWithTasks("editor5", []);
  assert.strictEqual((await api("PATCH", "/api/tasks/987654", { title: "x" })).status, 404);
});

test("edit: an empty title is rejected and the old title kept", async () => {
  const { api, ids } = await signedInWithTasks("editor6", ["Keep me"]);
  assert.strictEqual((await api("PATCH", `/api/tasks/${ids[0]}`, { title: "   " })).status, 400);
  assert.strictEqual((await api("GET", "/api/tasks")).data[0].title, "Keep me");
});

test("edit: unauthenticated updates are rejected and change nothing", async () => {
  const { api, ids } = await signedInWithTasks("editor7", ["Untouched"]);
  assert.strictEqual((await client()("PATCH", `/api/tasks/${ids[0]}`, { title: "Anon" })).status, 401);
  assert.strictEqual((await api("GET", "/api/tasks")).data[0].title, "Untouched");
});

test("edit: the UPDATE itself is limited to the owner's rows", async () => {
  const taskModel = require("./models/taskModel");
  const owner = await signedInWithTasks("owner8", ["Owned"]);
  const other = await signedInWithTasks("other8", []);
  const otherId = (await other.api("GET", "/api/auth/me")).data.user.user_id;
  assert.strictEqual(await taskModel.updateTask(owner.ids[0], otherId, { title: "Bypass" }), null);
  assert.strictEqual((await owner.api("GET", "/api/tasks")).data[0].title, "Owned");
});

test("edit: the UPDATE query is sent the new title as its first parameter", async () => {
  const pool = require("./db/pool");
  const { api, ids } = await signedInWithTasks("editor9", ["Before"]);
  const seen = [];
  const original = pool.query;
  pool.query = function (sql, params) {
    if (/^\s*UPDATE tasks/i.test(sql)) seen.push({ sql, params });
    return original.apply(this, arguments);
  };
  try {
    await api("PATCH", `/api/tasks/${ids[0]}`, { title: "After" });
  } finally {
    pool.query = original;
  }
  assert.strictEqual(seen.length, 1);
  // Only the field that was sent is written
  assert.match(seen[0].sql, /SET title = \$1\s/);
  assert.doesNotMatch(seen[0].sql, /is_complete =|due_date =/);
  assert.match(seen[0].sql, /WHERE id = \$2 AND user_id = \$3/);
  assert.strictEqual(seen[0].params[0], "After");
  assert.strictEqual(String(seen[0].params[1]), String(ids[0]));
});

test("edit: a request whose JSON body wasn't parsed is rejected, not silently ignored", async () => {
  const { api, ids } = await signedInWithTasks("editor10", ["Keep"]);
  // Sent as text/plain, so express.json() leaves the body unparsed
  const res = await fetch(`${base}/api/tasks/${ids[0]}`, {
    method: "PATCH",
    headers: { "Content-Type": "text/plain", Cookie: (await api("GET", "/api/auth/me")).cookieHeader || "" },
    body: JSON.stringify({ title: "Lost" }),
  });
  assert.strictEqual(res.status, 400);
  assert.match((await res.json()).error, /No changes were received/);
  assert.strictEqual((await api("GET", "/api/tasks")).data[0].title, "Keep");
});

test("edit: an empty update is rejected with a clear message and changes nothing", async () => {
  const { api, ids } = await signedInWithTasks("editor11", ["Keep too"]);
  const res = await api("PATCH", `/api/tasks/${ids[0]}`, {});
  assert.strictEqual(res.status, 400);
  assert.match(res.data.error, /No changes were received/);
  assert.strictEqual((await api("GET", "/api/tasks")).data[0].title, "Keep too");
});

// ---------- Input rules ----------

test("registration rejects short passwords and invalid usernames with clear messages", async () => {
  const short = await client()("POST", "/api/auth/register", { username: "shorty", password: "1234567" });
  assert.strictEqual(short.status, 400);
  assert.match(short.data.error, /at least 8 characters/);

  for (const username of ["ab", "has space", "way-too-long-username-over-thirty", "emoji😀"]) {
    const res = await client()("POST", "/api/auth/register", { username, password: "long-enough-1" });
    assert.strictEqual(res.status, 400, username);
    assert.match(res.data.error, /3 to 30 characters/);
  }

  const tooLong = await client()("POST", "/api/auth/register", { username: "longpass", password: "x".repeat(73) });
  assert.strictEqual(tooLong.status, 400);
});

test("registration trims the username and treats capitalisation as the same name", async () => {
  const api = client();
  const res = await api("POST", "/api/auth/register", { username: "  Casey  ", password: "casey-pass-1" });
  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.data.user.username, "Casey");

  const dup = await client()("POST", "/api/auth/register", { username: "casey", password: "casey-pass-2" });
  assert.strictEqual(dup.status, 400);
  assert.match(dup.data.error, /already taken/);
});

test("an existing account with an older-style username can still log in", async () => {
  const hash = await bcrypt.hash("legacy-password", 4);
  db.public.none(`INSERT INTO users (username, password_hash) VALUES ('old name!', '${hash}')`);
  const res = await client()("POST", "/api/auth/login", { username: "old name!", password: "legacy-password" });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.data.user.username, "old name!");
});

test("task titles are limited to 200 characters on create and edit", async () => {
  const api = client();
  await api("POST", "/api/auth/register", { username: "titles", password: "titles-pass" });

  assert.strictEqual((await api("POST", "/api/tasks", { title: "x".repeat(201) })).status, 400);
  const ok = await api("POST", "/api/tasks", { title: "y".repeat(200) });
  assert.strictEqual(ok.status, 201);

  const edit = await api("PATCH", `/api/tasks/${ok.data.task_id}`, { title: "z".repeat(201) });
  assert.strictEqual(edit.status, 400);
  assert.match(edit.data.error, /at most 200 characters/);
});

// ---------- Due dates ----------

test("due dates: set on create, returned as YYYY-MM-DD, changed, kept on title edits, and cleared", async () => {
  const api = client();
  await api("POST", "/api/auth/register", { username: "dates", password: "dates-pass" });

  const created = await api("POST", "/api/tasks", { title: "Pay rent", due_date: "2026-12-01" });
  assert.strictEqual(created.status, 201);
  assert.strictEqual(created.data.due_date, "2026-12-01");
  const id = created.data.task_id;

  assert.strictEqual((await api("PATCH", `/api/tasks/${id}`, { due_date: "2026-12-15" })).data.due_date, "2026-12-15");

  const renamed = await api("PATCH", `/api/tasks/${id}`, { title: "Pay December rent" });
  assert.strictEqual(renamed.data.due_date, "2026-12-15", "a title edit leaves the date alone");

  const cleared = await api("PATCH", `/api/tasks/${id}`, { due_date: null });
  assert.strictEqual(cleared.data.due_date, null);

  const listed = (await api("GET", "/api/tasks")).data.find((t) => t.task_id === id);
  assert.deepStrictEqual([listed.title, listed.due_date], ["Pay December rent", null]);
});

test("due dates: tasks without one return null, and invalid dates are rejected", async () => {
  const api = client();
  await api("POST", "/api/auth/register", { username: "baddates", password: "baddates-pass" });

  const plain = await api("POST", "/api/tasks", { title: "No date" });
  assert.strictEqual(plain.data.due_date, null);
  assert.strictEqual((await api("POST", "/api/tasks", { title: "Empty", due_date: "" })).data.due_date, null);

  for (const due_date of ["2026-02-30", "12/01/2026", "tomorrow", 20261201]) {
    const res = await api("POST", "/api/tasks", { title: "Bad", due_date });
    assert.strictEqual(res.status, 400, String(due_date));
    assert.match(res.data.error, /YYYY-MM-DD/);
  }
  assert.strictEqual((await api("PATCH", `/api/tasks/${plain.data.task_id}`, { due_date: "2026-13-01" })).status, 400);
});

test("is_complete must be a boolean", async () => {
  const { api, ids } = await signedInWithTasks("boolcheck", ["Task"]);
  assert.strictEqual((await api("PATCH", `/api/tasks/${ids[0]}`, { is_complete: "yes" })).status, 400);
  assert.strictEqual((await api("PATCH", `/api/tasks/${ids[0]}`, { is_complete: true })).data.is_complete, true);
});

// ---------- Account: change username and password ----------

test("account: change username; the new name logs in and the old one doesn't", async () => {
  const api = client();
  await api("POST", "/api/auth/register", { username: "renamer", password: "renamer-pass" });

  const res = await api("PATCH", "/api/users/me", { username: "  renamed.user  " });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.data.user.username, "renamed.user");
  assert.strictEqual((await api("GET", "/api/auth/me")).data.user.username, "renamed.user", "same session, new name");

  assert.strictEqual((await client()("POST", "/api/auth/login", { username: "renamed.user", password: "renamer-pass" })).status, 200);
  assert.strictEqual((await client()("POST", "/api/auth/login", { username: "renamer", password: "renamer-pass" })).status, 401);
});

test("account: username rules apply, names taken by others are refused, your own capitalisation can change", async () => {
  await client()("POST", "/api/auth/register", { username: "TakenName", password: "taken-pass-1" });
  const api = client();
  await api("POST", "/api/auth/register", { username: "chooser", password: "chooser-pass" });

  for (const username of ["ab", "has space", "", 42]) {
    const res = await api("PATCH", "/api/users/me", { username });
    assert.strictEqual(res.status, 400, String(username));
  }
  const taken = await api("PATCH", "/api/users/me", { username: "takenname" });
  assert.strictEqual(taken.status, 400);
  assert.match(taken.data.error, /already taken/);

  const recased = await api("PATCH", "/api/users/me", { username: "Chooser" });
  assert.strictEqual(recased.status, 200);
  assert.strictEqual(recased.data.user.username, "Chooser");
});

test("account: change password; the new password logs in and the old one doesn't", async () => {
  const api = client();
  await api("POST", "/api/auth/register", { username: "pwchanger", password: "old-password-1" });

  const res = await api("POST", "/api/users/me/password", { currentPassword: "old-password-1", newPassword: "new-password-2" });
  assert.strictEqual(res.status, 200);
  assert.deepStrictEqual(res.data, { message: "Password updated." });

  assert.strictEqual((await client()("POST", "/api/auth/login", { username: "pwchanger", password: "new-password-2" })).status, 200);
  assert.strictEqual((await client()("POST", "/api/auth/login", { username: "pwchanger", password: "old-password-1" })).status, 401);
});

test("account: a wrong current password or a weak new one is refused and changes nothing", async () => {
  const api = client();
  await api("POST", "/api/auth/register", { username: "pwkeeper", password: "keep-password-1" });

  const wrong = await api("POST", "/api/users/me/password", { currentPassword: "not-it", newPassword: "another-pass-9" });
  assert.strictEqual(wrong.status, 400);
  assert.match(wrong.data.error, /current password is incorrect/);

  const weak = await api("POST", "/api/users/me/password", { currentPassword: "keep-password-1", newPassword: "short" });
  assert.strictEqual(weak.status, 400);
  assert.match(weak.data.error, /at least 8 characters/);

  const missing = await api("POST", "/api/users/me/password", { newPassword: "another-pass-9" });
  assert.strictEqual(missing.status, 400);

  assert.strictEqual((await client()("POST", "/api/auth/login", { username: "pwkeeper", password: "keep-password-1" })).status, 200);
});

test("account: both routes require a session", async () => {
  const anon = client();
  assert.strictEqual((await anon("PATCH", "/api/users/me", { username: "ghosty" })).status, 401);
  assert.strictEqual((await anon("POST", "/api/users/me/password", { currentPassword: "a", newPassword: "bbbbbbbbb" })).status, 401);
});

test("account: a server error during a password change never logs the passwords", async () => {
  const userModel = require("./models/userModel");
  const api = client();
  await api("POST", "/api/auth/register", { username: "logcheck", password: "log-check-pass" });

  const original = userModel.checkPassword;
  const logged = [];
  const originalError = console.error;
  userModel.checkPassword = async (id, password) => {
    throw new Error(`database exploded while checking ${password}`);
  };
  console.error = (...args) => logged.push(args.join(" "));
  try {
    const res = await api("POST", "/api/users/me/password", { currentPassword: "log-check-pass", newPassword: "secret-new-pass" });
    assert.strictEqual(res.status, 500);
  } finally {
    userModel.checkPassword = original;
    console.error = originalError;
  }
  assert.ok(logged.length > 0, "the error was logged");
  for (const line of logged) {
    assert.ok(!line.includes("log-check-pass") && !line.includes("secret-new-pass"), line);
  }
});

// ---------- Phase 1: sign-in, sessions and request errors ----------

test("sign-in works with another capitalisation or surrounding spaces", async () => {
  await client()("POST", "/api/auth/register", { username: "MixedCase", password: "mixed-pass-1" });
  for (const typed of ["mixedcase", "MIXEDCASE", " MixedCase  "]) {
    const res = await client()("POST", "/api/auth/login", { username: typed, password: "mixed-pass-1" });
    assert.strictEqual(res.status, 200, typed);
    assert.strictEqual(res.data.user.username, "MixedCase");
  }
  const wrong = await client()("POST", "/api/auth/login", { username: "mixedcase", password: "Mixed-pass-1" });
  assert.strictEqual(wrong.status, 401);
});

test("a body that isn't valid JSON is a 400 with a clear message, not a logged server error", async () => {
  const logged = [];
  const quiet = console.error;
  console.error = (...args) => logged.push(args.join(" "));
  let res;
  try {
    res = await fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: '{"username":',
    });
  } finally {
    console.error = quiet;
  }
  assert.strictEqual(res.status, 400);
  assert.deepStrictEqual(await res.json(), { error: "The request body must be valid JSON." });
  assert.ok(!logged.some((line) => line.includes("SERVER ERROR")), logged.join("\n"));
});

const sessionCookieExpiry = (res) => {
  const cookie = res.headers.getSetCookie().find((c) => c.startsWith("session="));
  const match = cookie && /expires=([^;]+)/i.exec(cookie);
  return match ? Date.parse(match[1]) : null;
};

test("activity keeps a session alive: the 24-hour limit counts from the last request", async () => {
  const api = client();
  await api("POST", "/api/auth/register", { username: "rolling", password: "rolling-pass" });

  // The first request records the minute; later ones within it send no new cookie
  await api("GET", "/api/auth/me");
  assert.strictEqual(sessionCookieExpiry(await api("GET", "/api/auth/me")), null);

  const realNow = Date.now;
  const later = realNow() + 3 * 60 * 60 * 1000; // three hours of use later
  mock.method(Date, "now", () => later);
  try {
    const res = await api("GET", "/api/tasks");
    assert.strictEqual(res.status, 200);
    const expires = sessionCookieExpiry(res);
    assert.ok(expires, "a refreshed cookie was sent");
    // Expires a day after this request (cookies carry whole seconds)
    assert.ok(Math.abs(expires - (later + 24 * 60 * 60 * 1000)) < 2000, new Date(expires).toISOString());
  } finally {
    mock.restoreAll();
  }
  assert.strictEqual((await api("GET", "/api/auth/me")).status, 200);
});

test("signed-out requests never get a session cookie", async () => {
  const res = await client()("GET", "/api/auth/me");
  assert.strictEqual(res.status, 401);
  assert.deepStrictEqual(res.headers.getSetCookie(), []);
});

test("a session whose account no longer exists is cleared", async () => {
  const api = client();
  const reg = await api("POST", "/api/auth/register", { username: "goner", password: "goner-pass" });
  db.public.none(`DELETE FROM users WHERE id = ${reg.data.user.user_id}`);

  const first = await api("GET", "/api/auth/me");
  assert.strictEqual(first.status, 401);
  assert.ok(first.headers.getSetCookie().some((c) => /^session=;/.test(c)), "the cookie is cleared");
  assert.deepStrictEqual((await api("GET", "/api/auth/me")).data, { error: "Not authenticated" });
});

test("existing user and task records are never modified", () => {
  assert.deepStrictEqual(snapshot(), snapshotBefore);
});
