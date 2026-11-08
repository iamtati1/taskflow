const { test, beforeEach } = require("node:test");
const assert = require("node:assert");
const bcrypt = require("bcrypt");

// A fake pool over an in-memory users table shaped like production:
// columns id, username, password_hash (no user_id column).
// Each query's columns are checked against that table, so referencing a
// missing column fails like Postgres does (42703).
const COLUMNS = ["id", "username", "password_hash"];
let rows;
let queries;
let failUpdates; // makes UPDATE queries throw, like a dropped connection

const missingColumn = (name) => Object.assign(new Error(`column "${name}" does not exist`), { code: "42703" });

const checkColumn = (name) => {
  if (!COLUMNS.includes(name)) throw missingColumn(name);
};

// "id AS user_id, username" -> [["id", "user_id"], ["username", "username"]]
const parseProjection = (list) =>
  list.split(",").map((part) => {
    const [column, alias] = part.trim().split(/\s+AS\s+/i);
    if (column === "*") return ["*", "*"];
    checkColumn(column);
    return [column, alias || column];
  });

const project = (row, projection) =>
  projection[0][0] === "*"
    ? { ...row }
    : Object.fromEntries(projection.map(([column, alias]) => [alias, row[column]]));

const fakePool = {
  query: async (sql, params) => {
    queries.push(sql);
    let m = sql.match(/^INSERT INTO users \((.+)\) VALUES \(\$1, \$2\) RETURNING (.+)$/i);
    if (m) {
      const insertColumns = m[1].split(",").map((c) => c.trim());
      insertColumns.forEach(checkColumn);
      const projection = parseProjection(m[2]);
      const row = { id: rows.length + 1 };
      insertColumns.forEach((c, i) => (row[c] = params[i]));
      rows.push(row);
      return { rows: [project(row, projection)] };
    }
    m = sql.match(/^UPDATE users SET password_hash = \$1 WHERE id = \$2 AND password_hash = \$3$/i);
    if (m) {
      if (failUpdates) throw new Error("connection lost");
      const row = rows.find((r) => r.id === params[1] && r.password_hash === params[2]);
      if (row) row.password_hash = params[0];
      return { rows: [], rowCount: row ? 1 : 0 };
    }
    m = sql.match(/^SELECT (.+) FROM users WHERE LOWER\((\w+)\) = LOWER\(\$1\)$/i);
    if (m) {
      const projection = parseProjection(m[1]);
      checkColumn(m[2]);
      const wanted = String(params[0]).toLowerCase();
      return { rows: rows.filter((r) => String(r[m[2]]).toLowerCase() === wanted).map((r) => project(r, projection)) };
    }
    m = sql.match(/^SELECT (.+) FROM users WHERE (\w+) = \$1$/i);
    if (m) {
      const projection = parseProjection(m[1]);
      checkColumn(m[2]);
      return { rows: rows.filter((r) => r[m[2]] === params[0]).map((r) => project(r, projection)) };
    }
    throw new Error(`unexpected query: ${sql}`);
  },
};

require.cache[require.resolve("../db/pool")] = { exports: fakePool };
const userModel = require("./userModel");

beforeEach(() => {
  rows = [];
  queries = [];
  failUpdates = false;
  process.env.BCRYPT_COST = "4";
});

const addExistingUser = async (username, password, cost = 4) => {
  rows.push({ id: rows.length + 1, username, password_hash: await bcrypt.hash(password, cost) });
  return rows.length;
};

test("create returns user_id from the id column, never the hash", async () => {
  const user = await userModel.create("newuser", "s3cret-pass");
  assert.deepStrictEqual(user, { user_id: 1, username: "newuser" });
  assert.notStrictEqual(rows[0].password_hash, "s3cret-pass");
});

test("findByUsername returns user_id for a taken username and null otherwise", async () => {
  const id = await addExistingUser("existing", "pw-1234");
  assert.deepStrictEqual(await userModel.findByUsername("existing"), { user_id: id, username: "existing" });
  assert.strictEqual(await userModel.findByUsername("nobody"), null);
});

test("findByUsername ignores capitalisation, so Jordan and jordan can't both register", async () => {
  const id = await addExistingUser("Jordan", "pw-12345678");
  assert.deepStrictEqual(await userModel.findByUsername("jordan"), { user_id: id, username: "Jordan" });
});

test("find looks a user up by id and returns user_id", async () => {
  await addExistingUser("first", "pw-1234");
  const id = await addExistingUser("second", "pw-5678");
  assert.deepStrictEqual(await userModel.find(id), { user_id: id, username: "second" });
  assert.strictEqual(await userModel.find(99), null);
});

test("validatePassword returns user_id for an existing user's correct password", async () => {
  const id = await addExistingUser("existing", "correct-horse");
  assert.deepStrictEqual(await userModel.validatePassword("existing", "correct-horse"), { user_id: id, username: "existing" });
});

test("validatePassword returns null for a wrong password or unknown user", async () => {
  await addExistingUser("existing", "correct-horse");
  assert.strictEqual(await userModel.validatePassword("existing", "wrong"), null);
  assert.strictEqual(await userModel.validatePassword("nobody", "correct-horse"), null);
});

test("registration flow: a new user can be found, logged in, and looked up by id", async () => {
  assert.strictEqual(await userModel.findByUsername("flow"), null);
  const created = await userModel.create("flow", "flow-pass");
  assert.deepStrictEqual(await userModel.validatePassword("flow", "flow-pass"), created);
  assert.deepStrictEqual(await userModel.find(created.user_id), created);
});

test("no query references a user_id column on users (only the alias)", async () => {
  await userModel.create("a", "pw-1234");
  await userModel.findByUsername("a");
  await userModel.find(1);
  await userModel.validatePassword("a", "pw-1234");
  for (const sql of queries) {
    assert(!/\buser_id\b/.test(sql.replace(/\bAS user_id\b/gi, "")), sql);
  }
});

test("the fake table rejects the old user_id column like Postgres (sanity check)", async () => {
  await assert.rejects(fakePool.query("SELECT user_id, username FROM users WHERE username = $1", ["x"]), { code: "42703" });
});

// ---------- Signing in with a different capitalisation or spaces ----------

test("sign-in accepts another capitalisation and surrounding spaces, as registration does", async () => {
  const id = await addExistingUser("Jordan", "correct-horse");
  for (const typed of ["Jordan", "jordan", "JORDAN", "  Jordan ", "jordan\t"]) {
    assert.deepStrictEqual(await userModel.validatePassword(typed, "correct-horse"), { user_id: id, username: "Jordan" }, JSON.stringify(typed));
  }
  assert.strictEqual(await userModel.validatePassword("jordan", "wrong"), null);
});

test("the password itself is not trimmed or case-folded", async () => {
  await addExistingUser("pat", "Secret-Pass ");
  assert.strictEqual(await userModel.validatePassword("pat", "Secret-Pass"), null);
  assert.strictEqual(await userModel.validatePassword("pat", "secret-pass "), null);
  assert.ok(await userModel.validatePassword("pat", "Secret-Pass "));
});

test("older accounts that differ only in capitalisation: the exact name signs in, an ambiguous one doesn't", async () => {
  // Possible for accounts created before registration ignored capitalisation
  const upper = await addExistingUser("Sam", "upper-pass");
  const lower = await addExistingUser("sam", "lower-pass");

  assert.deepStrictEqual(await userModel.validatePassword("Sam", "upper-pass"), { user_id: upper, username: "Sam" });
  assert.deepStrictEqual(await userModel.validatePassword("sam", "lower-pass"), { user_id: lower, username: "sam" });
  assert.strictEqual(await userModel.validatePassword("Sam", "lower-pass"), null, "never falls through to the other account");
  assert.strictEqual(await userModel.validatePassword("SAM", "upper-pass"), null, "ambiguous: neither account");
  assert.strictEqual(await userModel.validatePassword("SAM", "lower-pass"), null, "ambiguous: neither account");
});

test("an older account whose name has surrounding spaces still signs in with exactly that name", async () => {
  const id = await addExistingUser("  spaced", "spaced-pass");
  assert.deepStrictEqual(await userModel.validatePassword("  spaced", "spaced-pass"), { user_id: id, username: "  spaced" });
});

// ---------- Password hashing strength ----------

test("passwordCost is 12 by default and honours a valid BCRYPT_COST", () => {
  assert.strictEqual(userModel.passwordCost({}), 12);
  assert.strictEqual(userModel.passwordCost({ BCRYPT_COST: "10" }), 10);
  for (const bad of ["", "abc", "3", "16", "10.5"]) {
    assert.strictEqual(userModel.passwordCost({ BCRYPT_COST: bad }), 12, bad);
  }
});

test("new passwords are hashed at the configured cost", async () => {
  process.env.BCRYPT_COST = "5";
  await userModel.create("costly", "costly-pass");
  assert.strictEqual(bcrypt.getRounds(rows[0].password_hash), 5);
});

test("a successful sign-in upgrades an older, weaker hash; the password keeps working", async () => {
  await addExistingUser("legacy", "legacy-pass", 4);
  process.env.BCRYPT_COST = "6";

  assert.ok(await userModel.validatePassword("legacy", "legacy-pass"));
  assert.strictEqual(bcrypt.getRounds(rows[0].password_hash), 6);
  assert.ok(await userModel.validatePassword("legacy", "legacy-pass"));
});

test("a failed sign-in, or a hash that is already strong enough, is left alone", async () => {
  await addExistingUser("weak", "weak-pass", 4);
  await addExistingUser("strong", "strong-pass", 5);
  process.env.BCRYPT_COST = "5";
  const [weakHash, strongHash] = rows.map((r) => r.password_hash);

  assert.strictEqual(await userModel.validatePassword("weak", "wrong-pass"), null);
  assert.ok(await userModel.validatePassword("strong", "strong-pass"));

  assert.deepStrictEqual(rows.map((r) => r.password_hash), [weakHash, strongHash]);
  assert.ok(!queries.some((q) => /^UPDATE/i.test(q)));
});

test("if upgrading the hash fails, the sign-in still succeeds", async () => {
  await addExistingUser("flaky", "flaky-pass", 4);
  process.env.BCRYPT_COST = "6";
  failUpdates = true;
  const quiet = console.error;
  console.error = () => {};
  try {
    assert.ok(await userModel.validatePassword("flaky", "flaky-pass"));
  } finally {
    console.error = quiet;
  }
  assert.strictEqual(bcrypt.getRounds(rows[0].password_hash), 4);
});
