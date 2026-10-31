const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const dbPath = path.join(__dirname, '..', 'brightloop.db');
console.log('📂 Inspecting Database:', dbPath);

const db = new DatabaseSync(dbPath);

// List all tables
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
console.log('\n📊 Tables in database:', tables.map(t => t.name).join(', '));

tables.forEach(({ name }) => {
  console.log(`\n================== [ TABLE: ${name} ] ==================`);
  const rows = db.prepare(`SELECT * FROM ${name}`).all();
  if (rows.length === 0) {
    console.log('(Empty table)');
  } else {
    console.table(rows);
  }
});
