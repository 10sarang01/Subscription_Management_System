const path = require('path');
const sqlite3 = require('sqlite3');
const SQLite = require('./server/sqlite');
const db = new SQLite(path.join(__dirname, 'brightloop.db'), sqlite3.OPEN_READONLY);
(async () => {
  try {
    for (const table of ['products', 'product_variants', 'product_plans']) {
      const row = await db.prepare(`SELECT COUNT(*) AS count FROM "${table}"`).get();
      console.log(`${table}: ${row.count}`);
    }
  } catch (err) { console.error(err.message); process.exitCode = 1; }
  finally { await db.close(); }
})();
