const pool = require('../db/pool');

// The production columns (id, user_id, title, is_complete, due_date) plus the
// ones added by db/migrations. `id` is aliased as `task_id`, the name the API
// and frontend use. created_at and completed_at are NULL for tasks from
// before the migration, whose times were never recorded.
const TASK_COLUMNS = `id AS task_id, user_id, title, is_complete, due_date,
  priority, description, category_id, created_at, completed_at`;

// Each function takes an optional `db`: the client of a transaction
// (db/transaction.js), so a change and its history entry save together.

// Due dates leave the API as "YYYY-MM-DD" (a calendar day, no time zone).
// pg returns text (see db/pool.js); a driver that returns a Date gets its UTC day.
const dayOnly = (value) => {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
};
const toTask = (row) => (row ? { ...row, due_date: dayOnly(row.due_date) } : null);

// Returns all tasks for a specific user, ordered by creation time
module.exports.getTasksByUser = async (user_id) => {
  // Newest first; ids increase as tasks are created
  const query = `
  SELECT ${TASK_COLUMNS}
  FROM tasks
  WHERE user_id = $1
  ORDER BY id DESC
`;

  const { rows } = await pool.query(query, [user_id]);
  return rows.map(toTask);
};

// Returns a single task row (used for ownership checks before update/delete)
module.exports.getTaskById = async (task_id, db = pool) => {
  const query = `SELECT ${TASK_COLUMNS} FROM tasks WHERE id = $1`;
  const { rows } = await db.query(query, [task_id]);
  return toTask(rows[0]);
};

// Creates a new task (created_at is set by the database). Returns the full
// task row.
module.exports.createTask = async (
  { title, due_date, user_id, priority, description, category_id },
  db = pool
) => {

  // priority falls back to the column's default when not given
  const query = `
    INSERT INTO tasks (
      title,
      is_complete,
      due_date,
      user_id,
      priority,
      description,
      category_id
    )
    VALUES ($1, FALSE, $2, $3, COALESCE($4, 'medium'), $5, $6)
    RETURNING ${TASK_COLUMNS}
  `;

  const { rows } = await db.query(query, [
    title,
    due_date || null,
    user_id,
    priority ?? null,
    description ?? null,
    category_id ?? null,
  ]);

  return toTask(rows[0]);
};

// Updates only the fields that are present (undefined = leave unchanged;
// null clears due_date, description or category_id). Column names come from
// this fixed list, never from the request. Only touches the task if it
// belongs to user_id. Returns the updated row, or null if nothing matched.
const UPDATABLE_FIELDS = ['title', 'is_complete', 'due_date', 'priority', 'description', 'category_id'];

module.exports.updateTask = async (task_id, user_id, fields, db = pool) => {
  const present = UPDATABLE_FIELDS.filter((field) => fields[field] !== undefined);
  if (present.length === 0) return module.exports.getTaskById(task_id, db);

  const assignments = present.map((field, i) => `${field} = $${i + 1}`);
  const values = present.map((field) => fields[field]);
  const idParam = present.length + 1;

  // Completing records the time (completing again keeps the first time);
  // reopening clears it
  if (present.includes('is_complete')) {
    const completeParam = present.indexOf('is_complete') + 1;
    assignments.push(
      `completed_at = CASE WHEN $${completeParam}::boolean THEN COALESCE(completed_at, now()) ELSE NULL END`
    );
  }

  const { rows } = await db.query(
    `UPDATE tasks
     SET ${assignments.join(', ')}
     WHERE id = $${idParam} AND user_id = $${idParam + 1}
     RETURNING ${TASK_COLUMNS}`,
    [...values, task_id, user_id]
  );

  return toTask(rows[0]);
};

// Deletes a task by id
module.exports.deleteTask = async (task_id, user_id, db = pool) => {
  const query = `DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING ${TASK_COLUMNS}`;
  const { rows } = await db.query(query, [task_id, user_id]);
  return toTask(rows[0]);
};
