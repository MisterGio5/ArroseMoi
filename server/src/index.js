const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

// Initialize database (creates tables if needed)
require('./db/database');

const authRoutes = require('./routes/auth');
const plantRoutes = require('./routes/plants');
const profileRoutes = require('./routes/profile');
const houseRoutes = require('./routes/houses');
const notificationRoutes = require('./routes/notifications');

const app = express();
const PORT = process.env.PORT || 3001;

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://*.supabase.co", "https://api.stripe.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

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
app.use('/api/houses', houseRoutes);
app.use('/api/notifications', notificationRoutes);

// Serve React static files (built frontend copied to ./public by Dockerfile)
const publicPath = path.join(__dirname, '..', 'public');

// Service Worker must be served from root with correct headers
app.get('/sw.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Service-Worker-Allowed', '/');
  res.setHeader('Cache-Control', 'no-cache');
  res.sendFile(path.join(publicPath, 'sw.js'));
});

app.use(express.static(publicPath));

// SPA fallback - all non-API routes serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`ArroseMoi server running on port ${PORT}`);

  // Start notification scheduler
  const { startScheduler } = require('./services/notificationScheduler');
  startScheduler();
});
