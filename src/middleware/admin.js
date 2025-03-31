const logger = require('../config/logger');

const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

const moderatorMiddleware = (req, res, next) => {
  if (!req.user || !['admin', 'moderator'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Moderator access required'
    });
  }
  next();
};

const adminOnly = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (req.user.role !== 'admin') {
      logger.warn('Unauthorized admin access attempt:', {
        userId: req.user.id,
        role: req.user.role,
        endpoint: req.originalUrl
      });
      
      return res.status(403).json({
        success: false,
        message: 'Admin privileges required'
      });
    }

    next();
  } catch (error) {
    logger.error('Admin middleware error:', error);
    next(error);
  }
};

module.exports = { adminMiddleware, moderatorMiddleware, adminOnly }; 