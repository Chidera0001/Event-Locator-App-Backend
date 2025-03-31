const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { testPool } = require('./setup');

async function createTestUser(overrides = {}) {
  const defaultUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'Password123!'
  };

  const userData = { ...defaultUser, ...overrides };
  const password_hash = await bcrypt.hash(userData.password, 10);

  const result = await testPool.query(
    'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
    [userData.username, userData.email, password_hash]
  );

  return result.rows[0];
}

async function generateAuthToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
}

async function createTestEvent(userId, overrides = {}) {
  const defaultEvent = {
    title: 'Test Event',
    description: 'Test Description',
    location: { type: 'Point', coordinates: [-73.935242, 40.730610] },
    address: '123 Test St',
    start_date: new Date(Date.now() + 86400000),
    end_date: new Date(Date.now() + 172800000)
  };

  const eventData = { ...defaultEvent, ...overrides };
  
  const result = await testPool.query(`
    INSERT INTO events (
      title, description, location, address, 
      start_date, end_date, creator_id
    )
    VALUES (
      $1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326), $5, 
      $6, $7, $8
    )
    RETURNING *
  `, [
    eventData.title,
    eventData.description,
    eventData.location.coordinates[0],
    eventData.location.coordinates[1],
    eventData.address,
    eventData.start_date,
    eventData.end_date,
    userId
  ]);

  return result.rows[0];
}

module.exports = {
  createTestUser,
  generateAuthToken,
  createTestEvent
}; 