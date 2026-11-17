const jwt = require("jsonwebtoken");
const db = require("../config/db");

function protect(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Please sign in to continue." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = db.prepare("SELECT id, name, email, role FROM users WHERE id = ?")
      .get(decoded.id);

    if (!user) return res.status(401).json({ message: "Account not found." });

    req.user = { ...user, _id: user.id };
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired session." });
  }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Administrator access required." });
  }
  next();
}

module.exports = { protect, adminOnly };
