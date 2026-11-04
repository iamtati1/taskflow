const bcrypt = require('bcrypt');
const pool = require('../db/pool');

const SALT_ROUNDS = 8;

// The users table's primary key is `id`; queries alias it as `user_id`,
// the name the controllers, session and frontend use.

// Creates a new user. Returns { user_id, username } — never exposes password_hash.
module.exports.create = async (username, password) => {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
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
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
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

// Verifies a password against the stored hash. Returns { user_id, username } if
// valid, or null if the username doesn't exist or the password is wrong.
module.exports.validatePassword = async (username, password) => {
  const query = 'SELECT id AS user_id, username, password_hash FROM users WHERE username = $1';
  const { rows } = await pool.query(query, [username]);
  const user = rows[0];
  if (!user) return null;
  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) return null;
  return {
    user_id: user.user_id,
    username: user.username
  };
};
