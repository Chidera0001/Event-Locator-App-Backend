/**
 * Validates if a string is a valid UUID v4
 * @param {string} value - The string to validate
 * @returns {boolean} - True if valid UUID v4, false otherwise
 */
const isValidUUID = (value) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
};

module.exports = {
  isValidUUID
}; 