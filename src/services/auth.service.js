const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/user.model');
const logger = require('../config/logger');

const AuthService = {
  async register({ username, email, password, language = 'en' }) {
    // Check if user already exists
    const existingEmail = await User.findByEmail(email);
    if (existingEmail) {
      throw new Error('Email already exists');
    }
    
    const existingUsername = await User.findByUsername(username);
    if (existingUsername) {
      throw new Error('Username already exists');
    }
    
    // Create new user
    const user = await User.create({ username, email, password, language });
    
    // Generate token
    const token = this.generateToken(user);
    
    return { user, token };
  },
  
  async login(email, password) {
    try {
      logger.debug('Login attempt for email:', email);
      
      // Find user by email
      const user = await User.findByEmail(email);
      if (!user) {
        logger.debug('No user found with email:', email);
        throw new Error('Invalid credentials');
      }
      
      logger.debug('User found:', { id: user.id, email: user.email, role: user.role });
      
      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        logger.debug('Invalid password for user:', email);
        throw new Error('Invalid credentials');
      }
      
      logger.debug('Password verified successfully');
      
      // Create a safe copy of user data
      const userResponse = {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        preferred_language: user.preferred_language,
        created_at: user.created_at
      };
      
      // Generate token
      const token = this.generateToken(userResponse);
      
      logger.debug('Login successful, token generated');
      
      return { user: userResponse, token };
    } catch (error) {
      logger.error('Login error:', error.message);
      throw error;
    }
  },
  
  generateToken(user) {
    // Ensure user.id is a valid UUID
    if (!user.id) {
      logger.error('Token generation failed: Missing user ID');
      throw new Error('User ID is required');
    }

    try {
      const token = jwt.sign(
        { 
          id: user.id,
          email: user.email,
          role: user.role || 'user'
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );
      
      logger.debug('Token generated successfully');
      return token;
    } catch (error) {
      logger.error('Token generation error:', error.message);
      throw error;
    }
  }
};

module.exports = AuthService; 