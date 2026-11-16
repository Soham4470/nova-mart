const db = require("./config/db");

function classify(name) {
  const n = name.toLowerCase();

  // Watches
  if (/analog watch/.test(n))
    return ["Watches", "Analog Watches"];
  if (/smartwatch/.test(n))
    return ["Watches", "Smartwatches"];

  // Beauty
  if (/facial serum|radiance serum/.test(n))
    return ["Beauty & Personal Care", "Face Serums"];
  if (/hair care/.test(n))
    return ["Beauty & Personal Care", "Hair Care"];
  if (/matte lip colour/.test(n))
    return ["Beauty & Personal Care", "Lip Makeup"];
  if (/moisturiser/.test(n))
    return ["Beauty & Personal Care", "Moisturisers"];
  if (/fragrance/.test(n))
    return ["Beauty & Personal Care", "Fragrances"];
  if (/facial cleanser/.test(n))
    return ["Beauty & Personal Care", "Face Cleansers"];
  if (/body lotion/.test(n))
    return ["Beauty & Personal Care", "Body Care"];
  if (/makeup brush/.test(n))
    return ["Beauty & Personal Care", "Makeup Tools"];

  // Electronics and computers
  if (/bluetooth speaker/.test(n))
    return ["Electronics", "Bluetooth Speakers"];
  if (/wireless earbuds/.test(n))
    return ["Electronics", "Wireless Earbuds"];
  if (/wireless headphones/.test(n))
    return ["Electronics", "Headphones"];
  if (/mirrorless camera/.test(n))
    return ["Cameras & Photography", "Mirrorless Cameras"];
  if (/4k monitor/.test(n))
    return ["Computers & Laptops", "Monitors"];
  if (/laptop/.test(n))
    return ["Computers & Laptops", "Laptops"];
  if (/smartphone/.test(n))
    return ["Mobiles & Accessories", "Smartphones"];

  // Bags and accessories
  if (/leather wallet/.test(n))
    return ["Bags & Luggage", "Wallets"];
  if (/travel backpack|executive backpack/.test(n))
    return ["Bags & Luggage", "Backpacks"];
  if (/duffle bag/.test(n))
    return ["Bags & Luggage", "Travel Bags"];
  if (/handbag/.test(n))
    return ["Bags & Luggage", "Handbags"];
  if (/card holder/.test(n))
    return ["Fashion Accessories", "Card Holders"];
  if (/sunglasses/.test(n))
    return ["Fashion Accessories", "Sunglasses"];
  if (/bracelet/.test(n))
    return ["Jewellery", "Bracelets"];

  // Footwear
  if (/sneakers/.test(n))
    return ["Shoes & Footwear", "Sneakers"];
  if (/loafers/.test(n))
    return ["Shoes & Footwear", "Loafers"];

  // Furniture
  if (/coffee table|side table/.test(n))
    return ["Furniture", "Tables"];
  if (/lounge chair/.test(n))
    return ["Furniture", "Chairs"];
  if (/modern sofa/.test(n))
    return ["Furniture", "Sofas"];
  if (/queen bed/.test(n))
    return ["Furniture", "Beds"];
  if (/study desk/.test(n))
    return ["Furniture", "Desks"];

  // Home and decor
  if (/bedding set/.test(n))
    return ["Home & Kitchen", "Bedding"];
  if (/cushion set/.test(n))
    return ["Home Decor", "Cushions"];
  if (/decorative vase/.test(n))
    return ["Home Decor", "Vases"];
  if (/lamp/.test(n))
    return ["Home Decor", "Lighting"];
  if (/kitchen storage/.test(n))
    return ["Home & Kitchen", "Kitchen Storage"];

  // Fashion
  if (/activewear/.test(n))
    return ["Fashion", "Activewear"];
  if (/jacket|utility jacket/.test(n))
    return ["Fashion", "Jackets"];
  if (/trousers/.test(n))
    return ["Fashion", "Trousers"];
  if (/kurta/.test(n))
    return ["Fashion", "Kurtas"];
  if (/blazer/.test(n))
    return ["Fashion", "Blazers"];
  if (/polo shirt/.test(n))
    return ["Fashion", "Polo Shirts"];
  if (/t-shirt/.test(n))
    return ["Fashion", "T-Shirts"];
  if (/jeans|denim/.test(n))
    return ["Fashion", "Jeans"];
  if (/dress/.test(n))
    return ["Fashion", "Dresses"];
  if (/shirt/.test(n))
    return ["Fashion", "Shirts"];
  if (/hoodie/.test(n))
    return ["Fashion", "Hoodies"];
  if (/sweater|knitwear/.test(n))
    return ["Fashion", "Sweaters"];

  return null;
}

try {
  const products = db.prepare(
    "SELECT id, name, category, subcategory FROM products"
  ).all();

  const seen = new Set();
  const duplicateIds = [];
  const unresolved = [];
  const counts = {};
  const mapping = [];

  for (const p of products) {
    if (seen.has(p.id)) duplicateIds.push(p.id);
    seen.add(p.id);

    const result = classify(p.name);

    if (!result) {
      unresolved.push(p);
      continue;
    }

    const [category, subcategory] = result;
    mapping.push({ id: p.id, name: p.name, oldCategory: p.category, newCategory: category, subcategory });
    const key = `${category} > ${subcategory}`;
    counts[key] = (counts[key] || 0) + 1;
  }

  const csv = [
    "id,name,oldCategory,newCategory,subcategory",
    ...mapping.map(x =>
      [x.id, x.name, x.oldCategory, x.newCategory, x.subcategory]
        .map(v => '"' + String(v ?? "").replace(/"/g, '""') + '"')
        .join(",")
    )
  ].join("\n");

  require("fs").writeFileSync("./data/category-preview.csv", csv, "utf8");
  console.log("Preview CSV saved: data/category-preview.csv");
  console.log("\n========== CATEGORY DRY RUN ==========");
  console.log("Total products:", products.length);
  console.log("Unique product IDs:", seen.size);
  console.log("Duplicate IDs:", duplicateIds.length);
  console.log("Successfully classified:", products.length - unresolved.length);
  console.log("Unclassified products:", unresolved.length);

  console.log("\n========== NEW CATEGORY COUNTS ==========");
  for (const [category, count] of Object.entries(counts).sort()) {
    console.log(`${category}: ${count}`);
  }

  if (duplicateIds.length) {
    console.log("\nDUPLICATE IDS:");
    console.log(duplicateIds);
  }

  if (unresolved.length) {
    console.log("\nUNCLASSIFIED PRODUCTS:");
    for (const p of unresolved) {
      console.log(`${p.id} | ${p.name} | Current: ${p.category}`);
    }
  }

  console.log("\n======================================");
  console.log("READ ONLY: Database was NOT modified.");
} catch (error) {
  console.error("Dry run failed:", error.message);
} finally {
  db.close();
}

