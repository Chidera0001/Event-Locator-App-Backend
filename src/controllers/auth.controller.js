const AuthService = require('../services/auth.service');
const emailService = require('../services/email.service');
const logger = require('../config/logger');

const AuthController = {
  async register(req, res, next) {
    try {
      const { username, email, password, language } = req.body;
      
      const { user, token } = await AuthService.register({
        username,
        email,
        password,
        language
      });
      
      // Send welcome email
      await emailService.sendWelcomeEmail(user);
      
      res.status(201).json({
        success: true,
        message: req.t('registerSuccess'),
        data: { user, token }
      });
    } catch (error) {
      if (error.message === 'Email already exists' || error.message === 'Username already exists') {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }
      
      next(error);
    }
  },
  
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      
      const { user, token } = await AuthService.login(email, password);
      
      res.status(200).json({
        success: true,
        message: req.t('loginSuccess'),
        data: { user, token }
      });
    } catch (error) {
      if (error.message === 'Invalid credentials') {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password'
        });
      }
      
      next(error);
    }
  }
};

module.exports = AuthController; 