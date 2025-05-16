const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { mapDbRoleToFrontend } = require('../schemas/auth');

// Middleware to verify JWT token
const auth = async (req, res, next) => {
  // Get token from header or Authorization header
  const token = req.header('x-auth-token') || req.header('Authorization')?.replace('Bearer ', '');

  // Check if no token
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'defaultsecret');

    // Find user by id
    const [users] = await pool.query(
      'SELECT * FROM users WHERE id = ?',
      [decoded.user.id]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    // Check if user is active
    if (users[0].is_active === 'no') {
      return res.status(401).json({ success: false, message: 'Account is inactive' });
    }

    // Add user to request object
    req.user = users[0];
    next();
  } catch (err) {
    console.error('Token verification error:', err.message);
    res.status(401).json({ success: false, message: 'Token is not valid' });
  }
};

// Middleware to check if user is admin
const admin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
  }
  next();
};

// Middleware to check if user is data entry officer
const dataEntryOfficer = (req, res, next) => {
  if (!req.user || req.user.role !== 'deo') {
    return res.status(403).json({ success: false, message: 'Access denied. Data Entry Officer privileges required.' });
  }
  next();
};

// Middleware to check if user is verification officer
const verificationOfficer = (req, res, next) => {
  if (!req.user || req.user.role !== 'vo') {
    return res.status(403).json({ success: false, message: 'Access denied. Verification Officer privileges required.' });
  }
  next();
};

module.exports = { auth, admin, dataEntryOfficer, verificationOfficer };
