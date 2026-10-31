const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const { spawn } = require('node:child_process');

async function freePort() {
  const socket = net.createServer();
  await new Promise((resolve) => socket.listen(0, '127.0.0.1', resolve));
  const port = socket.address().port;
  await new Promise((resolve) => socket.close(resolve));
  return port;
}

test('catalog uses sqlite3, preserves variant IDs, and enforces permissions', async () => {
  const root = path.join(__dirname, '..');
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'brightloop-catalog-test-'));
  const port = await freePort();
  await fs.cp(path.join(root, 'server'), path.join(temp, 'server'), { recursive: true });
  await fs.symlink(path.join(root, 'node_modules'), path.join(temp, 'node_modules'), 'dir');
  const server = spawn(process.execPath, ['server/index.js'], { cwd: temp, env: { ...process.env, PORT: String(port), JWT_SECRET: 'test-only-secret' }, stdio: 'ignore' });
  const request = async (method, url, body, token) => {
    const response = await fetch(`http://127.0.0.1:${port}${url}`, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    return { status: response.status, data: await response.json() };
  };
  try {
    let login;
    for (let attempt = 0; attempt < 100; attempt++) {
      try { login = await request('POST', '/api/auth/login', { email: 'admin@brightloop.com', password: 'Admin@BrightLoop2026!' }); break; }
      catch { await new Promise((resolve) => setTimeout(resolve, 50)); }
    }
    assert.equal(login?.status, 200);
    const admin = login.data.token;
    const customer = await request('POST', '/api/auth/register', { email: 'test@example.test', password: 'CustomerTest@123', full_name: 'Test Customer' });
    assert.equal(customer.status, 201);
    const body = { name: 'Test product', type: 'Software', salesPrice: 100, costPrice: 40, variants: [{ name: 'Custom', priceOffset: 42 }] };
    assert.equal((await request('GET', '/api/products')).status, 401);
    assert.equal((await request('POST', '/api/products', body, customer.data.token)).status, 403);
    const created = await request('POST', '/api/products', body, admin);
    assert.equal(created.status, 201);
    const { id, variants } = created.data.product;
    assert.equal(variants[0].priceOffset, 42);
    const changed = await request('PUT', `/api/products/${id}`, { variants: [{ id: variants[0].id, name: 'Custom', priceOffset: 55 }] }, admin);
    assert.equal(changed.status, 200);
    assert.equal(changed.data.product.variants[0].id, variants[0].id);
    const loaded = await request('GET', '/api/products', undefined, admin);
    assert.equal(loaded.data.products.find((product) => product.id === id).variants[0].priceOffset, 55);
    assert.equal((await request('PUT', `/api/products/${id}`, { salesPrice: -1 }, admin)).status, 400);
    const plan = await request('POST', `/api/products/${id}/plans`, { name: 'Test plan', price: 100, billingInterval: 'monthly', minimumQuantity: 1, availableFrom: '2026-01-01', availableUntil: '2027-12-31' }, admin);
    assert.equal(plan.status, 201);
    assert.equal((await request('GET', `/api/products/${id}/plans`, undefined, admin)).data.plans.length, 1);
    assert.equal((await request('DELETE', `/api/plans/${plan.data.plan.id}`, undefined, admin)).status, 200);
    assert.equal((await request('DELETE', `/api/products/${id}`, undefined, admin)).status, 200);
  } finally {
    server.kill();
    await new Promise((resolve) => server.once('exit', resolve));
    await fs.rm(temp, { recursive: true, force: true });
  }
});
