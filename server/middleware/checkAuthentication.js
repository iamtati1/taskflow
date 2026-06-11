module.exports = (req, res, next) => {
  // TEMP DEV/DEPLOY FIX
  req.session = { user_id: 1 };
  next();
};
