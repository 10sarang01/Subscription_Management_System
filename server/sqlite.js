const sqlite3 = require('sqlite3');
const { AsyncLocalStorage } = require('async_hooks');

class SQLite {
  constructor(filename, mode) {
    this.connection = new sqlite3.Database(filename, mode);
    this.scope = new AsyncLocalStorage();
    this.tail = Promise.resolve();
  }
  schedule(fn) {
    if (this.scope.getStore() === this) return fn();
    const next = this.tail.then(fn);
    this.tail = next.catch(() => {});
    return next;
  }
  exec(sql) {
    return this.schedule(() => new Promise((resolve, reject) => this.connection.exec(sql, (err) => err ? reject(err) : resolve())));
  }
  prepare(sql) {
    const query = (method, args) => this.schedule(() => new Promise((resolve, reject) => {
      this.connection[method](sql, args, function (err, rows) {
        if (err) reject(err);
        else if (method === 'run') resolve({ lastInsertRowid: this.lastID, changes: this.changes });
        else resolve(rows);
      });
    }));
    return { get: (...args) => query('get', args), all: (...args) => query('all', args), run: (...args) => query('run', args) };
  }
  transaction(fn) {
    return this.schedule(() => this.scope.run(this, async () => {
      await this.exec('BEGIN IMMEDIATE');
      try { const result = await fn(); await this.exec('COMMIT'); return result; }
      catch (err) { await this.exec('ROLLBACK'); throw err; }
    }));
  }
  close() { return this.schedule(() => new Promise((resolve, reject) => this.connection.close((err) => err ? reject(err) : resolve()))); }
}
module.exports = SQLite;
