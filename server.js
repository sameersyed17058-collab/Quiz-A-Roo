const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

const quizRouter = require('./routes/quiz');
const usersRouter = require('./routes/users');

// API Routes
app.use('/api', quizRouter);
app.use('/api', usersRouter);

// Root Endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Quiz-A-Roo backend API is running!',
    clientUrl: 'http://localhost:3000',
    endpoints: {
      health: '/api/health',
      generateQuiz: '/api/generate-quiz',
      leaderboard: '/api/leaderboard'
    }
  });
});

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Quiz-A-Roo API is running' });
});

const PORT = process.env.PORT || 4000;

// Local Development Listener
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, '0.0.0.0', () => console.log(`Server listening on ${PORT}`));
}

// Required for Vercel Serverless Functions
module.exports = app;