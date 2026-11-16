const fs = require("fs");
const db = require("./config/db");

function parseCSV(text) {
  const rows = [];
  let row = [], value = "", quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        value += '"';
        i++;
      } else if (c === '"') {
        quoted = false;
      } else {
        value += c;
      }
    } else if (c === '"') {
      quoted = true;
    } else if (c === ",") {
      row.push(value);
      value = "";
    } else if (c === "\n") {
      row.push(value.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      value = "";
    } else {
      value += c;
    }
  }

  if (value.length || row.length) {
    row.push(value.replace(/\r$/, ""));
    rows.push(row);
  }

  const headers = rows.shift();
  return rows.filter(r => r.some(v => v !== "")).map(r =>
    Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ""]))
  );
}

try {
  const file = fs.readFileSync("./data/category-preview.csv", "utf8");
  const csv = parseCSV(file);
  const products = db.prepare("SELECT id FROM products").all();

  const dbIds = new Set(products.map(p => p.id));
  const csvIds = csv.map(p => p.id);
  const csvIdSet = new Set(csvIds);

  const duplicateIds = csvIds.filter((id, i) => csvIds.indexOf(id) !== i);
  const missingIds = products.filter(p => !csvIdSet.has(p.id)).map(p => p.id);
  const extraIds = csv.filter(p => !dbIds.has(p.id)).map(p => p.id);
  const emptyCategories = csv.filter(p => !p.newCategory || !p.subcategory);

  console.log("\n======= FINAL VALIDATION =======");
  console.log("Database products:", products.length);
  console.log("CSV products:", csv.length);
  console.log("Duplicate CSV IDs:", duplicateIds.length);
  console.log("Missing database IDs:", missingIds.length);
  console.log("Extra CSV IDs:", extraIds.length);
  console.log("Empty category/subcategory:", emptyCategories.length);

  const passed =
    products.length === 500 &&
    csv.length === products.length &&
    duplicateIds.length === 0 &&
    missingIds.length === 0 &&
    extraIds.length === 0 &&
    emptyCategories.length === 0;

  console.log("\nVALIDATION:", passed ? "PASSED" : "FAILED");
  console.log("Database modified: NO");

  if (duplicateIds.length) console.log("Duplicates:", duplicateIds);
  if (missingIds.length) console.log("Missing:", missingIds);
  if (extraIds.length) console.log("Extra:", extraIds);
  if (emptyCategories.length) console.log("Empty assignments:", emptyCategories);
} catch (error) {
  console.error("Validation error:", error.message);
  process.exitCode = 1;
} finally {
  db.close();
}
