
const express = require("express");
const { randomUUID } = require("crypto");
const db = require("../config/db");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();

function safeJsonParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function normalizeVariants(variants) {
  if (!Array.isArray(variants)) return [];

  return variants.map(variant => ({
    id: String(variant.id || randomUUID()),
    name: String(variant.name || ""),
    sku: String(variant.sku || ""),
    options: variant.options && typeof variant.options === "object"
      ? variant.options
      : {},
    color: String(variant.color || ""),
    size: String(variant.size || ""),
    storage: String(variant.storage || ""),
    image: String(variant.image || ""),
    images: Array.isArray(variant.images) ? variant.images : [],
    price: variant.price !== undefined && variant.price !== ""
      ? Number(variant.price)
      : null,
    originalPrice: variant.originalPrice !== undefined && variant.originalPrice !== ""
      ? Number(variant.originalPrice)
      : null,
    stock: variant.stock !== undefined && variant.stock !== ""
      ? Number(variant.stock)
      : 0,
    active: variant.active !== false
  }));
}

function formatProduct(row) {
  if (!row) return null;

  return {
    ...row,
    _id: row.id,
    images: safeJsonParse(row.images, []),
    specifications: safeJsonParse(row.specifications, {}),
    variants: normalizeVariants(safeJsonParse(row.variants, [])),
    tags: safeJsonParse(row.tags, []),
    featured: Boolean(row.featured)
  };
}

function validateVariants(variants) {
  if (!Array.isArray(variants)) {
    return { valid: false, message: "Variants must be an array." };
  }

  const ids = new Set();
  const skus = new Set();

  for (const variant of variants) {
    if (!variant || typeof variant !== "object") {
      return { valid: false, message: "Invalid variant data." };
    }

    if (!variant.id || !String(variant.id).trim()) {
      return { valid: false, message: "Every variant needs an ID." };
    }

    if (ids.has(String(variant.id))) {
      return { valid: false, message: "Variant IDs must be unique." };
    }
    ids.add(String(variant.id));

    if (
      variant.price !== null &&
      variant.price !== undefined &&
      (!Number.isFinite(Number(variant.price)) || Number(variant.price) < 0)
    ) {
      return { valid: false, message: "Variant price must be valid." };
    }

    if (
      variant.originalPrice !== null &&
      variant.originalPrice !== undefined &&
      (!Number.isFinite(Number(variant.originalPrice)) ||
        Number(variant.originalPrice) < 0)
    ) {
      return { valid: false, message: "Variant original price must be valid." };
    }

    if (
      !Number.isInteger(Number(variant.stock)) ||
      Number(variant.stock) < 0
    ) {
      return { valid: false, message: "Variant stock must be a whole number." };
    }

    if (variant.sku) {
      const sku = String(variant.sku).trim().toLowerCase();
      if (skus.has(sku)) {
        return { valid: false, message: "Variant SKUs must be unique." };
      }
      skus.add(sku);
    }

    if (!variant.options || typeof variant.options !== "object" || Array.isArray(variant.options)) {
      return { valid: false, message: "Variant options must be an object." };
    }

    if (!Array.isArray(variant.images)) {
      return { valid: false, message: "Variant images must be an array." };
    }
  }

  return { valid: true };
}

function validateProduct(product) {
  if (!product.name || !String(product.name).trim()) {
    return "Product name is required.";
  }

  if (!product.category || !String(product.category).trim()) {
    return "Product category is required.";
  }

  if (!product.image || !String(product.image).trim()) {
    return "Product image URL is required.";
  }

  if (!Number.isFinite(Number(product.price)) || Number(product.price) <= 0) {
    return "Product price must be greater than zero.";
  }

  if (
    product.stock !== undefined &&
    (!Number.isInteger(Number(product.stock)) || Number(product.stock) < 0)
  ) {
    return "Product stock must be a non-negative whole number.";
  }

  return null;
}

/* GET ALL PRODUCTS */
router.get("/", (req, res) => {
  try {
    const { search, category, subcategory, sort, featured } = req.query;

    let sql = "SELECT * FROM products WHERE 1=1";
    const params = [];

    if (category && category !== "All") {
      sql += " AND category = ?";
      params.push(category);
    }

    if (subcategory && subcategory !== "All") {
      sql += " AND subcategory = ?";
      params.push(subcategory);
    }

    if (featured === "true") {
      sql += " AND featured = 1";
    }

    if (search) {
      sql += `
        AND (
          name LIKE ?
          OR description LIKE ?
          OR brand LIKE ?
          OR sku LIKE ?
          OR modelNumber LIKE ?
          OR subcategory LIKE ?
          OR tags LIKE ?
          OR variants LIKE ?
        )
      `;

      const term = `%${search}%`;
      params.push(term, term, term, term, term, term, term, term);
    }

    const sorting = {
      "price-low": "price ASC",
      "price-high": "price DESC",
      rating: "rating DESC",
      newest: "createdAt DESC",
      name: "name ASC",
      stock: "stock DESC"
    };

    sql += ` ORDER BY ${sorting[sort] || "createdAt DESC"}`;

    const products = db.prepare(sql).all(...params).map(formatProduct);

    res.json({ products });
  } catch (error) {
    console.error("GET products error:", error);
    res.status(500).json({ message: "Could not load products." });
  }
});

/* GET SINGLE PRODUCT */
router.get("/:id", (req, res) => {
  try {
    const product = formatProduct(
      db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id)
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    res.json({ product });
  } catch (error) {
    console.error("GET product error:", error);
    res.status(500).json({ message: "Could not load product." });
  }
});

/* CREATE PRODUCT */
router.post("/", protect, adminOnly, (req, res) => {
  try {
    const p = req.body;
    const validationMessage = validateProduct(p);

    if (validationMessage) {
      return res.status(400).json({ message: validationMessage });
    }

    const variants = normalizeVariants(p.variants || []);
    const variantValidation = validateVariants(variants);

    if (!variantValidation.valid) {
      return res.status(400).json({ message: variantValidation.message });
    }

    const id = randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO products (
        id, name, description, category, subcategory,
        price, originalPrice, image, images, rating, stock,
        featured, brand, sku, modelNumber, specifications,
        variants, tags, createdAt, updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      String(p.name).trim(),
      p.description || "",
      String(p.category).trim(),
      p.subcategory || "",
      Number(p.price),
      Number(p.originalPrice || 0),
      String(p.image).trim(),
      JSON.stringify(Array.isArray(p.images) ? p.images : []),
      Number(p.rating || 0),
      Number(p.stock || 0),
      p.featured ? 1 : 0,
      p.brand || "",
      p.sku || "",
      p.modelNumber || "",
      JSON.stringify(p.specifications || {}),
      JSON.stringify(variants),
      JSON.stringify(Array.isArray(p.tags) ? p.tags : []),
      now,
      now
    );

    const product = formatProduct(
      db.prepare("SELECT * FROM products WHERE id = ?").get(id)
    );

    res.status(201).json({ product });
  } catch (error) {
    console.error("CREATE product error:", error);
    res.status(400).json({ message: error.message });
  }
});

/* UPDATE PRODUCT */
router.patch("/:id", protect, adminOnly, (req, res) => {
  try {
    const p = req.body;
    const existing = db.prepare(
      "SELECT * FROM products WHERE id = ?"
    ).get(req.params.id);

    if (!existing) {
      return res.status(404).json({ message: "Product not found." });
    }

    const fields = {
      name: "name",
      description: "description",
      category: "category",
      subcategory: "subcategory",
      price: "price",
      originalPrice: "originalPrice",
      image: "image",
      rating: "rating",
      stock: "stock",
      brand: "brand",
      sku: "sku",
      modelNumber: "modelNumber"
    };

    const updates = [];
    const values = [];

    for (const [key, column] of Object.entries(fields)) {
      if (p[key] !== undefined) {
        updates.push(`${column} = ?`);
        values.push(p[key]);
      }
    }

    if (p.images !== undefined) {
      if (!Array.isArray(p.images)) {
        return res.status(400).json({ message: "Images must be an array." });
      }
      updates.push("images = ?");
      values.push(JSON.stringify(p.images));
    }

    if (p.specifications !== undefined) {
      updates.push("specifications = ?");
      values.push(JSON.stringify(p.specifications));
    }

    if (p.tags !== undefined) {
      if (!Array.isArray(p.tags)) {
        return res.status(400).json({ message: "Tags must be an array." });
      }
      updates.push("tags = ?");
      values.push(JSON.stringify(p.tags));
    }

    if (p.variants !== undefined) {
      const variants = normalizeVariants(p.variants);
      const validation = validateVariants(variants);

      if (!validation.valid) {
        return res.status(400).json({ message: validation.message });
      }

      updates.push("variants = ?");
      values.push(JSON.stringify(variants));
    }

    if (p.featured !== undefined) {
      updates.push("featured = ?");
      values.push(p.featured ? 1 : 0);
    }

    if (!updates.length) {
      return res.status(400).json({ message: "No valid fields to update." });
    }

    updates.push("updatedAt = ?");
    values.push(new Date().toISOString());
    values.push(req.params.id);

    db.prepare(`
      UPDATE products
      SET ${updates.join(", ")}
      WHERE id = ?
    `).run(...values);

    const product = formatProduct(
      db.prepare("SELECT * FROM products WHERE id = ?").get(req.params.id)
    );

    res.json({ product });
  } catch (error) {
    console.error("UPDATE product error:", error);
    res.status(400).json({ message: error.message });
  }
});

/* DELETE PRODUCT */
router.delete("/:id", protect, adminOnly, (req, res) => {
  try {
    const result = db.prepare(
      "DELETE FROM products WHERE id = ?"
    ).run(req.params.id);

    if (!result.changes) {
      return res.status(404).json({ message: "Product not found." });
    }

    res.json({ message: "Product deleted." });
  } catch (error) {
    console.error("DELETE product error:", error);
    res.status(500).json({ message: "Could not delete product." });
  }
});

module.exports = router;
