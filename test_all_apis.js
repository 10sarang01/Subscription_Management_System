const http = require('http');

function req(method, path, body) {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: '127.0.0.1', port: 5001, path, method,
      headers: { 'Content-Type': 'application/json', ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}) }
    };
    const r = http.request(opts, res => {
      let b = '';
      res.on('data', d => b += d);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(b) }));
    });
    r.on('error', e => resolve({ status: 0, body: { error: e.message } }));
    if (data) r.write(data);
    r.end();
  });
}

async function test(label, method, path, body) {
  const res = await req(method, path, body);
  const ok = res.status >= 200 && res.status < 300;
  console.log(`${ok ? '✅' : '❌'} ${label}: ${res.status}`);
  if (!ok) console.log('   Error:', JSON.stringify(res.body));
  return res.body;
}

async function main() {
  console.log('\n=== Testing all brightloop.db API endpoints ===\n');

  // Products
  const p = await test('Create product', 'POST', '/api/products', { name: 'Test ERP', type: 'Software', salesPrice: 299, costPrice: 100 });
  const prodId = p.product?.id;

  // Plans
  const pl = await test('Create plan', 'POST', `/api/products/${prodId}/plans`, {
    name: 'Monthly Pro', price: 99, billingInterval: 'monthly',
    minimumQuantity: 1, availableFrom: '2026-01-01', availableUntil: '2026-12-31'
  });
  const planId = pl.plan?.id;

  await test('Get plans for product', 'GET', `/api/products/${prodId}/plans`);

  // Update plan
  await test('Update plan', 'PUT', `/api/plans/${planId}`, { name: 'Monthly Pro (Updated)', price: 109 });

  // Subscriptions
  const sub = await test('Create subscription', 'POST', '/api/subscriptions', {
    subNumber: 'SUB-2026-001', customerName: 'Test Corp', customerEmail: 'test@corp.com',
    planName: 'Monthly Pro', billingFrequency: 'monthly', status: 'Active',
    nextBillingDate: '2026-11-01', items: [{ productId: prodId, name: 'Test ERP', quantity: 2, unitPrice: 99, taxRate: 0.10 }]
  });
  const subId = sub.subscription?.id;

  await test('Get subscriptions', 'GET', '/api/subscriptions');
  await test('Update subscription', 'PUT', `/api/subscriptions/${subId}`, { status: 'Paused' });

  // Invoices
  const inv = await test('Create invoice', 'POST', '/api/invoices', {
    invoiceNumber: 'INV-2026-001', customerName: 'Test Corp',
    issueDate: '2026-10-31', total: 218, amountPaid: 0, balance: 218,
    status: 'Confirmed', items: []
  });
  const invId = inv.invoice?.id;

  await test('Get invoices', 'GET', '/api/invoices');
  await test('Update invoice status', 'PATCH', `/api/invoices/${invId}`, { status: 'Paid' });

  // Payments
  const pay = await test('Record payment', 'POST', '/api/payments', {
    paymentNumber: 'PAY-2026-001', invoiceId: invId,
    customerName: 'Test Corp', date: '2026-10-31',
    method: 'Credit Card (Stripe)', amount: 218, status: 'Completed'
  });

  await test('Get payments', 'GET', '/api/payments');

  // Templates
  const tmpl = await test('Create template', 'POST', '/api/templates', {
    name: 'Standard Monthly', validityDays: 30,
    items: [{ productId: prodId, quantity: 1, unitPrice: 99 }]
  });
  const tmplId = tmpl.template?.id;
  await test('Get templates', 'GET', '/api/templates');
  await test('Update template', 'PUT', `/api/templates/${tmplId}`, { name: 'Standard Monthly (v2)', validityDays: 45 });
  await test('Delete template', 'DELETE', `/api/templates/${tmplId}`);

  // Discounts
  await test('Get discounts', 'GET', '/api/discounts');

  console.log('\n=== All tests complete ===\n');
}
main().catch(console.error);
