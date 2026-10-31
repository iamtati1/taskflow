const { test } = require("node:test");
const assert = require("node:assert");
const net = require("net");
const { execFileSync } = require("child_process");
const EventEmitter = require("events");
const { Pool } = require("pg");

const diagnoseDatabase = require("./diagnose");
const { describeDatabaseUrl, categorizeError, sanitizeMessage, probeTls, withTimeout } = diagnoseDatabase;

const SECRET_URL = "postgresql://taskflow_user:s3cretPa55@dpg-abc123-a.ohio-postgres.render.com/taskflow_db";
const SECRETS = ["s3cretPa55", "taskflow_user", "taskflow_db", "dpg-abc123", "render.com"];
const SSL_REQUEST = Buffer.from([0, 0, 0, 8, 4, 210, 22, 47]);

// Starts a local TCP server; records every connection and the bytes it receives
const fakeServer = (onSocket) =>
  new Promise((resolve) => {
    const received = [];
    let connections = 0;
    const server = net.createServer((socket) => {
      connections += 1;
      socket.on("data", (chunk) => received.push(chunk));
      onSocket(socket);
    });
    server.received = () => Buffer.concat(received);
    server.connections = () => connections;
    server.listen(0, "127.0.0.1", () => resolve(server));
  });

const pgError = (message, code) => Object.assign(new Error(message), code ? { code } : {});

const assertNoSecrets = (text) => {
  for (const secret of SECRETS) assert(!text.includes(secret), `leaked ${secret}: ${text}`);
};

test("describeDatabaseUrl never includes credentials, host or database name", () => {
  const info = describeDatabaseUrl(SECRET_URL);
  assertNoSecrets(JSON.stringify(info));
  assert.strictEqual(info.hostKind, "external");
  assert.strictEqual(info.port, "5432");
  assert.strictEqual(info.hasUsername, true);
  assert.strictEqual(info.hasPassword, true);
  assert.strictEqual(info.hasDatabaseName, true);
});

test("describeDatabaseUrl flags paste mistakes", () => {
  const info = describeDatabaseUrl(` '${SECRET_URL}'\n`);
  assert.strictEqual(info.surroundingWhitespace, true);
  assert.strictEqual(info.surroundingQuotes, true);
  assert.strictEqual(info.parseable, true);
});

test("describeDatabaseUrl reports internal hosts and ssl query params", () => {
  const info = describeDatabaseUrl("postgresql://u:p@dpg-abc123-a/db?sslmode=disable");
  assert.strictEqual(info.hostKind, "internal");
  assert.deepStrictEqual(info.queryParams, ["sslmode"]);
  assert.strictEqual(info.sslmode, "disable");
});

test("describeDatabaseUrl handles missing and unparseable values", () => {
  assert.deepStrictEqual(describeDatabaseUrl(undefined), { present: false });
  assert.strictEqual(describeDatabaseUrl("not a url").parseable, false);
});

test("categorizeError distinguishes the failure causes", () => {
  const cases = [
    [pgError("Connection terminated unexpectedly"), "connection_terminated"],
    [pgError("read ECONNRESET", "ECONNRESET"), "connection_terminated"],
    [pgError("timeout expired"), "timeout"],
    [pgError("diagnostic timeout", "ETIMEDOUT"), "timeout"],
    [pgError("getaddrinfo ENOTFOUND dpg-abc-a", "ENOTFOUND"), "dns_resolution_failed"],
    [pgError('password authentication failed for user "x"', "28P01"), "authentication_failed"],
    [pgError("SSL/TLS required"), "ssl_tls_failed"],
    [pgError("self-signed certificate in certificate chain"), "ssl_tls_failed"],
    [pgError("connect ECONNREFUSED 1.2.3.4:5432", "ECONNREFUSED"), "connection_refused"],
    [pgError('database "x" does not exist', "3D000"), "database_does_not_exist"],
    [pgError("the database system is starting up", "57P03"), "database_starting_up"],
    [pgError("something else"), "unknown"],
  ];
  for (const [err, expected] of cases) {
    assert.strictEqual(categorizeError(err), expected, err.message);
  }
});

test("sanitizeMessage strips users, hosts, IPs, database names and quoted values", () => {
  const cases = [
    'password authentication failed for user "taskflow_user"',
    "getaddrinfo ENOTFOUND dpg-abc123-a.ohio-postgres.render.com",
    "connect ECONNREFUSED 18.118.220.241:5432",
    'database "taskflow_db" does not exist',
    "no pg_hba.conf entry for host 74.220.50.7, user taskflow_user, database taskflow_db",
  ];
  const out = cases.map(sanitizeMessage).join("\n");
  assertNoSecrets(out);
  assert(!out.includes("18.118") && !out.includes("74.220"));
  assert.strictEqual(sanitizeMessage("Connection terminated unexpectedly"), "Connection terminated unexpectedly");
});

test("probeTls sends only the 8-byte SSLRequest before a dropped connection", async () => {
  const server = await fakeServer((socket) => socket.once("data", () => socket.end()));
  const { result, steps } = await probeTls("127.0.0.1", server.address().port);
  server.close();
  assert.strictEqual(result, "server closed the connection");
  assert.deepStrictEqual(steps, ["tcp connected"]);
  assert.deepStrictEqual(server.received(), SSL_REQUEST);
});

test("probeTls reports a server that refuses SSL", async () => {
  const server = await fakeServer((socket) => socket.once("data", () => socket.write("N")));
  const { result } = await probeTls("127.0.0.1", server.address().port);
  server.close();
  assert.strictEqual(result, "server refused SSL");
  assert.deepStrictEqual(server.received(), SSL_REQUEST);
});

test("probeTls reports a TLS failure after the server accepts SSL, without sending credentials", async () => {
  const server = await fakeServer((socket) =>
    socket.once("data", () => {
      socket.write("S");
      socket.once("data", () => socket.end("not tls"));
    })
  );
  const { result, steps } = await probeTls("127.0.0.1", server.address().port);
  server.close();
  assert.match(result, /^tls error|^server closed/);
  assert.deepStrictEqual(steps.slice(0, 2), ["tcp connected", 'SSLRequest answered "S"']);
  // After the SSLRequest only a TLS ClientHello (record type 0x16) is sent
  const sent = server.received();
  assert.deepStrictEqual(sent.subarray(0, 8), SSL_REQUEST);
  assert.strictEqual(sent[8], 0x16);
  assertNoSecrets(sent.toString("latin1"));
});

test("probeTls reports nothing listening", async () => {
  const server = await fakeServer(() => {});
  const { port } = server.address();
  await new Promise((r) => server.close(r));
  const { result } = await probeTls("127.0.0.1", port);
  assert.strictEqual(result, "socket error: ECONNREFUSED");
});

test("probeTls gives up at its deadline when the server never answers", async () => {
  const server = await fakeServer(() => {});
  const started = Date.now();
  const { result } = await keepAlive(() => probeTls("127.0.0.1", server.address().port, 200));
  server.close();
  assert.strictEqual(result, "timed out");
  assert(Date.now() - started < 2000);
});

// Diagnostic timers are unref'd, so a test waiting only on them needs its own ref'd handle
const keepAlive = async (fn) => {
  const handle = setInterval(() => {}, 1000);
  try {
    return await fn();
  } finally {
    clearInterval(handle);
  }
};

test("withTimeout rejects a promise that never settles", () =>
  keepAlive(() => assert.rejects(withTimeout(new Promise(() => {}), 50), { code: "ETIMEDOUT" })));

test("the diagnostic releases the process by its deadline", () => {
  // A 60 s SELECT 1 deadline must not hold the process; an unanswered probe is destroyed at its 1 s deadline
  const started = Date.now();
  execFileSync(process.execPath, [
    "-e",
    `const d = require(${JSON.stringify(require.resolve("./diagnose"))});
     d.withTimeout(new Promise(() => {}), 60000).catch(() => {});
     d.probeTls("10.255.255.1", 5432, 1000);`,
  ]);
  const elapsed = Date.now() - started;
  assert(elapsed < 5000, `child process lived ${elapsed} ms past its deadline`);
});

// Runs diagnoseDatabase against a local server with a stubbed pool; returns logs, queries and the server
const runDiagnostics = async (pool, options) => {
  const server = await fakeServer((socket) => socket.once("data", () => socket.end()));
  const originalUrl = process.env.DATABASE_URL;
  const originalLog = console.log;
  const logs = [];

  process.env.DATABASE_URL = `postgresql://taskflow_user:s3cretPa55@127.0.0.1:${server.address().port}/taskflow_db`;
  console.log = (...args) => logs.push(args.join(" "));
  try {
    await diagnoseDatabase(pool, options);
  } finally {
    console.log = originalLog;
    process.env.DATABASE_URL = originalUrl;
    server.close();
  }
  return { out: logs.join("\n"), server };
};

// A pool whose Client class records every client, query and end()
const stubPool = (query) => {
  const queries = [];
  const clients = [];
  class Client extends EventEmitter {
    constructor(config) {
      super();
      this.config = config;
      this.ended = false;
      clients.push(this);
    }
    connect() {
      return Promise.resolve();
    }
    query(sql) {
      queries.push(sql);
      return query();
    }
    end() {
      this.ended = true;
      return Promise.resolve();
    }
  }
  return { queries, clients, Client, options: { ssl: { rejectUnauthorized: false } } };
};

test("diagnoseDatabase runs only SELECT 1, opens one probe socket, and logs a sanitized failure", async () => {
  const pool = stubPool(() => Promise.reject(pgError('password authentication failed for user "taskflow_user"', "28P01")));
  const { out, server } = await runDiagnostics(pool);
  assert.deepStrictEqual(pool.queries, ["SELECT 1"]);
  assert.strictEqual(server.connections(), 1);
  assert.strictEqual(pool.clients.length, 1);
  assert.strictEqual(pool.clients[0].ended, true);
  assert.strictEqual(pool.clients[0].config.connectionTimeoutMillis, 15000);
  assertNoSecrets(out);
  assert(!out.includes("127.0.0.1"));
  assert(!/OUTBOUND/.test(out));
  assert.match(out, /TLS PROBE: .*server closed the connection/);
  assert.match(out, /SELECT 1 FAILED .*"category":"authentication_failed".*"code":"28P01"/);
  assert.match(out, /"sslInCode":"on"/);
});

test("diagnoseDatabase reports success", async () => {
  const { out } = await runDiagnostics(stubPool(() => Promise.resolve({ rows: [{ "?column?": 1 }] })));
  assert.match(out, /SELECT 1: ok in \d+ ms/);
});

test("diagnoseDatabase times out a hanging SELECT 1", async () => {
  const started = Date.now();
  const { out } = await keepAlive(() => runDiagnostics(stubPool(() => new Promise(() => {})), { timeoutMs: 200 }));
  assert.match(out, /SELECT 1 FAILED .*"category":"timeout"/);
  assert(Date.now() - started < 3000);
});

test("diagnoseDatabase never throws, even when the pool itself is broken", async () => {
  const brokenPool = {
    get options() {
      throw new Error('broken pool for user "taskflow_user"');
    },
  };
  const { out } = await runDiagnostics(brokenPool);
  assert.match(out, /diagnostics crashed/);
  assertNoSecrets(out);
});

test("a SELECT 1 against a silent server closes the real pg socket at the deadline", async () => {
  let closed = 0;
  const silent = await fakeServer((socket) => socket.on("close", () => (closed += 1)));
  const pool = new Pool({
    connectionString: `postgresql://taskflow_user:s3cretPa55@127.0.0.1:${silent.address().port}/taskflow_db`,
    ssl: { rejectUnauthorized: false },
  });
  const started = Date.now();
  const { out } = await keepAlive(async () => {
    const result = await runDiagnostics(pool, { timeoutMs: 300 });
    for (let i = 0; i < 40 && closed === 0; i++) await new Promise((r) => setTimeout(r, 50));
    return result;
  });
  silent.close();
  await pool.end();
  assert.strictEqual(silent.connections(), 1);
  assert.strictEqual(closed, 1, "pg socket was left open");
  assert.strictEqual(pool.totalCount, 0, "diagnostic used a slot in the app pool");
  assert.match(out, /SELECT 1 FAILED .*"category":"timeout"/);
  assertNoSecrets(out);
  assert(Date.now() - started < 3000);
});

test("a late error event on the diagnostic client cannot crash the process", async () => {
  const pool = stubPool(() => Promise.resolve({}));
  await runDiagnostics(pool);
  assert.doesNotThrow(() => pool.clients[0].emit("error", new Error("Connection terminated unexpectedly")));
});

test("diagnoseOnStartup runs once per process, however often it is called", async () => {
  const modulePath = require.resolve("./diagnose");
  delete require.cache[modulePath];
  const { diagnoseOnStartup } = require("./diagnose");
  const pool = stubPool(() => Promise.resolve({}));
  const originalLog = console.log;
  const originalUrl = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  console.log = () => {};
  try {
    const first = diagnoseOnStartup(pool);
    const second = diagnoseOnStartup(pool);
    await Promise.all([first, second, diagnoseOnStartup(pool)]);
    assert.strictEqual(first, second);
  } finally {
    console.log = originalLog;
    if (originalUrl !== undefined) process.env.DATABASE_URL = originalUrl;
    delete require.cache[modulePath];
  }
  assert.deepStrictEqual(pool.queries, ["SELECT 1"]);
  assert.strictEqual(pool.clients.length, 1);
});
