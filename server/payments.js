const { randomUUID } = require('crypto');

class PaymentError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

async function recordPayment(db, { invoiceId, amount, method, note, transactionRef, idempotencyKey }, user) {
  if (!['admin', 'staff'].includes(user.role)) throw new PaymentError(403, 'Staff access required.');
  if (!Number.isInteger(Number(invoiceId)) || Number(invoiceId) < 1) throw new PaymentError(400, 'Invalid invoice.');
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0 || !Number.isSafeInteger(Math.round(amount * 100)) || Math.abs(amount * 100 - Math.round(amount * 100)) > 1e-7) throw new PaymentError(400, 'Amount must be positive and have at most two decimal places.');
  if (!['Credit Card', 'Bank Transfer', 'Cash', 'Direct Debit', 'Online'].includes(method)) throw new PaymentError(400, 'Unsupported payment method.');
  if (typeof idempotencyKey !== 'string' || !/^[A-Za-z0-9_-]{16,128}$/.test(idempotencyKey)) throw new PaymentError(400, 'A valid idempotency key is required.');
  if (transactionRef != null && (typeof transactionRef !== 'string' || transactionRef.length > 200)) throw new PaymentError(400, 'Invalid transaction reference.');
  if (note != null && (typeof note !== 'string' || note.length > 1000)) throw new PaymentError(400, 'Invalid note.');
  return db.transaction(async () => {
    await db.exec(`CREATE TABLE IF NOT EXISTS payment_requests (request_key TEXT PRIMARY KEY, invoice_id INTEGER NOT NULL, amount_cents INTEGER NOT NULL, method TEXT NOT NULL, note TEXT NOT NULL, payment_id INTEGER NOT NULL REFERENCES payments(id))`);
    const prior = await db.prepare('SELECT * FROM payment_requests WHERE request_key = ?').get(idempotencyKey);
    if (prior) {
      if (prior.invoice_id !== Number(invoiceId) || prior.amount_cents !== Math.round(amount * 100) || prior.method !== method || prior.note !== (note || '')) throw new PaymentError(409, 'Idempotency key was used for a different payment.');
      const payment = await db.prepare('SELECT * FROM payments WHERE id = ?').get(prior.payment_id);
      if ((payment.transaction_ref || '') !== (transactionRef || '')) throw new PaymentError(409, 'Idempotency key was used for a different payment.');
      return { payment, replayed: true };
    }
    const invoice = await db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId);
    if (!invoice) throw new PaymentError(404, 'Invoice not found.');
    if (invoice.status !== 'Confirmed') throw new PaymentError(409, 'Only confirmed invoices can receive payments.');
    const balanceCents = Math.round(invoice.balance_due * 100);
    const amountCents = Math.round(amount * 100);
    if (amountCents > balanceCents) throw new PaymentError(400, 'Payment exceeds the outstanding balance.');
    const paidCents = Math.round(invoice.amount_paid * 100) + amountCents;
    const remainingCents = balanceCents - amountCents;
    const number = `PAY-${randomUUID()}`;
    const result = await db.prepare("INSERT INTO payments (payment_number, invoice_id, payment_method, amount, payment_date, note, transaction_ref) VALUES (?, ?, ?, ?, date('now'), ?, ?)").run(number, invoiceId, method, amountCents / 100, note || '', transactionRef || null);
    await db.prepare("UPDATE invoices SET amount_paid = ?, balance_due = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(paidCents / 100, remainingCents / 100, remainingCents === 0 ? 'Paid' : 'Confirmed', invoiceId);
    await db.prepare('INSERT INTO payment_requests VALUES (?, ?, ?, ?, ?, ?)').run(idempotencyKey, invoiceId, amountCents, method, note || '', result.lastInsertRowid);
    const payment = await db.prepare('SELECT * FROM payments WHERE id = ?').get(result.lastInsertRowid);
    return { payment, replayed: false };
  });
}
module.exports = { recordPayment, PaymentError };
