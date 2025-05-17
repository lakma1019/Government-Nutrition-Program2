const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { auth, dataEntryOfficer } = require('../middleware/auth');
const { dailyDataSchema, credentialsSchema, dailyDataWithCredentialsSchema } = require('../schemas/dailyData');
const bcrypt = require('bcryptjs');

// Helper function to authenticate user with username and password
const authenticateUser = async (username, password) => {
  try {
    // For development purposes, allow a hardcoded user for the frontend
    if (username === 'dataeo1' && password === 'dataeo1123') {
      console.log('Using hardcoded DEO credentials for development');
      return {
        success: true,
        user: {
          id: 999,
          username: 'dataeo1',
          role: 'deo',
          is_active: 'yes'
        }
      };
    }

    // Find user in database
    const [users] = await pool.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return { success: false, message: 'Invalid credentials' };
    }

    const user = users[0];

    // Check if user is active
    if (user.is_active === 'no') {
      return { success: false, message: 'Account is inactive' };
    }

    // Check if user is a DEO
    if (user.role !== 'deo') {
      return { success: false, message: 'Access denied. Only Data Entry Officers can manage daily data.' };
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return { success: false, message: 'Invalid credentials' };
    }

    return { success: true, user };
  } catch (error) {
    console.error('Authentication error:', error.message);
    return { success: false, message: 'Server error during authentication' };
  }
};

// @route   GET /api/daily-data
// @desc    Get all daily data entries
// @access  Public with basic auth
router.get('/', async (req, res) => {
  try {
    // Check for username and password in query parameters
    const { username, password } = req.query;

    // Validate credentials
    const validationResult = credentialsSchema.safeParse({ username, password });
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationResult.error.errors
      });
    }

    // Authenticate user
    const authResult = await authenticateUser(username, password);
    if (!authResult.success) {
      return res.status(401).json({
        success: false,
        message: authResult.message
      });
    }

    // Get all daily data entries
    const [dailyData] = await pool.query(
      'SELECT * FROM daily_data ORDER BY date DESC'
    );

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
// @access  Public with basic auth
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password } = req.query;

    // Validate credentials
    const validationResult = credentialsSchema.safeParse({ username, password });
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationResult.error.errors
      });
    }

    // Authenticate user
    const authResult = await authenticateUser(username, password);
    if (!authResult.success) {
      return res.status(401).json({
        success: false,
        message: authResult.message
      });
    }

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
// @access  Public with basic auth
router.post('/', async (req, res) => {
  try {
    // Validate request body
    const validationResult = dailyDataWithCredentialsSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationResult.error.errors
      });
    }

    const {
      username,
      password,
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

    // Authenticate user
    const authResult = await authenticateUser(username, password);
    if (!authResult.success) {
      return res.status(401).json({
        success: false,
        message: authResult.message
      });
    }

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
// @access  Public with basic auth
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate request body
    const validationResult = dailyDataWithCredentialsSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationResult.error.errors
      });
    }

    const {
      username,
      password,
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

    // Authenticate user
    const authResult = await authenticateUser(username, password);
    if (!authResult.success) {
      return res.status(401).json({
        success: false,
        message: authResult.message
      });
    }

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
// @access  Public with basic auth
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password } = req.query;

    // Validate credentials
    const validationResult = credentialsSchema.safeParse({ username, password });
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationResult.error.errors
      });
    }

    // Authenticate user
    const authResult = await authenticateUser(username, password);
    if (!authResult.success) {
      return res.status(401).json({
        success: false,
        message: authResult.message
      });
    }

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
