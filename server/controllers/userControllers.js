const userModel = require('../models/userModel');
const { usernameError, passwordError } = require('../utils/validation');

// PATCH /api/users/me  { username } -> { user }
module.exports.updateProfile = async (req, res, next) => {
  try {
    const { username } = req.body || {};

    const invalid = usernameError(username);
    if (invalid) {
      return res.status(400).json({ error: invalid });
    }

    const newName = username.trim();

    // Taken by someone else (any capitalisation)? Changing the capitalisation
    // of your own name is allowed.
    const existing = await userModel.findByUsername(newName);
    if (existing && String(existing.user_id) !== String(req.session.user_id)) {
      return res.status(400).json({ error: 'Username already taken.' });
    }

    const user = await userModel.updateUsername(req.session.user_id, newName);
    if (!user) {
      req.session = null;
      return res.status(401).json({ error: 'Not authenticated' });
    }

    return res.json({ user });
  } catch (err) {
    // Two renames racing for the same name: the UNIQUE constraint catches it
    if (err && err.code === '23505') {
      return res.status(400).json({ error: 'Username already taken.' });
    }
    next(err);
  }
};

// POST /api/users/me/password  { currentPassword, newPassword } -> { message }
module.exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (typeof currentPassword !== 'string' || !currentPassword) {
      return res.status(400).json({ error: 'Enter your current password.' });
    }

    const invalid = passwordError(newPassword);
    if (invalid) {
      return res.status(400).json({ error: invalid });
    }

    const matches = await userModel.checkPassword(req.session.user_id, currentPassword);
    if (!matches) {
      return res.status(400).json({ error: 'Your current password is incorrect.' });
    }

    await userModel.updatePassword(req.session.user_id, newPassword);

    return res.json({ message: 'Password updated.' });
  } catch (err) {
    next(err);
  }
};
