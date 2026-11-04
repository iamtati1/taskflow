const { rateLimit } = require('express-rate-limit');

// Slows down password guessing on login and registration: by default 20
// attempts per IP address every 15 minutes. AUTH_RATE_LIMIT overrides the
// count (the test suite raises it). On Vercel each function instance keeps
// its own count, so this is a speed bump rather than a hard global limit.
const createAuthLimiter = ({
  limit = Number(process.env.AUTH_RATE_LIMIT) || 20,
  windowMs = 15 * 60 * 1000,
} = {}) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many attempts. Please wait a few minutes and try again.' },
  });

module.exports = { createAuthLimiter };
