-- Task priority (low, medium, high) and free-text notes. Additive and safe to
-- run more than once.
--
-- Existing tasks become 'medium', the default TaskFlow always used. Notes
-- start empty (NULL); their length limit is enforced by the API.

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'medium'
  CHECK (priority IN ('low', 'medium', 'high'));

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description TEXT;
