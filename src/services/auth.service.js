const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/user.model');

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
    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
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