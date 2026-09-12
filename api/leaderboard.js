// Dedicated Vercel Serverless Function entrypoint for /api/leaderboard
const app = require('../server');

module.exports = (req, res) => {
  req.url = '/api/leaderboard';
  return app(req, res);
};
