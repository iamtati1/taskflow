const { test } = require("node:test");
const assert = require("node:assert");

const { sanitizeMessage, describeError, logError } = require("./safeError");

// A non-Render host, so redaction can't rely on the dpg- pattern
const URL_PARTS = { user: "taskflow_user", password: "s3cret%40Pa55", host: "ep-quiet-sky-123.us-east-2.aws.neon.tech", db: "taskflow_db" };
const SECRET_URL = `postgresql://${URL_PARTS.user}:${URL_PARTS.password}@${URL_PARTS.host}:5432/${URL_PARTS.db}`;
const SECRETS = ["taskflow_user", "s3cret", "Pa55", "ep-quiet-sky", "neon.tech", "taskflow_db", "postgresql://", "18.118.220.241"];

const assertNoSecrets = (text) => {
  for (const secret of SECRETS) assert(!text.includes(secret), `leaked ${secret}: ${text}`);
};

const withDatabaseUrl = (value, fn) => {
  const original = process.env.DATABASE_URL;
  process.env.DATABASE_URL = value;
  try {
    return fn();
  } finally {
    if (original === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = original;
  }
};

const captureConsoleError = (fn) => {
  const original = console.error;
  const lines = [];
  console.error = (...args) => lines.push(args.join(" "));
  try {
    fn();
  } finally {
    console.error = original;
  }
  return lines.join("\n");
};

const pgError = (message, fields = {}) => Object.assign(new Error(message), fields);

// Errors shaped like the ones pg, Node and the app actually throw
const LEAKY_ERRORS = [
  pgError('password authentication failed for user "taskflow_user"', { code: "28P01", severity: "FATAL" }),
  pgError("getaddrinfo ENOTFOUND ep-quiet-sky-123.us-east-2.aws.neon.tech", { code: "ENOTFOUND" }),
  pgError("connect ECONNREFUSED 18.118.220.241:5432", { code: "ECONNREFUSED" }),
  pgError('database "taskflow_db" does not exist', { code: "3D000" }),
  pgError("no pg_hba.conf entry for host 74.220.50.7, user taskflow_user, database taskflow_db, SSL off", { code: "28000" }),
  pgError(`invalid connection string ${SECRET_URL}`),
  pgError("could not connect with password=s3cret@Pa55"),
  pgError("role taskflow_user is not permitted to log in", { code: "28000" }),
  pgError('duplicate key value violates unique constraint "users_username_key"', {
    code: "23505",
    detail: "Key (username)=(taskflow_user) already exists.",
  }),
  // The raw, unparsed username/password also appear decoded in some messages
  pgError("authentication failed for s3cret@Pa55"),
  Object.assign(new AggregateError([pgError("connect ECONNREFUSED 18.118.220.241:5432", { code: "ECONNREFUSED" })], ""), {}),
];

test("sanitizeMessage removes every part of the configured DATABASE_URL, any host", () =>
  withDatabaseUrl(SECRET_URL, () => {
    for (const err of LEAKY_ERRORS) assertNoSecrets(sanitizeMessage(err.message));
  }));

test("sanitizeMessage removes credentials even when DATABASE_URL is not set", () =>
  withDatabaseUrl(undefined, () => {
    for (const err of LEAKY_ERRORS.filter((e) => !e.message.includes("s3cret@"))) {
      assertNoSecrets(sanitizeMessage(err.message));
    }
  }));

test("sanitizeMessage keeps ordinary application messages readable", () =>
  withDatabaseUrl(SECRET_URL, () => {
    assert.strictEqual(sanitizeMessage("Connection terminated unexpectedly"), "Connection terminated unexpectedly");
    assert.strictEqual(sanitizeMessage("Cannot read properties of undefined (reading 'user_id')"), "Cannot read properties of undefined (reading 'user_id')");
    assert.match(sanitizeMessage('password authentication failed for user "x"'), /^password authentication failed for user/);
  }));

test("describeError keeps category, code and severity but never detail, hint or the raw message", () =>
  withDatabaseUrl(SECRET_URL, () => {
    const summary = describeError(LEAKY_ERRORS[0]);
    assert.strictEqual(summary.category, "authentication_failed");
    assert.strictEqual(summary.code, "28P01");
    assert.strictEqual(summary.severity, "FATAL");
    assert.deepStrictEqual(Object.keys(summary).sort(), ["at", "category", "code", "message", "name", "severity"]);

    const duplicate = describeError(LEAKY_ERRORS[8]);
    assert.strictEqual(duplicate.category, "unique_violation");
    assertNoSecrets(JSON.stringify(duplicate));
  }));

test("describeError reads the code inside an AggregateError", () => {
  const summary = describeError(LEAKY_ERRORS.at(-1));
  assert.strictEqual(summary.code, "ECONNREFUSED");
  assert.strictEqual(summary.category, "connection_refused");
  assertNoSecrets(JSON.stringify(summary));
});

test("describeError keeps where an application error was thrown", () => {
  const summary = describeError(new TypeError("Cannot read properties of undefined (reading 'user_id')"));
  assert.strictEqual(summary.name, "TypeError");
  assert.match(summary.at[0], /safeError\.test\.js:\d+/);
});

test("describeError handles thrown non-errors", () => {
  assert.deepStrictEqual(describeError(null), { category: "unknown", message: "null" });
  withDatabaseUrl(SECRET_URL, () => assertNoSecrets(JSON.stringify(describeError(SECRET_URL))));
});

test("logError writes one sanitized line for every leaky error and never throws", () =>
  withDatabaseUrl(SECRET_URL, () => {
    const out = captureConsoleError(() => {
      for (const err of LEAKY_ERRORS) logError("REGISTER ERROR:", err);
      const hostile = { get message() { throw new Error(SECRET_URL); } };
      logError("REGISTER ERROR:", hostile);
    });
    assertNoSecrets(out);
    assert.strictEqual(out.split("\n").length, LEAKY_ERRORS.length + 1);
  }));

// Runs fn with the given PG* variables set and DATABASE_URL unset (the local fallback)
const withPgEnv = (vars, fn) => {
  const keys = ["DATABASE_URL", ...Object.keys(vars)];
  const original = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
  delete process.env.DATABASE_URL;
  Object.assign(process.env, vars);
  try {
    return fn();
  } finally {
    for (const k of keys) {
      if (original[k] === undefined) delete process.env[k];
      else process.env[k] = original[k];
    }
  }
};

test("sanitizeMessage removes PG* values when pg connects without DATABASE_URL", () =>
  withPgEnv({ PGUSER: "alice_admin", PGPASSWORD: "Zx9longsecretPw", PGHOST: "db.internal-corp", PGDATABASE: "payroll_db" }, () => {
    const out = [
      "connect failed as alice_admin to payroll_db",
      "auth failed using Zx9longsecretPw",
      "getaddrinfo ENOTFOUND db.internal-corp",
    ]
      .map((m) => JSON.stringify(describeError(new Error(m))))
      .join("\n");
    for (const secret of ["alice_admin", "Zx9longsecretPw", "db.internal-corp", "payroll_db"]) {
      assert(!out.includes(secret), `leaked ${secret}: ${out}`);
    }
  }));

test("sanitizeMessage removes every query parameter value", () => {
  const out = sanitizeMessage("GET /api/tasks?token=abc123&page=2&password=hunter2 failed");
  for (const secret of ["abc123", "hunter2"]) assert(!out.includes(secret), out);
  assert.match(out, /\?token=<redacted>&page=<redacted>&password=<redacted> failed$/);
});
