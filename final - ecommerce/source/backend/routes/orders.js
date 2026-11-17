
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

function getVariants(product) {
  const variants = safeJsonParse(product.variants, []);
  return Array.isArray(variants) ? variants : [];
}

function formatOrder(order, includeUser = false) {
  if (!order) return null;

  const result = {
    ...order,
    _id: order.id,
    user: order.userId,
    items: safeJsonParse(order.items, []),
    shippingAddress: safeJsonParse(order.shippingAddress, {})
  };

  if (includeUser) {
    const user = db.prepare(
      "SELECT id, name, email FROM users WHERE id = ?"
    ).get(order.userId);

    result.user = user ? { ...user, _id: user.id } : null;
  }

  return result;
}

function getVariantSnapshot(variant) {
  return {
    id: variant.id,
    name: variant.name || "",
    sku: variant.sku || "",
    options: variant.options || {},
    color: variant.color || "",
    size: variant.size || "",
    storage: variant.storage || "",
    image: variant.image || "",
    images: Array.isArray(variant.images) ? variant.images : []
  };
}

// Restore the exact stock deducted during checkout.
function cancelOrder(orderId, allowedStatuses) {
  return db.transaction(() => {
    const order = db.prepare(
      "SELECT * FROM orders WHERE id = ?"
    ).get(orderId);

    if (!order) {
      throw new Error("ORDER_NOT_FOUND");
    }

    if (!allowedStatuses.includes(order.status)) {
      throw new Error("ORDER_CANNOT_BE_CANCELLED");
    }

    const items = safeJsonParse(order.items, []);
    const now = new Date().toISOString();

    for (const item of items) {
      const productId = item.product || item.productId;

      const product = db.prepare(
        "SELECT * FROM products WHERE id = ?"
      ).get(productId);

      if (!product) {
        throw new Error("PRODUCT_NOT_FOUND");
      }

      if (item.variantId) {
        const variants = getVariants(product);
        const variantIndex = variants.findIndex(
          variant => String(variant.id) === String(item.variantId)
        );

        if (variantIndex === -1) {
          throw new Error("VARIANT_NOT_FOUND");
        }

        variants[variantIndex].stock =
          Number(variants[variantIndex].stock || 0) +
          Number(item.quantity || 0);

        db.prepare(`
          UPDATE products
          SET variants = ?, updatedAt = ?
          WHERE id = ?
        `).run(
          JSON.stringify(variants),
          now,
          productId
        );
      } else {
        db.prepare(`
          UPDATE products
          SET stock = stock + ?, updatedAt = ?
          WHERE id = ?
        `).run(
          Number(item.quantity || 0),
          now,
          productId
        );
      }
    }

    db.prepare(`
      UPDATE orders
      SET status = 'Cancelled', updatedAt = ?
      WHERE id = ?
    `).run(now, orderId);

    return db.prepare(
      "SELECT * FROM orders WHERE id = ?"
    ).get(orderId);
  })();
}

/* PLACE ORDER - CASH ON DELIVERY */
router.post("/", protect, (req, res) => {
  try {
    const { items, shippingAddress } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Your cart is empty."
      });
    }

    const requiredAddressFields = [
      "fullName",
      "phone",
      "address",
      "city",
      "state",
      "postalCode"
    ];

    if (
      !shippingAddress ||
      requiredAddressFields.some(key =>
        typeof shippingAddress[key] !== "string" ||
        !shippingAddress[key].trim()
      )
    ) {
      return res.status(400).json({
        message: "Please complete all shipping details."
      });
    }

    const createOrder = db.transaction(() => {
      // Combine duplicate cart lines so stock is checked correctly.
      const groupedItems = new Map();

      for (const item of items) {
        const productId = String(item.productId || "").trim();
        const variantId = item.variantId
          ? String(item.variantId).trim()
          : "";

        const quantity = Number(item.quantity);

        if (
          !productId ||
          !Number.isInteger(quantity) ||
          quantity < 1
        ) {
          throw new Error("One or more cart items are invalid.");
        }

        const key = `${productId}::${variantId}`;
        const existing = groupedItems.get(key);

        if (existing) {
          existing.quantity += quantity;
        } else {
          groupedItems.set(key, {
            productId,
            variantId,
            quantity
          });
        }
      }

      const orderItems = [];
      let total = 0;

      for (const requested of groupedItems.values()) {
        const product = db.prepare(
          "SELECT * FROM products WHERE id = ?"
        ).get(requested.productId);

        if (!product) {
          throw new Error("A product in your cart is no longer available.");
        }

        let selectedVariant = null;
        let unitPrice = Number(product.price);
        let availableStock = Number(product.stock || 0);
        let itemImage = product.image;
        let variantSnapshot = null;

        if (requested.variantId) {
          const variants = getVariants(product);

          selectedVariant = variants.find(
            variant =>
              String(variant.id) === requested.variantId &&
              variant.active !== false
          );

          if (!selectedVariant) {
            throw new Error(
              `${product.name}: selected variant is unavailable.`
            );
          }

          availableStock = Number(selectedVariant.stock || 0);

          if (
            selectedVariant.price !== null &&
            selectedVariant.price !== undefined &&
            Number.isFinite(Number(selectedVariant.price))
          ) {
            unitPrice = Number(selectedVariant.price);
          }

          itemImage =
            selectedVariant.image ||
            (Array.isArray(selectedVariant.images) &&
              selectedVariant.images[0]) ||
            product.image;

          variantSnapshot = getVariantSnapshot(selectedVariant);
        }

        if (requested.quantity > availableStock) {
          throw new Error(
            `${product.name}: only ${availableStock} item(s) are available.`
          );
        }

        if (!Number.isFinite(unitPrice) || unitPrice < 0) {
          throw new Error(`${product.name} has an invalid price.`);
        }

        const orderItem = {
          product: product.id,
          productId: product.id,
          name: product.name,
          image: itemImage,
          price: unitPrice,
          quantity: requested.quantity
        };

        if (selectedVariant) {
          orderItem.variantId = selectedVariant.id;
          orderItem.variant = variantSnapshot;
          orderItem.variantName = selectedVariant.name || "";
          orderItem.sku = selectedVariant.sku || "";
        }

        orderItems.push(orderItem);
        total += unitPrice * requested.quantity;
      }

      const now = new Date().toISOString();

      // Deduct stock only after every cart line has passed validation.
      for (const item of orderItems) {
        if (item.variantId) {
          const product = db.prepare(
            "SELECT * FROM products WHERE id = ?"
          ).get(item.product);

          const variants = getVariants(product);
          const variant = variants.find(
            entry => String(entry.id) === String(item.variantId)
          );

          if (!variant || Number(variant.stock || 0) < item.quantity) {
            throw new Error(
              `${item.name}: stock changed. Please refresh your cart.`
            );
          }

          variant.stock = Number(variant.stock) - item.quantity;

          db.prepare(`
            UPDATE products
            SET variants = ?, updatedAt = ?
            WHERE id = ?
          `).run(
            JSON.stringify(variants),
            now,
            item.product
          );
        } else {
          const result = db.prepare(`
            UPDATE products
            SET stock = stock - ?, updatedAt = ?
            WHERE id = ? AND stock >= ?
          `).run(
            item.quantity,
            now,
            item.product,
            item.quantity
          );

          if (!result.changes) {
            throw new Error(
              `${item.name}: stock changed. Please refresh your cart.`
            );
          }
        }
      }

      const orderId = randomUUID();

      const cleanAddress = {
        fullName: shippingAddress.fullName.trim(),
        phone: shippingAddress.phone.trim(),
        address: shippingAddress.address.trim(),
        city: shippingAddress.city.trim(),
        state: shippingAddress.state.trim(),
        postalCode: shippingAddress.postalCode.trim(),
        country: String(shippingAddress.country || "India").trim()
      };

      db.prepare(`
        INSERT INTO orders (
          id,
          userId,
          items,
          shippingAddress,
          total,
          paymentMethod,
          paymentStatus,
          status,
          createdAt,
          updatedAt
        )
        VALUES (?, ?, ?, ?, ?, 'COD', 'pending', 'Placed', ?, ?)
      `).run(
        orderId,
        req.user.id,
        JSON.stringify(orderItems),
        JSON.stringify(cleanAddress),
        total,
        now,
        now
      );

      return db.prepare(
        "SELECT * FROM orders WHERE id = ?"
      ).get(orderId);
    });

    const order = createOrder();

    res.status(201).json({
      message: "Order placed successfully.",
      order: formatOrder(order)
    });
  } catch (error) {
    console.error("PLACE ORDER error:", error);

    const stockError =
      error.message.toLowerCase().includes("stock") ||
      error.message.toLowerCase().includes("available");

    res.status(stockError ? 409 : 400).json({
      message: error.message || "Could not place your order."
    });
  }
});

/* CUSTOMER ORDER HISTORY */
router.get("/my", protect, (req, res) => {
  try {
    const orders = db.prepare(`
      SELECT *
      FROM orders
      WHERE userId = ?
      ORDER BY createdAt DESC
    `).all(req.user.id).map(order => formatOrder(order));

    res.json({ orders });
  } catch (error) {
    console.error("MY ORDERS error:", error);

    res.status(500).json({
      message: "Could not load your orders."
    });
  }
});

/* CUSTOMER CANCEL ORDER */
router.patch("/:id/cancel", protect, (req, res) => {
  try {
    const existing = db.prepare(`
      SELECT id, userId
      FROM orders
      WHERE id = ?
    `).get(req.params.id);

    if (!existing || existing.userId !== req.user.id) {
      return res.status(404).json({
        message: "Order not found."
      });
    }

    const order = cancelOrder(req.params.id, ["Placed"]);

    res.json({
      message: "Order cancelled successfully.",
      order: formatOrder(order)
    });
  } catch (error) {
    console.error("CUSTOMER CANCEL error:", error);

    if (error.message === "ORDER_CANNOT_BE_CANCELLED") {
      return res.status(400).json({
        message: "This order can no longer be cancelled."
      });
    }

    if (
      error.message === "PRODUCT_NOT_FOUND" ||
      error.message === "VARIANT_NOT_FOUND"
    ) {
      return res.status(409).json({
        message: "A product or variant in this order no longer exists. Please contact admin."
      });
    }

    res.status(500).json({
      message: "Could not cancel this order."
    });
  }
});

/* ADMIN - VIEW ALL ORDERS */
router.get("/", protect, adminOnly, (req, res) => {
  try {
    const orders = db.prepare(`
      SELECT *
      FROM orders
      ORDER BY createdAt DESC
    `).all().map(order => formatOrder(order, true));

    res.json({ orders });
  } catch (error) {
    console.error("ADMIN ORDERS error:", error);

    res.status(500).json({
      message: "Could not load orders."
    });
  }
});

/* ADMIN - UPDATE ORDER STATUS */
router.patch("/:id/status", protect, adminOnly, (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "Processing",
      "Shipped",
      "Delivered",
      "Cancelled"
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid order status."
      });
    }

    let order;

    if (status === "Cancelled") {
      order = cancelOrder(
        req.params.id,
        ["Placed", "Processing", "Shipped"]
      );
    } else {
      const existing = db.prepare(
        "SELECT * FROM orders WHERE id = ?"
      ).get(req.params.id);

      if (!existing) {
        return res.status(404).json({
          message: "Order not found."
        });
      }

      if (
        existing.status === "Cancelled" ||
        existing.status === "Delivered"
      ) {
        return res.status(400).json({
          message: "This order cannot be changed."
        });
      }

      db.prepare(`
        UPDATE orders
        SET status = ?, updatedAt = ?
        WHERE id = ?
      `).run(
        status,
        new Date().toISOString(),
        req.params.id
      );

      order = db.prepare(
        "SELECT * FROM orders WHERE id = ?"
      ).get(req.params.id);
    }

    res.json({
      message: "Order status updated.",
      order: formatOrder(order, true)
    });
  } catch (error) {
    console.error("ADMIN UPDATE ORDER error:", error);

    if (error.message === "ORDER_NOT_FOUND") {
      return res.status(404).json({
        message: "Order not found."
      });
    }

    if (error.message === "ORDER_CANNOT_BE_CANCELLED") {
      return res.status(400).json({
        message: "This order cannot be cancelled."
      });
    }

    if (
      error.message === "PRODUCT_NOT_FOUND" ||
      error.message === "VARIANT_NOT_FOUND"
    ) {
      return res.status(409).json({
        message: "A product or variant in this order no longer exists."
      });
    }

    res.status(500).json({
      message: "Could not update order status."
    });
  }
});

module.exports = router;
