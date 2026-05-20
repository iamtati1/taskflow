const pool = require('../db/pool');

// Returns all tasks for a specific user, ordered by creation time
module.exports.getTasksByUser = async (user_id) => {
  const query = 'SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC';
  const { rows } = await pool.query(query, [user_id]);
  return rows;
};

// Returns a single task row (used for ownership checks before update/delete)
module.exports.getTaskById = async (task_id) => {
  const query = 'SELECT * FROM tasks WHERE task_id = $1';
  const { rows } = await pool.query(query, [task_id]);
  return rows[0] || null;
};

// Creates a new task. Returns the full task row.
module.exports.createTask = async ({ title, priority, due_date, category_id, user_id }) => {
  const query = 'INSERT INTO tasks (title, priority, due_date, category_id, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *';
  const { rows } = await pool.query(query, [title, priority, due_date, category_id, user_id]);
  return rows[0];
};

// Updates is_complete for a task. Returns the updated row.
module.exports.updateTask = async (task_id, fields) => {
  const { title, is_complete, priority, due_date, category_id } = fields;

  const { rows } = await pool.query(
    `UPDATE tasks
     SET title = COALESCE($1, title),
         is_complete = COALESCE($2, is_complete),
         priority = COALESCE($3, priority),
         due_date = COALESCE($4, due_date),
         category_id = COALESCE($5, category_id)
     WHERE task_id = $6
     RETURNING *`,
    [title, is_complete, priority, due_date, category_id, task_id]
  );

  return rows[0];
};

// Deletes a task by id
module.exports.deleteTask = async (task_id, user_id) => {
  const query = 'DELETE FROM tasks WHERE task_id = $1 AND user_id = $2 RETURNING *';
  const { rows } = await pool.query(query, [task_id, user_id]);
  return rows[0] || null;
};
