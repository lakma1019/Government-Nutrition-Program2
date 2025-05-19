const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { auth, dataEntryOfficer } = require('../middleware/auth');
const { dailyDataSchema } = require('../schemas/dailyData');

// @route   GET /api/daily-data
// @desc    Get all daily data entries with optional year and month filtering
// @access  Public (for progress report)
router.get('/', async (req, res) => {
  try {
    const { year, month } = req.query;

    let query = 'SELECT * FROM daily_data';
    let params = [];

    // Add WHERE clause for year and month filtering if provided
    if (year && month) {
      // Filter by both year and month
      query += ' WHERE YEAR(date) = ? AND MONTH(date) = ?';
      params = [year, month];
    } else if (year) {
      // Filter by year only
      query += ' WHERE YEAR(date) = ?';
      params = [year];
    } else if (month) {
      // Filter by month only
      query += ' WHERE MONTH(date) = ?';
      params = [month];
    }

    // Add ORDER BY clause
    query += ' ORDER BY date ASC';

    // Execute the query with parameters
    const [dailyData] = await pool.query(query, params);

    res.json({
      success: true,
      data: dailyData
    });
  } catch (err) {
    console.error('Error getting daily data:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/daily-data/:id
// @desc    Get daily data entry by ID
// @access  Private (DEO only)
router.get('/:id', auth, dataEntryOfficer, async (req, res) => {
  try {
    const { id } = req.params;

    // Get daily data entry by ID
    const [dailyData] = await pool.query(
      'SELECT * FROM daily_data WHERE id = ?',
      [id]
    );

    if (dailyData.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Daily data entry not found'
      });
    }

    res.json({
      success: true,
      data: dailyData[0]
    });
  } catch (err) {
    console.error('Error getting daily data entry:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/daily-data
// @desc    Create a new daily data entry
// @access  Private (DEO only)
router.post('/', auth, dataEntryOfficer, async (req, res) => {
  try {
    // Validate request body
    const validationResult = dailyDataSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationResult.error.errors
      });
    }

    const {
      date,
      female,
      male,
      total,
      unit_price,
      amount,
      method_of_rice_received,
      meal_recipe,
      number_of_eggs,
      fruits
    } = validationResult.data;

    // Insert new daily data entry
    const [result] = await pool.query(
      `INSERT INTO daily_data
      (date, female, male, total, unit_price, amount, method_of_rice_received, meal_recipe, number_of_eggs, fruits)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [date, female, male, total, unit_price, amount, method_of_rice_received, meal_recipe, number_of_eggs, fruits]
    );

    // Get the newly created entry
    const [newEntry] = await pool.query(
      'SELECT * FROM daily_data WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Daily data entry created successfully',
      data: newEntry[0]
    });
  } catch (err) {
    console.error('Error creating daily data entry:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/daily-data/:id
// @desc    Update a daily data entry
// @access  Private (DEO only)
router.put('/:id', auth, dataEntryOfficer, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate request body
    const validationResult = dailyDataSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationResult.error.errors
      });
    }

    const {
      date,
      female,
      male,
      total,
      unit_price,
      amount,
      method_of_rice_received,
      meal_recipe,
      number_of_eggs,
      fruits
    } = validationResult.data;

    // Check if entry exists
    const [existingEntries] = await pool.query(
      'SELECT * FROM daily_data WHERE id = ?',
      [id]
    );

    if (existingEntries.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Daily data entry not found'
      });
    }

    // Update daily data entry
    await pool.query(
      `UPDATE daily_data
      SET date = ?, female = ?, male = ?, total = ?, unit_price = ?, amount = ?,
      method_of_rice_received = ?, meal_recipe = ?, number_of_eggs = ?, fruits = ?
      WHERE id = ?`,
      [date, female, male, total, unit_price, amount, method_of_rice_received, meal_recipe, number_of_eggs, fruits, id]
    );

    // Get the updated entry
    const [updatedEntry] = await pool.query(
      'SELECT * FROM daily_data WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Daily data entry updated successfully',
      data: updatedEntry[0]
    });
  } catch (err) {
    console.error('Error updating daily data entry:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/daily-data/:id
// @desc    Delete a daily data entry
// @access  Private (DEO only)
router.delete('/:id', auth, dataEntryOfficer, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if entry exists
    const [existingEntries] = await pool.query(
      'SELECT * FROM daily_data WHERE id = ?',
      [id]
    );

    if (existingEntries.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Daily data entry not found'
      });
    }

    // Delete daily data entry
    await pool.query(
      'DELETE FROM daily_data WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Daily data entry deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting daily data entry:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
