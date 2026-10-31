const path = require('path');
const Database = require('better-sqlite3');
const DB_PATH = path.join('d:\\React\\Subscription_Management_System', 'brightloop.db');
const db = new Database(DB_PATH);

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables:', tables.map(t => t.name));

try {
  const pp = db.prepare('SELECT COUNT(*) as c FROM product_plans').get();
  console.log('product_plans count:', pp.c);
} catch (e) { console.log('product_plans error:', e.message); }

try {
  const pv = db.prepare('SELECT COUNT(*) as c FROM product_variants').get();
  console.log('product_variants count:', pv.c);
} catch (e) { console.log('product_variants error:', e.message); }

try {
  const pr = db.prepare('SELECT COUNT(*) as c FROM products').get();
  console.log('products count:', pr.c);
} catch (e) { console.log('products error:', e.message); }

try {
  const plans = db.prepare('SELECT * FROM product_plans').all();
  console.log('product_plans rows:', JSON.stringify(plans, null, 2));
} catch (e) { console.log('product_plans fetch error:', e.message); }
