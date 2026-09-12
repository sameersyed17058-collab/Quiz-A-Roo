// Dedicated Vercel Serverless Function entrypoint for /api/generate-quiz
const app = require('../server');

module.exports = (req, res) => {
  req.url = '/api/generate-quiz';
  return app(req, res);
};
