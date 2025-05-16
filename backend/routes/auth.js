const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { auth } = require('../middleware/auth');
const { loginSchema, userSchema, mapDbRoleToFrontend } = require('../schemas/auth');

// @route   POST /api/auth/register
// @desc    Register a user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    // Validate request body against schema
    const validationResult = userSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Validation error',
        errors: validationResult.error.errors
      });
    }

    const {
      username,
      password,
      role,
      is_active
    } = validationResult.data;

    // Check if user already exists
    const [existingUsers] = await pool.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const [result] = await pool.query(
      `INSERT INTO users
      (username, password, role, is_active)
      VALUES (?, ?, ?, ?)`,
      [
        username,
        hashedPassword,
        role,
        is_active
      ]
    );

    // Get the newly created user
    const [newUsers] = await pool.query(
      'SELECT * FROM users WHERE id = ?',
      [result.insertId]
    );

    const newUser = newUsers[0];

    // Create JWT token
    const payload = {
      user: {
        id: newUser.id,
        username: newUser.username,
        role: mapDbRoleToFrontend(newUser.role)
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'defaultsecret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' },
      (err, token) => {
        if (err) throw err;

        // Return user without password
        const { password, ...userWithoutPassword } = newUser;
        res.status(201).json({
          success: true,
          message: 'User registered successfully',
          token,
          user: {
            ...userWithoutPassword,
            role: mapDbRoleToFrontend(newUser.role)
          }
        });
      }
    );
  } catch (err) {
    console.error('Error in register:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    // Validate request body against schema
    const validationResult = loginSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationResult.error.errors
      });
    }

    const { username, password } = validationResult.data;

    // Find user
    const [users] = await pool.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    const user = users[0];

    // Check if user is active
    if (user.is_active === 'no') {
      return res.status(400).json({ success: false, message: 'Account is inactive' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // Map database role to frontend role
    const frontendRole = mapDbRoleToFrontend(user.role);

    // Create JWT token
    const payload = {
      user: {
        id: user.id,
        username: user.username,
        role: frontendRole
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'defaultsecret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' },
      (err, token) => {
        if (err) throw err;

        // Return user without password
        const { password, ...userWithoutPassword } = user;

        // Get user details from related tables if needed
        // For example, if it's a DEO, get details from deo_details table

        res.json({
          success: true,
          message: 'Login successful',
          token,
          user: {
            ...userWithoutPassword,
            role: frontendRole
          }
        });
      }
    );
  } catch (err) {
    console.error('Error in login:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    // Get fresh user data from database
    const [users] = await pool.query(
      'SELECT * FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = users[0];

    // Map database role to frontend role
    const frontendRole = mapDbRoleToFrontend(user.role);

    // Return user without password
    const { password, ...userWithoutPassword } = user;
    res.json({
      success: true,
      user: {
        ...userWithoutPassword,
        role: frontendRole
      }
    });
  } catch (err) {
    console.error('Error in get me:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/auth/refresh-token
// @desc    Refresh JWT token
// @access  Private
router.post('/refresh-token', auth, async (req, res) => {
  try {
    // Create a new token with the existing user data
    const payload = {
      user: {
        id: req.user.id,
        username: req.user.username,
        role: mapDbRoleToFrontend(req.user.role)
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'defaultsecret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' },
      (err, token) => {
        if (err) throw err;
        res.json({
          success: true,
          token
        });
      }
    );
  } catch (err) {
    console.error('Error refreshing token:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
