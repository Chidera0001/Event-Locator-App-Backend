const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const userService = require('../services/user.service');

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
};

const jwtStrategy = new JwtStrategy(jwtOptions, async (jwtPayload, done) => {
  try {
    const user = await userService.getUserById(jwtPayload.id);
    if (!user) {
      return done(null, false);
    }
    
    // Don't include password hash in the user object
    delete user.password_hash;
    
    return done(null, user);
  } catch (error) {
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

module.exports = {
  jwtStrategy,
  localStrategy,
}; 