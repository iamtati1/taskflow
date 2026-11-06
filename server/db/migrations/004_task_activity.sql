-- A history of task changes (Recent Activity). Additive and safe to run more
-- than once.
--
-- task_title is a copy taken at the time, so history still reads correctly
-- after a task is renamed or deleted; deleting a task keeps its history with
-- task_id set to NULL. Deleting a user deletes their history.

CREATE TABLE IF NOT EXISTS task_activity (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
  task_title TEXT NOT NULL,
  action TEXT NOT NULL
    CHECK (action IN ('created', 'updated', 'completed', 'reopened', 'deleted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS task_activity_user_created_idx
  ON task_activity (user_id, created_at DESC);
