const path = require('path');
const sqlite3 = require('sqlite3');
const SQLite = require('./server/sqlite');
const db = new SQLite(path.join(__dirname, 'brightloop.db'), sqlite3.OPEN_READONLY);
(async () => {
  try {
    const tables = await db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    for (const { name } of tables) {
      const columns = await db.prepare(`PRAGMA table_info("${name.replace(/"/g, '""')}")`).all();
      console.log(`${name}: ${columns.map((column) => column.name).join(', ')}`);
    }
  } catch (err) { console.error(err.message); process.exitCode = 1; }
  finally { await db.close(); }
})();
