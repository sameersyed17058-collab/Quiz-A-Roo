// Dedicated Vercel Serverless Function entrypoint for /api/quiz-result
const app = require('../server');

module.exports = (req, res) => {
  req.url = '/api/quiz-result';
  return app(req, res);
};
