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
    const user = db.prepare("SELECT id, name, email FROM users WHERE id = ?")
      .get(order.userId);
    result.user = user ? { ...user, _id: user.id } : null;
  }

  return result;
}

router.post("/", protect, (req, res) => {
  try {
    const { items, shippingAddress } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Your cart is empty." });
    }

    const required = ["fullName", "phone", "address", "city", "state", "postalCode"];
    if (!shippingAddress || required.some(key => !shippingAddress[key]?.trim())) {
      return res.status(400).json({ message: "Please complete all shipping details." });
    }

    const createOrder = db.transaction(() => {
      const orderItems = [];
      let total = 0;

      for (const item of items) {
        const product = db.prepare("SELECT * FROM products WHERE id = ?")
          .get(item.productId);
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

      for (const item of orderItems) {
        db.prepare("UPDATE products SET stock = stock - ?, updatedAt = ? WHERE id = ?")
          .run(item.quantity, new Date().toISOString(), item.product);
      }

      const id = randomUUID();
      const now = new Date().toISOString();

      db.prepare(`
        INSERT INTO orders
        (id,userId,items,shippingAddress,total,paymentMethod,paymentStatus,status,createdAt,updatedAt)
        VALUES (?,?,?,?,?,'COD','pending','Placed',?,?)
      `).run(
        id, req.user.id, JSON.stringify(orderItems),
        JSON.stringify({ ...shippingAddress, country: shippingAddress.country || "India" }),
        total, now, now
      );

      return db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
    });

    const order = createOrder();
    res.status(201).json({ order: formatOrder(order) });
  } catch (error) {
    const status = error.message.includes("enough stock") ? 409 : 400;
    res.status(status).json({ message: error.message || "Could not place your order." });
  }
});

router.get("/my", protect, (req, res) => {
  try {
    const orders = db.prepare("SELECT * FROM orders WHERE userId = ? ORDER BY createdAt DESC")
      .all(req.user.id).map(order => formatOrder(order));
    res.json({ orders });
  } catch {
    res.status(500).json({ message: "Could not load your orders." });
  }
});

router.get("/", protect, adminOnly, (req, res) => {
  try {
    const orders = db.prepare("SELECT * FROM orders ORDER BY createdAt DESC")
      .all().map(order => formatOrder(order, true));
    res.json({ orders });
  } catch {
    res.status(500).json({ message: "Could not load orders." });
  }
});

router.patch("/:id/status", protect, adminOnly, (req, res) => {
  const allowed = ["Processing", "Shipped", "Delivered", "Cancelled"];

  if (!allowed.includes(req.body.status)) {
    return res.status(400).json({ message: "Invalid order status." });
  }

  const result = db.prepare(
    "UPDATE orders SET status = ?, updatedAt = ? WHERE id = ?"
  ).run(req.body.status, new Date().toISOString(), req.params.id);

  if (!result.changes) return res.status(404).json({ message: "Order not found." });

  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(req.params.id);
  res.json({ order: formatOrder(order, true) });
});

module.exports = router;
