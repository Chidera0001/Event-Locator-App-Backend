module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  clearMocks: true,
  testTimeout: 30000,
  modulePathIgnorePatterns: ['<rootDir>/src/i18n/'],
  globals: {
    'process.env': {
      NODE_ENV: 'test',
      JWT_SECRET: 'test-secret',
      DB_HOST: 'localhost',
      DB_PORT: '5432',
      DB_USER: 'postgres',
      DB_PASSWORD: '123456',
      DB_NAME: 'event_locator_test'
    }
  }
}; 