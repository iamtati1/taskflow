// Vercel serverless function: serves every /api/* request (see vercel.json rewrites)
// with the same Express app the local server uses. No app.listen() here.
import app from "../../server/app.js";

export default app;
