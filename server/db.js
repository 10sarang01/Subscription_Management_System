const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

// Database path for official SQLite database
const DB_PATH = path.join(__dirname, '..', 'users.db');
const db = new Database(DB_PATH);

// Enable WAL mode and foreign keys
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

console.log('📦 Connected to SQLite database at:', DB_PATH);

// Initialize Users Table and default Admin
async function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'staff', 'customer')),
      company_name TEXT,
      phone TEXT,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
  `);

  // Ensure Admin exists
  const adminCheck = db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get();
  if (!adminCheck) {
    const saltRounds = 10;
    const adminPassword = 'Admin@BrightLoop2026!';
    const adminHash = bcrypt.hashSync(adminPassword, saltRounds);

    const insertUser = db.prepare(`
      INSERT INTO users (email, password_hash, full_name, role, company_name, phone)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertUser.run(
      'admin@brightloop.com',
      adminHash,
      'Elena Vance (Admin)',
      'admin',
      'Brightloop Software Inc.',
      '+1-555-0100'
    );

    const staffHash = bcrypt.hashSync('Staff@BrightLoop2026!', saltRounds);
    insertUser.run(
      'sarah.ops@brightloop.com',
      staffHash,
      'Sarah Jenkins',
      'staff',
      'Brightloop Software Inc.',
      '+1-555-0101'
    );

    const customerHash = bcrypt.hashSync('Customer@BrightLoop2026!', saltRounds);
    insertUser.run(
      'alice@cornerbakery.com',
      customerHash,
      'Alice Smith',
      'customer',
      'Corner Bakery & Cafe',
      '+1-555-0102'
    );

    console.log('✅ SQLite users table initialized and seeded with Admin, Staff, and Customer accounts.');
  } else {
    console.log('ℹ️ SQLite database already contains admin user.');
  }
}

// User query functions
async function getUserByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase());
}

async function getUserById(id) {
  return db.prepare('SELECT id, email, full_name, role, company_name, phone, is_active, created_at FROM users WHERE id = ?').get(id);
}

async function getAllUsers() {
  return db.prepare('SELECT id, email, full_name, role, company_name, phone, is_active, created_at FROM users ORDER BY id ASC').all();
}

async function createUser({ email, password, full_name, role = 'customer', company_name = '', phone = '', created_by = null }) {
  const saltRounds = 10;
  const hash = bcrypt.hashSync(password, saltRounds);
  const stmt = db.prepare(`
    INSERT INTO users (email, password_hash, full_name, role, company_name, phone, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(email.trim().toLowerCase(), hash, full_name.trim(), role, company_name.trim(), phone.trim(), created_by);
  return await getUserById(result.lastInsertRowid);
}

module.exports = {
  db,
  initDatabase,
  getUserByEmail,
  getUserById,
  getAllUsers,
  createUser
};
