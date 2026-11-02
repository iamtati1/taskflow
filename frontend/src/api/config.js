// Base URL for API requests. Empty by default: the API is served from the same
// origin (Vercel /api function in production, Vite's /api proxy in development).
// Set VITE_API_BASE_URL only to point at a separately hosted backend.
export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
