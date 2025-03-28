const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/database');
const bcrypt = require('bcrypt');

// Mock data
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123'
};

// Clean up and setup before tests
beforeAll(async () => {
  // Clean up existing test user if it exists
  await db.query('DELETE FROM users WHERE email = $1', [testUser.email]);
});

afterAll(async () => {
  // Clean up after tests
  await db.query('DELETE FROM users WHERE email = $1', [testUser.email]);
});

describe('Authentication API', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);
      
      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toHaveProperty('id');
      expect(res.body.data.user.username).toEqual(testUser.username);
      expect(res.body.data.user.email).toEqual(testUser.email);
      expect(res.body.data.token).toBeTruthy();
    });
    
    it('should not register with existing email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);
      
      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
    });
  });
  
  describe('POST /api/auth/login', () => {
    it('should login existing user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toHaveProperty('id');
      expect(res.body.data.token).toBeTruthy();
    });
    
    it('should not login with incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        });
      
      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
    });
    
    it('should not login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password
        });
      
      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
    });
  });
}); 