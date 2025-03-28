const passport = require('passport');

function authenticate(req, res, next) {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: req.t('unauthorized')
      });
    }
    
    req.user = user;
    next();
  })(req, res, next);
}

function optionalAuth(req, res, next) {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (err) {
      return next(err);
    }
    
    if (user) {
      req.user = user;
    }
    
    next();
  })(req, res, next);
}

module.exports = {
  authenticate,
  optionalAuth
}; 