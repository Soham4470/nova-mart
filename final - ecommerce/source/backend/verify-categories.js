const db = require("./config/db");

try {
  const total = db.prepare(
    "SELECT COUNT(*) AS n FROM products"
  ).get().n;

  const empty = db.prepare(`
    SELECT COUNT(*) AS n FROM products
    WHERE LENGTH(TRIM(COALESCE(category, ''))) = 0
       OR LENGTH(TRIM(COALESCE(subcategory, ''))) = 0
  `).get().n;

  console.log("\n======= FINAL DATABASE VERIFICATION =======");
  console.log("Total products:", total);
  console.log("Empty categories/subcategories:", empty);

  console.log("\nCATEGORY / SUBCATEGORY COUNTS:");

  const rows = db.prepare(`
    SELECT category, subcategory, COUNT(*) AS total
    FROM products
    GROUP BY category, subcategory
    ORDER BY category, subcategory
  `).all();

  rows.forEach(row => {
    console.log(`${row.category} > ${row.subcategory}: ${row.total}`);
  });

  console.log("\nFINAL RESULT:", total === 500 && empty === 0 ? "PASSED" : "CHECK REQUIRED");
} catch (error) {
  console.error("Verification error:", error.message);
} finally {
  db.close();
}
