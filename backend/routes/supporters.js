const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { auth, dataEntryOfficer } = require('../middleware/auth');
const { supporterSchema, supporterWithContractorSchema } = require('../schemas/supporters');

// @route   GET /api/supporters
// @desc    Get all supporters with their contractor details
// @access  Private (DEO only)
router.get('/', auth, dataEntryOfficer, async (req, res) => {
  try {
    // Get all supporters with their contractor details using a LEFT JOIN
    const [supporters] = await pool.query(`
      SELECT
        s.id,
        s.supporter_nic_number,
        s.supporter_name,
        s.supporter_contact_number,
        s.supporter_address,
        s.is_active,
        s.created_at,
        s.updated_at,
        c.id AS contractor_id,
        c.contractor_nic_number,
        c.full_name AS contractor_name
      FROM supporters s
      LEFT JOIN contractors c ON s.contractor_id = c.id
      ORDER BY s.created_at DESC
    `);

    res.json({
      success: true,
      data: supporters
    });
  } catch (err) {
    console.error('Error getting supporters:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/supporters/:nic_number
// @desc    Get supporter by NIC number
// @access  Private (DEO only)
router.get('/:nic_number', auth, dataEntryOfficer, async (req, res) => {
  try {
    const { nic_number } = req.params;

    // Get supporter with contractor details using a LEFT JOIN
    const [supporters] = await pool.query(`
      SELECT
        s.id,
        s.supporter_nic_number,
        s.supporter_name,
        s.supporter_contact_number,
        s.supporter_address,
        s.is_active,
        s.created_at,
        s.updated_at,
        c.id AS contractor_id,
        c.contractor_nic_number,
        c.full_name AS contractor_name
      FROM supporters s
      LEFT JOIN contractors c ON s.contractor_id = c.id
      WHERE s.supporter_nic_number = ?
    `, [nic_number]);

    if (supporters.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Supporter not found'
      });
    }

    res.json({
      success: true,
      data: supporters[0]
    });
  } catch (err) {
    console.error('Error getting supporter:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/supporters
// @desc    Create a new supporter
// @access  Private (DEO only)
router.post('/', auth, dataEntryOfficer, async (req, res) => {
  try {
    // Validate request body
    const validationResult = supporterSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationResult.error.errors
      });
    }

    const {
      supporter_nic_number,
      supporter_name,
      supporter_contact_number,
      supporter_address,
      contractor_id,
      contractor_nic_number,
      is_active
    } = validationResult.data;

    // Check if supporter already exists
    const [existingSupporters] = await pool.query(
      'SELECT * FROM supporters WHERE supporter_nic_number = ?',
      [supporter_nic_number]
    );

    if (existingSupporters.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Supporter with this NIC number already exists'
      });
    }

    // Start a transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      let contractorIdToUse = contractor_id;

      // If contractor_nic_number is provided but not contractor_id, look up the contractor
      if (!contractorIdToUse && contractor_nic_number) {
        const [contractors] = await connection.query(
          'SELECT id FROM contractors WHERE contractor_nic_number = ?',
          [contractor_nic_number]
        );

        if (contractors.length > 0) {
          contractorIdToUse = contractors[0].id;
        }
      }

      // Insert supporter
      const [supporterResult] = await connection.query(
        `INSERT INTO supporters
        (supporter_nic_number, supporter_name, supporter_contact_number, supporter_address, contractor_id, is_active)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          supporter_nic_number,
          supporter_name,
          supporter_contact_number,
          supporter_address || null,
          contractorIdToUse || null,
          is_active || 'yes'
        ]
      );

      const supporterId = supporterResult.insertId;

      // Commit the transaction
      await connection.commit();

      // Get the newly created supporter with contractor details
      const [newSupporter] = await pool.query(`
        SELECT
          s.id,
          s.supporter_nic_number,
          s.supporter_name,
          s.supporter_contact_number,
          s.supporter_address,
          s.is_active,
          s.created_at,
          s.updated_at,
          c.id AS contractor_id,
          c.contractor_nic_number,
          c.full_name AS contractor_name
        FROM supporters s
        LEFT JOIN contractors c ON s.contractor_id = c.id
        WHERE s.id = ?
      `, [supporterId]);

      res.status(201).json({
        success: true,
        message: 'Supporter created successfully',
        data: newSupporter[0]
      });
    } catch (error) {
      // Rollback the transaction in case of error
      await connection.rollback();
      throw error;
    } finally {
      // Release the connection
      connection.release();
    }
  } catch (err) {
    console.error('Error creating supporter:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/supporters/:nic_number
// @desc    Update a supporter
// @access  Private (DEO only)
router.put('/:nic_number', auth, dataEntryOfficer, async (req, res) => {
  try {
    const { nic_number } = req.params;

    // Validate request body
    const validationResult = supporterSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationResult.error.errors
      });
    }

    const {
      supporter_nic_number,
      supporter_name,
      supporter_contact_number,
      supporter_address,
      contractor_id,
      contractor_nic_number,
      is_active
    } = validationResult.data;

    // Check if supporter exists
    const [existingSupporters] = await pool.query(
      'SELECT * FROM supporters WHERE supporter_nic_number = ?',
      [nic_number]
    );

    if (existingSupporters.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Supporter not found'
      });
    }

    const supporterId = existingSupporters[0].id;

    // Start a transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      let contractorIdToUse = contractor_id;

      // If contractor_nic_number is provided but not contractor_id, look up the contractor
      if (!contractorIdToUse && contractor_nic_number) {
        const [contractors] = await connection.query(
          'SELECT id FROM contractors WHERE contractor_nic_number = ?',
          [contractor_nic_number]
        );

        if (contractors.length > 0) {
          contractorIdToUse = contractors[0].id;
        }
      }

      // Update supporter
      await connection.query(
        `UPDATE supporters
        SET supporter_nic_number = ?, supporter_name = ?, supporter_contact_number = ?, 
        supporter_address = ?, contractor_id = ?, is_active = ?
        WHERE id = ?`,
        [
          supporter_nic_number,
          supporter_name,
          supporter_contact_number,
          supporter_address || null,
          contractorIdToUse || null,
          is_active || 'yes',
          supporterId
        ]
      );

      // Commit the transaction
      await connection.commit();

      // Get the updated supporter with contractor details
      const [updatedSupporter] = await pool.query(`
        SELECT
          s.id,
          s.supporter_nic_number,
          s.supporter_name,
          s.supporter_contact_number,
          s.supporter_address,
          s.is_active,
          s.created_at,
          s.updated_at,
          c.id AS contractor_id,
          c.contractor_nic_number,
          c.full_name AS contractor_name
        FROM supporters s
        LEFT JOIN contractors c ON s.contractor_id = c.id
        WHERE s.id = ?
      `, [supporterId]);

      res.json({
        success: true,
        message: 'Supporter updated successfully',
        data: updatedSupporter[0]
      });
    } catch (error) {
      // Rollback the transaction in case of error
      await connection.rollback();
      throw error;
    } finally {
      // Release the connection
      connection.release();
    }
  } catch (err) {
    console.error('Error updating supporter:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/supporters/:nic_number
// @desc    Delete a supporter
// @access  Private (DEO only)
router.delete('/:nic_number', auth, dataEntryOfficer, async (req, res) => {
  try {
    const { nic_number } = req.params;

    // Check if supporter exists
    const [existingSupporters] = await pool.query(
      'SELECT * FROM supporters WHERE supporter_nic_number = ?',
      [nic_number]
    );

    if (existingSupporters.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Supporter not found'
      });
    }

    const supporterId = existingSupporters[0].id;

    // Delete supporter
    await pool.query(
      'DELETE FROM supporters WHERE id = ?',
      [supporterId]
    );

    res.json({
      success: true,
      message: 'Supporter deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting supporter:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
