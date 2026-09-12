const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-vercel-matched-path', 'x-matched-path']
}));
app.options('*', cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Vercel Serverless Route Normalization:
// When Vercel routes /api/register to /server.js?_path=$1 or via x-vercel-matched-path,
// restore req.url to the actual requested route (/api/register) so Express routers match perfectly.
app.use((req, res, next) => {
  const queryPath = req.query && req.query._path
    ? (req.query._path.startsWith('/') ? req.query._path : `/api/${req.query._path}`)
    : null;

  const headerPath =
    req.headers['x-vercel-matched-path'] ||
    req.headers['x-matched-path'] ||
    req.headers['x-forwarded-uri'] ||
    req.headers['x-original-url'];

  const targetPath = queryPath || headerPath;

  if (targetPath) {
    const currentPath = req.url.split('?')[0];
    if (
      !currentPath.startsWith('/api') ||
      currentPath === '/' ||
      currentPath.includes('server.js') ||
      currentPath.includes('index.js')
    ) {
      const queryIndex = req.url.indexOf('?');
      let queryString = '';
      if (queryIndex !== -1) {
        const params = new URLSearchParams(req.url.slice(queryIndex + 1));
        params.delete('_path');
        const remaining = params.toString();
        if (remaining) queryString = `?${remaining}`;
      }
      req.url = `${targetPath.split('?')[0]}${queryString}`;
    }
  }
  next();
});

const quizRouter = require('./routes/quiz');
const usersRouter = require('./routes/users');

// API Routes: mount on both '/api' and '/' to ensure compatibility
// with serverless rewrites (Vercel) and direct server requests (Render/Railway/local)
app.use('/api', quizRouter);
app.use('/api', usersRouter);
app.use('/', quizRouter);
app.use('/', usersRouter);

// Root Endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Quiz-A-Roo backend API is running!',
    clientUrl: 'http://localhost:3000',
    endpoints: {
      health: '/api/health',
      generateQuiz: '/api/generate-quiz',
      leaderboard: '/api/leaderboard',
      register: '/api/register'
    }
  });
});

// Health Check Endpoint
app.get(['/api/health', '/health'], (req, res) => {
  res.json({ status: 'OK', message: 'Quiz-A-Roo API is running' });
});

// Catch-all 404 handler: always return JSON so client fetch calls never fail with 'Unexpected end of JSON'
app.use((req, res) => {
  res.status(404).json({
    error: `Endpoint not found: ${req.method} ${req.originalUrl || req.url}`,
    status: 404
  });
});

// Global error handler: always return JSON
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    status: err.status || 500
  });
});

const PORT = process.env.PORT || 4100;

// Start HTTP server if run directly (node server.js, Render, Railway, Heroku, Docker, local dev).
// When imported as a module (e.g. by api/index.js on Vercel), export app without calling listen.
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => console.log(`Quiz-A-Roo server listening on port ${PORT}`));
}

// Required for Vercel Serverless Functions
module.exports = app;