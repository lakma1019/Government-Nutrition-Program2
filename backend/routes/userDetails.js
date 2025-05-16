const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { auth, admin } = require('../middleware/auth');
const { z } = require('zod');

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

module.exports = router;