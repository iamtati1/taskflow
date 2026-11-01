const { test } = require("node:test");
const assert = require("node:assert");

const sessionKeys = require("./sessionKeys");

const REAL = "4f3c9e1b7a2d8c6e0f5a3b9d1c7e2a8f";

test("production uses SESSION_SECRET", () => {
  assert.deepStrictEqual(sessionKeys({ NODE_ENV: "production", SESSION_SECRET: REAL }), [REAL]);
});

test("production refuses a missing or blank SESSION_SECRET", () => {
  for (const env of [{ NODE_ENV: "production" }, { NODE_ENV: "production", SESSION_SECRET: "   " }]) {
    assert.throws(() => sessionKeys(env), /SESSION_SECRET must be set in production/);
  }
});

test("production refuses the public fallback and the template placeholder", () => {
  for (const value of ["dev-fallback-secret", "your-random-secret-here", " your-random-secret-here "]) {
    assert.throws(() => sessionKeys({ NODE_ENV: "production", SESSION_SECRET: value }), /public placeholder/);
  }
});

test("the startup error never echoes the secret value", () => {
  try {
    sessionKeys({ NODE_ENV: "production", SESSION_SECRET: "your-random-secret-here" });
  } catch (err) {
    assert(!err.message.includes("your-random-secret-here"), err.message);
  }
});

test("development keeps working with or without a secret", () => {
  assert.deepStrictEqual(sessionKeys({ NODE_ENV: "development" }), ["dev-fallback-secret"]);
  assert.deepStrictEqual(sessionKeys({}), ["dev-fallback-secret"]);
  assert.deepStrictEqual(sessionKeys({ NODE_ENV: "development", SESSION_SECRET: REAL }), [REAL]);
});

test("index.js takes its cookie keys from sessionKeys, not an inline fallback", () => {
  const source = require("fs").readFileSync(require.resolve("../index.js"), "utf8");
  assert.match(source, /keys:\s*sessionKeys\(\)/);
  assert(!/SESSION_SECRET\s*\|\|/.test(source), "index.js still has an inline SESSION_SECRET fallback");
});
