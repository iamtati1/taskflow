// Base URL for API requests. Empty by default: the API is served from the same
// origin (Vercel /api function in production, Vite's /api proxy in development).
// Set VITE_API_BASE_URL only to point at a separately hosted backend.
export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

// Fired on window when an API request finds the session has ended (401),
// so the app can return to sign-in instead of failing every action
export const SESSION_ENDED_EVENT = "taskflow:session-ended";
