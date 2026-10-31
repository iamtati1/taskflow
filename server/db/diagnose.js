// Logs why the database connection fails, from inside the running service.
// Runs only when the startup migration fails, and only runs SELECT 1.
// Never logs DATABASE_URL, hostnames, usernames, passwords or raw error objects.
const net = require("net");
const tls = require("tls");
const { categorizeError, sanitizeMessage, describeError } = require("../utils/safeError");

const TIMEOUT_MS = 15000;

// Postgres SSLRequest packet: length 8, code 80877103
const SSL_REQUEST = Buffer.from([0, 0, 0, 8, 4, 210, 22, 47]);

// Summarizes DATABASE_URL without revealing credentials or the host
const describeDatabaseUrl = (raw) => {
  if (!raw) return { present: false };

  const trimmed = raw.trim();
  const info = {
    present: true,
    surroundingWhitespace: raw !== trimmed,
    surroundingQuotes: /^['"]|['"]$/.test(trimmed),
  };

  let url;
  try {
    url = new URL(trimmed.replace(/^['"]|['"]$/g, ""));
  } catch (e) {
    info.parseable = false;
    return info;
  }

  info.parseable = true;
  info.protocol = url.protocol;
  info.hostKind = url.hostname.includes(".") ? "external" : "internal";
  info.port = url.port || "5432";
  info.hasUsername = url.username.length > 0;
  info.hasPassword = url.password.length > 0;
  info.hasDatabaseName = url.pathname.length > 1;
  info.queryParams = [...url.searchParams.keys()];
  if (url.searchParams.has("sslmode")) info.sslmode = url.searchParams.get("sslmode");
  if (url.searchParams.has("ssl")) info.ssl = url.searchParams.get("ssl");
  return info;
};

// Rejects after `ms`; the timer is cleared on settle and unref'd so it never keeps the process alive
const withTimeout = (promise, ms) => {
  let timer;
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => reject(Object.assign(new Error("diagnostic timeout"), { code: "ETIMEDOUT" })), ms);
    timer.unref();
  });
  return Promise.race([promise, deadline]).finally(() => clearTimeout(timer));
};

// Walks the connection up to the TLS handshake. Sends no credentials.
const probeTls = (host, port, timeoutMs = TIMEOUT_MS) =>
  new Promise((resolve) => {
    const steps = [];
    let settled = false;
    const socket = net.connect({ host, port });
    let secure;

    // Absolute deadline; unref'd so it never keeps the process alive
    const timer = setTimeout(() => finish("timed out"), timeoutMs);
    timer.unref();

    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (secure) secure.destroy();
      socket.destroy();
      resolve({ steps, result });
    };

    socket.once("error", (e) => finish(`socket error: ${e.code || "unknown"}`));
    socket.once("end", () => finish("server closed the connection"));

    socket.once("connect", () => {
      steps.push("tcp connected");
      socket.write(SSL_REQUEST);
    });

    socket.once("data", (reply) => {
      const answer = String.fromCharCode(reply[0]);
      steps.push(`SSLRequest answered "${answer}"`);
      if (answer !== "S") return finish("server refused SSL");

      secure = tls.connect({ socket, servername: host, rejectUnauthorized: false }, () => {
        steps.push(`tls ${secure.getProtocol()} handshake ok`);
        finish("tls ok");
      });
      secure.once("error", (e) => finish(`tls error: ${sanitizeMessage(e.message)}`));
    });
  });

// Runs SELECT 1 on a dedicated, short-lived client with the app pool's settings.
// Its own connect/query timeouts and the end() in finally close the socket even when the
// server never answers, and it never holds a slot in the app's pool.
const selectOne = async (pool, timeoutMs) => {
  const client = new pool.Client({
    ...pool.options,
    password: pool.options.password, // pg-pool hides this one from spreads
    connectionTimeoutMillis: timeoutMs,
    query_timeout: timeoutMs,
  });
  client.on("error", () => {}); // a late socket error must never become an uncaught exception
  try {
    await withTimeout(client.connect().then(() => client.query("SELECT 1")), timeoutMs);
  } finally {
    client.end().catch(() => {});
  }
};

const diagnoseDatabase = async (pool, { timeoutMs = TIMEOUT_MS } = {}) => {
  try {
    console.log("🩺 DB DIAGNOSTICS (no credentials are logged)");

    const url = describeDatabaseUrl(process.env.DATABASE_URL);
    console.log("🩺 DATABASE_URL:", JSON.stringify(url));
    console.log(
      "🩺 RUNTIME:",
      JSON.stringify({
        node: process.version,
        pg: require("pg/package.json").version,
        nodeEnv: process.env.NODE_ENV,
        sslInCode: pool.options.ssl ? "on" : "off",
      })
    );

    if (url.parseable) {
      const { hostname, port } = new URL(process.env.DATABASE_URL.trim().replace(/^['"]|['"]$/g, ""));
      const probe = await probeTls(hostname, Number(port || 5432), timeoutMs);
      console.log("🩺 TLS PROBE:", JSON.stringify(probe));
    }

    const started = Date.now();
    try {
      await selectOne(pool, timeoutMs);
      console.log(`🩺 SELECT 1: ok in ${Date.now() - started} ms`);
    } catch (err) {
      const { at, ...summary } = describeError(err);
      console.log(`🩺 SELECT 1 FAILED after ${Date.now() - started} ms:`, JSON.stringify(summary));
    }
  } catch (err) {
    console.log("🩺 diagnostics crashed:", sanitizeMessage(err && err.message));
  }
};

// The startup entry point: runs at most once per process, whatever calls it
let startupRun;
const diagnoseOnStartup = (pool) => {
  if (!startupRun) startupRun = diagnoseDatabase(pool);
  return startupRun;
};

module.exports = diagnoseDatabase;
module.exports.diagnoseOnStartup = diagnoseOnStartup;
module.exports.describeDatabaseUrl = describeDatabaseUrl;
module.exports.categorizeError = categorizeError;
module.exports.sanitizeMessage = sanitizeMessage;
module.exports.probeTls = probeTls;
module.exports.withTimeout = withTimeout;
