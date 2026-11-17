const db = require("./backend/config/db");
const fs = require("fs");
const path = require("path");

const fashionStyles = [
"Aster","Arden","Aurelia","Atlas","Aurora","Briar","Cedar","Celeste","Clover","Cove",
"Dakota","Dune","Eden","Elara","Ember","Everest","Flora","Harper","Haven","Indigo",
"Isla","Jade","Juniper","Kai","Kensington","Luna","Magnolia","Marble","Meadow","Monroe",
"Nova","Oakley","Onyx","Orion","Paloma","Pearl","Phoenix","River","Rowan","Sage",
"Savannah","Serenity","Sienna","Solstice","Sterling","Summer","Thea","Valencia","Willow",
"Winter","Zara","Zenith","Alpine","Amara","Bayside","Caspian","Delphi","Ellery",
"Fable","Geneva","Harlow","Ivory","Jasper","Keystone","Lennox","Marlow","Noble",
"Opal","Portland","Remington","Sutton","Weston"
];

const configs = [
{
 category: "Fashion", target: 300, base: 799, spread: 7000,
 styles: fashionStyles,
 types: [
 "Tailored Shirt","Premium T-Shirt","Polo Shirt","Straight-Fit Jeans",
 "Classic Trousers","Zip Hoodie","Casual Jacket","Everyday Sneakers",
 "Summer Dress","Formal Blazer","Cotton Kurta","Activewear Set"
 ],
 images: [
 "photo-1591047139829-d91aecb6caea","photo-1542272604-787c3835535d",
 "photo-1576566588028-4147f3842f27","photo-1598033129183-c4f50c736f10",
 "photo-1539008835657-9e8e9680c956","photo-1542291026-7eec264c27ff",
 "photo-1551028719-00167b16eac5","photo-1531310197839-ccf54634509e",
 "photo-1529139574466-a303027c1d8b","photo-1483985988355-763728e1935b",
 "photo-1490481651871-ab68de25d43d","photo-1503342217505-b0a15ec3261c",
 "photo-1515886657613-9f3515b0c78f","photo-1521572163474-6864f9cf17ab"
 ]
},
{
 category: "Electronics", target: 53, base: 1499, spread: 85000,
 styles: ["Nova","Vertex","Auraluxe","Sonic","Pixel","Quantum","Zenith","Pulse","Lumina"],
 types: ["Smartphone","Laptop","Wireless Earbuds","Bluetooth Speaker","Smartwatch"],
 images: [
 "photo-1511707171634-5f897ff02aa9","photo-1496181133206-80ce9b88a853",
 "photo-1505740420928-5e560c06d30e","photo-1608043152269-423dbba4e7e1",
 "photo-1523275335684-37898b6baf30","photo-1590658268037-6bf12165a8df",
 "photo-1516035069371-29a1b244cc32","photo-1527443224154-c4a3942d3acf"
 ]
},
{
 category: "Furniture", target: 45, base: 2999, spread: 55000,
 styles: ["Nordic","Monarch","Forma","Urban","Serene","Oakwood","Haven","Arden","Luxe"],
 types: ["Lounge Chair","Modern Sofa","Coffee Table","Study Desk","Queen Bed"],
 images: [
 "photo-1555041469-a586c61ea9bc","photo-1505693416388-ac5ce068fe85",
 "photo-1567538096630-e0c55bd6374c","photo-1493663284031-b7e3aefcae8e",
 "photo-1600210492486-724fe5c67fb0","photo-1494438639946-1ebd1d20bf85"
 ]
},
{
 category: "Home & Living", target: 43, base: 399, spread: 12000,
 styles: ["Arcadia","Cloudline","Atelier","Serene","Luxe","Botanical","Nordic"],
 types: ["Table Lamp","Decorative Vase","Bedding Set","Cushion Set","Kitchen Storage Set"],
 images: [
 "photo-1507473885765-e6ed057f782c","photo-1578500494198-246f612d3b3d",
 "photo-1631049307264-da0ec9d70304","photo-1584100936595-c0654b55a2e2",
 "photo-1600210492486-724fe5c67fb0","photo-1600585154340-be6161a56a0c"
 ]
},
{
 category: "Beauty", target: 33, base: 299, spread: 5000,
 styles: ["Éclat","Velvet","Pure","Lumière","Botanica"],
 types: ["Facial Serum","Moisturiser","Matte Lip Colour","Hair Care Set","Signature Fragrance"],
 images: [
 "photo-1608248543803-ba4f8c70ae0b","photo-1586495777744-4413f21062fa",
 "photo-1556229010-6c3f2c9ca5f8","photo-1601049541289-9b1b7bbbfe19",
 "photo-1594035910387-fea47794261f","photo-1522335789203-aabd1fc54bc9"
 ]
},
{
 category: "Accessories", target: 26, base: 499, spread: 12000,
 styles: ["Chronos","Voyager","Monogram","Aero","Sterling","Executive"],
 types: ["Analog Watch","Leather Wallet","Travel Backpack"],
 images: [
 "photo-1523275335684-37898b6baf30","photo-1553062407-98eeb64c6a62",
 "photo-1584917865442-de89df76afd3","photo-1627123424574-724758594e93",
 "photo-1511499767150-a48a237f0083","photo-1611591437281-460bfbe1220a"
 ]
}
];

async function main() {
 const dbPath = path.join(__dirname,"backend","data","novamart.db");
 const backupPath = path.join(
   __dirname,"backend","data",`novamart-backup-${Date.now()}.db`
 );

 await db.backup(backupPath);
 console.log("Database backup created:", backupPath);

 const counts = db.prepare(
   "SELECT category, COUNT(*) AS total FROM products GROUP BY category"
 ).all();

 const countMap = Object.fromEntries(counts.map(x => [x.category,x.total]));

 const insert = db.prepare(`
   INSERT OR IGNORE INTO products
   (id,name,description,category,price,originalPrice,image,images,
    rating,stock,featured,brand,createdAt,updatedAt)
   VALUES
   (@id,@name,@description,@category,@price,@originalPrice,@image,@images,
    @rating,@stock,1,@brand,@now,@now)
 `);

 const existingTotal = db.prepare(
   "SELECT COUNT(*) AS total FROM products"
 ).get().total;

 let nextId = existingTotal + 1;
 let added = 0;
 const now = new Date().toISOString();

 const transaction = db.transaction(() => {
   for (const config of configs) {
     const existing = countMap[config.category] || 0;
     const needed = Math.max(0, config.target - existing);

     for (let i = 0; i < needed; i++) {
       const style = config.styles[
         Math.floor(i / config.types.length) % config.styles.length
       ];
       const type = config.types[i % config.types.length];

       const price = config.base + ((i * 137) % config.spread);
       const originalPrice = Math.round(price * 1.2 / 10) * 10;
       const imageId = config.images[i % config.images.length];

       const name = `${style} ${type}`;

       const description =
         `Discover the ${name}, thoughtfully selected for a contemporary lifestyle. ` +
         `Combining an appealing design with versatile everyday character, this ` +
         `${config.category.toLowerCase()} essential brings quality-inspired style ` +
         `and a refined look to your collection.`;

       const result = insert.run({
         id: `nova-catalog-${String(nextId).padStart(3,"0")}`,
         name,
         description,
         category: config.category,
         price,
         originalPrice,
         image: `https://images.unsplash.com/${imageId}?auto=format&fit=crop&w=900&q=85`,
         images: "[]",
         rating: Number((4.2 + (i % 8) * 0.1).toFixed(1)),
         stock: 5 + ((i * 7) % 46),
         brand: style,
         now
       });

       if (result.changes) {
         added++;
         nextId++;
       }
     }
   }
 });

 transaction();

 const finalCounts = db.prepare(
   "SELECT category, COUNT(*) AS total FROM products GROUP BY category ORDER BY total DESC"
 ).all();

 const total = db.prepare(
   "SELECT COUNT(*) AS total FROM products"
 ).get().total;

 console.log("\nCatalogue expansion completed.");
 console.log("Products added:", added);
 console.log("Total products:", total);
 console.table(finalCounts);
 console.log("Fashion share:",
   ((finalCounts.find(x => x.category === "Fashion")?.total || 0) / total * 100).toFixed(1) + "%"
 );

 db.close();
}

main().catch(error => {
 console.error("Catalogue expansion failed:",error);
 db.close();
 process.exitCode = 1;
});
