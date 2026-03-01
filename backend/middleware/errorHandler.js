/**
 * Error handling middleware for the eduGenius backend
 */

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

/**
 * Central error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.stack || err.message);

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      error: 'Validation failed',
      details: messages,
    });
  }

  // MongoDB Duplicate Key Error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const value = err.keyValue ? err.keyValue[field] : '';
    return res.status(400).json({
      error: `Duplicate value for ${field}: "${value}" already exists.`,
    });
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: `Invalid ${err.path}: ${err.value}`,
    });
  }

  // Custom AppError
  if (err.isOperational && err.statusCode) {
    return res.status(err.statusCode).json({
      error: err.message,
    });
  }

  // Default 500
  res.status(500).json({
    error: 'Internal server error. Please try again later.',
  });
};

module.exports = { errorHandler, AppError };
