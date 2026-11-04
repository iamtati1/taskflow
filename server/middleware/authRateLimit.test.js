const { test } = require("node:test");
const assert = require("node:assert");
const express = require("express");

const { createAuthLimiter } = require("./authRateLimit");

const withApp = async (limit, fn) => {
  const app = express();
  app.post("/login", createAuthLimiter({ limit }), (req, res) => res.json({ ok: true }));
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  try {
    await fn(`http://127.0.0.1:${server.address().port}`);
  } finally {
    server.close();
  }
};

test("attempts beyond the limit get 429 with a friendly message", async () => {
  await withApp(2, async (base) => {
    assert.strictEqual((await fetch(`${base}/login`, { method: "POST" })).status, 200);
    assert.strictEqual((await fetch(`${base}/login`, { method: "POST" })).status, 200);
    const third = await fetch(`${base}/login`, { method: "POST" });
    assert.strictEqual(third.status, 429);
    assert.match((await third.json()).error, /Too many attempts/);
    assert.ok(third.headers.get("retry-after"));
  });
});

test("the default allows 20 attempts per window", async () => {
  delete process.env.AUTH_RATE_LIMIT;
  await withApp(undefined, async (base) => {
    let last;
    for (let i = 0; i < 21; i++) last = await fetch(`${base}/login`, { method: "POST" });
    assert.strictEqual(last.status, 429);
  });
});
