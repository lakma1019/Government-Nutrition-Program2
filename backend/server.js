const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Database modules
const { testConnection } = require('./config/db');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));

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
