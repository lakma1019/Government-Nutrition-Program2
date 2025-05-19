const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { auth, dataEntryOfficer, verificationOfficer } = require('../middleware/auth');
const sanitizer = require('perfect-express-sanitizer');
const { voucherSchema } = require('../schemas/voucher');

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
    // Validate request body
    const validationResult = voucherSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationResult.error.errors
      });
    }

    const { url_data, status, comment } = validationResult.data;

    // Ensure url_data is provided
    if (!url_data || !url_data.downloadURL) {
      return res.status(400).json({
        success: false,
        message: 'URL data with downloadURL is required'
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

    // Prepare URL data for storage
    let urlDataJson = url_data;
    if (typeof url_data === 'string') {
      try {
        urlDataJson = JSON.parse(url_data);
      } catch (e) {
        urlDataJson = { downloadURL: url_data };
      }
    }

    // Log the URL data for debugging
    console.log('Received Firebase URL data for voucher:', urlDataJson);

    // Insert voucher with the JSON URL data
    const [result] = await pool.query(
      `INSERT INTO vouchers
      (url_data, deo_id, vo_id, status, comment)
      VALUES (?, ?, ?, ?, ?)`,
      [
        JSON.stringify(urlDataJson),
        req.user.id,
        vo_id,
        status || 'pending',
        comment || null
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
// @desc    Get all vouchers with optional year and month filtering
// @access  Private (DEO and VO)
router.get('/', auth, async (req, res) => {
  try {
    const { year, month } = req.query;

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

    // Start building WHERE clause
    let whereConditions = [];
    let params = [];

    // Filter by role
    if (req.user.role === 'deo') {
      whereConditions.push(`v.deo_id = ?`);
      params.push(req.user.id);
    } else if (req.user.role === 'vo') {
      whereConditions.push(`v.vo_id = ?`);
      params.push(req.user.id);
    }

    // Add year and month filters if provided
    if (year && month) {
      whereConditions.push(`YEAR(v.created_at) = ? AND MONTH(v.created_at) = ?`);
      params.push(year, month);
    } else if (year) {
      whereConditions.push(`YEAR(v.created_at) = ?`);
      params.push(year);
    } else if (month) {
      whereConditions.push(`MONTH(v.created_at) = ?`);
      params.push(month);
    }

    // Add WHERE clause if there are conditions
    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    // Add ORDER BY clause
    query += ' ORDER BY v.created_at DESC';

    // Execute the query with parameters
    const [vouchers] = await pool.query(query, params);

    // Parse URL data for each voucher
    const processedVouchers = vouchers.map(voucher => {
      if (voucher.url_data && typeof voucher.url_data === 'string') {
        try {
          voucher.url_data = JSON.parse(voucher.url_data);
        } catch (e) {
          console.error('Error parsing URL data for voucher ID:', voucher.id, e);
          // If parsing fails, keep it as is
        }
      }
      return voucher;
    });

    res.json({
      success: true,
      data: processedVouchers
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

    // Parse URL data if it's stored as a string
    if (vouchers[0].url_data && typeof vouchers[0].url_data === 'string') {
      try {
        vouchers[0].url_data = JSON.parse(vouchers[0].url_data);
      } catch (e) {
        console.error('Error parsing URL data:', e);
        // If parsing fails, keep it as is
      }
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

    // Parse URL data if it's stored as a string
    let voucherData = vouchers[0];
    if (voucherData.url_data && typeof voucherData.url_data === 'string') {
      try {
        voucherData.url_data = JSON.parse(voucherData.url_data);
      } catch (e) {
        console.error('Error parsing URL data:', e);
        // If parsing fails, keep it as is
      }
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

    // Parse URL data for the updated voucher
    if (updatedVoucher[0].url_data && typeof updatedVoucher[0].url_data === 'string') {
      try {
        updatedVoucher[0].url_data = JSON.parse(updatedVoucher[0].url_data);
      } catch (e) {
        console.error('Error parsing URL data for updated voucher:', e);
        // If parsing fails, keep it as is
      }
    }

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