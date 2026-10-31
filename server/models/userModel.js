const bcrypt = require('bcrypt');
const pool = require('../db/pool');

const SALT_ROUNDS = 8;

// Creates a new user. Returns { user_id, username } — never exposes password_hash.
module.exports.create = async (username, password) => {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const query = 'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING user_id, username';
  const { rows } = await pool.query(query, [username, passwordHash]);
  return rows[0];
};

// Returns { user_id, username } or null
module.exports.find = async (user_id) => {
  const query =
    'SELECT user_id, username FROM users WHERE user_id = $1';

  const { rows } = await pool.query(query, [user_id]);

  return rows[0] || null;
};

// Returns { user_id, username } or null — used to check if a username is taken
module.exports.findByUsername = async (username) => {
  const query = 'SELECT user_id, username FROM users WHERE username = $1';
  const { rows } = await pool.query(query, [username]);
  return rows[0] || null;
};

// Verifies a password against the stored hash. Returns { user_id, username } if
// valid, or null if the username doesn't exist or the password is wrong.
module.exports.validatePassword = async (username, password) => {
  const query = 'SELECT * FROM users WHERE username = $1';
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
