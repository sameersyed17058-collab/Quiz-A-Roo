// Vercel Serverless Function entrypoint
const app = require('../server');

module.exports = (req, res) => {
  try {
    return app(req, res);
  } catch (err) {
    console.error('Serverless function error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || 'Internal Server Error', status: 500 });
    }
  }
};
