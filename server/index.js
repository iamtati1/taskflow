// Local / long-running server: the API from app.js plus the built React app.
// On Vercel, frontend/api/index.js serves app.js and Vercel serves frontend/dist.
const express = require('express');
const path = require('path');
const app = require('./app');

const PORT = process.env.PORT || 8080;

// ====================================
// Health Check / Root Route
// ====================================
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Backend server is running',
  });
});

// ====================================
// Serve frontend (MUST be after API routes)
// ====================================
// In production, serve the built React app from frontend/dist.
// In development, Vite's dev server handles the frontend on a separate port
// and proxies /api requests to this server.
app.use(express.static(path.join(__dirname, '../frontend/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// ====================================
// Listen (ALWAYS LAST)
// ====================================
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
