const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Default users to seed
const defaultUsers = [
  {
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    is_active: 'yes'
  },
  {
    username: 'deo',
    password: 'deo123',
    role: 'deo',
    is_active: 'yes'
  },
  {
    username: 'vo',
    password: 'vo123',
    role: 'vo',
    is_active: 'yes'
  }
];

// Function to seed users
async function seedUsers() {
  try {
    console.log('Starting user seeding...');

    // Check if database connection is successful
    const connection = await pool.getConnection();
    console.log('Database connection established successfully');
    connection.release();

    // Create users table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id int NOT NULL AUTO_INCREMENT,
        username varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
        password varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
        role enum('admin','deo','vo') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'admin',
        is_active enum('yes','no') COLLATE utf8mb4_unicode_ci DEFAULT 'yes',
        created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY username (username)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('Users table created or already exists');

    // Seed each default user
    for (const user of defaultUsers) {
      // Check if user already exists
      const [existingUsers] = await pool.query(
        'SELECT * FROM users WHERE username = ?',
        [user.username]
      );

      if (existingUsers.length > 0) {
        console.log(`User ${user.username} already exists, skipping...`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(user.password, 10);

      // Insert user
      await pool.query(
        `INSERT INTO users (username, password, role, is_active)
         VALUES (?, ?, ?, ?)`,
        [user.username, hashedPassword, user.role, user.is_active]
      );

      console.log(`User ${user.username} created successfully`);
    }

    console.log('User seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error.message);
    process.exit(1);
  }
}

// Run the seeding function
seedUsers();
