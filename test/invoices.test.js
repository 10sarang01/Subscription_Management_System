const { test } = require('node:test');
const assert = require('node:assert/strict');
const Database = require('../server/sqlite');
const { getInvoices } = require('../server/invoices');

test('invoice reads preserve stored amounts and isolate customers', async () => {
  const db = new Database(':memory:');
  try {
    await db.exec(`
      CREATE TABLE users (id INTEGER, full_name TEXT, company_name TEXT, email TEXT);
      CREATE TABLE subscriptions (id INTEGER, subscription_number TEXT);
      CREATE TABLE invoices (id INTEGER, invoice_number TEXT, subscription_id INTEGER, customer_id INTEGER, billing_period_start TEXT, billing_period_end TEXT, invoice_date TEXT, due_date TEXT, status TEXT, subtotal REAL, discount_total REAL, tax_total REAL, total_amount REAL, amount_paid REAL, balance_due REAL, sent_at TEXT);
      CREATE TABLE tax_rules (id INTEGER, rate REAL);
      CREATE TABLE invoice_lines (id INTEGER, invoice_id INTEGER, product_id TEXT, description TEXT, quantity INTEGER, unit_price REAL, discount_amount REAL, tax_id INTEGER, tax_amount REAL, line_total REAL);
      INSERT INTO users VALUES (1,'Alice','Acme','alice@example.test'),(2,'Bob',NULL,'bob@example.test');
      INSERT INTO subscriptions VALUES (1,'SUB-1');
      INSERT INTO invoices VALUES (1,'INV-1',1,1,NULL,NULL,'2026-01-01','2026-01-31','Confirmed',100,10,9,99,20,79,NULL),(2,'INV-2',NULL,2,NULL,NULL,'2026-01-01','2026-01-31','Draft',10,0,0,10,0,10,NULL);
      INSERT INTO tax_rules VALUES (1,10);
      INSERT INTO invoice_lines VALUES (1,1,'p1','Service',1,100,10,1,9,99);
    `);
    const own = await getInvoices(db, { id: 1, role: 'customer' });
    assert.equal(own.length, 1);
    assert.equal(own[0].balance, 79);
    assert.equal(own[0].items[0].taxRate, 0.1);
    assert.equal(own[0].items[0].total, 99);
    assert.equal((await getInvoices(db, { id: 3, role: 'customer' })).length, 0);
    assert.equal((await getInvoices(db, { id: 9, role: 'staff' })).length, 2);
    await assert.rejects(() => getInvoices(db, { id: 9, role: 'unknown' }));
  } finally { await db.close(); }
});

test('invoice transitions enforce status, payment and role rules', async () => {
  const { transitionInvoice } = require('../server/invoices');
  const db = new Database(':memory:');
  try {
    await db.exec(`CREATE TABLE invoices (id INTEGER PRIMARY KEY, status TEXT, amount_paid REAL, updated_at TEXT);
      INSERT INTO invoices VALUES (1, 'Draft', 0, NULL), (2, 'Confirmed', 10, NULL), (3, 'Confirmed', 0, NULL);`);
    const staff = { role: 'staff' };
    await assert.rejects(() => transitionInvoice(db, 1, 'confirm', { role: 'customer' }), /Staff access/);
    await transitionInvoice(db, 1, 'confirm', staff);
    await assert.rejects(() => transitionInvoice(db, 1, 'confirm', staff), /cannot be changed/);
    await assert.rejects(() => transitionInvoice(db, 2, 'cancel', staff), /cannot be changed/);
    await transitionInvoice(db, 3, 'cancel', staff);
    assert.equal((await db.prepare('SELECT status FROM invoices WHERE id = 3').get()).status, 'Cancelled');
  } finally { await db.close(); }
});
