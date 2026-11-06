const pool = require('../db/pool');

// True if the category exists and belongs to the user
module.exports.isOwnCategory = async (category_id, user_id, db = pool) => {
  const { rows } = await db.query(
    'SELECT 1 FROM categories WHERE id = $1 AND user_id = $2',
    [category_id, user_id]
  );
  return rows.length > 0;
};
