const pool = require('../db/pool');

// Adds one entry to a user's task history. task_title is the title at the
// time, so the entry still reads correctly after a rename or delete.
// Pass the transaction's client so the entry is saved with the change itself.
module.exports.recordActivity = async ({ user_id, task_id, task_title, action }, db = pool) => {
  await db.query(
    'INSERT INTO task_activity (user_id, task_id, task_title, action) VALUES ($1, $2, $3, $4)',
    [user_id, task_id, task_title, action]
  );
};
