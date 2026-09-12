// Dedicated Vercel Serverless Function entrypoint for /api/login
const app = require('../server');

module.exports = (req, res) => {
  req.url = '/api/login';
  return app(req, res);
};
