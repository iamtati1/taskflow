const logRoutes = (req, res, next) => {
  const time = new Date().toLocaleString();
  // Path only: query strings can carry tokens or credentials
  console.log(`${req.method}: ${req.originalUrl.split("?")[0]} - ${time}`);
  next();
};

module.exports = logRoutes;
