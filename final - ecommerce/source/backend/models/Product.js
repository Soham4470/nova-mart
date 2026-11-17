const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  category: { type: String, required: true, index: true },
  price: { type: Number, required: true, min: 0 },
  originalPrice: { type: Number, default: 0 },
  image: { type: String, required: true },
  images: [{ type: String }],
  rating: { type: Number, default: 0, min: 0, max: 5 },
  stock: { type: Number, default: 0, min: 0 },
  featured: { type: Boolean, default: false },
  brand: { type: String, default: "" }
}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);
