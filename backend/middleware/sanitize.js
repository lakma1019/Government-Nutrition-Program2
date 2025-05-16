const sanitizer = require('perfect-express-sanitizer');

// Middleware to sanitize request body, query, and params
const sanitizeMiddleware = (req, res, next) => {
  try {
    // Sanitize request body
    if (req.body) {
      // Skip sanitizing password fields
      const { password, ...restBody } = req.body;
      
      // Sanitize all other fields
      const sanitizedBody = sanitizer.sanitize.prepareSanitize(restBody, {
        xss: true,
        noSql: true,
        sql: true,
        level: 5 // Maximum sanitization level
      });
      
      // Restore password field
      req.body = {
        ...sanitizedBody,
        password: password || undefined
      };
    }
    
    // Sanitize query parameters
    if (req.query) {
      req.query = sanitizer.sanitize.prepareSanitize(req.query, {
        xss: true,
        noSql: true,
        sql: true,
        level: 5
      });
    }
    
    // Sanitize URL parameters
    if (req.params) {
      req.params = sanitizer.sanitize.prepareSanitize(req.params, {
        xss: true,
        noSql: true,
        sql: true,
        level: 5
      });
    }
    
    next();
  } catch (error) {
    console.error('Sanitization error:', error);
    next();
  }
};

module.exports = { sanitizeMiddleware };
