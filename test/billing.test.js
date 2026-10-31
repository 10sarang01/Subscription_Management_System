const { test } = require('node:test');
const assert = require('node:assert/strict');
const SQLite = require('../server/sqlite');
const { runBilling, advanceDate } = require('../server/billing');

async function fixture() {
  const db = new SQLite(':memory:');
  await db.exec(`
    CREATE TABLE subscription_plans (id INTEGER PRIMARY KEY, billing_interval TEXT);
    CREATE TABLE subscriptions (id INTEGER PRIMARY KEY, subscription_number TEXT, plan_id INTEGER, customer_id INTEGER, status TEXT, next_billing_date TEXT, last_billing_date TEXT, expiry_date TEXT, payment_terms TEXT, discount_code TEXT, updated_at TEXT);
    CREATE TABLE products (id TEXT PRIMARY KEY, name TEXT);
    CREATE TABLE tax_rules (id INTEGER PRIMARY KEY, rate REAL);
    CREATE TABLE subscription_lines (id INTEGER PRIMARY KEY, subscription_id INTEGER, product_id TEXT, variant_id INTEGER, quantity INTEGER, unit_price REAL, tax_id INTEGER, product_name_snapshot TEXT);
    CREATE TABLE discount_rules (id INTEGER PRIMARY KEY, code TEXT, is_active INTEGER, start_date TEXT, end_date TEXT, max_uses INTEGER, times_used INTEGER, min_quantity INTEGER, min_purchase_amount REAL, scope TEXT, product_id TEXT, discount_type TEXT, value REAL);
    CREATE TABLE invoices (id INTEGER PRIMARY KEY, invoice_number TEXT UNIQUE, subscription_id INTEGER, customer_id INTEGER, billing_period_start TEXT, billing_period_end TEXT, invoice_date TEXT, due_date TEXT, status TEXT, subtotal REAL, discount_total REAL, tax_total REAL, total_amount REAL, amount_paid REAL, balance_due REAL, UNIQUE(subscription_id,billing_period_start,billing_period_end));
    CREATE TABLE invoice_lines (id INTEGER PRIMARY KEY, invoice_id INTEGER, product_id TEXT, variant_id INTEGER, description TEXT, quantity INTEGER, unit_price REAL, discount_amount REAL, tax_id INTEGER, tax_amount REAL, line_total REAL);
    INSERT INTO subscription_plans VALUES (1,'monthly');
    INSERT INTO subscriptions VALUES (1,'SUB-1',1,1,'Active','2026-01-31',NULL,NULL,'Net 30','SAVE',NULL);
    INSERT INTO products VALUES ('a','Product A'),('b','Product B');
    INSERT INTO tax_rules VALUES (1,10);
    INSERT INTO subscription_lines VALUES (1,1,'a',NULL,1,100,1,NULL),(2,1,'b',NULL,1,50,1,NULL);
    INSERT INTO discount_rules VALUES (1,'SAVE',1,NULL,NULL,2,0,1,0,'product','a','percentage',10);
  `);
  return db;
}

test('billing is atomic, applies scoped discounts and prevents same-day repeat runs', async () => {
  const db = await fixture();
  try {
    const staff = { role: 'staff' };
    const results = await Promise.all([runBilling(db, '2026-01-31', staff), runBilling(db, '2026-01-31', staff)]);
    assert.equal(results.reduce((sum, result) => sum + result.generatedCount, 0), 1);
    const invoice = await db.prepare('SELECT * FROM invoices').get();
    assert.equal(invoice.subtotal, 150); assert.equal(invoice.discount_total, 10); assert.equal(invoice.tax_total, 14); assert.equal(invoice.total_amount, 154);
    assert.equal(invoice.billing_period_end, '2026-02-28');
    assert.equal((await db.prepare('SELECT times_used FROM discount_rules').get()).times_used, 1);
    assert.equal((await db.prepare('SELECT count(*) AS n FROM invoices').get()).n, 1);
    await assert.rejects(() => runBilling(db, '2026-02-28', { role: 'customer' }), /Staff access/);
    assert.equal(advanceDate('2024-02-29', 'yearly'), '2025-02-28');
  } finally { await db.close(); }
});

test('failure rolls back every invoice in the batch', async () => {
  const db = await fixture();
  try {
    await db.exec("INSERT INTO subscriptions VALUES (2,'SUB-2',1,1,'Active','2026-01-31',NULL,NULL,'Net 30',NULL,NULL)");
    await assert.rejects(() => runBilling(db, '2026-01-31', { role: 'admin' }), /no line items/);
    assert.equal((await db.prepare('SELECT count(*) AS n FROM invoices').get()).n, 0);
    assert.equal((await db.prepare('SELECT next_billing_date FROM subscriptions WHERE id = 1').get()).next_billing_date, '2026-01-31');
    assert.equal((await db.prepare('SELECT times_used FROM discount_rules').get()).times_used, 0);
  } finally { await db.close(); }
});
