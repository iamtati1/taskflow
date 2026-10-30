const userModel = require('../models/userModel');

module.exports.register = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: "Username and password are required."
      });
    }

    const existingUser = await userModel.findByUsername(username);

    if (existingUser) {
      return res.status(400).json({
        error: "Username already taken."
      });
    }

    const user = await userModel.create(username, password);

    req.session.user_id = user.user_id;

    return res.status(201).json({
      user
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);

    return res.status(500).json({
      error: "Registration failed. Please try again.",
    });
  }
}



module.exports.getMe = async (req, res, next) => {
  try {
    const user_id = req.session.user_id;

    if (!user_id) {
      return res.json({ user: null });
    }

    const user = await userModel.find(user_id);

    return res.json({ user: user || null });

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
    console.error("LOGIN ERROR:", err);

    return res.status(500).json({
      error: "Login failed. Please try again.",
    });
  }
}