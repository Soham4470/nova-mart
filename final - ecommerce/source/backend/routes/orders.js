
const express = require("express");
const { randomUUID } = require("crypto");
const db = require("../config/db");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();

function formatOrder(order, includeUser = false) {
  if (!order) return null;

  const result = {
    ...order,
    _id: order.id,
    user: order.userId,
    items: JSON.parse(order.items),
    shippingAddress: JSON.parse(order.shippingAddress)
  };

  if (includeUser) {
    const user = db.prepare(
      "SELECT id, name, email FROM users WHERE id = ?"
    ).get(order.userId);

    result.user = user ? { ...user, _id: user.id } : null;
  }

  return result;
}

// Restore stock and cancel an order in one database transaction.
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

    const items = JSON.parse(order.items);

    for (const item of items) {
      const product = db.prepare(
        "SELECT id FROM products WHERE id = ?"
      ).get(item.product);

      if (!product) {
        throw new Error("PRODUCT_NOT_FOUND");
      }

      db.prepare(
        "UPDATE products SET stock = stock + ?, updatedAt = ? WHERE id = ?"
      ).run(item.quantity, new Date().toISOString(), item.product);
    }

    db.prepare(
      "UPDATE orders SET status = 'Cancelled', updatedAt = ? WHERE id = ?"
    ).run(new Date().toISOString(), orderId);

    return db.prepare(
      "SELECT * FROM orders WHERE id = ?"
    ).get(orderId);
  })();
}

// Place COD order.
router.post("/", protect, (req, res) => {
  try {
    const { items, shippingAddress } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Your cart is empty." });
    }

    const required = [
      "fullName", "phone", "address", "city", "state", "postalCode"
    ];

    if (
      !shippingAddress ||
      required.some(key => !shippingAddress[key]?.trim())
    ) {
      return res.status(400).json({
        message: "Please complete all shipping details."
      });
    }

    const createOrder = db.transaction(() => {
      const orderItems = [];
      let total = 0;

      for (const item of items) {
        const product = db.prepare(
          "SELECT * FROM products WHERE id = ?"
        ).get(item.productId);

        const quantity = Number(item.quantity);

        if (!product || !Number.isInteger(quantity) || quantity < 1) {
          throw new Error("One or more cart items are invalid.");
        }

        if (product.stock < quantity) {
          throw new Error(`${product.name} does not have enough stock.`);
        }

        orderItems.push({
          product: product.id,
          name: product.name,
          image: product.image,
          price: product.price,
          quantity
        });

        total += product.price * quantity;
      }

      const now = new Date().toISOString();

      for (const item of orderItems) {
        db.prepare(
          "UPDATE products SET stock = stock - ?, updatedAt = ? WHERE id = ?"
        ).run(item.quantity, now, item.product);
      }

      const id = randomUUID();

      db.prepare(`
        INSERT INTO orders
        (id, userId, items, shippingAddress, total,
         paymentMethod, paymentStatus, status, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, 'COD', 'pending', 'Placed', ?, ?)
      `).run(
        id,
        req.user.id,
        JSON.stringify(orderItems),
        JSON.stringify({
          ...shippingAddress,
          country: shippingAddress.country || "India"
        }),
        total,
        now,
        now
      );

      return db.prepare(
        "SELECT * FROM orders WHERE id = ?"
      ).get(id);
    });

    const order = createOrder();

    res.status(201).json({ order: formatOrder(order) });
  } catch (error) {
    const status = error.message.includes("enough stock") ? 409 : 400;

    res.status(status).json({
      message: error.message || "Could not place your order."
    });
  }
});

// Customer order history.
router.get("/my", protect, (req, res) => {
  try {
    const orders = db.prepare(
      "SELECT * FROM orders WHERE userId = ? ORDER BY createdAt DESC"
    ).all(req.user.id).map(order => formatOrder(order));

    res.json({ orders });
  } catch {
    res.status(500).json({ message: "Could not load your orders." });
  }
});

// Customer cancellation: only orders still in Placed status.
router.patch("/:id/cancel", protect, (req, res) => {
  try {
    const existing = db.prepare(
      "SELECT id, userId FROM orders WHERE id = ?"
    ).get(req.params.id);

    if (!existing || existing.userId !== req.user.id) {
      return res.status(404).json({ message: "Order not found." });
    }

    const order = cancelOrder(req.params.id, ["Placed"]);

    res.json({
      message: "Order cancelled successfully.",
      order: formatOrder(order)
    });
  } catch (error) {
    if (error.message === "ORDER_CANNOT_BE_CANCELLED") {
      return res.status(400).json({
        message: "This order can no longer be cancelled."
      });
    }

    if (error.message === "PRODUCT_NOT_FOUND") {
      return res.status(409).json({
        message: "A product in this order no longer exists. Please contact admin."
      });
    }

    res.status(500).json({ message: "Could not cancel this order." });
  }
});

// Admin: view all orders.
router.get("/", protect, adminOnly, (req, res) => {
  try {
    const orders = db.prepare(
      "SELECT * FROM orders ORDER BY createdAt DESC"
    ).all().map(order => formatOrder(order, true));

    res.json({ orders });
  } catch {
    res.status(500).json({ message: "Could not load orders." });
  }
});

// Admin: update order status.
router.patch("/:id/status", protect, adminOnly, (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["Processing", "Shipped", "Delivered", "Cancelled"];

    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid order status." });
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
        return res.status(404).json({ message: "Order not found." });
      }

      if (existing.status === "Cancelled" || existing.status === "Delivered") {
        return res.status(400).json({
          message: "This order cannot be changed."
        });
      }

      db.prepare(
        "UPDATE orders SET status = ?, updatedAt = ? WHERE id = ?"
      ).run(status, new Date().toISOString(), req.params.id);

      order = db.prepare(
        "SELECT * FROM orders WHERE id = ?"
      ).get(req.params.id);
    }

    res.json({ order: formatOrder(order, true) });
  } catch (error) {
    if (error.message === "ORDER_CANNOT_BE_CANCELLED") {
      return res.status(400).json({
        message: "This order cannot be cancelled."
      });
    }

    if (error.message === "PRODUCT_NOT_FOUND") {
      return res.status(409).json({
        message: "A product in this order no longer exists."
      });
    }

    res.status(500).json({ message: "Could not update order status." });
  }
});

module.exports = router;
