const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const quizRouter = require('./routes/quiz');
const usersRouter = require('./routes/users');

// API Endpoints
app.use('/api', quizRouter);
app.use('/api', usersRouter);

// Serve Static React Files
app.use(express.static(path.join(__dirname, 'client', 'build')));

// Handle Frontend Client Routing
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
});

const PORT = process.env.PORT || 4000;

// Local Development Server Listener
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
}

// Required for Vercel Serverless Deployment
module.exports = app;
