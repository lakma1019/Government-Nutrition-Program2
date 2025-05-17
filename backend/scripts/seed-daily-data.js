const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Import the database connection after loading environment variables
const { pool } = require('../config/db');

// Sample daily data entries
const sampleDailyData = [
  {
    date: '2023-10-01',
    female: 25,
    male: 20,
    total: 45,
    unit_price: 2.50,
    amount: 112.50,
    method_of_rice_received: 'purchased',
    meal_recipe: 'Rice and curry with vegetables',
    number_of_eggs: 45,
    fruits: 'Bananas'
  },
  {
    date: '2023-10-02',
    female: 22,
    male: 18,
    total: 40,
    unit_price: 2.50,
    amount: 100.00,
    method_of_rice_received: 'purchased',
    meal_recipe: 'Rice with fish curry and vegetables',
    number_of_eggs: 40,
    fruits: 'Apples'
  },
  {
    date: '2023-10-03',
    female: 28,
    male: 22,
    total: 50,
    unit_price: 0,
    amount: 0,
    method_of_rice_received: 'donated',
    meal_recipe: 'Rice with chicken curry and vegetables',
    number_of_eggs: 50,
    fruits: 'Oranges'
  }
];

// Function to seed daily data
async function seedDailyData() {
  try {
    console.log('Starting daily data seeding...');

    // Check if database connection is successful
    const connection = await pool.getConnection();
    console.log('Database connection established successfully');
    connection.release();

    // Check if daily_data table exists
    const [tables] = await pool.query(`
      SHOW TABLES LIKE 'daily_data'
    `);

    if (tables.length === 0) {
      console.log('daily_data table does not exist, creating it...');

      // Create daily_data table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS daily_data (
          id int NOT NULL AUTO_INCREMENT,
          date date NOT NULL,
          female int NOT NULL,
          male int NOT NULL,
          total int NOT NULL,
          unit_price decimal(10,2) NOT NULL,
          amount decimal(10,2) NOT NULL,
          method_of_rice_received enum('donated','purchased') COLLATE utf8mb4_unicode_ci DEFAULT 'purchased',
          meal_recipe text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
          number_of_eggs int NOT NULL DEFAULT '0',
          fruits varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
          created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      console.log('daily_data table created successfully');
    } else {
      console.log('daily_data table already exists');
    }

    // Check if table has data
    const [existingData] = await pool.query('SELECT COUNT(*) as count FROM daily_data');

    if (existingData[0].count > 0) {
      console.log(`daily_data table already has ${existingData[0].count} entries, skipping seeding...`);
      return;
    }

    // Seed sample data
    for (const entry of sampleDailyData) {
      await pool.query(
        `INSERT INTO daily_data
        (date, female, male, total, unit_price, amount, method_of_rice_received, meal_recipe, number_of_eggs, fruits)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          entry.date,
          entry.female,
          entry.male,
          entry.total,
          entry.unit_price,
          entry.amount,
          entry.method_of_rice_received,
          entry.meal_recipe,
          entry.number_of_eggs,
          entry.fruits
        ]
      );
      console.log(`Added daily data entry for ${entry.date}`);
    }

    console.log('Daily data seeding completed successfully');
  } catch (error) {
    console.error('Error seeding daily data:', error.message);
  } finally {
    process.exit(0);
  }
}

// Run the seed function
seedDailyData();
