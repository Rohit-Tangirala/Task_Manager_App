import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false,
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function initDb() {
  console.log('Checking and initializing database tables...');
  try {
    const connection = await pool.getConnection();
    
    // Create users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        bio TEXT DEFAULT NULL,
        role_title VARCHAR(100) DEFAULT NULL,
        profile_pic MEDIUMTEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('Table "users" checked/created.');

    // Add profile columns to existing users table if they don't exist
    const profileColumns = [
      { name: 'bio', type: 'TEXT DEFAULT NULL' },
      { name: 'role_title', type: 'VARCHAR(100) DEFAULT NULL' },
      { name: 'profile_pic', type: 'MEDIUMTEXT DEFAULT NULL' }
    ];

    for (const col of profileColumns) {
      try {
        await connection.query(`
          ALTER TABLE users ADD COLUMN ${col.name} ${col.type};
        `);
        console.log(`Added column "${col.name}" to table "users".`);
      } catch (alterError: any) {
        if (alterError.code === 'ER_DUP_FIELDNAME' || String(alterError).includes('Duplicate column name')) {
          console.log(`Column "${col.name}" already exists on "users" table.`);
        } else {
          console.warn(`Could not run ALTER TABLE to add ${col.name}:`, alterError.message || alterError);
        }
      }
    }

    // Create tasks table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status ENUM('todo', 'in-progress', 'done') DEFAULT 'todo',
        priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
        due_date DATE DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('Table "tasks" checked/created.');

    // Add due_date to existing table if it doesn't exist
    try {
      await connection.query(`
        ALTER TABLE tasks ADD COLUMN due_date DATE DEFAULT NULL;
      `);
      console.log('Added column "due_date" to table "tasks".');
    } catch (alterError: any) {
      // Ignore error if column already exists (typically error code ER_DUP_FIELDNAME)
      if (alterError.code === 'ER_DUP_FIELDNAME' || String(alterError).includes('Duplicate column name')) {
        console.log('Column "due_date" already exists on "tasks" table.');
      } else {
        console.warn('Could not run ALTER TABLE to add due_date:', alterError.message || alterError);
      }
    }

    connection.release();
    console.log('Database initialization completed.');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

export default pool;
