const fs = require("fs");
const path = require("path");
const db = require("./config/db");

const csvPath = path.join(__dirname, "data", "category-preview.csv");
const backupPath = path.join(__dirname, "data", "novamart-backup-before-category-update-20261116-183850.db");

function parseCSV(content) {
  const rows = [];
  let row = [], field = "", quoted = false;

  for (let i = 0; i < content.length; i++) {
    const ch = content[i];

    if (quoted) {
      if (ch === '"' && content[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch !== "\r") {
      field += ch;
    }
  }

  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }

  const headers = rows.shift().map(h => h.replace(/^\uFEFF/, "").trim());
  return rows.filter(r => r.some(v => v.trim() !== "")).map(r => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = (r[i] || "").trim());
    return obj;
  });
}

try {
  if (!fs.existsSync(csvPath)) throw new Error("Category preview CSV not found.");
  if (!fs.existsSync(backupPath)) throw new Error("Backup file not found. Update cancelled.");

  const csv = parseCSV(fs.readFileSync(csvPath, "utf8"));
  const products = db.prepare("SELECT id FROM products").all();

  if (products.length !== 500 || csv.length !== 500) {
    throw new Error(`Expected 500 products. Database: ${products.length}, CSV: ${csv.length}`);
  }

  const dbIds = new Set(products.map(p => String(p.id)));
  const csvIds = csv.map(p => String(p.id));
  const csvIdSet = new Set(csvIds);

  if (csvIdSet.size !== 500) throw new Error("Duplicate product IDs found in CSV.");
  if (products.some(p => !csvIdSet.has(String(p.id)))) {
    throw new Error("Some database products are missing from CSV.");
  }
  if (csv.some(p => !dbIds.has(String(p.id)))) {
    throw new Error("CSV contains unknown product IDs.");
  }
  if (csv.some(p => !p.newCategory || !p.subcategory)) {
    throw new Error("Empty category or subcategory found.");
  }

  const update = db.prepare(
    "UPDATE products SET category = ?, subcategory = ? WHERE id = ?"
  );

  const updateAll = db.transaction(() => {
    let total = 0;
    for (const p of csv) {
      const result = update.run(p.newCategory, p.subcategory, p.id);
      if (result.changes !== 1) {
        throw new Error(`Update failed for product ID ${p.id}`);
      }
      total += result.changes;
    }
    return total;
  });

  const updated = updateAll();

  console.log("\n======= CATEGORY UPDATE COMPLETE =======");
  console.log("Products updated:", updated);
  console.log("Fields changed: category, subcategory");
  console.log("Backup verified:", path.basename(backupPath));
  console.log("Other product fields: unchanged");

} catch (error) {
  console.error("\nUPDATE FAILED:", error.message);
  console.error("If the transaction started, its changes were rolled back.");
  process.exitCode = 1;
} finally {
  db.close();
}
