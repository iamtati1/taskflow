const { test } = require("node:test");
const assert = require("node:assert");

// Replace the user model before the controller loads, so no pool or database is touched
const userModelPath = require.resolve("../models/userModel");
const userModel = {};
require.cache[userModelPath] = { id: userModelPath, filename: userModelPath, loaded: true, exports: userModel };
const authControllers = require("./authControllers");

const SECRET_URL = "postgresql://taskflow_user:s3cretPa55@dpg-abc123-a.ohio-postgres.render.com/taskflow_db";
const SECRETS = ["taskflow_user", "s3cretPa55", "dpg-abc123", "render.com", "taskflow_db", "74.220"];

const assertNoSecrets = (text) => {
  for (const secret of SECRETS) assert(!text.includes(secret), `leaked ${secret}: ${text}`);
};

const pgError = (message, fields = {}) => Object.assign(new Error(message), fields);

// The production failure, plus the errors most likely to carry connection details
const DB_ERRORS = [
  pgError("Connection terminated unexpectedly"),
  pgError('password authentication failed for user "taskflow_user"', { code: "28P01", severity: "FATAL" }),
  pgError("getaddrinfo ENOTFOUND dpg-abc123-a.ohio-postgres.render.com", { code: "ENOTFOUND" }),
  pgError("no pg_hba.conf entry for host 74.220.50.7, user taskflow_user, database taskflow_db", { code: "28000" }),
  pgError(`connect failed: ${SECRET_URL}`, { detail: SECRET_URL, hint: "check user taskflow_user" }),
];

const fakeRes = () => {
  const res = { statusCode: 200, body: undefined };
  res.status = (code) => ((res.statusCode = code), res);
  res.json = (body) => ((res.body = body), res);
  return res;
};

// Calls a controller with the model rejecting `err`; returns the response and stderr
const callWithFailure = async (handler, modelMethod, err) => {
  userModel[modelMethod] = () => Promise.reject(err);
  const originalUrl = process.env.DATABASE_URL;
  const originalError = console.error;
  const lines = [];
  process.env.DATABASE_URL = SECRET_URL;
  console.error = (...args) => lines.push(args.map(String).join(" "));
  const res = fakeRes();
  try {
    await handler({ body: { username: "new_person", password: "hunter2-user-password" }, session: {} }, res, () => {});
  } finally {
    console.error = originalError;
    if (originalUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalUrl;
  }
  return { res, out: lines.join("\n") };
};

for (const [label, handler, method, message] of [
  ["REGISTER", authControllers.register, "findByUsername", "Registration failed. Please try again."],
  ["LOGIN", authControllers.login, "validatePassword", "Login failed. Please try again."],
]) {
  test(`${label} ERROR logs never contain connection details`, async () => {
    for (const err of DB_ERRORS) {
      const { res, out } = await callWithFailure(handler, method, err);
      assertNoSecrets(out);
      assert(!out.includes("hunter2"), "logged the request password");
      assert(out.startsWith(`${label} ERROR:`), out);
      assert.strictEqual(res.statusCode, 500);
      assert.deepStrictEqual(res.body, { error: message });
    }
  });

  test(`${label} ERROR keeps the category and code`, async () => {
    const { out } = await callWithFailure(handler, method, DB_ERRORS[1]);
    assert.match(out, /"category":"authentication_failed"/);
    assert.match(out, /"code":"28P01"/);
    const { out: terminated } = await callWithFailure(handler, method, DB_ERRORS[0]);
    assert.match(terminated, /"category":"connection_terminated".*"message":"Connection terminated unexpectedly"/);
  });
}
