const { User } = require('../../src/models');
const { pool } = require('../../src/models');

describe('User Validation', () => {
  beforeEach(async () => {
    await pool.query('DELETE FROM users');
  });

  describe('email validation', () => {
    it('should validate correct email format', async () => {
      const validUser = {
        username: 'testuser',
        email: 'anelechidera4@gmail.com',
        password: 'Password123!'
      };
      const user = await User.create(validUser);
      expect(user.email).toBe(validUser.email);
    });

    it('should reject invalid email format', async () => {
      const invalidUser = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'Password123!'
      };
      await expect(User.create(invalidUser)).rejects.toThrow();
    });
  });

  describe('password validation', () => {
    it('should require minimum password length', async () => {
      const invalidUser = {
        username: 'testuser',
        email: 'anelechidera4@gmail.com',
        password: 'short'
      };
      await expect(User.create(invalidUser)).rejects.toThrow();
    });
  });
}); 