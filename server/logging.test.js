// Guards every server log call: no request bodies, passwords, secrets,
// connection strings or raw error objects. Scans the source so a new
// console call that bypasses utils/safeError fails the suite.
const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");

const SKIP_DIRS = new Set(["node_modules", "public"]);

const sourceFiles = (dir = __dirname) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return SKIP_DIRS.has(entry.name) ? [] : sourceFiles(full);
    return entry.name.endsWith(".js") && !entry.name.endsWith(".test.js") ? [full] : [];
  });

// Every console call with its arguments, including calls that span lines
const consoleCalls = (file) => {
  const source = fs.readFileSync(file, "utf8");
  const calls = [];
  const pattern = /console\.(log|error|warn|info|debug|dir)\s*\(/g;
  let match;
  while ((match = pattern.exec(source))) {
    let depth = 1;
    let i = pattern.lastIndex;
    while (i < source.length && depth > 0) {
      if (source[i] === "(") depth += 1;
      if (source[i] === ")") depth -= 1;
      i += 1;
    }
    const line = source.slice(0, match.index).split("\n").length;
    calls.push({ where: `${path.relative(__dirname, file)}:${line}`, method: match[1], text: source.slice(match.index, i) });
  }
  return calls;
};

const ALL_CALLS = sourceFiles().flatMap(consoleCalls);

test("the scan sees the server's log calls", () => {
  assert(ALL_CALLS.length > 10, `only found ${ALL_CALLS.length} console calls`);
  assert(ALL_CALLS.some((c) => c.where.startsWith("utils/safeError.js")));
});

test("no log call prints a request body, query, headers or cookies", () => {
  const bad = ALL_CALLS.filter((c) => /req\.(body|query|headers|cookies|session)\b/.test(c.text));
  assert.deepStrictEqual(bad.map((c) => c.where), []);
});

test("no log call prints a password, secret or connection string", () => {
  const bad = ALL_CALLS.filter(
    (c) =>
      /\bpassword\b|password_hash|SESSION_SECRET|connectionString/i.test(c.text) ||
      // A boolean presence check (!!process.env.DATABASE_URL) is the only allowed use
      /(?<!!!)process\.env\.DATABASE_URL/.test(c.text)
  );
  assert.deepStrictEqual(bad.map((c) => c.where), []);
});

test("no log call prints a raw error object; errors go through logError", () => {
  const bad = ALL_CALLS.filter(
    (c) =>
      c.method === "dir" ||
      /[(,]\s*(err|error|e)\s*\)$/.test(c.text) ||
      /\b(err|error|e)\.(stack|message)\b/.test(c.text) ||
      // Interpolated or stringified errors print the raw message too
      /\$\{\s*(err|error|e)\s*\}|\b(err|error|e)\.toString\(/.test(c.text)
  )
    .filter((c) => !c.where.startsWith("utils/safeError.js"))
    // Messages already passed through the sanitizer are safe
    .filter((c) => !/sanitizeMessage\(\s*(err|error|e)\b/.test(c.text));
  assert.deepStrictEqual(bad.map((c) => c.where), []);
});

test("the route logger prints the path without the query string", () => {
  const logRoutes = require("./middleware/logRoutes");
  const original = console.log;
  const lines = [];
  console.log = (...args) => lines.push(args.join(" "));
  try {
    logRoutes({ method: "POST", originalUrl: "/api/auth/login?password=hunter2&token=abc" }, {}, () => {});
  } finally {
    console.log = original;
  }
  assert.match(lines[0], /^POST: \/api\/auth\/login - /);
  assert(!lines[0].includes("hunter2") && !lines[0].includes("token"));
});
