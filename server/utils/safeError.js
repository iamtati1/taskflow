// Turns errors into log-safe summaries.
// Never includes DATABASE_URL, hostnames, usernames, passwords, database names,
// IPs, or extra pg fields (detail, hint, where) that can echo row data.
// Depends on nothing in the app, so anything can require it without import cycles.

// Maps a pg/Node error to a cause category
const categorizeError = (err) => {
  const code = err.code || "";
  const message = (err.message || "").toLowerCase();

  if (code === "ENOTFOUND" || code === "EAI_AGAIN") return "dns_resolution_failed";
  if (code === "ECONNREFUSED") return "connection_refused";
  if (code === "ETIMEDOUT" || message.includes("timeout")) return "timeout";
  if (code === "28P01" || code === "28000") return "authentication_failed";
  if (code === "3D000") return "database_does_not_exist";
  if (code === "57P03") return "database_starting_up";
  if (code === "53300") return "too_many_connections";
  if (code === "42P01" || code === "42703") return "schema_mismatch";
  if (code === "23505") return "unique_violation";
  if (/ssl|tls|certificate/.test(message)) return "ssl_tls_failed";
  if (code === "ECONNRESET" || message.includes("connection terminated")) return "connection_terminated";
  return "unknown";
};

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// The exact sensitive parts of a connection string, in raw and decoded form
const connectionSecrets = (raw = process.env.DATABASE_URL) => {
  if (!raw) return [];
  const values = [raw.trim()];
  try {
    const url = new URL(raw.trim().replace(/^['"]|['"]$/g, ""));
    values.push(url.username, url.password, url.hostname, url.pathname.slice(1));
  } catch (e) {
    // Unparseable: only the whole value is known to be sensitive
  }
  const decoded = values.map((v) => {
    try {
      return decodeURIComponent(v);
    } catch (e) {
      return v;
    }
  });
  // Very short values (e.g. a database named "db") would mangle ordinary words
  return [...new Set([...values, ...decoded])].filter((v) => v.length >= 4).sort((a, b) => b.length - a.length);
};

// Replaces the exact DATABASE_URL parts wherever they appear
const redactConnectionSecrets = (text) => {
  let out = String(text);
  for (const secret of connectionSecrets()) {
    out = out.replace(new RegExp(escapeRegExp(secret), "gi"), "<redacted>");
  }
  return out;
};

// Keeps the error's shape but strips connection details, quoted values, hosts and IPs
const sanitizeMessage = (message = "") =>
  redactConnectionSecrets(message)
    .replace(/\b[a-z][a-z0-9+.-]*:\/\/\S+/gi, "<url>")
    .replace(/\bpassword\s*[=:]\s*\S+/gi, "password=<redacted>")
    .replace(/"[^"]*"/g, '"<redacted>"')
    .replace(/\b\d{1,3}(\.\d{1,3}){3}(:\d+)?\b/g, "<ip>")
    .replace(/\bdpg-[a-z0-9-]+(\.[a-z0-9.-]+)?/gi, "<host>")
    .replace(/\b[a-z0-9-]+(\.[a-z0-9-]+){2,}\b/gi, "<host>")
    .replace(/\b(user|database|role)[ =]+(?!"<redacted>")[^\s,]+/gi, "$1 <redacted>")
    .slice(0, 200);

// First few code locations from the stack; never the stack's message line.
// Frames are file paths, so only exact secrets are redacted (the host pattern would eat file names).
const stackFrames = (err) =>
  String(err.stack || "")
    .split("\n")
    .filter((line) => /^\s+at /.test(line))
    .slice(0, 3)
    .map((line) => redactConnectionSecrets(line.trim()).slice(0, 200));

// A log-safe summary: category, name, codes, a sanitized message and where it was thrown
const describeError = (err) => {
  if (!err || typeof err !== "object") {
    return { category: "unknown", message: sanitizeMessage(String(err)) };
  }
  // Node can wrap several connection attempts in an AggregateError with an empty message
  const inner = Array.isArray(err.errors) && err.errors[0] ? err.errors[0] : {};
  return {
    category: categorizeError(err.code ? err : { ...inner, message: err.message || inner.message }),
    name: err.name,
    code: err.code || inner.code,
    severity: err.severity,
    message: sanitizeMessage(err.message || inner.message),
    at: stackFrames(err),
  };
};

// Logs a label plus the safe summary; never throws
const logError = (label, err) => {
  try {
    console.error(label, JSON.stringify(describeError(err)));
  } catch (e) {
    console.error(label, "(error could not be described)");
  }
};

module.exports = { categorizeError, sanitizeMessage, describeError, logError };
