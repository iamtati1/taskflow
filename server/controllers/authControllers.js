const userModel = require('../models/userModel');
const { registrationError } = require('../utils/validation');

module.exports.register = async (req, res, next) => {
  try {
    const { password } = req.body;

    const invalid = registrationError(req.body.username, password);
    if (invalid) {
      return res.status(400).json({ error: invalid });
    }

    const username = req.body.username.trim();

    // Case-insensitive, so "Jordan" can't be registered next to "jordan"
    const existingUser = await userModel.findByUsername(username);

    if (existingUser) {
      return res.status(400).json({
        error: 'Username already taken.'
      });
    }

    const user = await userModel.create(username, password);

    // ✅ CONSISTENT SESSION KEY
    req.session.user_id = user.user_id;

    return res.status(201).json({
      user
    });

  } catch (err) {
    next(err);
  }
};



module.exports.getMe = async (req, res, next) => {
  try {
    const user_id = req.session.user_id;

    if (!user_id) {
      return res.status(401).json({
        error: "Not authenticated"
      });
    }

    const user = await userModel.find(user_id);

    // The account was deleted: end the session so the cookie stops coming back
    if (!user) {
      req.session = null;
      return res.status(401).json({
        error: "User not found"
      });
    }

    return res.json({ user });

  } catch (err) {
    next(err);
  }
};


module.exports.logout = (req, res) => {
  req.session = null;

  return res.json({
    message: 'Logged out'
  });
};

module.exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: "Username and password are required."
      });
    }

    const user = await userModel.validatePassword(username, password);


    if (!user) {
      return res.status(401).json({
        error: "Invalid username or password"
      });
    }

    req.session.user_id = user.user_id;

    return res.json({ user });

  } catch (err) {
    next(err);
  }
};