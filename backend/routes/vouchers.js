const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { auth, dataEntryOfficer, verificationOfficer } = require('../middleware/auth');
const sanitizer = require('perfect-express-sanitizer');

// Helper function to sanitize input
const sanitizeInput = (input) => {
  if (!input) return input;
  return sanitizer.sanitize.prepareSanitize(input, {
    xss: true,
    noSql: true,
    sql: true,
    level: 5
  });
};

// @route   POST /api/vouchers
// @desc    Create a new voucher entry (DEO sends to VO)
// @access  Private (DEO only)
router.post('/', auth, dataEntryOfficer, async (req, res) => {
  try {
    const { file_path } = req.body;

    if (!file_path) {
      return res.status(400).json({
        success: false,
        message: 'File path is required'
      });
    }

    // Get active VO
    const [activeVO] = await pool.query(
      `SELECT u.id 
       FROM users u 
       JOIN vo_details v ON u.id = v.user_id 
       WHERE u.role = 'vo' AND v.is_active = 'yes'`
    );

    if (activeVO.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No active Verification Officer found'
      });
    }

    const vo_id = activeVO[0].id;

    // Insert voucher with default status 'pending'
    const [result] = await pool.query(
      `INSERT INTO vouchers
      (file_path, deo_id, vo_id, status)
      VALUES (?, ?, ?, 'pending')`,
      [
        sanitizeInput(file_path),
        req.user.id,
        vo_id
      ]
    );

    // Get the newly created voucher
    const [newVoucher] = await pool.query(
      'SELECT * FROM vouchers WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Voucher sent to Verification Officer successfully',
      data: newVoucher[0]
    });
  } catch (err) {
    console.error('Error creating voucher:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/vouchers
// @desc    Get all vouchers
// @access  Private (DEO and VO)
router.get('/', auth, async (req, res) => {
  try {
    let query = `
      SELECT v.*, 
             u_deo.username as deo_username, 
             u_vo.username as vo_username,
             deo.full_name as deo_full_name,
             vo.full_name as vo_full_name
      FROM vouchers v
      LEFT JOIN users u_deo ON v.deo_id = u_deo.id
      LEFT JOIN users u_vo ON v.vo_id = u_vo.id
      LEFT JOIN deo_details deo ON u_deo.id = deo.user_id
      LEFT JOIN vo_details vo ON u_vo.id = vo.user_id
    `;
    
    // Filter by role
    if (req.user.role === 'deo') {
      query += ` WHERE v.deo_id = ${req.user.id}`;
    } else if (req.user.role === 'vo') {
      query += ` WHERE v.vo_id = ${req.user.id}`;
    }
    
    query += ' ORDER BY v.created_at DESC';
    
    const [vouchers] = await pool.query(query);

    res.json({
      success: true,
      data: vouchers
    });
  } catch (err) {
    console.error('Error getting vouchers:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/vouchers/:id
// @desc    Get voucher by ID
// @access  Private (DEO and VO)
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [vouchers] = await pool.query(
      `SELECT v.*, 
              u_deo.username as deo_username, 
              u_vo.username as vo_username,
              deo.full_name as deo_full_name,
              vo.full_name as vo_full_name
       FROM vouchers v
       LEFT JOIN users u_deo ON v.deo_id = u_deo.id
       LEFT JOIN users u_vo ON v.vo_id = u_vo.id
       LEFT JOIN deo_details deo ON u_deo.id = deo.user_id
       LEFT JOIN vo_details vo ON u_vo.id = vo.user_id
       WHERE v.id = ?`,
      [id]
    );

    if (vouchers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Voucher not found'
      });
    }

    // Check if user has access to this voucher
    if (req.user.role === 'deo' && vouchers[0].deo_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (req.user.role === 'vo' && vouchers[0].vo_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: vouchers[0]
    });
  } catch (err) {
    console.error('Error getting voucher:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/vouchers/:id/verify
// @desc    Verify or reject a voucher
// @access  Private (VO only)
router.put('/:id/verify', auth, verificationOfficer, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comment } = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "approved" or "rejected"'
      });
    }

    // Check if voucher exists and is assigned to this VO
    const [vouchers] = await pool.query(
      'SELECT * FROM vouchers WHERE id = ? AND vo_id = ?',
      [id, req.user.id]
    );

    if (vouchers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Voucher not found or not assigned to you'
      });
    }

    // Update voucher status
    await pool.query(
      'UPDATE vouchers SET status = ?, comment = ? WHERE id = ?',
      [status, comment ? sanitizeInput(comment) : null, id]
    );

    // Get the updated voucher
    const [updatedVoucher] = await pool.query(
      'SELECT * FROM vouchers WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: `Voucher ${status === 'approved' ? 'approved' : 'rejected'} successfully`,
      data: updatedVoucher[0]
    });
  } catch (err) {
    console.error('Error updating voucher:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
