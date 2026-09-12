// Dedicated Vercel Serverless Function entrypoint for /api/profile
const app = require('../server');

module.exports = (req, res) => {
  req.url = '/api/profile';
  return app(req, res);
};
