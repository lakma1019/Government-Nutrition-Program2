const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { auth, admin } = require('../middleware/auth');
const { z } = require('zod');

// Helper function to check if user has permission to access details
const hasPermission = (req, userId) => {
  // Admin can access any user's details
  if (req.user.role === 'admin') return true;

  // Users can access their own details
  return req.user.id === parseInt(userId);
};

// @route   GET /api/user-details/active/deo
// @desc    Get active DEO user details
// @access  Public
router.get('/active/deo', async (req, res) => {
  try {
    // Get active DEO user
    const [activeUsers] = await pool.query(`
      SELECT u.id, u.username, u.role, u.is_active, d.full_name, d.nic_number, d.tel_number, d.address
      FROM users u
      JOIN deo_details d ON u.id = d.user_id
      WHERE u.role = 'deo' AND u.is_active = 'yes' AND d.is_active = 'yes'
      LIMIT 1
    `);

    if (activeUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active DEO found'
      });
    }

    res.json({
      success: true,
      data: activeUsers[0]
    });
  } catch (err) {
    console.error('Error getting active DEO:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/user-details/active/vo
// @desc    Get active VO user details
// @access  Public
router.get('/active/vo', async (req, res) => {
  try {
    // Get active VO user
    const [activeUsers] = await pool.query(`
      SELECT u.id, u.username, u.role, u.is_active, v.full_name, v.nic_number, v.tel_number, v.address
      FROM users u
      JOIN vo_details v ON u.id = v.user_id
      WHERE u.role = 'vo' AND u.is_active = 'yes' AND v.is_active = 'yes'
      LIMIT 1
    `);

    if (activeUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active VO found'
      });
    }

    res.json({
      success: true,
      data: activeUsers[0]
    });
  } catch (err) {
    console.error('Error getting active VO:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Validation schemas
const deoDetailsSchema = z.object({
  user_id: z.number().int().positive(),
  full_name: z.string().min(1, { message: 'Full name is required' }),
  nic_number: z.string().optional(),
  tel_number: z.string().optional(),
  address: z.string().optional(),
  is_active: z.enum(['yes', 'no']).default('yes')
});

const voDetailsSchema = z.object({
  user_id: z.number().int().positive(),
  full_name: z.string().min(1, { message: 'Full name is required' }),
  nic_number: z.string().optional(),
  tel_number: z.string().optional(),
  address: z.string().optional(),
  is_active: z.enum(['yes', 'no']).default('yes')
});

// @route   POST /api/user-details/deo
// @desc    Add DEO details
// @access  Private (Authentication required, but no role restriction)
router.post('/deo', auth, async (req, res) => {
  try {
    // Validate request body
    const validationResult = deoDetailsSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Validation error',
        errors: validationResult.error.errors
      });
    }

    const { user_id, full_name, nic_number, tel_number, address, is_active } = validationResult.data;

    // Check if user exists
    const [users] = await pool.query(
      'SELECT * FROM users WHERE id = ?',
      [user_id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Security check: Only allow admins or the user themselves to add their details
    if (req.user.role !== 'admin' && req.user.id !== user_id) {
      return res.status(403).json({
        message: 'Access denied. You can only add details for yourself unless you are an admin.'
      });
    }

    // Check if user is a DEO
    if (users[0].role !== 'deo') {
      return res.status(400).json({ message: 'User is not a Data Entry Officer' });
    }

    // Check if DEO details already exist for this user
    const [existingDetails] = await pool.query(
      'SELECT * FROM deo_details WHERE user_id = ?',
      [user_id]
    );

    if (existingDetails.length > 0) {
      return res.status(400).json({ message: 'DEO details already exist for this user' });
    }

    // Check if NIC number is unique if provided
    if (nic_number) {
      const [existingNIC] = await pool.query(
        'SELECT * FROM deo_details WHERE nic_number = ?',
        [nic_number]
      );

      if (existingNIC.length > 0) {
        return res.status(400).json({ message: 'NIC number already exists' });
      }
    }

    // Insert DEO details
    const [result] = await pool.query(
      `INSERT INTO deo_details
      (user_id, full_name, nic_number, tel_number, address, is_active)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [user_id, full_name, nic_number, tel_number, address, is_active]
    );

    // Get the newly created DEO details
    const [newDetails] = await pool.query(
      'SELECT * FROM deo_details WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'DEO details added successfully',
      details: newDetails[0]
    });
  } catch (err) {
    console.error('Error adding DEO details:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/user-details/vo
// @desc    Add VO details
// @access  Private (Authentication required, but no role restriction)
router.post('/vo', auth, async (req, res) => {
  try {
    // Validate request body
    const validationResult = voDetailsSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Validation error',
        errors: validationResult.error.errors
      });
    }

    const { user_id, full_name, nic_number, tel_number, address, is_active } = validationResult.data;

    // Check if user exists
    const [users] = await pool.query(
      'SELECT * FROM users WHERE id = ?',
      [user_id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Security check: Only allow admins or the user themselves to add their details
    if (req.user.role !== 'admin' && req.user.id !== user_id) {
      return res.status(403).json({
        message: 'Access denied. You can only add details for yourself unless you are an admin.'
      });
    }

    // Check if user is a VO
    if (users[0].role !== 'vo') {
      return res.status(400).json({ message: 'User is not a Verification Officer' });
    }

    // Check if VO details already exist for this user
    const [existingDetails] = await pool.query(
      'SELECT * FROM vo_details WHERE user_id = ?',
      [user_id]
    );

    if (existingDetails.length > 0) {
      return res.status(400).json({ message: 'VO details already exist for this user' });
    }

    // Check if NIC number is unique if provided
    if (nic_number) {
      const [existingNIC] = await pool.query(
        'SELECT * FROM vo_details WHERE nic_number = ?',
        [nic_number]
      );

      if (existingNIC.length > 0) {
        return res.status(400).json({ message: 'NIC number already exists' });
      }
    }

    // Insert VO details
    const [result] = await pool.query(
      `INSERT INTO vo_details
      (user_id, full_name, nic_number, tel_number, address, is_active)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [user_id, full_name, nic_number, tel_number, address, is_active]
    );

    // Get the newly created VO details
    const [newDetails] = await pool.query(
      'SELECT * FROM vo_details WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'VO details added successfully',
      details: newDetails[0]
    });
  } catch (err) {
    console.error('Error adding VO details:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/user-details/deo/:userId
// @desc    Get DEO details by user ID
// @access  Private (Admin or self)
router.get('/deo/:userId', auth, async (req, res) => {
  try {
    const userId = req.params.userId;

    // Check permission
    if (!hasPermission(req, userId)) {
      return res.status(403).json({
        message: 'Access denied. You can only view your own details unless you are an admin.'
      });
    }

    // Get DEO details
    const [deoDetails] = await pool.query(
      'SELECT * FROM deo_details WHERE user_id = ?',
      [userId]
    );

    if (deoDetails.length === 0) {
      return res.status(404).json({ message: 'DEO details not found' });
    }

    // Get basic user info
    const [users] = await pool.query(
      'SELECT id, username, role, is_active, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Combine user and DEO details
    const userDetails = {
      ...users[0],
      deoDetails: deoDetails[0]
    };

    res.json({
      success: true,
      userDetails
    });
  } catch (err) {
    console.error('Error getting DEO details:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/user-details/vo/:userId
// @desc    Get VO details by user ID
// @access  Private (Admin or self)
router.get('/vo/:userId', auth, async (req, res) => {
  try {
    const userId = req.params.userId;

    // Check permission
    if (!hasPermission(req, userId)) {
      return res.status(403).json({
        message: 'Access denied. You can only view your own details unless you are an admin.'
      });
    }

    // Get VO details
    const [voDetails] = await pool.query(
      'SELECT * FROM vo_details WHERE user_id = ?',
      [userId]
    );

    if (voDetails.length === 0) {
      return res.status(404).json({ message: 'VO details not found' });
    }

    // Get basic user info
    const [users] = await pool.query(
      'SELECT id, username, role, is_active, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Combine user and VO details
    const userDetails = {
      ...users[0],
      voDetails: voDetails[0]
    };

    res.json({
      success: true,
      userDetails
    });
  } catch (err) {
    console.error('Error getting VO details:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/user-details/deo/:userId
// @desc    Update DEO details
// @access  Private (Admin or self)
router.put('/deo/:userId', auth, async (req, res) => {
  try {
    const userId = req.params.userId;

    // Check permission
    if (!hasPermission(req, userId)) {
      return res.status(403).json({
        message: 'Access denied. You can only update your own details unless you are an admin.'
      });
    }

    // Validate request body
    const validationResult = deoDetailsSchema.safeParse({
      ...req.body,
      user_id: parseInt(userId) // Ensure user_id is set correctly
    });

    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Validation error',
        errors: validationResult.error.errors
      });
    }

    const { full_name, nic_number, tel_number, address, is_active } = validationResult.data;

    // Check if user exists
    const [users] = await pool.query(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is a DEO
    if (users[0].role !== 'deo') {
      return res.status(400).json({ message: 'User is not a Data Entry Officer' });
    }

    // Check if DEO details exist
    const [existingDetails] = await pool.query(
      'SELECT * FROM deo_details WHERE user_id = ?',
      [userId]
    );

    if (existingDetails.length === 0) {
      // If details don't exist, create them
      const [result] = await pool.query(
        `INSERT INTO deo_details
        (user_id, full_name, nic_number, tel_number, address, is_active)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, full_name, nic_number, tel_number, address, is_active]
      );

      // Get the newly created DEO details
      const [newDetails] = await pool.query(
        'SELECT * FROM deo_details WHERE id = ?',
        [result.insertId]
      );

      return res.status(201).json({
        success: true,
        message: 'DEO details created successfully',
        details: newDetails[0]
      });
    }

    // Check if NIC number is unique if it's being changed
    if (nic_number && nic_number !== existingDetails[0].nic_number) {
      const [existingNIC] = await pool.query(
        'SELECT * FROM deo_details WHERE nic_number = ? AND user_id != ?',
        [nic_number, userId]
      );

      if (existingNIC.length > 0) {
        return res.status(400).json({ message: 'NIC number already exists' });
      }
    }

    // Update DEO details
    await pool.query(
      `UPDATE deo_details
      SET full_name = ?, nic_number = ?, tel_number = ?, address = ?, is_active = ?
      WHERE user_id = ?`,
      [full_name, nic_number, tel_number, address, is_active, userId]
    );

    // Get the updated DEO details
    const [updatedDetails] = await pool.query(
      'SELECT * FROM deo_details WHERE user_id = ?',
      [userId]
    );

    res.json({
      success: true,
      message: 'DEO details updated successfully',
      details: updatedDetails[0]
    });
  } catch (err) {
    console.error('Error updating DEO details:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/user-details/vo/:userId
// @desc    Update VO details
// @access  Private (Admin or self)
router.put('/vo/:userId', auth, async (req, res) => {
  try {
    const userId = req.params.userId;

    // Check permission
    if (!hasPermission(req, userId)) {
      return res.status(403).json({
        message: 'Access denied. You can only update your own details unless you are an admin.'
      });
    }

    // Validate request body
    const validationResult = voDetailsSchema.safeParse({
      ...req.body,
      user_id: parseInt(userId) // Ensure user_id is set correctly
    });

    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Validation error',
        errors: validationResult.error.errors
      });
    }

    const { full_name, nic_number, tel_number, address, is_active } = validationResult.data;

    // Check if user exists
    const [users] = await pool.query(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is a VO
    if (users[0].role !== 'vo') {
      return res.status(400).json({ message: 'User is not a Verification Officer' });
    }

    // Check if VO details exist
    const [existingDetails] = await pool.query(
      'SELECT * FROM vo_details WHERE user_id = ?',
      [userId]
    );

    if (existingDetails.length === 0) {
      // If details don't exist, create them
      const [result] = await pool.query(
        `INSERT INTO vo_details
        (user_id, full_name, nic_number, tel_number, address, is_active)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, full_name, nic_number, tel_number, address, is_active]
      );

      // Get the newly created VO details
      const [newDetails] = await pool.query(
        'SELECT * FROM vo_details WHERE id = ?',
        [result.insertId]
      );

      return res.status(201).json({
        success: true,
        message: 'VO details created successfully',
        details: newDetails[0]
      });
    }

    // Check if NIC number is unique if it's being changed
    if (nic_number && nic_number !== existingDetails[0].nic_number) {
      const [existingNIC] = await pool.query(
        'SELECT * FROM vo_details WHERE nic_number = ? AND user_id != ?',
        [nic_number, userId]
      );

      if (existingNIC.length > 0) {
        return res.status(400).json({ message: 'NIC number already exists' });
      }
    }

    // Update VO details
    await pool.query(
      `UPDATE vo_details
      SET full_name = ?, nic_number = ?, tel_number = ?, address = ?, is_active = ?
      WHERE user_id = ?`,
      [full_name, nic_number, tel_number, address, is_active, userId]
    );

    // Get the updated VO details
    const [updatedDetails] = await pool.query(
      'SELECT * FROM vo_details WHERE user_id = ?',
      [userId]
    );

    res.json({
      success: true,
      message: 'VO details updated successfully',
      details: updatedDetails[0]
    });
  } catch (err) {
    console.error('Error updating VO details:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;