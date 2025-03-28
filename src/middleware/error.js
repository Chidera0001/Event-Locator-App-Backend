const logger = require('../config/logger');

function errorMiddleware(err, req, res, next) {
  logger.error(err.stack);
  
  // Default error status and message
  const status = err.status || 500;
  const message = status === 500
    ? req.t('serverError')
    : err.message;
  
  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
}

module.exports = errorMiddleware; 