const pool = require('../db/pool');

// The tasks columns every database has: id, user_id, title, is_complete,
// due_date. `id` is aliased as `task_id`, the name the API and frontend use.
const BASE_COLUMNS = ['id AS task_id', 'user_id', 'title', 'is_complete', 'due_date'];

// Columns added later (db/schema.sql). A database that hasn't had them added
// yet keeps working: they are left out of every query, and the controller
// refuses to save them with a clear message instead.
const OPTIONAL_COLUMNS = ['description', 'scheduled_time'];

// Which optional columns exist, checked once per process. Selecting a missing
// column fails with "column ... does not exist" (Postgres code 42703).
let columnsCheck = null;
const missingColumn = (err) =>
  err?.code === '42703' || /column .* does not exist/i.test(err?.message || '');

const optionalColumns = () => {
  if (!columnsCheck) {
    columnsCheck = Promise.all(
      OPTIONAL_COLUMNS.map((column) =>
        pool.query(`SELECT ${column} FROM tasks LIMIT 0`).then(
          () => column,
          (err) => {
            if (missingColumn(err)) return null;
            throw err;
          }
        )
      )
    )
      .then((found) => new Set(found.filter(Boolean)))
      .catch((err) => {
        columnsCheck = null; // a connection problem: check again next time
        throw err;
      });
  }
  return columnsCheck;
};

module.exports.optionalColumns = optionalColumns;
// Tests change the schema between checks
module.exports._forgetColumns = () => {
  columnsCheck = null;
};

const selectList = (available) =>
  [...BASE_COLUMNS, ...OPTIONAL_COLUMNS.filter((c) => available.has(c))].join(', ');

// Due dates leave the API as "YYYY-MM-DD" (a calendar day, no time zone).
// pg returns text (see db/pool.js); a driver that returns a Date gets its UTC day.
const dayOnly = (value) => {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
};

// Scheduled times leave the API as "HH:MM" (Postgres sends "HH:MM:SS")
const timeOnly = (value) => (value === null || value === undefined ? null : String(value).slice(0, 5));

const toTask = (row) => {
  if (!row) return null;
  const task = { ...row, due_date: dayOnly(row.due_date) };
  if ('scheduled_time' in row) task.scheduled_time = timeOnly(row.scheduled_time);
  return task;
};

// Returns all tasks for a specific user, ordered by creation time
module.exports.getTasksByUser = async (user_id) => {
  const available = await optionalColumns();
  // Newest first; ids increase as tasks are created
  const query = `
  SELECT ${selectList(available)}
  FROM tasks
  WHERE user_id = $1
  ORDER BY id DESC
`;

  const { rows } = await pool.query(query, [user_id]);
  return rows.map(toTask);
};

// Returns a single task row (used for ownership checks before update/delete)
module.exports.getTaskById = async (task_id) => {
  const available = await optionalColumns();
  const query = `SELECT ${selectList(available)} FROM tasks WHERE id = $1`;
  const { rows } = await pool.query(query, [task_id]);
  return toTask(rows[0]);
};

// Creates a new task. Returns the full task row. Optional fields are only
// written when their column exists (the controller checks first).
module.exports.createTask = async ({ title, due_date, user_id, description, scheduled_time }) => {
  const available = await optionalColumns();

  const fields = { title, is_complete: false, due_date: due_date || null, user_id };
  if (available.has('description')) fields.description = description ?? null;
  if (available.has('scheduled_time')) fields.scheduled_time = scheduled_time ?? null;

  const names = Object.keys(fields);
  const query = `
    INSERT INTO tasks (${names.join(', ')})
    VALUES (${names.map((_, i) => `$${i + 1}`).join(', ')})
    RETURNING ${selectList(available)}
  `;

  const { rows } = await pool.query(query, Object.values(fields));
  return toTask(rows[0]);
};

// Updates only the fields that are present (undefined = leave unchanged;
// null clears due_date, description and scheduled_time). Column names come
// from this fixed list, never from the request. Only touches the task if it
// belongs to user_id. Returns the updated row, or null if nothing matched.
const BASE_UPDATABLE = ['title', 'is_complete', 'due_date'];

module.exports.updateTask = async (task_id, user_id, fields) => {
  const available = await optionalColumns();
  const updatable = [...BASE_UPDATABLE, ...OPTIONAL_COLUMNS.filter((c) => available.has(c))];

  const present = updatable.filter((field) => fields[field] !== undefined);
  if (present.length === 0) return module.exports.getTaskById(task_id);

  const assignments = present.map((field, i) => `${field} = $${i + 1}`).join(', ');
  const values = present.map((field) => fields[field]);
  const idParam = present.length + 1;

  const { rows } = await pool.query(
    `UPDATE tasks
     SET ${assignments}
     WHERE id = $${idParam} AND user_id = $${idParam + 1}
     RETURNING ${selectList(available)}`,
    [...values, task_id, user_id]
  );

  return toTask(rows[0]);
};

// Deletes a task by id
module.exports.deleteTask = async (task_id, user_id) => {
  const available = await optionalColumns();
  const query = `DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING ${selectList(available)}`;
  const { rows } = await pool.query(query, [task_id, user_id]);
  return toTask(rows[0]);
};
