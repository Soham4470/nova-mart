
const fs = require("fs");
const db = require("./config/db");

try {
    const rows = db.prepare(`
        SELECT
            id,
            name,
            description,
            category,
            brand,
            subcategory,
            tags
        FROM products
        ORDER BY category, name
    `).all();

    const columns = [
        "id", "name", "description",
        "category", "brand", "subcategory", "tags"
    ];

    const escapeCSV = (value) =>
        '"' + String(value ?? "").replace(/"/g, '""') + '"';

    const csv = [
        columns.join(","),
        ...rows.map(row =>
            columns.map(col => escapeCSV(row[col])).join(",")
        )
    ].join("\n");

    fs.writeFileSync(
        "./data/products-for-categorization.csv",
        "\uFEFF" + csv,
        "utf8"
    );

    console.log(`SUCCESS: Exported ${rows.length} products.`);
} catch (error) {
    console.error("Export failed:", error.message);
} finally {
    db.close();
}
