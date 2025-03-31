module.exports = {
  LanguageDetector: jest.fn(),
  handle: jest.fn((i18n) => (req, res, next) => {
    req.t = (key) => key;
    next();
  })
}; 