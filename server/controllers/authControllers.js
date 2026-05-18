const userModel = require('../models/userModel');

module.exports.register = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).send({
        error: 'Username and password are required.'
      });
    }

    const existingUser = await userModel.findByUsername(username);

    if (existingUser) {
      return res.status(400).send({
        error: 'Username already taken.'
      });
    }

    const user = await userModel.create(username, password);

    req.session.userId = user.user_id;

    res.status(201).send(user);
  } catch (err) {
    next(err);
  }
};

module.exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Missing in your current version
    if (!username || !password) {
      return res.status(400).send({
        error: 'Username and password are required.'
      });
    }

    const user = await userModel.validatePassword(username, password);

    if (!user) {
      return res.status(401).send({
        error: 'Invalid credentials.'
      });
    }

    req.session.userId = user.user_id;

    res.send(user);
  } catch (err) {
    next(err);
  }
};

// Returns the logged-in user object, or null if no session exists.
// Returning JSON null (200) keeps the response format consistent — the frontend
// can always call response.json() without hitting a parse error.
module.exports.getMe = async (req, res, next) => {
  try {
    if (!req.session.userId) {
      return res.json(null);
    }

    const user = await userModel.find(req.session.userId);

    return res.json({
      user
    });
  } catch (err) {
    next(err);
  }
};

module.exports.logout = (req, res) => {
  req.session = null;

  res.send({
    message: 'Logged out.'
  });
};