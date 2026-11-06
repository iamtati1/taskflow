-- Per-user task categories. Additive and safe to run more than once.
--
-- Deleting a category leaves its tasks in place, uncategorised. Deleting a
-- user deletes their categories. That a task's category belongs to the same
-- user is checked by the API.

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS category_id INTEGER
  REFERENCES categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS tasks_category_id_idx ON tasks (category_id);
