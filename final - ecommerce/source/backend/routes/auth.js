const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { randomUUID } = require("crypto");
const db = require("../config/db");
const { protect } = require("../middleware/auth");

const router = express.Router();

function publicUser(user) {
  return {
    _id: user.id,
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };
}

function makeToken(user) {
  return jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ message: "Name, email and password are required." });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must contain at least 8 characters." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(normalizedEmail);

    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const id = randomUUID();
    const hashedPassword = await bcrypt.hash(password, 12);
    const role = normalizedEmail === process.env.ADMIN_EMAIL?.toLowerCase()
      ? "admin" : "customer";

    db.prepare(`
      INSERT INTO users (id,name,email,password,role,createdAt)
      VALUES (?,?,?,?,?,?)
    `).run(id, name.trim(), normalizedEmail, hashedPassword, role, new Date().toISOString());

    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);

    res.status(201).json({
      token: makeToken(user),
      user: publicUser(user)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not create your account." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const email = req.body.email?.toLowerCase().trim();
    const password = req.body.password || "";
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email || "");

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Incorrect email or password." });
    }

    res.json({
      token: makeToken(user),
      user: publicUser(user)
    });
  } catch {
    res.status(500).json({ message: "Login failed. Please try again." });
  }
});

router.get("/me", protect, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

module.exports = router;
