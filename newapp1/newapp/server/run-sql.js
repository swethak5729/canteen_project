const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

(async () => {
  const db = await open({
    filename: path.join(__dirname, 'database.sqlite'),
    driver: sqlite3.Database
  });

  try {
    await db.exec('PRAGMA foreign_keys = ON;');

    const sql = `
    DROP TABLE IF EXISTS orders;

    CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT,
    user_id TEXT NOT NULL,
    user_name TEXT,
    role TEXT,
    items TEXT,
    amount REAL,
    payment_type TEXT,
    payment_status TEXT,
    order_status TEXT,
    order_date TEXT DEFAULT (datetime('now'))
    );
    `;
    await db.exec(sql);
    console.log('✅ order_items table created');
  } catch (err) {
    console.error('❌ SQL error:', err);
  } finally {
    await db.close();
  }
})();
