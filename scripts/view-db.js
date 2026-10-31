const path = require('path');
const sqlite3 = require('sqlite3');

const dbPath = path.join(__dirname, '..', 'brightloop.db');
console.log('📂 Inspecting Database:', dbPath);
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);
const all = (sql) => new Promise((resolve, reject) => db.all(sql, [], (err, rows) => err ? reject(err) : resolve(rows)));

async function main() {
  try {
    const tables = await all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
    console.log('\n📊 Tables in database:', tables.map((table) => table.name).join(', '));
    for (const { name } of tables) {
      console.log(`\n================== [ TABLE: ${name} ] ==================`);
      const rows = await all(`SELECT * FROM "${name.replace(/"/g, '""')}"`);
      if (rows.length === 0) console.log('(Empty table)');
      else console.table(rows);
    }
  } catch (err) {
    console.error('Failed to inspect database:', err.message);
    process.exitCode = 1;
  } finally {
    db.close((err) => {
      if (err) { console.error('Failed to close database:', err.message); process.exitCode = 1; }
    });
  }
}
main();
