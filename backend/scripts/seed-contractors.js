const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Import the database connection after loading environment variables
const { pool } = require('../config/db');

// Sample contractors data
const sampleContractors = [
  {
    contractor_nic_number: '123456789V',
    full_name: 'John Doe',
    contact_number: '0771234567',
    address: '123 Main St, Colombo',
    agreement_number: 'AGR-2023-001',
    agreement_start_date: '2023-01-01',
    agreement_end_date: '2023-12-31',
    is_active: 'yes',
    has_supporter: true,
    supporter: {
      supporter_nic_number: '987654321V',
      supporter_name: 'Jane Smith',
      supporter_contact_number: '0777654321',
      supporter_address: '456 Side St, Colombo'
    }
  },
  {
    contractor_nic_number: '234567890V',
    full_name: 'Robert Johnson',
    contact_number: '0772345678',
    address: '789 Park Ave, Kandy',
    agreement_number: 'AGR-2023-002',
    agreement_start_date: '2023-02-15',
    agreement_end_date: '2023-12-31',
    is_active: 'yes',
    has_supporter: false
  },
  {
    contractor_nic_number: '345678901V',
    full_name: 'Mary Williams',
    contact_number: '0773456789',
    address: '567 Lake Rd, Galle',
    agreement_number: 'AGR-2023-003',
    agreement_start_date: '2023-03-10',
    agreement_end_date: '2023-12-31',
    is_active: 'yes',
    has_supporter: true,
    supporter: {
      supporter_nic_number: '876543210V',
      supporter_name: 'David Brown',
      supporter_contact_number: '0778765432',
      supporter_address: '890 Hill St, Galle'
    }
  }
];

// Function to seed contractors
async function seedContractors() {
  try {
    console.log('Starting contractors seeding...');

    // Log database configuration (without password)
    console.log('Database configuration:');
    console.log(`- Host: ${process.env.DB_HOST}`);
    console.log(`- User: ${process.env.DB_USER}`);
    console.log(`- Database: ${process.env.DB_NAME}`);
    console.log(`- Port: ${process.env.DB_PORT || 3306}`);

    // Check if database connection is successful
    const connection = await pool.getConnection();
    console.log('Database connection established successfully');
    connection.release();

    // Check if contractors table exists
    const [contractorsTables] = await pool.query(`
      SHOW TABLES LIKE 'contractors'
    `);

    if (contractorsTables.length === 0) {
      console.log('contractors table does not exist, creating it...');

      // Create contractors table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS contractors (
          id int NOT NULL AUTO_INCREMENT,
          contractor_nic_number varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
          full_name varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
          contact_number varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
          address text COLLATE utf8mb4_unicode_ci NOT NULL,
          agreement_number varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
          agreement_start_date date DEFAULT NULL,
          agreement_end_date date DEFAULT NULL,
          is_active enum('yes','no') COLLATE utf8mb4_unicode_ci DEFAULT 'yes',
          created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY contractor_nic_number (contractor_nic_number)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      console.log('contractors table created successfully');
    } else {
      console.log('contractors table already exists');
    }

    // Check if supporters table exists
    const [supportersTables] = await pool.query(`
      SHOW TABLES LIKE 'supporters'
    `);

    if (supportersTables.length === 0) {
      console.log('supporters table does not exist, creating it...');

      // Create supporters table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS supporters (
          id int NOT NULL AUTO_INCREMENT,
          contractor_id int NOT NULL,
          supporter_nic_number varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
          supporter_name varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
          supporter_contact_number varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
          supporter_address text COLLATE utf8mb4_unicode_ci,
          is_active enum('yes','no') COLLATE utf8mb4_unicode_ci DEFAULT 'yes',
          created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY supporter_nic_number (supporter_nic_number),
          UNIQUE KEY contractor_id (contractor_id),
          CONSTRAINT supporters_ibfk_1 FOREIGN KEY (contractor_id) REFERENCES contractors (id) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      console.log('supporters table created successfully');
    } else {
      console.log('supporters table already exists');
    }

    // Check if contractors table has data
    const [existingContractors] = await pool.query('SELECT COUNT(*) as count FROM contractors');

    if (existingContractors[0].count > 0) {
      console.log(`contractors table already has ${existingContractors[0].count} entries, skipping seeding...`);
      return;
    }

    // Seed sample data
    for (const contractor of sampleContractors) {
      // Insert contractor
      const [result] = await pool.query(
        `INSERT INTO contractors
        (contractor_nic_number, full_name, contact_number, address, agreement_number, agreement_start_date, agreement_end_date, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          contractor.contractor_nic_number,
          contractor.full_name,
          contractor.contact_number,
          contractor.address,
          contractor.agreement_number,
          contractor.agreement_start_date,
          contractor.agreement_end_date,
          contractor.is_active
        ]
      );

      const contractorId = result.insertId;
      console.log(`Added contractor: ${contractor.full_name} with ID ${contractorId}`);

      // Insert supporter if exists
      if (contractor.has_supporter && contractor.supporter) {
        await pool.query(
          `INSERT INTO supporters
          (contractor_id, supporter_nic_number, supporter_name, supporter_contact_number, supporter_address)
          VALUES (?, ?, ?, ?, ?)`,
          [
            contractorId,
            contractor.supporter.supporter_nic_number,
            contractor.supporter.supporter_name,
            contractor.supporter.supporter_contact_number,
            contractor.supporter.supporter_address
          ]
        );
        console.log(`Added supporter: ${contractor.supporter.supporter_name} for contractor ID ${contractorId}`);
      }
    }

    console.log('Contractors seeding completed successfully');
  } catch (error) {
    console.error('Error seeding contractors:', error.message);

    // Additional error details for database connection issues
    if (error.code === 'ECONNREFUSED') {
      console.error('Could not connect to MySQL server. Please check if the server is running and the host/port are correct.');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('Access denied. Please check your database username and password.');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error(`Database '${process.env.DB_NAME}' does not exist. Please create it first.`);
    }

    process.exit(1); // Exit with error code
  } finally {
    // Only exit with success if we reach the end without errors
    if (!process.exitCode) {
      process.exit(0);
    }
  }
}

// Run the seed function
seedContractors();
