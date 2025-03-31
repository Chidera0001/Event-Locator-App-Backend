module.exports = {
  t: jest.fn(key => key),
  use: jest.fn().mockReturnThis(),
  init: jest.fn()
}; 