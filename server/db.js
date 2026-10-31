const path = require('path');
const bcrypt = require('bcryptjs');

// Database path for official SQLite database
const DB_PATH = path.join(__dirname, '..', 'users.db');

let db;
try {
  const Database = require('better-sqlite3');
  db = new Database(DB_PATH);
} catch (err) {
  // Graceful fallback to Node.js v24 built-in SQLite driver when better-sqlite3 native bindings are unavailable
  const { DatabaseSync } = require('node:sqlite');
  const syncDb = new DatabaseSync(DB_PATH);
  syncDb.pragma = (cmd) => {
    try {
      syncDb.exec(`PRAGMA ${cmd}`);
    } catch (e) {
      // pragma fallback
    }
  };
  db = syncDb;
}

// Enable WAL mode and foreign keys
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

console.log('📦 Connected to SQLite database at:', DB_PATH);

// Initialize Tables
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

    -- Products table
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      sales_price REAL NOT NULL,
      cost_price REAL NOT NULL,
      notes TEXT,
      has_odoo_variant INTEGER NOT NULL DEFAULT 0,
      odoo_price_offset REAL NOT NULL DEFAULT 560,
      variants_json TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- Legacy global plans table (kept for backward compatibility)
    CREATE TABLE IF NOT EXISTS plans (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      cost REAL NOT NULL,
      frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
      min_quantity INTEGER NOT NULL DEFAULT 1,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      auto_close_on_end INTEGER NOT NULL DEFAULT 1,
      can_close_early INTEGER NOT NULL DEFAULT 1,
      can_pause INTEGER NOT NULL DEFAULT 1,
      can_renew INTEGER NOT NULL DEFAULT 1,
      description TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- Product-scoped plans (one-to-many: one product → many plans)
    CREATE TABLE IF NOT EXISTS product_plans (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      billing_interval TEXT NOT NULL CHECK (billing_interval IN ('daily', 'weekly', 'monthly', 'yearly')),
      minimum_quantity INTEGER NOT NULL DEFAULT 1,
      available_from TEXT NOT NULL,
      available_until TEXT NOT NULL,
      auto_close INTEGER NOT NULL DEFAULT 1,
      allow_early_close INTEGER NOT NULL DEFAULT 1,
      allow_pause INTEGER NOT NULL DEFAULT 1,
      allow_renew INTEGER NOT NULL DEFAULT 1,
      is_active INTEGER NOT NULL DEFAULT 1,
      description TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_product_plans_product_id ON product_plans(product_id);
    CREATE INDEX IF NOT EXISTS idx_product_plans_active ON product_plans(is_active);
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

// ─── Product query functions ───────────────────────────────────────────────

async function getAllProducts() {
  const rows = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    type: r.type,
    salesPrice: r.sales_price,
    costPrice: r.cost_price,
    notes: r.notes || '',
    hasOdooVariant: Boolean(r.has_odoo_variant),
    odooPriceOffset: r.odoo_price_offset,
    variants: r.variants_json ? JSON.parse(r.variants_json) : []
  }));
}

async function createProduct({ id, name, type, salesPrice, costPrice, notes, hasOdooVariant = false, odooPriceOffset = 560, variants = [] }) {
  const prodId = id || `prod-${Date.now()}`;
  const stmt = db.prepare(`
    INSERT INTO products (id, name, type, sales_price, cost_price, notes, has_odoo_variant, odoo_price_offset, variants_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    prodId,
    name.trim(),
    type,
    parseFloat(salesPrice) || 0,
    parseFloat(costPrice) || 0,
    notes || '',
    hasOdooVariant ? 1 : 0,
    parseFloat(odooPriceOffset) || 560,
    JSON.stringify(variants)
  );

  return {
    id: prodId,
    name,
    type,
    salesPrice: parseFloat(salesPrice) || 0,
    costPrice: parseFloat(costPrice) || 0,
    notes: notes || '',
    hasOdooVariant: Boolean(hasOdooVariant),
    odooPriceOffset: parseFloat(odooPriceOffset) || 560,
    variants
  };
}

async function deleteProduct(id) {
  // Cascade delete removes product_plans automatically (ON DELETE CASCADE)
  return db.prepare('DELETE FROM products WHERE id = ?').run(id);
}

// ─── Legacy global plans (kept for backward compatibility) ─────────────────

async function getAllPlans() {
  const rows = db.prepare('SELECT * FROM plans ORDER BY created_at DESC').all();
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    cost: r.cost,
    frequency: r.frequency,
    minQuantity: r.min_quantity,
    startDate: r.start_date,
    endDate: r.end_date,
    autoCloseOnEnd: Boolean(r.auto_close_on_end),
    canCloseEarly: Boolean(r.can_close_early),
    canPause: Boolean(r.can_pause),
    canRenew: Boolean(r.can_renew),
    description: r.description || ''
  }));
}

async function createPlan({ id, name, cost, frequency, minQuantity = 1, startDate, endDate, autoCloseOnEnd = true, canCloseEarly = true, canPause = true, canRenew = true, description = '' }) {
  const planId = id || `plan-${Date.now()}`;
  const stmt = db.prepare(`
    INSERT INTO plans (id, name, cost, frequency, min_quantity, start_date, end_date, auto_close_on_end, can_close_early, can_pause, can_renew, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    planId,
    name.trim(),
    parseFloat(cost) || 0,
    frequency,
    parseInt(minQuantity) || 1,
    startDate,
    endDate,
    autoCloseOnEnd ? 1 : 0,
    canCloseEarly ? 1 : 0,
    canPause ? 1 : 0,
    canRenew ? 1 : 0,
    description || ''
  );

  return {
    id: planId,
    name,
    cost: parseFloat(cost) || 0,
    frequency,
    minQuantity: parseInt(minQuantity) || 1,
    startDate,
    endDate,
    autoCloseOnEnd: Boolean(autoCloseOnEnd),
    canCloseEarly: Boolean(canCloseEarly),
    canPause: Boolean(canPause),
    canRenew: Boolean(canRenew),
    description: description || ''
  };
}

async function deletePlan(id) {
  return db.prepare('DELETE FROM plans WHERE id = ?').run(id);
}

// ─── Product-scoped Plan functions ─────────────────────────────────────────

function mapProductPlanRow(r) {
  return {
    id: r.id,
    productId: r.product_id,
    name: r.name,
    price: r.price,
    billingInterval: r.billing_interval,
    minimumQuantity: r.minimum_quantity,
    availableFrom: r.available_from,
    availableUntil: r.available_until,
    autoClose: Boolean(r.auto_close),
    allowEarlyClose: Boolean(r.allow_early_close),
    allowPause: Boolean(r.allow_pause),
    allowRenew: Boolean(r.allow_renew),
    isActive: Boolean(r.is_active),
    description: r.description || '',
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
}

async function getPlansByProductId(productId) {
  const rows = db.prepare(
    'SELECT * FROM product_plans WHERE product_id = ? ORDER BY created_at ASC'
  ).all(productId);
  return rows.map(mapProductPlanRow);
}

async function getAllProductPlans() {
  const rows = db.prepare('SELECT * FROM product_plans ORDER BY product_id, created_at ASC').all();
  return rows.map(mapProductPlanRow);
}

async function createProductPlan({
  productId,
  name,
  price,
  billingInterval,
  minimumQuantity = 1,
  availableFrom,
  availableUntil,
  autoClose = true,
  allowEarlyClose = true,
  allowPause = true,
  allowRenew = true,
  description = ''
}) {
  const planId = `pp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const stmt = db.prepare(`
    INSERT INTO product_plans
      (id, product_id, name, price, billing_interval, minimum_quantity,
       available_from, available_until, auto_close, allow_early_close,
       allow_pause, allow_renew, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    planId,
    productId,
    name.trim(),
    parseFloat(price) || 0,
    billingInterval,
    parseInt(minimumQuantity) || 1,
    availableFrom,
    availableUntil,
    autoClose ? 1 : 0,
    allowEarlyClose ? 1 : 0,
    allowPause ? 1 : 0,
    allowRenew ? 1 : 0,
    description || ''
  );

  return db.prepare('SELECT * FROM product_plans WHERE id = ?').get(planId);
}

async function updateProductPlan(planId, updates) {
  const allowed = ['name', 'price', 'billing_interval', 'minimum_quantity',
    'available_from', 'available_until', 'auto_close', 'allow_early_close',
    'allow_pause', 'allow_renew', 'description'];

  const fieldMap = {
    name: 'name',
    price: 'price',
    billingInterval: 'billing_interval',
    minimumQuantity: 'minimum_quantity',
    availableFrom: 'available_from',
    availableUntil: 'available_until',
    autoClose: 'auto_close',
    allowEarlyClose: 'allow_early_close',
    allowPause: 'allow_pause',
    allowRenew: 'allow_renew',
    description: 'description'
  };

  const setClauses = [];
  const values = [];

  for (const [jsKey, dbCol] of Object.entries(fieldMap)) {
    if (updates[jsKey] !== undefined) {
      setClauses.push(`${dbCol} = ?`);
      // Coerce booleans to integers for SQLite
      let val = updates[jsKey];
      if (typeof val === 'boolean') val = val ? 1 : 0;
      values.push(val);
    }
  }

  if (setClauses.length === 0) return null;

  setClauses.push('updated_at = CURRENT_TIMESTAMP');
  values.push(planId);

  db.prepare(`UPDATE product_plans SET ${setClauses.join(', ')} WHERE id = ?`).run(...values);
  const row = db.prepare('SELECT * FROM product_plans WHERE id = ?').get(planId);
  return row ? mapProductPlanRow(row) : null;
}

async function toggleProductPlanStatus(planId, isActive) {
  db.prepare(
    'UPDATE product_plans SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).run(isActive ? 1 : 0, planId);
  const row = db.prepare('SELECT * FROM product_plans WHERE id = ?').get(planId);
  return row ? mapProductPlanRow(row) : null;
}

async function deleteProductPlan(planId) {
  return db.prepare('DELETE FROM product_plans WHERE id = ?').run(planId);
}

module.exports = {
  db,
  initDatabase,
  getUserByEmail,
  getUserById,
  getAllUsers,
  createUser,
  getAllProducts,
  createProduct,
  deleteProduct,
  getAllPlans,
  createPlan,
  deletePlan,
  // Product-scoped plans
  getPlansByProductId,
  getAllProductPlans,
  createProductPlan,
  updateProductPlan,
  toggleProductPlanStatus,
  deleteProductPlan
};
