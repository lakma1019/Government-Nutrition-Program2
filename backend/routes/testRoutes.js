const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

// @route   GET /api/test-gazette-table
// @desc    Test endpoint to get all gazettes (for development)
// @access  Public
router.get('/test-gazette-table', async (req, res) => {
  try {
    // Get all gazettes sorted by created_at (newest first)
    const [gazettes] = await pool.query(
      'SELECT * FROM gazette ORDER BY created_at DESC'
    );

    res.json({
      success: true,
      data: gazettes
    });
  } catch (err) {
    console.error('Error getting gazettes:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
