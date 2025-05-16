const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

// Middleware to verify JWT token
const auth = async (req, res, next) => {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user by id
    const [users] = await pool.query(
      'SELECT * FROM users WHERE id = ?',
      [decoded.user.id]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Add user to request object
    req.user = users[0];
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Middleware to check if user is admin
const admin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
  next();
};

module.exports = { auth, admin };
