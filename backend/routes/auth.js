const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { auth } = require('../middleware/auth');

// @route   POST /api/auth/register
// @desc    Register a user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const {
      username,
      password,
      full_name,
      role,
      is_active,
      nic_number,
      tel_number,
      address,
      profession
    } = req.body;

    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

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

    // Generate unique ID
    const userId = Date.now().toString();

    // Insert new user
    const [result] = await pool.query(
      `INSERT INTO users
      (id, username, password, full_name, role, is_active, nic_number, tel_number, address, profession)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        username,
        hashedPassword,
        full_name || '',
        role || 'verificationOfficer',
        is_active !== undefined ? is_active : true,
        nic_number || '',
        tel_number || '',
        address || '',
        profession || ''
      ]
    );

    // Get the newly created user
    const [newUsers] = await pool.query(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    const newUser = newUsers[0];

    // Create JWT token
    const payload = {
      user: {
        id: newUser.id,
        username: newUser.username,
        role: newUser.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN },
      (err, token) => {
        if (err) throw err;

        // Return user without password
        const { password, ...userWithoutPassword } = newUser;
        res.status(201).json({
          message: 'User registered successfully',
          token,
          user: userWithoutPassword
        });
      }
    );
  } catch (err) {
    console.error('Error in register:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Find user
    const [users] = await pool.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = users[0];

    // Check if user is active
    if (!user.is_active) {
      return res.status(400).json({ message: 'Account is inactive' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const payload = {
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN },
      (err, token) => {
        if (err) throw err;

        // Return user without password
        const { password, ...userWithoutPassword } = user;
        res.json({
          message: 'Login successful',
          token,
          user: userWithoutPassword
        });
      }
    );
  } catch (err) {
    console.error('Error in login:', err.message);
    res.status(500).json({ message: 'Server error' });
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
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];

    // Return user without password
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (err) {
    console.error('Error in get me:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
