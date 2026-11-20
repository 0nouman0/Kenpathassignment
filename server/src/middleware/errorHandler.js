/**
 * Global Express error handler.
 * Catches errors forwarded via next(err).
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  console.error('[ERROR]', err);

  // Handle CORS errors
  if (err.message && err.message.startsWith('CORS policy')) {
    return res.status(403).json({ error: err.message });
  }

  // PostgreSQL unique-violation
  if (err.code === '23505') {
    return res.status(409).json({ error: 'Duplicate entry – resource already exists' });
  }

  // PostgreSQL foreign-key violation
  if (err.code === '23503') {
    return res.status(400).json({ error: 'Referenced resource not found' });
  }

  // PostgreSQL check constraint
  if (err.code === '23514') {
    return res.status(400).json({ error: 'Value violates database constraint' });
  }

  const status = err.status || err.statusCode || 500;
  const message = status < 500 ? err.message : 'Internal server error';

  return res.status(status).json({ error: message });
};

module.exports = errorHandler;
