const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const { auth } = require('../middleware/auth');

// Helper function to check if there's an active user with a specific role
const checkActiveUserByRole = async (connection, role, userId = null) => {
  let query = 'SELECT id, username FROM users WHERE role = ? AND is_active = "yes"';
  let params = [role];

  // If userId is provided, exclude that user from the check
  if (userId) {
    query += ' AND id != ?';
    params.push(userId);
  }

  const [activeUsers] = await connection.query(query, params);
  return activeUsers.length > 0 ? activeUsers[0] : null;
};

// @route   GET /api/users
// @desc    Get all users
// @access  Private (Authentication required)
router.get('/', auth, async (req, res) => {
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
// @access  Private (Authentication required)
router.get('/:id', auth, async (req, res) => {
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
// @access  Private (Authentication required)
router.put('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin or updating their own account
    if (req.user.role !== 'admin' && req.user.id !== parseInt(req.params.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own account unless you are an admin.'
      });
    }
    console.log('User update request received for ID:', req.params.id);
    console.log('Request body:', JSON.stringify(req.body));

    const userId = req.params.id;

    // Find user by id to get current status and role
    const [users] = await pool.query(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const currentUser = users[0];
    const currentIsActive = currentUser.is_active;
    const currentRole = currentUser.role;

    const {
      username,
      password,
      role,
      is_active,
      nic_number,
      tel_number,
      address,
      profession
    } = req.body;

    // Check if trying to activate a user when another one is already active with the same role
    if (is_active === 'yes' && (currentIsActive !== 'yes' || role !== currentRole)) {
      const connection = await pool.getConnection();
      try {
        const activeUser = await checkActiveUserByRole(connection, role, userId);
        if (activeUser) {
          connection.release();
          return res.status(400).json({
            success: false,
            message: `Only one active ${role.toUpperCase()} is allowed. Please deactivate the current active ${role.toUpperCase()} first.`,
            activeUser: {
              id: activeUser.id,
              username: activeUser.username
            }
          });
        }
        connection.release();
      } catch (error) {
        connection.release();
        throw error;
      }
    }

    // Check if user exists
    const [existingUsers] = await pool.query(
      'SELECT * FROM users WHERE id = ?',
      [req.params.id]
    );

    if (existingUsers.length === 0) {
      console.log('User not found with ID:', req.params.id);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Existing user found, proceeding with update');

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
      console.log('Password update requested');
      updateFields.push('password = ?');
      const hashedPassword = await bcrypt.hash(password, 10);
      updateValues.push(hashedPassword);
      console.log('Password hashed successfully');
    } else {
      console.log('No password update requested');
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

    console.log('Update query:', updateQuery);
    console.log('Update values:', updateValues);

    // Check if there are any fields to update
    if (updateFields.length === 0) {
      console.log('No fields to update, returning existing user');
      const { password: pwd, ...userWithoutPassword } = existingUsers[0];
      return res.json({
        message: 'User updated successfully (no changes)',
        user: userWithoutPassword
      });
    }

    // Execute update query
    const updateResult = await pool.query(updateQuery, updateValues);
    console.log('Update result:', JSON.stringify(updateResult));

    // Get updated user
    const [updatedUsers] = await pool.query(
      'SELECT * FROM users WHERE id = ?',
      [req.params.id]
    );

    console.log('Updated user retrieved successfully');

    // Return user without password
    const { password: pwd, ...userWithoutPassword } = updatedUsers[0];
    console.log('Sending success response');
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
router.delete('/:id', auth, async (req, res) => {
  try {
    // Only admins can delete users
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can delete users.'
      });
    }
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
