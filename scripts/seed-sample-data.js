// Adds clearly marked demo records without replacing existing records.
const bcrypt = require('bcryptjs');
const { db, initDatabase } = require('../server/db');

async function main() {
  await initDatabase();
  const today = new Date();
  const localDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const start = localDate(today);
  const endDate = new Date(today.getFullYear() + 5, today.getMonth(), today.getDate());
  const until = localDate(endDate);
  const hash = bcrypt.hashSync('DemoCustomer@2026!', 10);
  await db.transaction(async () => {
    const admin = await db.prepare("SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1").get();
    if (!admin) throw new Error('An administrator is required to create the sample discount.');
    const users = [
      ['demo.customer@example.test', 'Demo Customer', 'Demo Corner Bakery'],
      ['demo.second@example.test', 'Demo Customer Two', 'Demo Acme Retail']
    ];
    for (const [email, name, company] of users) {
      await db.prepare("INSERT OR IGNORE INTO users (email,password_hash,full_name,role,company_name,is_active,created_by) VALUES (?,?,?,'customer',?,1,?)").run(email, hash, name, company, admin.id);
    }
    await db.prepare("INSERT OR IGNORE INTO tax_rules (name,rate,is_active) VALUES ('Demo tax (18%)',18,1)").run();
    const tax = await db.prepare("SELECT id FROM tax_rules WHERE name = 'Demo tax (18%)'").get();
    const products = [
      ['demo-core', 'Demo Core Subscription', 1200, 400, 'Sample recurring software subscription'],
      ['demo-analytics', 'Demo Analytics Add-on', 500, 150, 'Sample reporting add-on']
    ];
    for (const [id, name, price, cost, notes] of products) {
      await db.prepare("INSERT OR IGNORE INTO products (id,name,type,product_type,sales_price,cost_price,notes,tax_id,odoo_price_offset,is_active) VALUES (?,?,'Software','software',?,?,?,?,0,1)").run(id, name, price, cost, notes, tax.id);
    }
    const plans = [['DEMO-MONTHLY', 'Demo Monthly', 'monthly', 1200], ['DEMO-YEARLY', 'Demo Yearly', 'yearly', 12000]];
    for (const [code, name, frequency, price] of plans) {
      await db.prepare('INSERT OR IGNORE INTO subscription_plans (name,code,billing_interval,base_price,start_date,end_date,is_active) VALUES (?,?,?,?,?,?,1)').run(name, code, frequency, price, start, until);
      await db.prepare('INSERT OR IGNORE INTO product_plans (id,product_id,name,price,billing_interval,minimum_quantity,available_from,available_until,is_active) VALUES (?,?,?,?,?,1,?,?,1)').run(`demo-plan-${frequency}`, 'demo-core', name, price, frequency, start, until);
    }
    const monthly = await db.prepare("SELECT id FROM subscription_plans WHERE code='DEMO-MONTHLY'").get();
    const customer = await db.prepare("SELECT id FROM users WHERE email='demo.customer@example.test'").get();
    await db.prepare("INSERT OR IGNORE INTO discount_rules (code,name,discount_type,value,scope,min_purchase_amount,min_quantity,max_uses,times_used,created_by,is_active) VALUES ('DEMO10','Demo 10% discount','percentage',10,'subscription',0,1,100,0,?,1)").run(admin.id);
    const template = await db.prepare("SELECT id FROM quotation_templates WHERE name='Demo starter quotation' LIMIT 1").get();
    if (!template) {
      const result = await db.prepare("INSERT INTO quotation_templates (name,plan_id,validity_days,notes) VALUES ('Demo starter quotation',?,30,'Sample data')").run(monthly.id);
      await db.prepare('INSERT INTO quotation_template_lines (template_id,product_id,quantity,unit_price) VALUES (?,?,1,1200)').run(result.lastInsertRowid, 'demo-core');
    }
    const existing = await db.prepare("SELECT id FROM subscriptions WHERE subscription_number='DEMO-SUB-001'").get();
    if (!existing) {
      const sub = await db.prepare("INSERT INTO subscriptions (subscription_number,customer_id,plan_id,status,payment_terms,start_date,next_billing_date,subtotal,discount_total,tax_total,total_amount,notes) VALUES ('DEMO-SUB-001',?,?,'Active','Net 30',?,?,1200,0,216,1416,'Sample subscription; due for a billing run')").run(customer.id, monthly.id, start, start);
      await db.prepare('INSERT INTO subscription_lines (subscription_id,product_id,quantity,unit_price,tax_id,tax_amount,subtotal,line_total) VALUES (?,?,1,1200,?,216,1200,1416)').run(sub.lastInsertRowid, 'demo-core', tax.id);
    }
  });
  console.log('Sample customers, products, plans, tax rule, discount, quotation template and due subscription are ready.');
}
main().catch((err) => { console.error('Sample data could not be added:', err.message); process.exitCode = 1; }).finally(() => db.close());
