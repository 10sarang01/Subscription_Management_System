const { randomUUID } = require('crypto');

class BillingError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
function addDays(date, days) {
  const d = new Date(`${date}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
function advanceDate(date, frequency) {
  if (frequency === 'daily') return addDays(date, 1);
  if (frequency === 'weekly') return addDays(date, 7);
  if (!['monthly', 'yearly'].includes(frequency)) throw new BillingError(400, 'Unsupported billing frequency.');
  const [year, month, day] = date.split('-').map(Number);
  const nextMonth = frequency === 'yearly' ? month - 1 + 12 : month;
  const first = new Date(Date.UTC(year, nextMonth, 1));
  const lastDay = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  first.setUTCDate(Math.min(day, lastDay));
  return first.toISOString().slice(0, 10);
}
const cents = (value) => Math.round(Number(value) * 100);

async function runBilling(db, date, user) {
  if (!['admin', 'staff'].includes(user.role)) throw new BillingError(403, 'Staff access required.');
  if (!validDate(date)) throw new BillingError(400, 'A valid billing date is required.');
  return db.transaction(async () => {
    const subscriptions = await db.prepare(`SELECT s.*, p.billing_interval FROM subscriptions s
      JOIN subscription_plans p ON p.id = s.plan_id
      WHERE s.status = 'Active' AND s.next_billing_date IS NOT NULL AND s.next_billing_date <= ?
        AND (s.expiry_date IS NULL OR s.next_billing_date <= s.expiry_date)
        AND (s.last_billing_date IS NULL OR s.last_billing_date < ?)
      ORDER BY s.id`).all(date, date);
    const generated = [];
    for (const sub of subscriptions) {
      const start = sub.next_billing_date;
      const end = advanceDate(start, sub.billing_interval);
      const existing = await db.prepare('SELECT id FROM invoices WHERE subscription_id = ? AND billing_period_start = ? AND billing_period_end = ?').get(sub.id, start, end);
      if (existing) throw new BillingError(409, `Billing period already exists for ${sub.subscription_number}; check its billing dates.`);
      const lines = await db.prepare(`SELECT l.*, p.name AS product_name, COALESCE(t.rate, 0) AS tax_rate
        FROM subscription_lines l JOIN products p ON p.id = l.product_id LEFT JOIN tax_rules t ON t.id = l.tax_id
        WHERE l.subscription_id = ? ORDER BY l.id`).all(sub.id);
      if (!lines.length) throw new BillingError(409, `Subscription ${sub.subscription_number} has no line items.`);
      let discount = null;
      if (sub.discount_code) {
        const rule = await db.prepare('SELECT * FROM discount_rules WHERE code = ? COLLATE NOCASE').get(sub.discount_code);
        const totalQuantity = lines.reduce((sum, line) => sum + line.quantity, 0);
        const subtotal = lines.reduce((sum, line) => sum + cents(line.unit_price) * line.quantity, 0);
        if (rule && rule.is_active && (!rule.start_date || rule.start_date <= date) && (!rule.end_date || rule.end_date >= date) && (rule.max_uses == null || rule.times_used < rule.max_uses) && totalQuantity >= rule.min_quantity && subtotal >= cents(rule.min_purchase_amount)) discount = rule;
      }
      let subtotalCents = 0, discountCents = 0, taxCents = 0;
      const prepared = lines.map((line) => ({ ...line, lineSubtotal: cents(line.unit_price) * line.quantity }));
      const eligibleSubtotal = prepared.reduce((sum, line) => sum + (discount && (discount.scope !== 'product' || String(discount.product_id) === String(line.product_id)) ? line.lineSubtotal : 0), 0);
      const requestedDiscount = discount ? (discount.discount_type === 'percentage' ? Math.round(eligibleSubtotal * Number(discount.value) / 100) : cents(discount.value)) : 0;
      const discountTarget = Math.max(0, Math.min(eligibleSubtotal, requestedDiscount));
      let allocatedBase = 0, allocatedDiscount = 0;
      const invoiceLines = prepared.map((line) => {
        const eligible = discount && (discount.scope !== 'product' || String(discount.product_id) === String(line.product_id));
        let lineDiscount = 0;
        if (eligible && eligibleSubtotal > 0) {
          allocatedBase += line.lineSubtotal;
          const cumulative = Math.round(discountTarget * allocatedBase / eligibleSubtotal);
          lineDiscount = cumulative - allocatedDiscount;
          allocatedDiscount = cumulative;
        }
        const tax = Math.round((line.lineSubtotal - lineDiscount) * Number(line.tax_rate || 0) / 100);
        subtotalCents += line.lineSubtotal; discountCents += lineDiscount; taxCents += tax;
        return { ...line, lineDiscount, tax, totalCents: line.lineSubtotal - lineDiscount + tax };
      });
      const totalCents = subtotalCents - discountCents + taxCents;
      const terms = { 'Immediate': 0, 'Due upon receipt': 0, 'Net 15': 15, 'Net 30': 30, 'Net 60': 60 };
      if (!(sub.payment_terms in terms)) throw new BillingError(409, `Unsupported payment terms for ${sub.subscription_number}.`);
      const invoice = await db.prepare(`INSERT INTO invoices (invoice_number, subscription_id, customer_id, billing_period_start, billing_period_end, invoice_date, due_date, status, subtotal, discount_total, tax_total, total_amount, amount_paid, balance_due)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`).run(`INV-${randomUUID()}`, sub.id, sub.customer_id, start, end, date, addDays(date, terms[sub.payment_terms]), totalCents === 0 ? 'Paid' : 'Confirmed', subtotalCents / 100, discountCents / 100, taxCents / 100, totalCents / 100, totalCents / 100);
      const insertLine = db.prepare(`INSERT INTO invoice_lines (invoice_id, product_id, variant_id, description, quantity, unit_price, discount_amount, tax_id, tax_amount, line_total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      for (const line of invoiceLines) {
        await insertLine.run(invoice.lastInsertRowid, line.product_id, line.variant_id, line.product_name_snapshot || line.product_name, line.quantity, line.unit_price, line.lineDiscount / 100, line.tax_id, line.tax / 100, line.totalCents / 100);
      }
      if (discount && discountCents > 0) await db.prepare('UPDATE discount_rules SET times_used = times_used + 1 WHERE id = ?').run(discount.id);
      await db.prepare('UPDATE subscriptions SET last_billing_date = ?, next_billing_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(date, end, sub.id);
      generated.push({ id: invoice.lastInsertRowid, total: totalCents / 100 });
    }
    return { generatedCount: generated.length, totalAmount: generated.reduce((sum, item) => sum + cents(item.total), 0) / 100, invoices: generated };
  });
}
module.exports = { runBilling, BillingError, advanceDate };
