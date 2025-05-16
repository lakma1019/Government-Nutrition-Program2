# Government Nutrition Program Backend

A simple Node.js backend for the Government Nutrition Program application.

## Features

- User authentication (register, login)
- User management (CRUD operations)
- Role-based access control
- JWT authentication
- MySQL database integration

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- MySQL (v5.7 or higher)

### Installation

1. Install dependencies:
   ```
   npm install
   ```

2. Set up environment variables:
   - Ensure the `.env` file has the correct database connection values:
     ```
     DB_HOST=localhost
     DB_USER=root
     DB_PASSWORD=root
     DB_NAME=governmentnutritionprogram
     DB_PORT=3306
     ```

3. Start the development server:
   ```
   npm run dev
   ```

4. For production:
   ```
   npm start
   ```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user info (requires authentication)

### User Management

- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID (admin only)
- `PUT /api/users/:id` - Update user (admin only)
- `DELETE /api/users/:id` - Delete user (admin only)

## Default Admin User

The system comes with a default admin user:

- Username: `admin`
- Password: `admin123`

Please change the password after first login.

## Database Schema

### Users Table

| Column       | Type         | Description                                |
|--------------|--------------|-------------------------------------------|
| id           | VARCHAR(36)  | Primary key                               |
| username     | VARCHAR(50)  | Unique username                           |
| password     | VARCHAR(255) | Hashed password                           |
| full_name    | VARCHAR(100) | User's full name                          |
| role         | ENUM         | User role (admin, dataEntryOfficer, etc.) |
| is_active    | BOOLEAN      | Account status                            |
| nic_number   | VARCHAR(20)  | National ID number                        |
| tel_number   | VARCHAR(20)  | Telephone number                          |
| address      | TEXT         | User's address                            |
| profession   | VARCHAR(100) | User's profession                         |
| created_at   | TIMESTAMP    | Account creation timestamp                |
| updated_at   | TIMESTAMP    | Last update timestamp                     |

## License

This project is licensed under the MIT License.
