const path = require('path');
const bcrypt = require('bcryptjs');

// Database path for official SQLite database
const DB_PATH = path.join(__dirname, '..', 'brightloop.db');

const SQLite = require('./sqlite');
const db = new SQLite(DB_PATH);
console.log('📦 Connected to SQLite database at:', DB_PATH);

// Initialize Tables
async function initDatabase() {
  await db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  await db.exec(`
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
      product_type TEXT NOT NULL DEFAULT 'software',
      sales_price REAL NOT NULL,
      cost_price REAL NOT NULL,
      notes TEXT,
      has_odoo_variant INTEGER NOT NULL DEFAULT 0,
      odoo_price_offset REAL NOT NULL DEFAULT 0,
      variants_json TEXT,
      tax_id INTEGER,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS product_variants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      attribute_name TEXT NOT NULL,
      attribute_value TEXT NOT NULL,
      extra_price REAL NOT NULL DEFAULT 0,
      sku TEXT UNIQUE,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(product_id, attribute_name, attribute_value)
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

    -- Discounts table for Scene 5 (A customer asks for a better price)
    CREATE TABLE IF NOT EXISTS discounts (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE COLLATE NOCASE,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
      value REAL NOT NULL,
      scope TEXT NOT NULL CHECK (scope IN ('whole_subscription', 'specific_product')),
      target_product_id TEXT,
      min_quantity INTEGER NOT NULL DEFAULT 1,
      min_amount REAL NOT NULL DEFAULT 0,
      start_date TEXT,
      end_date TEXT,
      usage_limit INTEGER NOT NULL DEFAULT 100,
      times_used INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_discounts_code ON discounts(code);
    CREATE INDEX IF NOT EXISTS idx_discounts_active ON discounts(is_active);
    CREATE TABLE IF NOT EXISTS discount_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT NOT NULL UNIQUE COLLATE NOCASE,
      name TEXT NOT NULL, discount_type TEXT NOT NULL CHECK(discount_type IN ('percentage','fixed')),
      value REAL NOT NULL CHECK(value > 0), scope TEXT NOT NULL CHECK(scope IN ('product','subscription')),
      product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
      min_purchase_amount REAL NOT NULL DEFAULT 0, min_quantity INTEGER NOT NULL DEFAULT 0,
      start_date DATE, end_date DATE, max_uses INTEGER, times_used INTEGER NOT NULL DEFAULT 0,
      created_by INTEGER NOT NULL REFERENCES users(id), is_active INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Quotation creation must not consume a redemption; billing updates usage atomically.
  await db.exec('DROP TRIGGER IF EXISTS trg_discount_applied_increment');

  // Older database files predate JSON-backed product variants.
  const productColumns = await db.prepare('PRAGMA table_info(products)').all();
  if (!productColumns.some((column) => column.name === 'variants_json')) {
    await db.exec('ALTER TABLE products ADD COLUMN variants_json TEXT');
  }

  const paymentColumns = await db.prepare('PRAGMA table_info(payments)').all();
  if (paymentColumns.length && !paymentColumns.some((column) => column.name === 'transaction_ref')) {
    await db.exec('ALTER TABLE payments ADD COLUMN transaction_ref TEXT');
  }

  // Ensure Default Users (Admin, Staff, Customer/User) exist in SQLite database
  const defaultAccounts = [
    {
      email: 'admin@brightloop.com',
      password: 'Admin@BrightLoop2026!',
      fullName: 'Elena Vance (Admin)',
      role: 'admin',
      company: 'Brightloop Software Inc.',
      phone: '+1-555-0100'
    },
    {
      email: 'staff@brightloop.com',
      password: 'Staff@BrightLoop2026!',
      fullName: 'Sarah Jenkins (Staff)',
      role: 'staff',
      company: 'Brightloop Operations Team',
      phone: '+1-555-0101'
    },
    {
      email: 'sarah.ops@brightloop.com',
      password: 'Staff@BrightLoop2026!',
      fullName: 'Sarah Jenkins (Operations)',
      role: 'staff',
      company: 'Brightloop Operations Team',
      phone: '+1-555-0102'
    },
    {
      email: 'user@brightloop.com',
      password: 'User@BrightLoop2026!',
      fullName: 'Alex Morgan (Customer)',
      role: 'customer',
      company: 'Corner Bakery & Cafe',
      phone: '+1-555-0198'
    },
    {
      email: 'alice@cornerbakery.com',
      password: 'Customer@BrightLoop2026!',
      fullName: 'Alice Smith (Customer)',
      role: 'customer',
      company: 'Corner Bakery & Cafe',
      phone: '+1-555-0199'
    }
  ];

  const saltRounds = 10;
  for (const acc of defaultAccounts) {
    const existing = await db.prepare("SELECT id FROM users WHERE email = ? COLLATE NOCASE").get(acc.email);
    if (!existing) {
      const hash = bcrypt.hashSync(acc.password, saltRounds);
      const insertUser = await db.prepare(`
        INSERT INTO users (email, password_hash, full_name, role, company_name, phone)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      await insertUser.run(
        acc.email.toLowerCase(),
        hash,
        acc.fullName,
        acc.role,
        acc.company,
        acc.phone
      );
      console.log(`✅ SQLite users table initialized with default ${acc.role} account: ${acc.email}`);
    }
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
  const stmt = await db.prepare(`
    INSERT INTO users (email, password_hash, full_name, role, company_name, phone, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const result = await stmt.run(email.trim().toLowerCase(), hash, full_name.trim(), role, company_name.trim(), phone.trim(), created_by);
  return await getUserById(result.lastInsertRowid);
}

// ─── Product query functions ───────────────────────────────────────────────

async function getVariantsByProductId(productId) {
  const rows = await db.prepare('SELECT id, product_id, attribute_name, attribute_value, extra_price, sku, is_active FROM product_variants WHERE product_id = ? ORDER BY id').all(productId);
  return rows.map((row) => ({ id: row.id, productId: row.product_id, name: row.attribute_value, attributeName: row.attribute_name, priceOffset: row.extra_price, sku: row.sku, isActive: Boolean(row.is_active) }));
}
async function mapProduct(row) {
  const variants = await getVariantsByProductId(row.id);
  return { id: row.id, name: row.name, type: row.type, salesPrice: row.sales_price,
    costPrice: row.cost_price, notes: row.notes || '', hasOdooVariant: Boolean(row.has_odoo_variant),
    odooPriceOffset: row.odoo_price_offset, variants: variants.length ? variants : (row.variants_json ? JSON.parse(row.variants_json) : []) };
}
async function getAllProducts() {
  const rows = await db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
  return Promise.all(rows.map(mapProduct));
}
async function syncVariants(productId, variants) {
  const current = await getVariantsByProductId(productId);
  const kept = new Set();
  for (const variant of variants) {
    const name = variant.name.trim();
    const attribute = variant.attributeName || 'Edition';
    const existing = current.find((row) => !kept.has(row.id) && (variant.id != null ? String(row.id) === String(variant.id) : row.name === name && row.attributeName === attribute));
    if (existing) {
      await db.prepare('UPDATE product_variants SET attribute_name = ?, attribute_value = ?, extra_price = ? WHERE id = ? AND product_id = ?').run(attribute, name, Number(variant.priceOffset), existing.id, productId);
      kept.add(existing.id);
    } else {
      const result = await db.prepare('INSERT INTO product_variants (product_id, attribute_name, attribute_value, extra_price) VALUES (?, ?, ?, ?)').run(productId, attribute, name, Number(variant.priceOffset));
      kept.add(result.lastInsertRowid);
    }
  }
  for (const existing of current) if (!kept.has(existing.id)) await db.prepare('DELETE FROM product_variants WHERE id = ? AND product_id = ?').run(existing.id, productId);
  const saved = await getVariantsByProductId(productId);
  await db.prepare('UPDATE products SET variants_json = ? WHERE id = ?').run(JSON.stringify(saved), productId);
}
function productType(type) { return String(type || '').toLowerCase().replace('-', ''); }
async function createProduct({ id, name, type, salesPrice, costPrice, notes, variants = [] }) {
  const productId = id || `prod-${require('crypto').randomUUID()}`;
  return db.transaction(async () => {
    await db.prepare(`INSERT INTO products (id, name, type, product_type, sales_price, cost_price, notes, has_odoo_variant, odoo_price_offset, variants_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, '[]')`).run(productId, name.trim(), type, productType(type), Number(salesPrice), Number(costPrice), notes || '');
    await syncVariants(productId, variants);
    return mapProduct(await db.prepare('SELECT * FROM products WHERE id = ?').get(productId));
  });
}
async function deleteProduct(id) { return db.prepare('DELETE FROM products WHERE id = ?').run(id); }
async function updateProduct(id, updates) {
  return db.transaction(async () => {
    const existing = await db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!existing) return null;
    const type = updates.type === undefined ? existing.type : updates.type;
    await db.prepare('UPDATE products SET name = ?, type = ?, product_type = ?, sales_price = ?, cost_price = ?, notes = ? WHERE id = ?')
      .run(updates.name === undefined ? existing.name : updates.name.trim(), type, productType(type), updates.salesPrice === undefined ? existing.sales_price : Number(updates.salesPrice), updates.costPrice === undefined ? existing.cost_price : Number(updates.costPrice), updates.notes === undefined ? existing.notes : updates.notes, id);
    if (updates.variants !== undefined) await syncVariants(id, updates.variants);
    return mapProduct(await db.prepare('SELECT * FROM products WHERE id = ?').get(id));
  });
}

// ─── Legacy global plans (kept for backward compatibility) ─────────────────

async function getAllPlans() {
  const rows = await db.prepare('SELECT * FROM plans ORDER BY created_at DESC').all();
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
  const stmt = await db.prepare(`
    INSERT INTO plans (id, name, cost, frequency, min_quantity, start_date, end_date, auto_close_on_end, can_close_early, can_pause, can_renew, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  await stmt.run(
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
  const rows = await db.prepare(
    'SELECT * FROM product_plans WHERE product_id = ? ORDER BY created_at ASC'
  ).all(productId);
  return rows.map(mapProductPlanRow);
}

async function getAllProductPlans() {
  const rows = await db.prepare('SELECT * FROM product_plans ORDER BY product_id, created_at ASC').all();
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
  const validPrice = Math.max(0, parseFloat(price) || 0);
  const stmt = await db.prepare(`
    INSERT INTO product_plans
      (id, product_id, name, price, billing_interval, minimum_quantity,
       available_from, available_until, auto_close, allow_early_close,
       allow_pause, allow_renew, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  await stmt.run(
    planId,
    productId,
    name.trim(),
    validPrice,
    billingInterval,
    Math.max(1, parseInt(minimumQuantity) || 1),
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
      if (jsKey === 'price') {
        val = Math.max(0, parseFloat(val) || 0);
      } else if (jsKey === 'minimumQuantity') {
        val = Math.max(1, parseInt(val) || 1);
      } else if (typeof val === 'boolean') {
        val = val ? 1 : 0;
      }
      values.push(val);
    }
  }

  if (setClauses.length === 0) return null;

  setClauses.push('updated_at = CURRENT_TIMESTAMP');
  values.push(planId);

  await db.prepare(`UPDATE product_plans SET ${setClauses.join(', ')} WHERE id = ?`).run(...values);
  const row = await db.prepare('SELECT * FROM product_plans WHERE id = ?').get(planId);
  return row ? mapProductPlanRow(row) : null;
}

async function toggleProductPlanStatus(planId, isActive) {
  await db.prepare(
    'UPDATE product_plans SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).run(isActive ? 1 : 0, planId);
  const row = await db.prepare('SELECT * FROM product_plans WHERE id = ?').get(planId);
  return row ? mapProductPlanRow(row) : null;
}

async function deleteProductPlan(planId) {
  return db.prepare('DELETE FROM product_plans WHERE id = ?').run(planId);
}

// ─── Discount query functions (Scene 5 Live Persistence) ───────────────────

function mapDiscountRow(r) {
  return {
    id: String(r.id), code: r.code, name: r.name, type: r.discount_type,
    value: r.value, scope: r.scope === 'product' ? 'specific_product' : 'whole_subscription',
    targetProductId: r.product_id == null ? null : String(r.product_id),
    minQuantity: r.min_quantity, minAmount: r.min_purchase_amount,
    startDate: r.start_date, endDate: r.end_date, usageLimit: r.max_uses,
    timesUsed: r.times_used, isActive: Boolean(r.is_active), createdAt: r.created_at
  };
}
async function getAllDiscounts() {
  return (await db.prepare('SELECT * FROM discount_rules ORDER BY created_at DESC, id DESC').all()).map(mapDiscountRow);
}
async function getDiscountByCode(code) {
  if (!code) return null;
  const row = await db.prepare('SELECT * FROM discount_rules WHERE code = ? COLLATE NOCASE').get(code.trim());
  return row ? mapDiscountRow(row) : null;
}
async function getDiscountById(id) {
  const row = await db.prepare('SELECT * FROM discount_rules WHERE id = ?').get(id);
  return row ? mapDiscountRow(row) : null;
}
async function createDiscount({ code, name, type, value, scope, targetProductId, minQuantity, minAmount, startDate, endDate, usageLimit, createdBy }) {
  const result = await db.prepare(`INSERT INTO discount_rules
    (code,name,discount_type,value,scope,product_id,min_quantity,min_purchase_amount,start_date,end_date,max_uses,created_by)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run(code.trim().toUpperCase(), name.trim(), type, Number(value),
      scope === 'specific_product' ? 'product' : 'subscription', scope === 'specific_product' ? targetProductId : null,
      Number(minQuantity), Number(minAmount), startDate || null, endDate || null, usageLimit == null ? null : Number(usageLimit), createdBy);
  return getDiscountById(result.lastInsertRowid);
}
async function toggleDiscountStatus(id, isActive) {
  if (typeof isActive === 'boolean') await db.prepare('UPDATE discount_rules SET is_active = ? WHERE id = ?').run(isActive ? 1 : 0, id);
  else await db.prepare('UPDATE discount_rules SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END WHERE id = ?').run(id);
  return getDiscountById(id);
}
async function incrementDiscountUsage(code, count = 1) {
  await db.prepare('UPDATE discount_rules SET times_used = times_used + ? WHERE code = ? COLLATE NOCASE AND is_active = 1 AND (max_uses IS NULL OR times_used + ? <= max_uses)').run(count, code, count);
  return getDiscountByCode(code);
}
async function deleteDiscount(id) {
  return db.prepare('DELETE FROM discount_rules WHERE id = ?').run(id);
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
  updateProduct,
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
  deleteProductPlan,
  // Product variants
  getVariantsByProductId,
  // Discounts
  getAllDiscounts,
  getDiscountByCode,
  getDiscountById,
  createDiscount,
  toggleDiscountStatus,
  incrementDiscountUsage,
  deleteDiscount
};
