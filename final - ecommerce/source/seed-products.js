const db = require("./backend/config/db");

const products = [
  {
    id: "nova-demo-001", name: "Minimal Ceramic Table Lamp",
    category: "Home & Living", price: 2499, originalPrice: 3299,
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=700",
    rating: 4.8, brand: "Form Studio", stock: 25,
    description: "A minimalist ceramic table lamp designed to bring warm, elegant lighting to your space."
  },
  {
    id: "nova-demo-002", name: "Everyday Leather Sneakers",
    category: "Fashion", price: 3199, originalPrice: 3999,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=700",
    rating: 4.7, brand: "Northline", stock: 30,
    description: "Comfortable everyday sneakers with a modern design for casual styling."
  },
  {
    id: "nova-demo-003", name: "Wireless Studio Headphones",
    category: "Electronics", price: 5499, originalPrice: 6999,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700",
    rating: 4.9, brand: "Soundform", stock: 20,
    description: "Wireless headphones designed for immersive listening and everyday comfort."
  },
  {
    id: "nova-demo-004", name: "Classic Everyday Backpack",
    category: "Accessories", price: 1899, originalPrice: 2499,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=700",
    rating: 4.6, brand: "Carry Co.", stock: 35,
    description: "A versatile backpack for college, commuting and everyday essentials."
  },
  {
    id: "nova-demo-005", name: "Modern Skincare Essentials",
    category: "Beauty", price: 1299, originalPrice: 1699,
    image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=700",
    rating: 4.8, brand: "Pure Ritual", stock: 40,
    description: "A curated skincare collection for a simple everyday self-care routine."
  },
  {
    id: "nova-demo-006", name: "Sculptural Lounge Chair",
    category: "Home & Living", price: 8999, originalPrice: 10999,
    image: "https://images.unsplash.com/photo-1598300053653-3a4b2c7f7c0b?w=700",
    rating: 4.7, brand: "Form Studio", stock: 10,
    description: "A contemporary accent chair that adds character and comfort to your living space."
  },
  {
    id: "nova-demo-007", name: "Premium Analog Watch",
    category: "Accessories", price: 4299, originalPrice: 5499,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=700",
    rating: 4.9, brand: "Moment", stock: 18,
    description: "A timeless analog watch with a clean design suitable for everyday wear."
  },
  {
    id: "nova-demo-008", name: "Portable Bluetooth Speaker",
    category: "Electronics", price: 2799, originalPrice: 3499,
    image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=700",
    rating: 4.6, brand: "Soundform", stock: 25,
    description: "A compact Bluetooth speaker for enjoying music at home or on the go."
  }
];

const insert = db.prepare(`
  INSERT OR IGNORE INTO products
  (id,name,description,category,price,originalPrice,image,images,rating,stock,featured,brand,createdAt,updatedAt)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
`);

const seed = db.transaction(() => {
  const now = new Date().toISOString();

  for (const p of products) {
    insert.run(
      p.id, p.name, p.description, p.category, p.price,
      p.originalPrice, p.image, "[]", p.rating, p.stock,
      1, p.brand, now, now
    );
  }
});

seed();

console.log("Product seeding completed.");
console.log("Products in database:", db.prepare("SELECT COUNT(*) AS total FROM products").get().total);

db.close();
