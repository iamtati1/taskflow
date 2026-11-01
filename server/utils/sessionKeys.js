// Returns the cookie-session signing keys.
// In production a real SESSION_SECRET is required: the dev fallback and the
// template placeholder are public in this repo, so cookies signed with them
// could be forged. Throws (without echoing the value) so the server refuses to start.
const DEV_FALLBACK = "dev-fallback-secret";
const PUBLIC_VALUES = new Set([DEV_FALLBACK, "your-random-secret-here"]);

const sessionKeys = (env = process.env) => {
  const secret = (env.SESSION_SECRET || "").trim();

  if (env.NODE_ENV === "production") {
    if (!secret) throw new Error("SESSION_SECRET must be set in production");
    if (PUBLIC_VALUES.has(secret)) throw new Error("SESSION_SECRET is a public placeholder; set a random value in production");
  }

  return [secret || DEV_FALLBACK];
};

module.exports = sessionKeys;
