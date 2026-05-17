const sqlite3 = require("sqlite3").verbose();
const { open } = require("sqlite");
const path = require("path");

// Open SQLite database
async function openDb() {
  try {
    const db = await open({
      filename: path.join(__dirname, "database.sqlite"),
      driver: sqlite3.Database,
    });

    // Enable foreign key constraints
    await db.exec("PRAGMA foreign_keys = ON;");

    console.log("✅ Database connection established");
    return db;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    throw error;
  }
}

// Initialize database and create tables if not exists
async function initDb() {
  try {
    const db = await openDb();


 // Create users table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        user_id TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('student', 'faculty', 'admin', 'kitchen')),
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);


    // Create categories table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create items table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        image TEXT,
        category_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      )
    `);

    // Create orders table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token TEXT NOT NULL,
        user_id TEXT NOT NULL,
        user_name TEXT NOT NULL,
        role TEXT NOT NULL,
        amount REAL NOT NULL,
        payment_type TEXT NOT NULL CHECK(payment_type IN ('instant', 'monthly')),
        payment_status TEXT NOT NULL DEFAULT 'pending' CHECK(payment_status IN ('pending', 'completed', 'failed', 'refunded')),
        order_status TEXT NOT NULL DEFAULT 'preparing' CHECK(order_status IN ('preparing', 'partially_completed', 'ready_to_serve', 'completed')),
        order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      )
    `);

    // Create order_items table (links orders to items)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        item_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for faster queries
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_orders_token ON orders(token);
      CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
      CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

      CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
      CREATE INDEX IF NOT EXISTS idx_items_category ON items(category_id);
      CREATE INDEX IF NOT EXISTS idx_items_name ON items(name);
      CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
      CREATE INDEX IF NOT EXISTS idx_order_items_item_id ON order_items(item_id);
    `);

    console.log("✅ Database tables initialized");
    return db;
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    throw error;
  }
}

module.exports = { openDb, initDb };
