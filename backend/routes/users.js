const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const { auth, admin } = require('../middleware/auth');

// @route   GET /api/users
// @desc    Get all users
// @access  Private (Admin only)
router.get('/', auth, admin, async (req, res) => {
  try {
    // Get all users from database
    const [users] = await pool.query('SELECT * FROM users');

    // Return users without passwords
    const usersWithoutPasswords = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    res.json(usersWithoutPasswords);
  } catch (err) {
    console.error('Error getting users:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private (Admin only)
router.get('/:id', auth, admin, async (req, res) => {
  try {
    // Find user by id
    const [users] = await pool.query(
      'SELECT * FROM users WHERE id = ?',
      [req.params.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return user without password
    const { password, ...userWithoutPassword } = users[0];
    res.json(userWithoutPassword);
  } catch (err) {
    console.error('Error getting user:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (Admin only)
router.put('/:id', auth, admin, async (req, res) => {
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

    // Check if user exists
    const [existingUsers] = await pool.query(
      'SELECT * FROM users WHERE id = ?',
      [req.params.id]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const existingUser = existingUsers[0];

    // Check if username is already taken by another user
    if (username && username !== existingUser.username) {
      const [usersWithSameUsername] = await pool.query(
        'SELECT * FROM users WHERE username = ? AND id != ?',
        [username, req.params.id]
      );

      if (usersWithSameUsername.length > 0) {
        return res.status(400).json({ message: 'Username already exists' });
      }
    }

    // Build update query
    let updateQuery = 'UPDATE users SET ';
    const updateValues = [];
    const updateFields = [];

    if (username) {
      updateFields.push('username = ?');
      updateValues.push(username);
    }

    if (password) {
      updateFields.push('password = ?');
      updateValues.push(await bcrypt.hash(password, 10));
    }

    if (full_name !== undefined) {
      updateFields.push('full_name = ?');
      updateValues.push(full_name);
    }

    if (role) {
      updateFields.push('role = ?');
      updateValues.push(role);
    }

    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(is_active);
    }

    if (nic_number !== undefined) {
      updateFields.push('nic_number = ?');
      updateValues.push(nic_number);
    }

    if (tel_number !== undefined) {
      updateFields.push('tel_number = ?');
      updateValues.push(tel_number);
    }

    if (address !== undefined) {
      updateFields.push('address = ?');
      updateValues.push(address);
    }

    if (profession !== undefined) {
      updateFields.push('profession = ?');
      updateValues.push(profession);
    }

    // Add WHERE clause
    updateQuery += updateFields.join(', ') + ' WHERE id = ?';
    updateValues.push(req.params.id);

    // Execute update query
    await pool.query(updateQuery, updateValues);

    // Get updated user
    const [updatedUsers] = await pool.query(
      'SELECT * FROM users WHERE id = ?',
      [req.params.id]
    );

    // Return user without password
    const { password: pwd, ...userWithoutPassword } = updatedUsers[0];
    res.json({
      message: 'User updated successfully',
      user: userWithoutPassword
    });
  } catch (err) {
    console.error('Error updating user:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private (Admin only)
router.delete('/:id', auth, admin, async (req, res) => {
  try {
    // Check if user exists
    const [existingUsers] = await pool.query(
      'SELECT * FROM users WHERE id = ?',
      [req.params.id]
    );

    if (existingUsers.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete user
    await pool.query(
      'DELETE FROM users WHERE id = ?',
      [req.params.id]
    );

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
