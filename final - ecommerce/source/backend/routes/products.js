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

  return variants.map((variant) => ({
    id: String(variant.id || randomUUID()),
    name: String(variant.name || ""),
    color: String(variant.color || ""),
    size: String(variant.size || ""),
    storage: String(variant.storage || ""),
    image: String(variant.image || ""),
    price:
      variant.price !== undefined && variant.price !== ""
        ? Number(variant.price)
        : null,
    stock:
      variant.stock !== undefined && variant.stock !== ""
        ? Number(variant.stock)
        : 0
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

  for (const variant of variants) {
    if (!variant || typeof variant !== "object") {
      return { valid: false, message: "Invalid variant data." };
    }

    if (variant.price !== null && variant.price !== undefined) {
      if (!Number.isFinite(Number(variant.price)) || Number(variant.price) < 0) {
        return { valid: false, message: "Variant price must be valid." };
      }
    }

    if (
      variant.stock !== undefined &&
      (!Number.isFinite(Number(variant.stock)) || Number(variant.stock) < 0)
    ) {
      return { valid: false, message: "Variant stock must be valid." };
    }
  }

  return { valid: true };
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
        )
      `;

      const term = `%${search}%`;

      params.push(
        term,
        term,
        term,
        term,
        term,
        term,
        term
      );
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

    const products = db
      .prepare(sql)
      .all(...params)
      .map(formatProduct);

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
      db
        .prepare("SELECT * FROM products WHERE id = ?")
        .get(req.params.id)
    );

    if (!product) {
      return res.status(404).json({
        message: "Product not found."
      });
    }

    res.json({ product });
  } catch (error) {
    console.error("GET product error:", error);
    res.status(500).json({
      message: "Could not load product."
    });
  }
});

/* CREATE PRODUCT */
router.post("/", protect, adminOnly, (req, res) => {
  try {
    const p = req.body;

    if (
      !p.name ||
      !p.category ||
      !p.image ||
      !Number.isFinite(Number(p.price))
    ) {
      return res.status(400).json({
        message: "Name, category, image and valid price are required."
      });
    }

    const variants = normalizeVariants(p.variants || []);
    const variantValidation = validateVariants(variants);

    if (!variantValidation.valid) {
      return res.status(400).json({
        message: variantValidation.message
      });
    }

    const id = randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO products
      (
        id,
        name,
        description,
        category,
        subcategory,
        price,
        originalPrice,
        image,
        images,
        rating,
        stock,
        featured,
        brand,
        sku,
        modelNumber,
        specifications,
        variants,
        tags,
        createdAt,
        updatedAt
      )
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(
      id,
      String(p.name).trim(),
      p.description || "",
      p.category,
      p.subcategory || "",
      Number(p.price),
      Number(p.originalPrice || 0),
      p.image,
      JSON.stringify(p.images || []),
      Number(p.rating || 0),
      Number(p.stock || 0),
      p.featured ? 1 : 0,
      p.brand || "",
      p.sku || "",
      p.modelNumber || "",
      JSON.stringify(p.specifications || {}),
      JSON.stringify(variants),
      JSON.stringify(p.tags || []),
      now,
      now
    );

    const product = db
      .prepare("SELECT * FROM products WHERE id = ?")
      .get(id);

    res.status(201).json({
      product: formatProduct(product)
    });
  } catch (error) {
    console.error("CREATE product error:", error);
    res.status(400).json({
      message: error.message
    });
  }
});

/* UPDATE PRODUCT */
router.patch("/:id", protect, adminOnly, (req, res) => {
  try {
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
      if (req.body[key] !== undefined) {
        updates.push(`${column} = ?`);
        values.push(req.body[key]);
      }
    }

    if (req.body.images !== undefined) {
      updates.push("images = ?");
      values.push(JSON.stringify(req.body.images));
    }

    if (req.body.specifications !== undefined) {
      updates.push("specifications = ?");
      values.push(JSON.stringify(req.body.specifications));
    }

    if (req.body.tags !== undefined) {
      updates.push("tags = ?");
      values.push(JSON.stringify(req.body.tags));
    }

    if (req.body.variants !== undefined) {
      const variants = normalizeVariants(req.body.variants);
      const validation = validateVariants(variants);

      if (!validation.valid) {
        return res.status(400).json({
          message: validation.message
        });
      }

      updates.push("variants = ?");
      values.push(JSON.stringify(variants));
    }

    if (req.body.featured !== undefined) {
      updates.push("featured = ?");
      values.push(req.body.featured ? 1 : 0);
    }

    if (!updates.length) {
      return res.status(400).json({
        message: "No valid fields to update."
      });
    }

    updates.push("updatedAt = ?");
    values.push(new Date().toISOString());

    values.push(req.params.id);

    const result = db
      .prepare(
        `UPDATE products
         SET ${updates.join(", ")}
         WHERE id = ?`
      )
      .run(...values);

    if (!result.changes) {
      return res.status(404).json({
        message: "Product not found."
      });
    }

    const product = db
      .prepare("SELECT * FROM products WHERE id = ?")
      .get(req.params.id);

    res.json({
      product: formatProduct(product)
    });
  } catch (error) {
    console.error("UPDATE product error:", error);

    res.status(400).json({
      message: error.message
    });
  }
});

/* DELETE PRODUCT */
router.delete("/:id", protect, adminOnly, (req, res) => {
  try {
    const result = db
      .prepare("DELETE FROM products WHERE id = ?")
      .run(req.params.id);

    if (!result.changes) {
      return res.status(404).json({
        message: "Product not found."
      });
    }

    res.json({
      message: "Product deleted."
    });
  } catch (error) {
    console.error("DELETE product error:", error);

    res.status(500).json({
      message: "Could not delete product."
    });
  }
});

module.exports = router;