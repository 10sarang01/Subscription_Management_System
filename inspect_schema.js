const path = require('path');
const Database = require('better-sqlite3');
const db = new Database(path.join('d:/React/Subscription_Management_System', 'brightloop.db'));
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
tables.forEach(t => {
  const cols = db.prepare(`PRAGMA table_info(${t})`).all().map(c => c.name);
  console.log(t + ': ' + cols.join(', '));
});
