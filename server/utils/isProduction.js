// True for production servers and for Vercel production/preview deployments.
// Vercel sets VERCEL_ENV ("production", "preview" or "development" for `vercel dev`).
const isProduction = (env = process.env) =>
  env.NODE_ENV === "production" || ["production", "preview"].includes(env.VERCEL_ENV);

module.exports = isProduction;
