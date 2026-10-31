const express = require('express');
const { db } = require('./db');

const router = express.Router();

const ALLOWED_CREATE_STATUSES = new Set(['Draft', 'Quotation']);
const ALLOWED_TRANSITIONS = {
  Draft: new Set(['Quotation']),
  Quotation: new Set(['Confirmed', 'Closed']),
  Confirmed: new Set(['Active']),
  Active: new Set(['Paused', 'Closed']),
  Paused: new Set(['Active', 'Closed']),
  Closed: new Set(['Quotation'])
};

// Brightloop already owns these tables. Add only fields needed by this feature
// to that same database; never create a second database or parallel line table.
function ensureColumn(table, column, definition) {
  const exists = db.prepare(`PRAGMA table_info(${table})`).all()
    .some((existingColumn) => existingColumn.name === column);
  if (!exists) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

ensureColumn('subscriptions', 'quotation_validity_days', 'INTEGER NOT NULL DEFAULT 30');
ensureColumn('subscriptions', 'quote_issued_at', 'DATE');
ensureColumn('subscriptions', 'discount_code', 'TEXT');
ensureColumn('subscriptions', 'currency_code', "TEXT NOT NULL DEFAULT 'INR'");
ensureColumn('subscriptions', 'template_id', 'INTEGER REFERENCES quotation_templates(id) ON DELETE SET NULL');
ensureColumn('subscription_lines', 'product_name_snapshot', 'TEXT');
ensureColumn('subscription_lines', 'variant_name_snapshot', 'TEXT');

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function todayDateString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function isValidDateString(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function addDays(dateString, days) {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function parseJsonArray(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getVariantRows(productId) {
  return db.prepare(`
    SELECT id, attribute_name, attribute_value, extra_price
    FROM product_variants
    WHERE CAST(product_id AS TEXT) = CAST(? AS TEXT) AND is_active = 1
    ORDER BY id
  `).all(productId);
}

function mapProductRow(row) {
  const databaseVariants = getVariantRows(row.id);
  const savedVariants = parseJsonArray(row.variants_json);
  const variants = savedVariants.length
    ? savedVariants.map((variant) => {
      const name = String(variant.name || variant.attributeValue || variant.value || 'Standard');
      const matchingDatabaseVariant = databaseVariants.find((candidate) =>
        candidate.attribute_value === name
      );
      return {
        ...variant,
        id: matchingDatabaseVariant?.id ?? variant.id ?? null,
        variantId: matchingDatabaseVariant?.id ?? variant.variantId ?? variant.id ?? null,
        name,
        priceOffset: Number(variant.priceOffset ?? matchingDatabaseVariant?.extra_price ?? 0)
      };
    })
    : databaseVariants.map((variant) => ({
      id: variant.id,
      variantId: variant.id,
      name: variant.attribute_value,
      attributeName: variant.attribute_name,
      priceOffset: Number(variant.extra_price)
    }));

  return {
    id: String(row.id),
    name: row.name,
    type: row.type || row.product_type || 'software',
    salesPrice: Number(row.sales_price) || 0,
    costPrice: Number(row.cost_price) || 0,
    notes: row.notes || '',
    hasOdooVariant: Boolean(row.has_odoo_variant) || variants.length > 0,
    odooPriceOffset: Number(row.odoo_price_offset) || 0,
    taxId: row.tax_id == null ? null : Number(row.tax_id),
    taxRate: Number(row.tax_rate || 0) / 100,
    variants
  };
}

function mapSubscriptionRow(row) {
  const lines = db.prepare(`
    SELECT sl.id, sl.product_id, sl.variant_id, sl.quantity, sl.unit_price,
           sl.discount_amount, sl.tax_id, sl.tax_amount, sl.subtotal, sl.line_total,
           COALESCE(sl.product_name_snapshot, p.name) AS product_name,
           COALESCE(sl.variant_name_snapshot, pv.attribute_value, '') AS variant_name,
           COALESCE(t.rate, 0) AS tax_rate
    FROM subscription_lines sl
    JOIN products p ON CAST(p.id AS TEXT) = CAST(sl.product_id AS TEXT)
    LEFT JOIN product_variants pv ON pv.id = sl.variant_id
    LEFT JOIN tax_rules t ON t.id = sl.tax_id
    WHERE sl.subscription_id = ?
    ORDER BY sl.id
  `).all(row.id).map((line) => ({
    id: String(line.id),
    productId: String(line.product_id),
    variantId: line.variant_id == null ? null : Number(line.variant_id),
    name: line.product_name,
    variant: line.variant_name,
    quantity: Number(line.quantity),
    unitPrice: Number(line.unit_price),
    taxRate: Number(line.tax_rate) / 100,
    taxAmount: Number(line.tax_amount),
    discountAmount: Number(line.discount_amount),
    lineSubtotal: Number(line.subtotal),
    lineTotal: Number(line.line_total)
  }));

  return {
    id: String(row.id),
    subNumber: row.subscription_number,
    customerId: String(row.customer_id),
    customerName: row.company_name || row.full_name,
    customerEmail: row.email,
    planId: String(row.plan_id),
    planName: row.plan_name,
    billingFrequency: row.billing_interval,
    startDate: row.start_date,
    expiryDate: row.expiry_date,
    nextBillingDate: row.next_billing_date,
    lastBillingDate: row.last_billing_date,
    paymentTerms: row.payment_terms,
    currencyCode: row.currency_code || 'INR',
    status: row.status,
    quoteValidityDays: Number(row.quotation_validity_days || 30),
    quoteValidUntil: row.quotation_valid_until,
    quoteIssuedAt: row.quote_issued_at,
    discountCode: row.discount_code || '',
    discountAmount: Number(row.discount_total) || 0,
    subtotal: Number(row.subtotal) || 0,
    taxTotal: Number(row.tax_total) || 0,
    totalAmount: Number(row.total_amount) || 0,
    templateId: row.template_id == null ? null : String(row.template_id),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items: lines
  };
}

const SUBSCRIPTION_SELECT = `
  SELECT s.*, u.email, u.full_name, u.company_name,
         p.name AS plan_name, p.billing_interval
  FROM subscriptions s
  JOIN users u ON u.id = s.customer_id
  JOIN subscription_plans p ON p.id = s.plan_id
`;

function getSubscriptionById(id) {
  const row = db.prepare(`${SUBSCRIPTION_SELECT} WHERE s.id = ?`).get(id);
  return row ? mapSubscriptionRow(row) : null;
}

function getSubscriptions(customerId = null) {
  const rows = customerId == null
    ? db.prepare(`${SUBSCRIPTION_SELECT} ORDER BY s.created_at DESC, s.id DESC`).all()
    : db.prepare(`${SUBSCRIPTION_SELECT} WHERE s.customer_id = ? ORDER BY s.created_at DESC, s.id DESC`).all(customerId);
  return rows.map(mapSubscriptionRow);
}

function mapDiscount(row) {
  return {
    id: String(row.id),
    code: row.code,
    name: row.name,
    type: row.discount_type,
    value: Number(row.value),
    scope: row.scope === 'product' ? 'specific_product' : 'whole_subscription',
    productId: row.product_id == null ? null : String(row.product_id),
    targetProductId: row.product_id == null ? null : String(row.product_id),
    minAmount: Number(row.min_purchase_amount) || 0,
    minQuantity: Number(row.min_quantity) || 0,
    startDate: row.start_date,
    endDate: row.end_date,
    usageLimit: row.max_uses == null ? undefined : Number(row.max_uses),
    usageCount: Number(row.times_used) || 0,
    timesUsed: Number(row.times_used) || 0,
    isActive: Boolean(row.is_active)
  };
}

function getSubscriptionOptions(user) {
  const isTeamMember = ['admin', 'staff'].includes(user.role);
  const customers = isTeamMember
    ? db.prepare(`SELECT id, email, full_name, company_name FROM users WHERE role = 'customer' AND is_active = 1 ORDER BY company_name, full_name`).all()
      .map((customer) => ({
        id: String(customer.id),
        name: customer.company_name || customer.full_name,
        email: customer.email
      }))
    : [];

  const products = db.prepare(`
    SELECT p.*, COALESCE(t.rate, 0) AS tax_rate
    FROM products p
    LEFT JOIN tax_rules t ON t.id = p.tax_id
    WHERE COALESCE(p.is_active, 1) = 1
    ORDER BY p.name
  `).all().map(mapProductRow);

  const plans = db.prepare(`
    SELECT id, name, code, billing_interval, base_price, minimum_quantity,
           start_date, end_date, allow_pause, allow_close_early, allow_renew
    FROM subscription_plans
    WHERE is_active = 1
    ORDER BY name
  `).all().map((plan) => ({
    id: String(plan.id),
    name: plan.name,
    code: plan.code,
    billingInterval: plan.billing_interval,
    price: Number(plan.base_price),
    minimumQuantity: Number(plan.minimum_quantity),
    availableFrom: plan.start_date,
    availableUntil: plan.end_date,
    allowPause: Boolean(plan.allow_pause),
    allowCloseEarly: Boolean(plan.allow_close_early),
    allowRenew: Boolean(plan.allow_renew),
    isActive: true
  }));

  const templates = db.prepare(`
    SELECT qt.id, qt.name, qt.plan_id, qt.validity_days, qt.notes
    FROM quotation_templates qt
    ORDER BY qt.id
  `).all().map((template) => {
    const items = db.prepare(`
      SELECT qtl.id AS template_line_id, qtl.product_id, qtl.variant_id, qtl.quantity, qtl.unit_price,
             p.name AS product_name, COALESCE(pv.attribute_value, '') AS variant_name,
             p.tax_id, COALESCE(t.rate, 0) AS tax_rate
      FROM quotation_template_lines qtl
      JOIN products p ON CAST(p.id AS TEXT) = CAST(qtl.product_id AS TEXT)
      LEFT JOIN product_variants pv ON pv.id = qtl.variant_id
      LEFT JOIN tax_rules t ON t.id = p.tax_id
      WHERE qtl.template_id = ?
      ORDER BY qtl.id
    `).all(template.id).map((line) => ({
      productId: String(line.product_id),
      templateLineId: String(line.template_line_id),
      productName: line.product_name,
      variantId: line.variant_id == null ? null : Number(line.variant_id),
      variant: line.variant_name,
      quantity: Number(line.quantity),
      unitPrice: Number(line.unit_price),
      taxId: line.tax_id == null ? null : Number(line.tax_id),
      taxRate: Number(line.tax_rate) / 100
    }));

    return {
      id: String(template.id),
      name: template.name,
      planId: template.plan_id == null ? null : String(template.plan_id),
      validityDays: Number(template.validity_days),
      notes: template.notes || '',
      items
    };
  });

  const discounts = db.prepare('SELECT * FROM discount_rules ORDER BY code').all().map(mapDiscount);
  return {
    customers,
    products,
    plans,
    templates,
    discounts,
    defaultValidityDays: templates[0]?.validityDays || 30
  };
}

function nextDocumentNumber(prefix) {
  const year = todayDateString().slice(0, 4);
  const rows = db.prepare('SELECT subscription_number FROM subscriptions WHERE subscription_number LIKE ?')
    .all(`${prefix}-${year}-%`);
  const pattern = new RegExp(`^${prefix}-${year}-(\\d+)$`);
  const highest = rows.reduce((max, row) => {
    const match = String(row.subscription_number).match(pattern);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `${prefix}-${year}-${String(highest + 1).padStart(4, '0')}`;
}

function findCustomer(input) {
  if (input.customerId != null && String(input.customerId).trim()) {
    return db.prepare(`SELECT id, email, full_name, company_name FROM users WHERE id = ? AND role = 'customer' AND is_active = 1`)
      .get(input.customerId);
  }
  const email = String(input.customerEmail || '').trim().toLowerCase();
  if (!email) return null;
  return db.prepare(`SELECT id, email, full_name, company_name FROM users WHERE email = ? COLLATE NOCASE AND role = 'customer' AND is_active = 1`)
    .get(email);
}

function findLineVariant(product, item) {
  const productId = String(product.id);
  if (item.variantId != null && String(item.variantId).trim()) {
    const row = db.prepare(`
      SELECT id, product_id, attribute_value, extra_price
      FROM product_variants WHERE id = ? AND CAST(product_id AS TEXT) = ? AND is_active = 1
    `).get(item.variantId, productId);
    if (row) return { id: Number(row.id), name: row.attribute_value, priceOffset: Number(row.extra_price) };
  }

  const variantName = String(item.variant || '').trim();
  if (!variantName) return { id: null, name: '', priceOffset: 0 };
  const savedVariant = parseJsonArray(product.variants_json).find((variant) =>
    String(variant.name || variant.attributeValue || variant.value || '') === variantName
  );
  if (savedVariant) {
    const dbVariant = db.prepare(`
      SELECT id, attribute_value, extra_price FROM product_variants
      WHERE CAST(product_id AS TEXT) = ? AND attribute_value = ? AND is_active = 1
      LIMIT 1
    `).get(productId, variantName);
    return {
      id: dbVariant ? Number(dbVariant.id) : null,
      name: variantName,
      priceOffset: Number(savedVariant.priceOffset ?? dbVariant?.extra_price ?? 0)
    };
  }

  const dbVariant = db.prepare(`
    SELECT id, attribute_value, extra_price FROM product_variants
    WHERE CAST(product_id AS TEXT) = ? AND attribute_value = ? AND is_active = 1
    LIMIT 1
  `).get(productId, variantName);
  return dbVariant
    ? { id: Number(dbVariant.id), name: dbVariant.attribute_value, priceOffset: Number(dbVariant.extra_price) }
    : { id: null, name: variantName, priceOffset: 0 };
}

function normalizeItems(inputItems, discountAmount, templateId = null) {
  if (!Array.isArray(inputItems) || inputItems.length === 0) {
    throw httpError(400, 'Add at least one product line to the quotation.');
  }

  const items = inputItems.map((inputItem, index) => {
    const productId = String(inputItem.productId || '').trim();
    const quantity = Number(inputItem.quantity);
    if (!productId) throw httpError(400, `Select a product for line ${index + 1}.`);
    if (!Number.isInteger(quantity) || quantity < 1) throw httpError(400, `Line ${index + 1} quantity must be a positive whole number.`);

    const product = db.prepare(`
      SELECT id, name, sales_price, tax_id, variants_json, is_active
      FROM products WHERE CAST(id AS TEXT) = ?
    `).get(productId);
    if (!product || !product.is_active) throw httpError(400, `Product on line ${index + 1} is no longer available.`);

    const variant = findLineVariant(product, inputItem);
    const templateLine = templateId && inputItem.templateLineId
      ? db.prepare(`
        SELECT unit_price FROM quotation_template_lines
        WHERE id = ? AND template_id = ? AND CAST(product_id AS TEXT) = CAST(? AS TEXT)
      `).get(inputItem.templateLineId, templateId, productId)
      : null;
    const tax = product.tax_id == null
      ? null
      : db.prepare('SELECT id, rate FROM tax_rules WHERE id = ? AND is_active = 1').get(product.tax_id);
    const unitPrice = roundMoney(templateLine
      ? Number(templateLine.unit_price)
      : (Number(product.sales_price) || 0) + variant.priceOffset);
    const lineSubtotal = roundMoney(quantity * unitPrice);
    return {
      productId: String(product.id),
      productName: product.name,
      variantId: variant.id,
      variantName: variant.name,
      quantity,
      unitPrice,
      taxId: tax ? Number(tax.id) : null,
      taxRate: tax ? Number(tax.rate) / 100 : 0,
      lineSubtotal
    };
  });

  const subtotal = roundMoney(items.reduce((sum, item) => sum + item.lineSubtotal, 0));
  const discount = Number(discountAmount || 0);
  if (!Number.isFinite(discount) || discount < 0 || discount > subtotal) {
    throw httpError(400, 'The quotation discount is invalid.');
  }
  const discountTotal = roundMoney(discount);
  const ratio = subtotal > 0 ? discountTotal / subtotal : 0;
  const normalizedItems = items.map((item) => {
    const itemDiscount = roundMoney(item.lineSubtotal * ratio);
    const taxableAmount = Math.max(0, item.lineSubtotal - itemDiscount);
    const taxAmount = roundMoney(taxableAmount * item.taxRate);
    return {
      ...item,
      discountAmount: itemDiscount,
      taxAmount,
      lineTotal: roundMoney(taxableAmount + taxAmount)
    };
  });
  const taxTotal = roundMoney(normalizedItems.reduce((sum, item) => sum + item.taxAmount, 0));
  return {
    items: normalizedItems,
    subtotal,
    discountTotal,
    taxTotal,
    totalAmount: roundMoney(subtotal - discountTotal + taxTotal)
  };
}

function createSubscription(input, createdBy) {
  const data = input && typeof input === 'object' ? input : {};
  const customer = findCustomer(data);
  if (!customer) throw httpError(400, 'Choose a customer account already stored in Brightloop.');

  const planId = Number(data.planId);
  if (!Number.isInteger(planId) || planId <= 0) throw httpError(400, 'Select a valid billing plan.');
  const plan = db.prepare(`
    SELECT id, name, billing_interval, is_active FROM subscription_plans WHERE id = ?
  `).get(planId);
  if (!plan || !plan.is_active) throw httpError(400, 'The selected billing plan is no longer active.');

  const startDate = data.startDate;
  const expiryDate = data.expiryDate || null;
  if (!isValidDateString(startDate) || (expiryDate && !isValidDateString(expiryDate)) || (expiryDate && expiryDate < startDate)) {
    throw httpError(400, 'The contract start and expiry dates are invalid.');
  }

  const validityDays = Number(data.quoteValidityDays);
  if (!Number.isInteger(validityDays) || validityDays < 1 || validityDays > 36500) {
    throw httpError(400, 'Quotation validity must be from 1 to 36500 days.');
  }
  const status = data.status || 'Draft';
  if (!ALLOWED_CREATE_STATUSES.has(status)) throw httpError(400, 'A new subscription must start as Draft or Quotation.');

  const today = todayDateString();
  const templateId = data.templateId == null || data.templateId === '' ? null : Number(data.templateId);
  if (templateId != null && (!Number.isInteger(templateId) || !db.prepare('SELECT id FROM quotation_templates WHERE id = ?').get(templateId))) {
    throw httpError(400, 'The selected quotation template was not found in Brightloop.');
  }
  const undiscountedFinancials = normalizeItems(data.items, 0, templateId);
  const discountCode = String(data.discountCode || '').trim().toUpperCase() || null;
  let discountAmount = 0;
  let discountRule = null;
  if (discountCode) {
    discountRule = db.prepare('SELECT * FROM discount_rules WHERE code = ? COLLATE NOCASE').get(discountCode);
    if (!discountRule || !discountRule.is_active) throw httpError(400, 'The selected discount is not active in Brightloop.');
    if (discountRule.start_date && today < discountRule.start_date) throw httpError(400, 'The selected discount is not active yet.');
    if (discountRule.end_date && today > discountRule.end_date) throw httpError(400, 'The selected discount has expired.');
    if (discountRule.max_uses != null && Number(discountRule.times_used) >= Number(discountRule.max_uses)) {
      throw httpError(400, 'The selected discount has reached its usage limit.');
    }

    const totalQuantity = undiscountedFinancials.items.reduce((sum, item) => sum + item.quantity, 0);
    if (Number(discountRule.min_quantity) > totalQuantity) throw httpError(400, 'The quotation does not meet the discount quantity requirement.');
    if (Number(discountRule.min_purchase_amount) > undiscountedFinancials.subtotal) {
      throw httpError(400, 'The quotation does not meet the discount minimum amount.');
    }

    const eligibleItems = discountRule.scope === 'product'
      ? undiscountedFinancials.items.filter((item) => String(item.productId) === String(discountRule.product_id))
      : undiscountedFinancials.items;
    const eligibleSubtotal = eligibleItems.reduce((sum, item) => sum + item.lineSubtotal, 0);
    if (eligibleSubtotal <= 0) throw httpError(400, 'The discount does not apply to any product in this quotation.');
    discountAmount = discountRule.discount_type === 'percentage'
      ? eligibleSubtotal * Number(discountRule.value) / 100
      : Math.min(Number(discountRule.value), eligibleSubtotal);
    discountAmount = roundMoney(discountAmount);
  } else if (Number(data.discountAmount || 0) > 0) {
    throw httpError(400, 'A discount code is required to apply a quotation discount.');
  }

  const financials = normalizeItems(data.items, discountAmount, templateId);
  const quoteValidUntil = isValidDateString(data.quoteValidUntil)
    ? data.quoteValidUntil
    : addDays(today, validityDays);
  const quoteIssuedAt = status === 'Quotation' ? today : null;
  db.exec('BEGIN IMMEDIATE TRANSACTION');
  try {
    const prefix = status === 'Quotation' ? 'QT' : 'QT';
    const subscriptionNumber = nextDocumentNumber(prefix);
    const header = db.prepare(`
      INSERT INTO subscriptions (
        subscription_number, customer_id, plan_id, status, payment_terms,
        start_date, expiry_date, next_billing_date, quotation_valid_until,
        quotation_validity_days, quote_issued_at, discount_code, currency_code, template_id,
        subtotal, discount_total, tax_total, total_amount, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      subscriptionNumber,
      Number(customer.id),
      planId,
      status,
      String(data.paymentTerms || 'Immediate').trim(),
      startDate,
      expiryDate,
      isValidDateString(data.nextBillingDate) ? data.nextBillingDate : startDate,
      quoteValidUntil,
      validityDays,
      quoteIssuedAt,
      discountCode,
      'INR',
      templateId,
      financials.subtotal,
      financials.discountTotal,
      financials.taxTotal,
      financials.totalAmount,
      String(data.notes || '').trim() || null
    );

    const insertLine = db.prepare(`
      INSERT INTO subscription_lines (
        subscription_id, product_id, variant_id, quantity, unit_price,
        discount_id, discount_amount, tax_id, tax_amount, subtotal, line_total,
        product_name_snapshot, variant_name_snapshot
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    financials.items.forEach((item) => insertLine.run(
      Number(header.lastInsertRowid),
      item.productId,
      item.variantId,
      item.quantity,
      item.unitPrice,
      null,
      item.discountAmount,
      item.taxId,
      item.taxAmount,
      item.lineSubtotal,
      item.lineTotal,
      item.productName,
      item.variantName
    ));

    if (discountRule && financials.discountTotal > 0) {
        db.prepare('INSERT OR IGNORE INTO subscription_discounts (subscription_id, discount_id) VALUES (?, ?)')
          .run(Number(header.lastInsertRowid), Number(discountRule.id));
    }

    db.exec('COMMIT');
    return getSubscriptionById(Number(header.lastInsertRowid));
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

function updateSubscriptionStatus(id, newStatus) {
  const subscriptionId = Number(id);
  if (!Number.isInteger(subscriptionId) || subscriptionId <= 0) throw httpError(400, 'Subscription id is invalid.');

  db.exec('BEGIN IMMEDIATE TRANSACTION');
  try {
    const current = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(subscriptionId);
    if (!current) throw httpError(404, 'Subscription not found.');
    const allowed = ALLOWED_TRANSITIONS[current.status];
    if (!allowed || !allowed.has(newStatus)) {
      throw httpError(409, `Cannot change subscription from ${current.status} to ${newStatus}.`);
    }

    const reissued = current.status === 'Closed' && newStatus === 'Quotation';
    const rejectedQuote = newStatus === 'Closed' && ['Draft', 'Quotation'].includes(current.status);
    const nextPrefix = ['Draft', 'Quotation'].includes(newStatus) || rejectedQuote ? 'QT' : 'SUB';
    const currentPrefix = String(current.subscription_number || '').split('-')[0];
    const newNumber = reissued || currentPrefix !== nextPrefix
      ? nextDocumentNumber(nextPrefix)
      : current.subscription_number;

    let quoteIssuedAt = current.quote_issued_at;
    let quoteValidUntil = current.quotation_valid_until;
    if (newStatus === 'Quotation' && current.status !== 'Quotation') {
      const today = todayDateString();
      const days = Number(current.quotation_validity_days) || 30;
      quoteIssuedAt = today;
      quoteValidUntil = addDays(today, days);
    }

    db.prepare(`
      UPDATE subscriptions
      SET subscription_number = ?, status = ?, quote_issued_at = ?,
          quotation_valid_until = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newNumber, newStatus, quoteIssuedAt, quoteValidUntil, subscriptionId);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
  return getSubscriptionById(subscriptionId);
}

function updateBillingDates(id, body) {
  const subscriptionId = Number(id);
  const { lastBillingDate, nextBillingDate } = body || {};
  if (!isValidDateString(lastBillingDate) || !isValidDateString(nextBillingDate)) {
    throw httpError(400, 'Billing dates are invalid.');
  }
  const result = db.prepare(`
    UPDATE subscriptions
    SET last_billing_date = ?, next_billing_date = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(lastBillingDate, nextBillingDate, subscriptionId);
  if (!result.changes) throw httpError(404, 'Subscription not found.');
  return getSubscriptionById(subscriptionId);
}

function requireTeamMember(req, res, next) {
  if (!req.user || !['admin', 'staff'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Only team members can manage subscriptions.' });
  }
  next();
}

router.get('/options', (req, res) => {
  try {
    res.json(getSubscriptionOptions(req.user));
  } catch (error) {
    console.error('Fetch subscription options error:', error);
    res.status(500).json({ error: 'Failed to load customers, products, plans, and quotation templates from Brightloop.' });
  }
});

router.get('/', (req, res) => {
  try {
    const subscriptions = ['admin', 'staff'].includes(req.user?.role)
      ? getSubscriptions()
      : getSubscriptions(req.user?.id);
    res.json({ subscriptions });
  } catch (error) {
    console.error('Fetch subscriptions error:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions from Brightloop.' });
  }
});

router.post('/', requireTeamMember, (req, res) => {
  try {
    const subscription = createSubscription(req.body, req.user.id);
    res.status(201).json({ subscription });
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(error.status || 500).json({ error: error.status ? error.message : 'Failed to save the quotation in Brightloop.' });
  }
});

router.patch('/:id/status', requireTeamMember, (req, res) => {
  try {
    const { status } = req.body || {};
    if (typeof status !== 'string') return res.status(400).json({ error: 'A new subscription status is required.' });
    res.json({ subscription: updateSubscriptionStatus(req.params.id, status) });
  } catch (error) {
    console.error('Update subscription status error:', error);
    res.status(error.status || 500).json({ error: error.status ? error.message : 'Failed to update the subscription status.' });
  }
});

router.patch('/:id/billing-dates', requireTeamMember, (req, res) => {
  try {
    res.json({ subscription: updateBillingDates(req.params.id, req.body) });
  } catch (error) {
    console.error('Update subscription billing dates error:', error);
    res.status(error.status || 500).json({ error: error.status ? error.message : 'Failed to save billing dates.' });
  }
});

module.exports = router;
