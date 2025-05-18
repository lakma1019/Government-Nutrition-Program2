const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { auth, dataEntryOfficer } = require('../middleware/auth');
const { gazetteSchema } = require('../schemas/gazette');

// @route   GET /api/gazettes
// @desc    Get all gazettes
// @access  Public
router.get('/', async (req, res) => {
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

// @route   GET /api/gazettes/:id
// @desc    Get gazette by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get gazette by ID
    const [gazettes] = await pool.query(
      'SELECT * FROM gazette WHERE id = ?',
      [id]
    );

    if (gazettes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Gazette not found'
      });
    }

    res.json({
      success: true,
      data: gazettes[0]
    });
  } catch (err) {
    console.error('Error getting gazette:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/gazettes
// @desc    Create a new gazette
// @access  Public (for now, can be restricted later)
router.post('/', async (req, res) => {
  try {
    // Validate request body
    const validationResult = gazetteSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationResult.error.errors
      });
    }

    const {
      gazette_name,
      publish_date,
      url_data,  // This should be the Firebase URL data as JSON
      uploader_name,
      is_active
    } = validationResult.data;

    // Ensure url_data is properly formatted as JSON
    let urlDataJson = url_data;

    // If url_data is a string with a URL, convert it to a JSON object
    if (typeof url_data === 'string') {
      try {
        urlDataJson = JSON.parse(url_data);
      } catch (e) {
        // If parsing fails, create a simple object with the URL
        urlDataJson = { downloadURL: url_data };
      }
    }

    // If url_data is an object but doesn't have downloadURL, check for url property
    if (typeof urlDataJson === 'object' && !urlDataJson.downloadURL && urlDataJson.url) {
      urlDataJson.downloadURL = urlDataJson.url;
    }

    // Log the URL data for debugging
    console.log('Received Firebase URL data:', urlDataJson);

    // Insert gazette with the JSON URL data
    const [result] = await pool.query(
      `INSERT INTO gazette
       (gazette_name, publish_date, url_data, uploader_name, is_active)
       VALUES (?, ?, ?, ?, ?)`,
      [gazette_name, publish_date, JSON.stringify(urlDataJson), uploader_name, is_active]
    );

    // Get the inserted gazette
    const [gazettes] = await pool.query(
      'SELECT * FROM gazette WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Gazette created successfully',
      data: gazettes[0]
    });
  } catch (err) {
    console.error('Error creating gazette:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/gazettes/:id
// @desc    Update a gazette
// @access  Public (for now, can be restricted later)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate request body
    const validationResult = gazetteSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationResult.error.errors
      });
    }

    const {
      gazette_name,
      publish_date,
      url_data,  // This should be the Firebase URL data as JSON
      uploader_name,
      is_active
    } = validationResult.data;

    // Ensure url_data is properly formatted as JSON
    let urlDataJson = url_data;

    // If url_data is a string with a URL, convert it to a JSON object
    if (typeof url_data === 'string') {
      try {
        urlDataJson = JSON.parse(url_data);
      } catch (e) {
        // If parsing fails, create a simple object with the URL
        urlDataJson = { downloadURL: url_data };
      }
    }

    // If url_data is an object but doesn't have downloadURL, check for url property
    if (typeof urlDataJson === 'object' && !urlDataJson.downloadURL && urlDataJson.url) {
      urlDataJson.downloadURL = urlDataJson.url;
    }

    // Log the URL data for debugging
    console.log('Received Firebase URL data for update:', urlDataJson);

    // Check if gazette exists
    const [existingGazettes] = await pool.query(
      'SELECT * FROM gazette WHERE id = ?',
      [id]
    );

    if (existingGazettes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Gazette not found'
      });
    }

    // Update gazette with the JSON URL data
    await pool.query(
      `UPDATE gazette
       SET gazette_name = ?, publish_date = ?, url_data = ?, uploader_name = ?, is_active = ?
       WHERE id = ?`,
      [gazette_name, publish_date, JSON.stringify(urlDataJson), uploader_name, is_active, id]
    );

    // Get the updated gazette
    const [gazettes] = await pool.query(
      'SELECT * FROM gazette WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Gazette updated successfully',
      data: gazettes[0]
    });
  } catch (err) {
    console.error('Error updating gazette:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/gazettes/:id
// @desc    Delete a gazette
// @access  Public (for now, can be restricted later)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if gazette exists
    const [existingGazettes] = await pool.query(
      'SELECT * FROM gazette WHERE id = ?',
      [id]
    );

    if (existingGazettes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Gazette not found'
      });
    }

    // Delete gazette
    await pool.query(
      'DELETE FROM gazette WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Gazette deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting gazette:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Test endpoints are now in testRoutes.js

module.exports = router;
