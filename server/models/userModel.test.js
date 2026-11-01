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
});

const addExistingUser = async (username, password) => {
  rows.push({ id: rows.length + 1, username, password_hash: await bcrypt.hash(password, 4) });
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
