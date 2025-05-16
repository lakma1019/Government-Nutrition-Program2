const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const sanitizer = require('perfect-express-sanitizer');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');

// Database modules
const { testConnection } = require('./config/db');

// Custom middleware
const { sanitizeMiddleware } = require('./middleware/sanitize');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // Your frontend URL
  credentials: true // Allow cookies to be sent
}));
app.use(express.json());
app.use(morgan('dev'));
app.use(cookieParser()); // Add cookie parser

// Apply sanitization middleware
app.use(sanitizeMiddleware);

// Global sanitization using perfect-express-sanitizer
app.use(
  sanitizer.clean({
    xss: true,
    noSql: true,
    sql: true,
    level: 3, // Medium level for global sanitization
    forbiddenTags: ['script', 'iframe', 'object', 'embed'],
    forbiddenAttributes: ['onerror', 'onload', 'onclick', 'onmouseover']
  })
);

// Setup CSRF protection
const csrfProtection = csrf({
  cookie: true,
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS'], // Don't require CSRF for these methods
  value: (req) => {
    // Custom function to get CSRF token from request
    // This allows requests to proceed even if the token is missing
    const token = req.headers['x-csrf-token'] || req.headers['csrf-token'];
    if (!token) {
      console.warn('CSRF token missing in request');
    }
    return token;
  }
});

// Create a route to get a CSRF token
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  try {
    const token = req.csrfToken();
    console.log('CSRF token generated successfully');
    res.json({ csrfToken: token });
  } catch (error) {
    console.error('Error generating CSRF token:', error);
    res.status(500).json({
      error: 'Failed to generate CSRF token',
      message: error.message
    });
  }
});

// CSRF error handler middleware
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    // Handle CSRF token errors
    console.error('CSRF token validation failed:', req.method, req.path);
    return res.status(403).json({
      error: 'CSRF token validation failed',
      message: 'Form submission rejected. Please refresh the page and try again.'
    });
  }

  // Pass other errors to the next middleware
  next(err);
});

// Routes with CSRF protection
app.use('/api/auth', csrfProtection, require('./routes/auth'));
app.use('/api/users', csrfProtection, require('./routes/users'));

// Default route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Government Nutrition Program API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Start server with database connection check
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();

    if (dbConnected) {
      // Start server
      const PORT = process.env.PORT || 3001;
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    } else {
      console.error('Server startup failed due to database connection issues');
      process.exit(1);
    }
  } catch (error) {
    console.error('Server startup error:', error.message);
    process.exit(1);
  }
};

// Start the server
startServer();
