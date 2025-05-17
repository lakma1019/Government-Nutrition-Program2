const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { auth, dataEntryOfficer } = require('../middleware/auth');
const {
  contractorSchema,
  supporterSchema,
  contractorWithSupporterSchema
} = require('../schemas/contractors');

// @route   GET /api/contractors
// @desc    Get all contractors with their supporters
// @access  Private (DEO only)
router.get('/', auth, dataEntryOfficer, async (req, res) => {
  try {
    // Get all contractors with their supporters using a LEFT JOIN
    const [contractors] = await pool.query(`
      SELECT
        c.id,
        c.contractor_nic_number AS nic_number,
        c.full_name,
        c.contact_number,
        c.address,
        c.agreement_number,
        c.agreement_start_date,
        c.agreement_end_date,
        c.is_active,
        c.created_at,
        c.updated_at,
        s.supporter_nic_number,
        s.supporter_name,
        s.supporter_contact_number,
        s.supporter_address,
        s.is_active AS supporter_is_active,
        s.created_at AS supporter_created_at,
        s.updated_at AS supporter_updated_at,
        CASE WHEN s.id IS NOT NULL THEN 'yes' ELSE 'no' END AS has_supporter
      FROM contractors c
      LEFT JOIN supporters s ON c.id = s.contractor_id
      ORDER BY c.created_at DESC
    `);

    res.json({
      success: true,
      data: contractors
    });
  } catch (err) {
    console.error('Error getting contractors:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/contractors/active
// @desc    Get the active contractor
// @access  Private (DEO only)
router.get('/active', auth, dataEntryOfficer, async (req, res) => {
  try {
    // Get the active contractor with supporter using a LEFT JOIN
    const [contractors] = await pool.query(`
      SELECT
        c.id,
        c.contractor_nic_number AS nic_number,
        c.full_name,
        c.contact_number,
        c.address,
        c.agreement_number,
        c.agreement_start_date,
        c.agreement_end_date,
        c.is_active,
        c.created_at,
        c.updated_at,
        s.supporter_nic_number,
        s.supporter_name,
        s.supporter_contact_number,
        s.supporter_address,
        s.is_active AS supporter_is_active,
        s.created_at AS supporter_created_at,
        s.updated_at AS supporter_updated_at,
        CASE WHEN s.id IS NOT NULL THEN 'yes' ELSE 'no' END AS has_supporter
      FROM contractors c
      LEFT JOIN supporters s ON c.id = s.contractor_id
      WHERE c.is_active = 'yes'
      LIMIT 1
    `);

    if (contractors.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active contractor found'
      });
    }

    res.json({
      success: true,
      data: contractors[0]
    });
  } catch (err) {
    console.error('Error getting active contractor:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/contractors/:nic_number
// @desc    Get contractor by NIC number
// @access  Private (DEO only)
router.get('/:nic_number', auth, dataEntryOfficer, async (req, res) => {
  try {
    const { nic_number } = req.params;

    // Get contractor with supporter using a LEFT JOIN
    const [contractors] = await pool.query(`
      SELECT
        c.id,
        c.contractor_nic_number AS nic_number,
        c.full_name,
        c.contact_number,
        c.address,
        c.agreement_number,
        c.agreement_start_date,
        c.agreement_end_date,
        c.is_active,
        c.created_at,
        c.updated_at,
        s.supporter_nic_number,
        s.supporter_name,
        s.supporter_contact_number,
        s.supporter_address,
        s.is_active AS supporter_is_active,
        s.created_at AS supporter_created_at,
        s.updated_at AS supporter_updated_at,
        CASE WHEN s.id IS NOT NULL THEN 'yes' ELSE 'no' END AS has_supporter
      FROM contractors c
      LEFT JOIN supporters s ON c.id = s.contractor_id
      WHERE c.contractor_nic_number = ?
    `, [nic_number]);

    if (contractors.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Contractor not found'
      });
    }

    res.json({
      success: true,
      data: contractors[0]
    });
  } catch (err) {
    console.error('Error getting contractor:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Helper function to check if there's an active contractor other than the one being edited
const checkActiveContractor = async (connection, contractorId = null) => {
  let query = 'SELECT id, contractor_nic_number, full_name FROM contractors WHERE is_active = "yes"';
  let params = [];

  // If contractorId is provided, exclude that contractor from the check
  if (contractorId) {
    query += ' AND id != ?';
    params.push(contractorId);
  }

  const [activeContractors] = await connection.query(query, params);
  return activeContractors.length > 0 ? activeContractors[0] : null;
};

// @route   POST /api/contractors
// @desc    Create a new contractor with optional supporter
// @access  Private (DEO only)
router.post('/', auth, dataEntryOfficer, async (req, res) => {
  try {
    // Validate request body
    const validationResult = contractorWithSupporterSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationResult.error.errors
      });
    }

    const {
      contractor_nic_number,
      full_name,
      contact_number,
      address,
      agreement_number,
      agreement_start_date,
      agreement_end_date,
      is_active,
      has_supporter,
      supporter_nic_number,
      supporter_name,
      supporter_contact_number,
      supporter_address
    } = validationResult.data;

    // Check if contractor already exists
    const [existingContractors] = await pool.query(
      'SELECT * FROM contractors WHERE contractor_nic_number = ?',
      [contractor_nic_number]
    );

    if (existingContractors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Contractor with this NIC number already exists'
      });
    }

    // Check if trying to add an active contractor when one already exists
    if (is_active === 'yes') {
      const connection = await pool.getConnection();
      try {
        const activeContractor = await checkActiveContractor(connection);
        if (activeContractor) {
          connection.release();
          return res.status(400).json({
            success: false,
            message: 'Only one active contractor is allowed. Please deactivate the current active contractor first.',
            activeContractor: {
              id: activeContractor.id,
              nic_number: activeContractor.contractor_nic_number,
              full_name: activeContractor.full_name
            }
          });
        }
      } catch (error) {
        connection.release();
        throw error;
      }
    }

    // Start a transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Insert contractor
      const [contractorResult] = await connection.query(
        `INSERT INTO contractors
        (contractor_nic_number, full_name, contact_number, address, agreement_number, agreement_start_date, agreement_end_date, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          contractor_nic_number,
          full_name,
          contact_number,
          address,
          agreement_number,
          agreement_start_date || null,
          agreement_end_date || null,
          is_active || 'yes'
        ]
      );

      const contractorId = contractorResult.insertId;

      // If has supporter is 'yes' and supporter details are provided, insert supporter
      if (has_supporter === 'yes' && supporter_nic_number && supporter_name && supporter_contact_number) {
        // Check if supporter already exists
        const [existingSupporters] = await connection.query(
          'SELECT * FROM supporters WHERE supporter_nic_number = ?',
          [supporter_nic_number]
        );

        if (existingSupporters.length > 0) {
          await connection.rollback();
          return res.status(400).json({
            success: false,
            message: 'Supporter with this NIC number already exists'
          });
        }

        await connection.query(
          `INSERT INTO supporters
          (contractor_id, supporter_nic_number, supporter_name, supporter_contact_number, supporter_address)
          VALUES (?, ?, ?, ?, ?)`,
          [
            contractorId,
            supporter_nic_number,
            supporter_name,
            supporter_contact_number,
            supporter_address || null
          ]
        );
      }

      // Commit the transaction
      await connection.commit();

      // Get the newly created contractor with supporter
      const [newContractor] = await pool.query(`
        SELECT
          c.id,
          c.contractor_nic_number AS nic_number,
          c.full_name,
          c.contact_number,
          c.address,
          c.agreement_number,
          c.agreement_start_date,
          c.agreement_end_date,
          c.is_active,
          c.created_at,
          c.updated_at,
          s.supporter_nic_number,
          s.supporter_name,
          s.supporter_contact_number,
          s.supporter_address,
          s.is_active AS supporter_is_active,
          s.created_at AS supporter_created_at,
          s.updated_at AS supporter_updated_at,
          CASE WHEN s.id IS NOT NULL THEN 'yes' ELSE 'no' END AS has_supporter
        FROM contractors c
        LEFT JOIN supporters s ON c.id = s.contractor_id
        WHERE c.id = ?
      `, [contractorId]);

      res.status(201).json({
        success: true,
        message: 'Contractor created successfully',
        data: newContractor[0]
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
    console.error('Error creating contractor:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/contractors/:nic_number
// @desc    Update a contractor with optional supporter
// @access  Private (DEO only)
router.put('/:nic_number', auth, dataEntryOfficer, async (req, res) => {
  try {
    const { nic_number } = req.params;

    // Validate request body
    const validationResult = contractorWithSupporterSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationResult.error.errors
      });
    }

    const {
      contractor_nic_number,
      full_name,
      contact_number,
      address,
      agreement_number,
      agreement_start_date,
      agreement_end_date,
      is_active,
      has_supporter,
      supporter_nic_number,
      supporter_name,
      supporter_contact_number,
      supporter_address
    } = validationResult.data;

    // Check if contractor exists
    const [existingContractors] = await pool.query(
      'SELECT * FROM contractors WHERE contractor_nic_number = ?',
      [nic_number]
    );

    if (existingContractors.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Contractor not found'
      });
    }

    const contractorId = existingContractors[0].id;
    const currentIsActive = existingContractors[0].is_active;

    // Start a transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Check if trying to activate a contractor when another one is already active
      if (is_active === 'yes' && currentIsActive !== 'yes') {
        const activeContractor = await checkActiveContractor(connection, contractorId);
        if (activeContractor) {
          await connection.rollback();
          connection.release();
          return res.status(400).json({
            success: false,
            message: 'Only one active contractor is allowed. Please deactivate the current active contractor first.',
            activeContractor: {
              id: activeContractor.id,
              nic_number: activeContractor.contractor_nic_number,
              full_name: activeContractor.full_name
            }
          });
        }
      }

      // Update contractor
      await connection.query(
        `UPDATE contractors
        SET contractor_nic_number = ?, full_name = ?, contact_number = ?, address = ?,
        agreement_number = ?, agreement_start_date = ?, agreement_end_date = ?, is_active = ?
        WHERE id = ?`,
        [
          contractor_nic_number,
          full_name,
          contact_number,
          address,
          agreement_number,
          agreement_start_date || null,
          agreement_end_date || null,
          is_active || 'yes',
          contractorId
        ]
      );

      // Check if contractor has a supporter
      const [existingSupporters] = await connection.query(
        'SELECT * FROM supporters WHERE contractor_id = ?',
        [contractorId]
      );

      const hasExistingSupporter = existingSupporters.length > 0;

      // Handle supporter based on has_supporter value
      if (has_supporter === 'yes') {
        if (supporter_nic_number && supporter_name && supporter_contact_number) {
          if (hasExistingSupporter) {
            // Update existing supporter
            await connection.query(
              `UPDATE supporters
              SET supporter_nic_number = ?, supporter_name = ?, supporter_contact_number = ?, supporter_address = ?
              WHERE contractor_id = ?`,
              [
                supporter_nic_number,
                supporter_name,
                supporter_contact_number,
                supporter_address || null,
                contractorId
              ]
            );
          } else {
            // Create new supporter
            await connection.query(
              `INSERT INTO supporters
              (contractor_id, supporter_nic_number, supporter_name, supporter_contact_number, supporter_address)
              VALUES (?, ?, ?, ?, ?)`,
              [
                contractorId,
                supporter_nic_number,
                supporter_name,
                supporter_contact_number,
                supporter_address || null
              ]
            );
          }
        }
      } else if (has_supporter === 'no' && hasExistingSupporter) {
        // Remove existing supporter if has_supporter is 'no'
        await connection.query(
          'DELETE FROM supporters WHERE contractor_id = ?',
          [contractorId]
        );
      }

      // Commit the transaction
      await connection.commit();

      // Get the updated contractor with supporter
      const [updatedContractor] = await pool.query(`
        SELECT
          c.id,
          c.contractor_nic_number AS nic_number,
          c.full_name,
          c.contact_number,
          c.address,
          c.agreement_number,
          c.agreement_start_date,
          c.agreement_end_date,
          c.is_active,
          c.created_at,
          c.updated_at,
          s.supporter_nic_number,
          s.supporter_name,
          s.supporter_contact_number,
          s.supporter_address,
          s.is_active AS supporter_is_active,
          s.created_at AS supporter_created_at,
          s.updated_at AS supporter_updated_at,
          CASE WHEN s.id IS NOT NULL THEN 'yes' ELSE 'no' END AS has_supporter
        FROM contractors c
        LEFT JOIN supporters s ON c.id = s.contractor_id
        WHERE c.id = ?
      `, [contractorId]);

      res.json({
        success: true,
        message: 'Contractor updated successfully',
        data: updatedContractor[0]
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
    console.error('Error updating contractor:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/contractors/:nic_number
// @desc    Delete a contractor and associated supporter
// @access  Private (DEO only)
router.delete('/:nic_number', auth, dataEntryOfficer, async (req, res) => {
  try {
    const { nic_number } = req.params;

    // Check if contractor exists
    const [existingContractors] = await pool.query(
      'SELECT * FROM contractors WHERE contractor_nic_number = ?',
      [nic_number]
    );

    if (existingContractors.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Contractor not found'
      });
    }

    const contractorId = existingContractors[0].id;

    // Start a transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Delete supporter first (if exists) due to foreign key constraint
      await connection.query(
        'DELETE FROM supporters WHERE contractor_id = ?',
        [contractorId]
      );

      // Delete contractor
      await connection.query(
        'DELETE FROM contractors WHERE id = ?',
        [contractorId]
      );

      // Commit the transaction
      await connection.commit();

      res.json({
        success: true,
        message: 'Contractor deleted successfully'
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
    console.error('Error deleting contractor:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
