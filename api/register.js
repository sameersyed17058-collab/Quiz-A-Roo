// Dedicated Vercel Serverless Function entrypoint for /api/register
const app = require('../server');

module.exports = (req, res) => {
  req.url = '/api/register';
  return app(req, res);
};
