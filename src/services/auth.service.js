const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const userModel = require('../models/user.model');

const AuthService = {
  async register({ username, email, password, language = 'en' }) {
    // Check if user already exists
    const existingEmail = await userModel.findByEmail(email);
    if (existingEmail) {
      throw new Error('EMAIL_ALREADY_EXISTS');
    }
    
    const existingUsername = await userModel.findByUsername(username);
    if (existingUsername) {
      throw new Error('USERNAME_ALREADY_EXISTS');
    }
    
    // Create new user
    const user = await userModel.create({ username, email, password, language });
    
    // Generate token
    const token = this.generateToken(user);
    
    return { user, token };
  },
  
  async login(email, password) {
    // Find user by email
    const user = await userModel.findByEmail(email);
    if (!user) {
      throw new Error('INVALID_CREDENTIALS');
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('INVALID_CREDENTIALS');
    }
    
    // Create a copy of user without the password hash
    const userWithoutPassword = { ...user };
    delete userWithoutPassword.password_hash;
    
    // Generate token
    const token = this.generateToken(userWithoutPassword);
    
    return { user: userWithoutPassword, token };
  },
  
  generateToken(user) {
    return jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
  }
};

module.exports = AuthService; 