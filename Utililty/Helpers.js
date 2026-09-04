// ============================================================
//  Helpers.js
//  Reusable utility functions for the entire application.
// ============================================================

// Neutralizes special characters in search queries to prevent regex crashes
const escapeRegex = (text) => {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
};

// Generates a unique 6-digit receipt number with today's date
const generateReceiptNumber = () => {
  const datePrefix = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  return `REC-${datePrefix}-${randomSuffix}`;
};

module.exports = {
  escapeRegex,
  generateReceiptNumber,
};
