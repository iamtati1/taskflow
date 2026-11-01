const bcrypt = require('bcrypt');
const pool = require('./pool');
const { logError } = require('../utils/safeError');

const SALT_ROUNDS = 8;

const seed = async () => {
  // Drop tables in reverse dependency order
  await pool.query('DROP TABLE IF EXISTS activity_log');
  await pool.query('DROP TABLE IF EXISTS tasks');
  await pool.query('DROP TABLE IF EXISTS categories');
  await pool.query('DROP TABLE IF EXISTS users');

  // USERS TABLE
  await pool.query(`
    CREATE TABLE users (
      user_id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL
    )
  `);

  // CATEGORIES TABLE
  await pool.query(`
    CREATE TABLE categories (
      category_id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE
    )
  `);

  // TASKS TABLE
  await pool.query(`
    CREATE TABLE tasks (
      task_id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      due_date TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      is_complete BOOLEAN DEFAULT FALSE,

      priority TEXT CHECK (
        priority IN ('low', 'medium', 'high')
      ) DEFAULT 'medium',

      user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,

      category_id INTEGER REFERENCES categories(category_id)
      ON DELETE SET NULL
    )
  `);

  // ACTIVITY LOG TABLE
  await pool.query(`
    CREATE TABLE activity_log (
      log_id SERIAL PRIMARY KEY,

      user_id INTEGER REFERENCES users(user_id)
      ON DELETE CASCADE,

      task_id INTEGER REFERENCES tasks(task_id)
      ON DELETE CASCADE,

      action TEXT CHECK (
        action IN (
          'TASK_CREATED',
          'TASK_UPDATED',
          'TASK_COMPLETED',
          'TASK_DELETED'
        )
      ) NOT NULL,

      meta JSONB,

      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // HASH PASSWORDS
  const [aliceHash, bobHash] = await Promise.all([
    bcrypt.hash('password123', SALT_ROUNDS),
    bcrypt.hash('password123', SALT_ROUNDS),
  ]);

  // INSERT USERS
  const { rows: users } = await pool.query(
    `
    INSERT INTO users (username, password_hash)
    VALUES
      ('alice', $1),
      ('bob', $2)
    RETURNING user_id, username
    `,
    [aliceHash, bobHash]
  );

  const [alice, bob] = users;

  // INSERT CATEGORIES
  const { rows: categories } = await pool.query(
    `
    INSERT INTO categories (name, user_id)
    VALUES
      ('Personal', $1),
      ('Work', $2)
    RETURNING category_id, name
    `,
    [alice.user_id, bob.user_id]
  );

  const [personalCategory, workCategory] = categories;

  // INSERT TASKS
  const { rows: tasks } = await pool.query(
    `
    INSERT INTO tasks (
      title,
      is_complete,
      user_id,
      category_id,
      priority
    )
    VALUES
      ('Buy groceries', FALSE, $1, $3, 'medium'),
      ('Walk the dog', FALSE, $1, $3, 'low'),
      ('Read a book', TRUE, $1, $3, 'high'),
      ('Set up the database', TRUE, $2, $4, 'high'),
      ('Build the API', TRUE, $2, $4, 'high'),
      ('Build the frontend', FALSE, $2, $4, 'medium')
    RETURNING task_id
    `,
    [
      alice.user_id,
      bob.user_id,
      personalCategory.category_id,
      workCategory.category_id,
    ]
  );

  // INSERT ACTIVITY LOG
  await pool.query(
    `
    INSERT INTO activity_log (
      user_id,
      task_id,
      action,
      meta
    )
    VALUES
      ($1, $2, 'TASK_CREATED', $3)
    `,
    [
      alice.user_id,
      tasks[0].task_id,
      JSON.stringify({ source: 'seed' }),
    ]
  );

  return users;
};

seed()
  .then((users) => {
    console.log('Database seeded successfully.');
    console.log(
      `Users: ${users.map((u) => u.username).join(', ')}`
    );
  })
  .catch((err) => {
    logError('Error seeding database:', err);
    process.exit(1);
  })
  .finally(() => pool.end());