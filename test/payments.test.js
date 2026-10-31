const { test } = require('node:test');
const assert = require('node:assert/strict');
const Database = require('../server/sqlite');
const { recordPayment } = require('../server/payments');

test('payments update the invoice atomically and prevent duplicate or excessive amounts', async () => {
  const db = new Database(':memory:');
  try {
    await db.exec(`CREATE TABLE invoices (id INTEGER PRIMARY KEY, status TEXT, amount_paid REAL, balance_due REAL, updated_at TEXT);
      CREATE TABLE payments (id INTEGER PRIMARY KEY, payment_number TEXT UNIQUE, invoice_id INTEGER, payment_method TEXT, amount REAL, payment_date TEXT, note TEXT, transaction_ref TEXT);
      INSERT INTO invoices VALUES (1,'Confirmed',0,100,NULL);`);
    const staff = { role: 'staff' };
    const args = { invoiceId: 1, amount: 40, method: 'Cash', idempotencyKey: 'first-payment-key-1234' };
    assert.equal((await recordPayment(db, args, staff)).replayed, false);
    assert.equal((await recordPayment(db, args, staff)).replayed, true);
    assert.equal((await db.prepare('SELECT count(*) AS n FROM payments').get()).n, 1);
    assert.deepEqual({ ...await db.prepare('SELECT amount_paid, balance_due, status FROM invoices').get() }, { amount_paid: 40, balance_due: 60, status: 'Confirmed' });
    await assert.rejects(() => recordPayment(db, { ...args, amount: 41 }, staff), /different payment/);
    await assert.rejects(() => recordPayment(db, { ...args, amount: 61, idempotencyKey: 'second-payment-key-123' }, staff), /exceeds/);
    await assert.rejects(() => recordPayment(db, { ...args, idempotencyKey: 'third-payment-key-1234' }, { role: 'customer' }), /Staff access/);
    await recordPayment(db, { ...args, amount: 60, idempotencyKey: 'last-payment-key-12345' }, staff);
    assert.deepEqual({ ...await db.prepare('SELECT amount_paid, balance_due, status FROM invoices').get() }, { amount_paid: 100, balance_due: 0, status: 'Paid' });
    await assert.rejects(() => recordPayment(db, { ...args, idempotencyKey: 'fourth-payment-key-123' }, staff), /confirmed invoices/);
    assert.equal((await db.prepare('SELECT count(*) AS n FROM payments').get()).n, 2);
  } finally { await db.close(); }
});

test('concurrent requests cannot overpay the same invoice', async () => {
  const db = new Database(':memory:');
  try {
    await db.exec(`CREATE TABLE invoices (id INTEGER PRIMARY KEY, status TEXT, amount_paid REAL, balance_due REAL, updated_at TEXT);
      CREATE TABLE payments (id INTEGER PRIMARY KEY, payment_number TEXT UNIQUE, invoice_id INTEGER, payment_method TEXT, amount REAL, payment_date TEXT, note TEXT, transaction_ref TEXT);
      INSERT INTO invoices VALUES (1,'Confirmed',0,100,NULL);`);
    const results = await Promise.allSettled([
      recordPayment(db, { invoiceId: 1, amount: 70, method: 'Cash', idempotencyKey: 'concurrent-payment-001' }, { role: 'staff' }),
      recordPayment(db, { invoiceId: 1, amount: 70, method: 'Cash', idempotencyKey: 'concurrent-payment-002' }, { role: 'staff' })
    ]);
    assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
    assert.equal(results.filter((r) => r.status === 'rejected').length, 1);
    assert.equal((await db.prepare('SELECT balance_due FROM invoices WHERE id = 1').get()).balance_due, 30);
  } finally { await db.close(); }
});
