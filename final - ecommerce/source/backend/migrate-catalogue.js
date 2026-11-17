const db = require("./config/db");

const columns = {
  sku: "TEXT DEFAULT ''",
  subcategory: "TEXT DEFAULT ''",
  modelNumber: "TEXT DEFAULT ''",
  specifications: "TEXT NOT NULL DEFAULT '{}'",
  variants: "TEXT NOT NULL DEFAULT '[]'",
  tags: "TEXT NOT NULL DEFAULT '[]'"
};

try {
  const existing = new Set(
    db.pragma("table_info(products)").map(column => column.name)
  );

  for (const [name, definition] of Object.entries(columns)) {
    if (!existing.has(name)) {
      db.exec(`ALTER TABLE products ADD COLUMN ${name} ${definition}`);
      console.log(`Added column: ${name}`);
    } else {
      console.log(`Already exists: ${name}`);
    }
  }

  console.log("\nCatalogue database migration completed.");
} catch (error) {
  console.error("Migration failed:", error.message);
  process.exitCode = 1;
} finally {
  db.close();
}
