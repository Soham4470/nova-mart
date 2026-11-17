const express = require("express");
const { randomUUID } = require("crypto");
const db = require("../config/db");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();

function formatProduct(row) {
  if (!row) return null;
  return {
    ...row,
    _id: row.id,
    images: JSON.parse(row.images || "[]"),
    featured: Boolean(row.featured)
  };
}

router.get("/", (req, res) => {
  try {
    const { search, category, sort, featured } = req.query;
    let sql = "SELECT * FROM products WHERE 1=1";
    const params = [];

    if (category && category !== "All") {
      sql += " AND category = ?";
      params.push(category);
    }

    if (featured === "true") sql += " AND featured = 1";

    if (search) {
      sql += " AND (name LIKE ? OR description LIKE ? OR brand LIKE ?)";
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    const sorting = {
      "price-low": "price ASC",
      "price-high": "price DESC",
      rating: "rating DESC",
      newest: "createdAt DESC"
    };

    sql += ` ORDER BY ${sorting[sort] || "createdAt DESC"}`;

    const products = db.prepare(sql).all(...params).map(formatProduct);
    res.json({ products });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not load products." });
  }
});

router.get("/:id", (req, res) => {
  try {
    const product = formatProduct(
      db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id)
    );

    if (!product) return res.status(404).json({ message: "Product not found." });
    res.json({ product });
  } catch {
    res.status(500).json({ message: "Could not load product." });
  }
});

router.post("/", protect, adminOnly, (req, res) => {
  try {
    const p = req.body;
    if (!p.name || !p.category || !p.image || !Number.isFinite(Number(p.price))) {
      return res.status(400).json({ message: "Name, category, image and valid price are required." });
    }

    const id = randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO products
      (id,name,description,category,price,originalPrice,image,images,rating,stock,featured,brand,createdAt,updatedAt)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(
      id, p.name.trim(), p.description || "", p.category,
      Number(p.price), Number(p.originalPrice || 0), p.image,
      JSON.stringify(p.images || []), Number(p.rating || 0),
      Number(p.stock || 0), p.featured ? 1 : 0,
      p.brand || "", now, now
    );

    res.status(201).json({
      product: formatProduct(db.prepare("SELECT * FROM products WHERE id = ?").get(id))
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.patch("/:id", protect, adminOnly, (req, res) => {
  try {
    const fields = {
      name: "name", description: "description", category: "category",
      price: "price", originalPrice: "originalPrice", image: "image",
      rating: "rating", stock: "stock", brand: "brand"
    };

    const updates = [];
    const values = [];

    for (const [key, column] of Object.entries(fields)) {
      if (req.body[key] !== undefined) {
        updates.push(`${column} = ?`);
        values.push(req.body[key]);
      }
    }

    if (req.body.images !== undefined) {
      updates.push("images = ?");
      values.push(JSON.stringify(req.body.images));
    }

    if (req.body.featured !== undefined) {
      updates.push("featured = ?");
      values.push(req.body.featured ? 1 : 0);
    }

    if (!updates.length) {
      return res.status(400).json({ message: "No valid fields to update." });
    }

    updates.push("updatedAt = ?");
    values.push(new Date().toISOString(), req.params.id);

    const result = db.prepare(
      `UPDATE products SET ${updates.join(", ")} WHERE id = ?`
    ).run(...values);

    if (!result.changes) return res.status(404).json({ message: "Product not found." });

    res.json({
      product: formatProduct(db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id))
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", protect, adminOnly, (req, res) => {
  try {
    const result = db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);
    if (!result.changes) return res.status(404).json({ message: "Product not found." });
    res.json({ message: "Product deleted." });
  } catch {
    res.status(500).json({ message: "Could not delete product." });
  }
});

module.exports = router;
