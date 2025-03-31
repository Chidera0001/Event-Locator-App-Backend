const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const userService = require('../services/user.service');
const { User } = require('../models');
const logger = require('./logger');

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
};

const jwtStrategy = new JwtStrategy(jwtOptions, async (payload, done) => {
  try {
    // Ensure payload.id is a valid UUID
    if (!isValidUUID(payload.id)) {
      return done(null, false);
    }

    const user = await User.findById(payload.id);
    if (!user) {
      return done(null, false);
    }

    return done(null, user);
  } catch (error) {
    logger.error('JWT Strategy error:', error);
    return done(error, false);
  }
});

const localStrategy = new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password',
  },
  async (email, password, done) => {
    try {
      const user = await userService.getUserByEmail(email);
      
      if (!user) {
        return done(null, false, { message: 'Invalid email or password' });
      }
      
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      
      if (!isPasswordValid) {
        return done(null, false, { message: 'Invalid email or password' });
      }
      
      // Don't include password hash in the user object
      delete user.password_hash;
      
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
);

// UUID validation helper
function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

module.exports = {
  jwtStrategy,
  localStrategy,
}; 