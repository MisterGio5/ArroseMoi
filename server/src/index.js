const express = require('express');
const cors = require('cors');
const path = require('path');

// Initialize database (creates tables if needed)
require('./db/database');

const authRoutes = require('./routes/auth');
const plantRoutes = require('./routes/plants');
const profileRoutes = require('./routes/profile');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json({ limit: '15mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/plants', plantRoutes);
app.use('/api/profile', profileRoutes);

// Serve React static files (built frontend copied to ./public by Dockerfile)
const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));

// SPA fallback - all non-API routes serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`ArroseMoi server running on port ${PORT}`);
});
