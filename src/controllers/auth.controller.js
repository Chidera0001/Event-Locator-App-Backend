const authService = require('../services/auth.service');
const emailService = require('../services/email.service');

const AuthController = {
  async register(req, res, next) {
    try {
      const { username, email, password, language } = req.body;
      
      const { user, token } = await authService.register({
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
      if (error.message === 'EMAIL_ALREADY_EXISTS') {
        return res.status(400).json({
          success: false,
          message: req.t('emailTaken', { ns: 'error' })
        });
      }
      
      if (error.message === 'USERNAME_ALREADY_EXISTS') {
        return res.status(400).json({
          success: false,
          message: req.t('usernameTaken', { ns: 'error' })
        });
      }
      
      next(error);
    }
  },
  
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      
      const { user, token } = await authService.login(email, password);
      
      res.status(200).json({
        success: true,
        message: req.t('loginSuccess'),
        data: { user, token }
      });
    } catch (error) {
      if (error.message === 'INVALID_CREDENTIALS') {
        return res.status(401).json({
          success: false,
          message: req.t('invalidCredentials', { ns: 'error' })
        });
      }
      
      next(error);
    }
  }
};

module.exports = AuthController; 