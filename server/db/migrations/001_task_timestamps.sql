-- When each task was created and completed (used by the Momentum chart, Work
-- Pattern and activity views). Additive and safe to run more than once.
--
-- Existing tasks keep NULL in both columns: when they were created or
-- completed was never recorded, and filling in the migration time would
-- invent history. Only tasks created after this migration get created_at.

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;
ALTER TABLE tasks ALTER COLUMN created_at SET DEFAULT now();

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
