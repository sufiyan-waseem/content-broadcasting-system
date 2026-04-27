/**
 * Global error-handling middleware.
 * Catches all errors passed via next(err) and returns a consistent JSON response.
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${new Date().toISOString()} - ${err.message}`);

  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map((e) => ({ field: e.path, message: e.message }));
    return res.status(400).json({ success: false, message: 'Validation failed.', errors });
  }

  // Sequelize unique constraint errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    const errors = err.errors.map((e) => ({ field: e.path, message: `${e.path} already exists.` }));
    return res.status(409).json({ success: false, message: 'Duplicate entry.', errors });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expired. Please login again.' });
  }

  // Default 500
  const statusCode = err.statusCode || err.status || 500;
  return res.status(statusCode).json({
    success: false,
    message: err.message || 'An internal server error occurred.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * 404 handler – for routes that don't exist
 */
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

module.exports = { errorHandler, notFound };
