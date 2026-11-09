-- TaskFlow schema. Matches the production database.
-- Safe to run repeatedly: existing tables (and their rows) are left untouched,
-- and the columns added later are only added if missing. Nothing is dropped,
-- renamed or rewritten.

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_complete BOOLEAN NOT NULL DEFAULT FALSE,
  due_date DATE
);

-- Optional details, added after launch. Existing tasks keep NULL (none).
--   description     free text; its length limit is enforced by the API.
--                   Same definition as the R1 recovery migration, so either
--                   can run first.
--   scheduled_time  an optional clock time on the due date ("14:30"), with no
--                   time zone: a due date stays a deadline unless a time is set
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS scheduled_time TIME;
