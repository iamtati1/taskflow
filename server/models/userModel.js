const bcrypt = require('bcrypt');
const pool = require('../db/pool');
const { logError } = require('../utils/safeError');

// bcrypt work factor for new hashes: 12 by default. BCRYPT_COST overrides it
// (the test suite lowers it for speed); values outside 4-15 are ignored.
const DEFAULT_COST = 12;
const passwordCost = (env = process.env) => {
  const cost = Number(env.BCRYPT_COST);
  return env.BCRYPT_COST && Number.isInteger(cost) && cost >= 4 && cost <= 15 ? cost : DEFAULT_COST;
};
module.exports.passwordCost = passwordCost;

// The users table's primary key is `id`; queries alias it as `user_id`,
// the name the controllers, session and frontend use.

// Creates a new user. Returns { user_id, username } — never exposes password_hash.
module.exports.create = async (username, password) => {
  const passwordHash = await bcrypt.hash(password, passwordCost());
  const query = 'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id AS user_id, username';
  const { rows } = await pool.query(query, [username, passwordHash]);
  return rows[0];
};

// Returns { user_id, username } or null
module.exports.find = async (user_id) => {
  const query =
    'SELECT id AS user_id, username FROM users WHERE id = $1';

  const { rows } = await pool.query(query, [user_id]);

  return rows[0] || null;
};

// Renames a user. Returns { user_id, username }, or null if there's no such user.
module.exports.updateUsername = async (user_id, username) => {
  const query = 'UPDATE users SET username = $1 WHERE id = $2 RETURNING id AS user_id, username';
  const { rows } = await pool.query(query, [username, user_id]);
  return rows[0] || null;
};

// Replaces a user's password hash. Returns true if the user exists.
module.exports.updatePassword = async (user_id, password) => {
  const passwordHash = await bcrypt.hash(password, passwordCost());
  const { rows } = await pool.query(
    'UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id',
    [passwordHash, user_id]
  );
  return rows.length > 0;
};

// True if the password matches this user's stored hash
module.exports.checkPassword = async (user_id, password) => {
  const { rows } = await pool.query('SELECT password_hash FROM users WHERE id = $1', [user_id]);
  if (!rows[0]) return false;
  return bcrypt.compare(password, rows[0].password_hash);
};

// Returns { user_id, username } or null — used to check if a username is taken.
// Case-insensitive, so names that differ only in capitalisation count as taken.
module.exports.findByUsername = async (username) => {
  const query = 'SELECT id AS user_id, username FROM users WHERE LOWER(username) = LOWER($1)';
  const { rows } = await pool.query(query, [username]);
  return rows[0] || null;
};

// The accounts a typed username could mean: any capitalisation, with or
// without the spaces around it (registration trims and ignores capitals)
const signInCandidates = async (typed) => {
  const query = 'SELECT id AS user_id, username, password_hash FROM users WHERE LOWER(username) = LOWER($1)';
  const names = [...new Set([typed, typed.trim()])];
  const byId = new Map();
  for (const name of names) {
    const { rows } = await pool.query(query, [name]);
    for (const row of rows) byId.set(row.user_id, row);
  }
  return [...byId.values()];
};

// Rehashes at the current cost after a successful sign-in, so older, weaker
// hashes are upgraded as people sign in. Only replaces the hash that was just
// checked (not one changed meanwhile). A failure is logged, never fatal.
const upgradeHash = async (user, password) => {
  if (bcrypt.getRounds(user.password_hash) >= passwordCost()) return;
  try {
    const stronger = await bcrypt.hash(password, passwordCost());
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2 AND password_hash = $3',
      [stronger, user.user_id, user.password_hash]
    );
  } catch (err) {
    logError("PASSWORD HASH UPGRADE FAILED:", err, [password]);
  }
};

// Verifies a password. Returns { user_id, username } if valid, or null if no
// account matches or the password is wrong. An account whose name matches
// exactly always wins; otherwise a different capitalisation or surrounding
// spaces are accepted only when exactly one account fits, so older accounts
// that differ only in capitals can never sign in as each other.
module.exports.validatePassword = async (username, password) => {
  if (typeof username !== 'string' || typeof password !== 'string') return null;

  const candidates = await signInCandidates(username);
  const exact =
    candidates.find((row) => row.username === username) ||
    candidates.find((row) => row.username === username.trim());
  const user = exact || (candidates.length === 1 ? candidates[0] : null);
  if (!user) return null;

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) return null;

  await upgradeHash(user, password);
  return {
    user_id: user.user_id,
    username: user.username
  };
};
