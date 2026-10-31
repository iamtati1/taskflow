const { test } = require("node:test");
const assert = require("node:assert");

const runStartupMigration = require("./startup");

const SECRET_URL = "postgresql://taskflow_user:s3cretPa55@dpg-abc123-a.ohio-postgres.render.com/taskflow_db";
const SECRETS = ["taskflow_user", "s3cretPa55", "dpg-abc123", "render.com", "taskflow_db"];

// Runs startup with DATABASE_URL set and console captured; returns everything logged
const run = async (options) => {
  const original = { log: console.log, error: console.error, url: process.env.DATABASE_URL };
  const lines = [];
  console.log = console.error = (...args) => lines.push(args.map(String).join(" "));
  process.env.DATABASE_URL = SECRET_URL;
  try {
    await runStartupMigration(options);
  } finally {
    console.log = original.log;
    console.error = original.error;
    if (original.url === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = original.url;
  }
  return lines.join("\n");
};

test("a failed migration is logged without connection details and diagnosed once", async () => {
  let diagnosed = 0;
  const out = await run({
    migrate: () => Promise.reject(Object.assign(new Error('password authentication failed for user "taskflow_user"'), { code: "28P01" })),
    diagnose: () => (diagnosed += 1),
  });
  for (const secret of SECRETS) assert(!out.includes(secret), `leaked ${secret}: ${out}`);
  assert.match(out, /Migration skipped\/failed: .*"category":"authentication_failed".*"code":"28P01"/);
  assert.strictEqual(diagnosed, 1);
});

test("a successful migration skips the diagnostic", async () => {
  let diagnosed = 0;
  const out = await run({ migrate: () => Promise.resolve(), diagnose: () => (diagnosed += 1) });
  assert.match(out, /DB migration complete/);
  assert.strictEqual(diagnosed, 0);
});

test("startup resolves even when migrate and the diagnostic both throw", async () => {
  await assert.doesNotReject(
    run({
      migrate: () => {
        throw new Error(`bad ${SECRET_URL}`);
      },
      diagnose: () => {
        throw new Error("diagnostic exploded");
      },
    })
  );
  const out = await run({ migrate: () => Promise.reject(new Error(SECRET_URL)), diagnose: () => Promise.reject(new Error("x")) });
  for (const secret of SECRETS) assert(!out.includes(secret), `leaked ${secret}: ${out}`);
});
