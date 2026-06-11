const userModel = require('../models/userModel');

module.exports.register = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: 'Username and password are required.'
      });
    }

    const existingUser = await userModel.findByUsername(username);

    if (existingUser) {
      return res.status(400).json({
        error: 'Username already taken.'
      });
    }

    const user = await userModel.create(username, password);

    // ✅ CONSISTENT SESSION KEY
    req.session.user_id = user.id;

    return res.status(201).json({
      user
    });

  } catch (err) {
    next(err);
  }
};



module.exports.getMe = async (req, res) => {
  return res.json({
    user: {
      user_id: 1,
      username: "demo",
    },
  });
};


module.exports.logout = (req, res) => {
  req.session = null;

  return res.json({
    message: 'Logged out'
  });
};

module.exports.login = async (req, res, next) => {
  try {
    console.log("LOGIN BODY:", req.body);

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

    req.session.user_id = user.id;

    return res.json({ user });

  } catch (err) {
    next(err);
  }
};