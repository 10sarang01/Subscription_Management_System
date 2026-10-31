const path = require('path');
const bcrypt = require('bcryptjs');

// Database path for official SQLite database
const DB_PATH = path.join(__dirname, '..', 'users.db');

let run, get, all, db;

try {
  const sqlite3 = require('sqlite3').verbose();
  db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('❌ Error connecting to SQLite database:', err.message);
    } else {
      console.log('📦 Connected to SQLite database at:', DB_PATH);
    }
  });

  run = function (sql, params = []) {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
  };

  get = function (sql, params = []) {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  };

  all = function (sql, params = []) {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  };
} catch (e) {
  // Graceful fallback to Node's built-in native SQLite engine (Node 22+)
  const { DatabaseSync } = require('node:sqlite');
  db = new DatabaseSync(DB_PATH);
  console.log('📦 Connected to native SQLite database at:', DB_PATH);

  run = async function (sql, params = []) {
    const stmt = db.prepare(sql);
    const res = stmt.run(...params);
    return { lastID: res.lastInsertRowid, changes: res.changes };
  };

  get = async function (sql, params = []) {
    const stmt = db.prepare(sql);
    return stmt.get(...params);
  };

  all = async function (sql, params = []) {
    const stmt = db.prepare(sql);
    return stmt.all(...params);
  };
}

// Initialize Users Table and default Admin
async function initDatabase() {
  await run('PRAGMA foreign_keys = ON');

  await run(`
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
    )
  `);

  await run(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`);

  // Ensure Admin exists
  const adminCheck = await get("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
  if (!adminCheck) {
    const saltRounds = 10;
    const adminPassword = 'Admin@BrightLoop2026!';
    const adminHash = bcrypt.hashSync(adminPassword, saltRounds);

    await run(`
      INSERT INTO users (email, password_hash, full_name, role, company_name, phone)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      'admin@brightloop.com',
      adminHash,
      'Elena Vance (Admin)',
      'admin',
      'Brightloop Software Inc.',
      '+1-555-0100'
    ]);

    const staffHash = bcrypt.hashSync('Staff@BrightLoop2026!', saltRounds);
    await run(`
      INSERT INTO users (email, password_hash, full_name, role, company_name, phone)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      'sarah.ops@brightloop.com',
      staffHash,
      'Sarah Jenkins',
      'staff',
      'Brightloop Software Inc.',
      '+1-555-0101'
    ]);

    const customerHash = bcrypt.hashSync('Customer@BrightLoop2026!', saltRounds);
    await run(`
      INSERT INTO users (email, password_hash, full_name, role, company_name, phone)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      'alice@cornerbakery.com',
      customerHash,
      'Alice Smith',
      'customer',
      'Corner Bakery & Cafe',
      '+1-555-0102'
    ]);

    console.log('✅ SQLite users table initialized and seeded with Admin user.');
  } else {
    console.log('ℹ️ SQLite database already contains admin user.');
  }
}

// User query functions
async function getUserByEmail(email) {
  return await get('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()]);
}

async function getUserById(id) {
  return await get('SELECT id, email, full_name, role, company_name, phone, is_active, created_at FROM users WHERE id = ?', [id]);
}

async function getAllUsers() {
  return await all('SELECT id, email, full_name, role, company_name, phone, is_active, created_at FROM users ORDER BY id ASC');
}

async function createUser({ email, password, full_name, role = 'customer', company_name = '', phone = '', created_by = null }) {
  const saltRounds = 10;
  const hash = bcrypt.hashSync(password, saltRounds);
  const result = await run(`
    INSERT INTO users (email, password_hash, full_name, role, company_name, phone, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [email.trim().toLowerCase(), hash, full_name.trim(), role, company_name.trim(), phone.trim(), created_by]);
  return await getUserById(result.lastID);
}

module.exports = {
  db,
  initDatabase,
  getUserByEmail,
  getUserById,
  getAllUsers,
  createUser
};
