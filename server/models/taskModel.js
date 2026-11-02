const pool = require('../db/pool');

// Only the tasks columns confirmed in production: id, user_id, title,
// is_complete, due_date. `id` is aliased as `task_id`, the name the API and
// frontend use. (priority, category_id and created_at are not stored.)
const TASK_COLUMNS = 'id AS task_id, user_id, title, is_complete, due_date';

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
  return rows;
};

// Returns a single task row (used for ownership checks before update/delete)
module.exports.getTaskById = async (task_id) => {
  const query = `SELECT ${TASK_COLUMNS} FROM tasks WHERE id = $1`;
  const { rows } = await pool.query(query, [task_id]);
  return rows[0] || null;
};

// Creates a new task. Returns the full task row.
module.exports.createTask = async ({ title, due_date, user_id }) => {

  const query = `
    INSERT INTO tasks (
      title,
      is_complete,
      due_date,
      user_id
    )
    VALUES ($1, FALSE, $2, $3)
    RETURNING ${TASK_COLUMNS}
  `;

  const { rows } = await pool.query(query, [
    title,
    due_date || null,
    user_id,
  ]);

  return rows[0];
};

// Updates title, is_complete and/or due_date (null leaves a field unchanged).
// Only touches the task if it belongs to user_id. Returns the updated row or null.
module.exports.updateTask = async (task_id, user_id, fields) => {
  const { title, is_complete, due_date } = fields;

  const { rows } = await pool.query(
    `UPDATE tasks
     SET title = COALESCE($1, title),
         is_complete = COALESCE($2, is_complete),
         due_date = COALESCE($3, due_date)
     WHERE id = $4 AND user_id = $5
     RETURNING ${TASK_COLUMNS}`,
    [title ?? null, is_complete ?? null, due_date ?? null, task_id, user_id]
  );

  return rows[0] || null;
};

// Deletes a task by id
module.exports.deleteTask = async (task_id, user_id) => {
  const query = `DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING ${TASK_COLUMNS}`;
  const { rows } = await pool.query(query, [task_id, user_id]);
  return rows[0] || null;
};
