const request = require('supertest');

// Mock i18next before requiring app
jest.mock('i18next-http-middleware');
jest.mock('i18next');
jest.mock('i18next-fs-backend');

const app = require('../../src/app');
const { testPool } = require('../setup');
const bcrypt = require('bcrypt');

describe('Authentication API', () => {
  const testUser = {
    username: 'testuser',
    email: 'anelechidera4@gmail.com',
    password: 'Password123!',
    language: 'en'
  };

  beforeEach(async () => {
    await testPool.query('TRUNCATE users CASCADE');
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toHaveProperty('id');
      expect(res.body.message).toBe('registerSuccess');
    });

    it('should not register with existing email', async () => {
      const hashedPassword = await bcrypt.hash(testUser.password, 10);
      await testPool.query(
        'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)',
        [testUser.username, testUser.email, hashedPassword]
      );

      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create test user
      const hashedPassword = await bcrypt.hash(testUser.password, 10);
      await testPool.query(
        'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)',
        [testUser.username, testUser.email, hashedPassword]
      );
    });

    it('should login with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
    });
  });
}); 