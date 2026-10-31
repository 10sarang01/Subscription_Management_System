// Read invoices with customer isolation; financial values remain those stored on the invoice.
async function getInvoices(db, user) {
  if (!['admin', 'staff', 'customer'].includes(user.role)) throw new Error('Unsupported role');
  const where = user.role === 'customer' ? 'WHERE i.customer_id = ?' : '';
  const query = db.prepare(`SELECT i.*, u.full_name, u.company_name, u.email,
    s.subscription_number
    FROM invoices i JOIN users u ON u.id = i.customer_id
    LEFT JOIN subscriptions s ON s.id = i.subscription_id
    ${where} ORDER BY i.invoice_date DESC, i.id DESC`);
  const rows = await (user.role === 'customer' ? query.all(user.id) : query.all());
  const lines = db.prepare(`SELECT l.*, t.rate AS tax_rate FROM invoice_lines l
    LEFT JOIN tax_rules t ON t.id = l.tax_id WHERE l.invoice_id = ? ORDER BY l.id`);
  return Promise.all(rows.map(async (row) => ({
    id: row.id,
    invoiceNumber: row.invoice_number,
    subscriptionNumber: row.subscription_number || '',
    customerName: row.company_name || row.full_name,
    customerEmail: row.email,
    issueDate: row.invoice_date,
    dueDate: row.due_date,
    billingPeriodStart: row.billing_period_start,
    billingPeriodEnd: row.billing_period_end,
    status: row.status === 'Confirmed' && row.balance_due > 0 && row.due_date < new Date().toISOString().slice(0, 10) ? 'Overdue' : row.status === 'Confirmed' && row.amount_paid > 0 ? 'Partially Paid' : row.status,
    subtotal: row.subtotal,
    discountAmount: row.discount_total,
    taxTotal: row.tax_total,
    total: row.total_amount,
    amountPaid: row.amount_paid,
    balance: row.balance_due,
    sentAt: row.sent_at,
    items: (await lines.all(row.id)).map((line) => ({
      productId: line.product_id,
      name: line.description,
      quantity: line.quantity,
      unitPrice: line.unit_price,
      discountAmount: line.discount_amount,
      taxRate: line.tax_rate == null ? null : line.tax_rate / 100,
      taxAmount: line.tax_amount,
      total: line.line_total
    }))
  })));
}
module.exports = { getInvoices };

async function transitionInvoice(db, invoiceId, action, user) {
  if (!['admin', 'staff'].includes(user.role)) { const e = new Error('Staff access required.'); e.status = 403; throw e; }
  if (!Number.isInteger(Number(invoiceId)) || Number(invoiceId) < 1) { const e = new Error('Invalid invoice.'); e.status = 400; throw e; }
  if (!['confirm', 'cancel'].includes(action)) { const e = new Error('Invalid action.'); e.status = 400; throw e; }
  return db.transaction(async () => {
    const invoice = await db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId);
    if (!invoice) { const e = new Error('Invoice not found.'); e.status = 404; throw e; }
    if ((action === 'confirm' && invoice.status !== 'Draft') || (action === 'cancel' && (!['Draft', 'Confirmed'].includes(invoice.status) || invoice.amount_paid > 0))) {
      const e = new Error('This invoice cannot be changed in its current state.'); e.status = 409; throw e;
    }
    await db.prepare('UPDATE invoices SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(action === 'confirm' ? 'Confirmed' : 'Cancelled', invoiceId);
    return { id: Number(invoiceId), status: action === 'confirm' ? 'Confirmed' : 'Cancelled' };
  });
}

async function getPayments(db, user) {
  if (!['admin', 'staff', 'customer'].includes(user.role)) throw new Error('Unsupported role');
  const where = user.role === 'customer' ? 'WHERE i.customer_id = ?' : '';
  const query = db.prepare(`SELECT p.*, i.invoice_number, u.full_name, u.company_name
    FROM payments p JOIN invoices i ON i.id = p.invoice_id JOIN users u ON u.id = i.customer_id
    ${where} ORDER BY p.payment_date DESC, p.id DESC`);
  const rows = await (user.role === 'customer' ? query.all(user.id) : query.all());
  return rows.map((row) => ({ id: row.id, paymentNumber: row.payment_number, invoiceNumber: row.invoice_number,
    customerName: row.company_name || row.full_name, date: row.payment_date, method: row.payment_method,
    amount: row.amount, note: row.note || '', transactionRef: row.transaction_ref || '', status: 'Completed' }));
}
module.exports = { getInvoices, getPayments, transitionInvoice };
