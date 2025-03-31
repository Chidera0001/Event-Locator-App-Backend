const { pool } = require('../src/config/database');

// Mock i18next and its middleware
jest.mock('i18next-http-middleware', () => ({
  LanguageDetector: jest.fn(),
  handle: jest.fn((i18n) => (req, res, next) => {
    req.t = (key) => key;
    next();
  })
}));

jest.mock('i18next', () => ({
  use: jest.fn().mockReturnThis(),
  init: jest.fn().mockResolvedValue(null),
  t: jest.fn(key => key)
}));

jest.mock('i18next-fs-backend', () => ({
  default: jest.fn()
}));

// Mock Redis
jest.mock('ioredis');
jest.mock('../src/queues/redis', () => ({
  client: {
    connect: jest.fn(),
    disconnect: jest.fn(),
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    zAdd: jest.fn(),
    publish: jest.fn(),
    subscribe: jest.fn(),
    on: jest.fn()
  }
}));

// Mock WebSocket
jest.mock('../src/websocket', () => ({
  notifyEventUpdate: jest.fn()
}));

// Mock email service
jest.mock('../src/services/email.service', () => ({
  sendWelcomeEmail: jest.fn()
}));

// Mock notification service
jest.mock('../src/services/notification.service', () => ({
  scheduleEventNotifications: jest.fn().mockResolvedValue({ success: true }),
  markAsSent: jest.fn().mockResolvedValue({ sent_at: new Date() }),
  getNotifications: jest.fn(),
  processNotifications: jest.fn()
}));

const i18next = require('i18next');
i18next.init({
  fallbackLng: 'en',
  preload: ['en'],
  ns: ['translation'],
  defaultNS: 'translation'
});

beforeAll(async () => {
  // Ensure database is clean
  await pool.query('DROP SCHEMA IF EXISTS public CASCADE');
  await pool.query('CREATE SCHEMA public');
  
  // Create extensions
  await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  await pool.query('CREATE EXTENSION IF NOT EXISTS postgis');
  
  // Create ALL necessary tables
  await pool.query(`
    CREATE TABLE users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      username VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      preferred_language VARCHAR(10) DEFAULT 'en',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE categories (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE events (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      title VARCHAR(255) NOT NULL,
      description TEXT,
      location GEOGRAPHY(Point, 4326),
      address VARCHAR(255),
      start_date TIMESTAMP NOT NULL,
      end_date TIMESTAMP NOT NULL,
      creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
      category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE reviews (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      event_id UUID REFERENCES events(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      rating INTEGER CHECK (rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE favorites (
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      event_id UUID REFERENCES events(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, event_id)
    );
  `);
});

beforeEach(async () => {
  // Clean tables before each test
  await pool.query('TRUNCATE users, categories, events, reviews, favorites CASCADE');
  jest.clearAllMocks();
});

afterAll(async () => {
  await pool.end();
});

// Export for use in tests
module.exports = { testPool: pool }; 