
const { DatabaseSync } = require("node:sqlite");
const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "..", "data");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new DatabaseSync(path.join(dataDir, "novamart.db"));

db.pragma = (statement) => {
  const sql = String(statement || "").trim();
  if (!sql) return [];
  return db.prepare(`PRAGMA ${sql}`).all();
};

db.transaction = (fn) => (...args) => {
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = fn(...args);
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
};

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  PRAGMA busy_timeout = 5000;
`);

// Original database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer',
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT NOT NULL,
    price REAL NOT NULL,
    originalPrice REAL DEFAULT 0,
    image TEXT NOT NULL,
    images TEXT DEFAULT '[]',
    rating REAL DEFAULT 0,
    stock INTEGER DEFAULT 0,
    featured INTEGER DEFAULT 0,
    brand TEXT DEFAULT '',
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    items TEXT NOT NULL,
    shippingAddress TEXT NOT NULL,
    total REAL NOT NULL,
    paymentMethod TEXT DEFAULT 'COD',
    paymentStatus TEXT DEFAULT 'pending',
    status TEXT DEFAULT 'Placed',
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY(userId) REFERENCES users(id)
  );
`);

// Safe migrations for existing product databases
function ensureColumn(table, column, definition) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all();
  const exists = columns.some(item => item.name === column);

  if (!exists) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    console.log(`Migration completed: ${table}.${column}`);
  }
}

const migrations = [
  ["subcategory", "TEXT DEFAULT ''"],
  ["sku", "TEXT DEFAULT ''"],
  ["modelNumber", "TEXT DEFAULT ''"],
  ["specifications", "TEXT DEFAULT '{}'"],
  ["variants", "TEXT DEFAULT '[]'"],
  ["tags", "TEXT DEFAULT '[]'"]
];

for (const [column, definition] of migrations) {
  ensureColumn("products", column, definition);
}

// Repair empty JSON fields in older products
db.prepare(`
  UPDATE products
  SET
    images = CASE
      WHEN images IS NULL OR images = '' THEN '[]'
      ELSE images
    END,
    specifications = CASE
      WHEN specifications IS NULL OR specifications = '' THEN '{}'
      ELSE specifications
    END,
    variants = CASE
      WHEN variants IS NULL OR variants = '' THEN '[]'
      ELSE variants
    END,
    tags = CASE
      WHEN tags IS NULL OR tags = '' THEN '[]'
      ELSE tags
    END
`).run();

// Search and sorting indexes
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_products_category
  ON products(category);

  CREATE INDEX IF NOT EXISTS idx_products_subcategory
  ON products(subcategory);

  CREATE INDEX IF NOT EXISTS idx_products_created
  ON products(createdAt);

  CREATE INDEX IF NOT EXISTS idx_orders_user
  ON orders(userId);

  CREATE INDEX IF NOT EXISTS idx_orders_created
  ON orders(createdAt);
`);

console.log("NOVA MART database connected and migrations checked.");

module.exports = db;
