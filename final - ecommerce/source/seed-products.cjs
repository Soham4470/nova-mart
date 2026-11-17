const db = require("./backend/config/db");

const raw = [
["Auraluxe Wireless Headphones","Electronics",6499,7999,"photo-1505740420928-5e560c06d30e",4.9,"Auraluxe",24,"Immerse yourself in a world of refined sound with these elegantly designed wireless headphones. A contemporary silhouette, intuitive connectivity and considered comfort make them an exceptional companion for music, entertainment and everyday listening."],
["Vertex Pro Smartphone","Electronics",24999,28999,"photo-1511707171634-5f897ff02aa9",4.8,"Vertex",18,"Designed for a connected lifestyle, this sophisticated smartphone brings contemporary aesthetics and everyday functionality together. Its streamlined profile and versatile design make it a compelling choice for modern digital experiences."],
["StudioBook Performance Laptop","Electronics",58999,65999,"photo-1496181133206-80ce9b88a853",4.8,"StudioBook",12,"A refined computing companion created for productivity, creativity and seamless everyday workflows. Its understated design complements a versatile experience, whether you are working, studying or exploring new ideas."],
["Lumina Mirrorless Camera","Electronics",45999,52999,"photo-1516035069371-29a1b244cc32",4.7,"Lumina",10,"Capture meaningful moments with a camera designed around creative expression. Its sophisticated form and versatile photographic experience make it an appealing choice for enthusiasts seeking greater control over their visual storytelling."],
["SonicArc Bluetooth Speaker","Electronics",3299,4299,"photo-1608043152269-423dbba4e7e1",4.7,"SonicArc",30,"Bring atmosphere to every setting with a contemporary portable speaker. A clean, compact profile and convenient wireless listening create an effortless audio companion for relaxed evenings and everyday adventures."],
["PulseFit Smartwatch","Electronics",4999,6499,"photo-1523275335684-37898b6baf30",4.6,"PulseFit",22,"A contemporary wearable that complements an active, connected lifestyle. Its modern design brings everyday convenience and personal technology together in a versatile accessory suited to work, leisure and movement."],
["Clarity Wireless Earbuds","Electronics",2499,3299,"photo-1590658268037-6bf12165a8df",4.7,"Clarity",35,"Discover a more effortless listening experience with compact wireless earbuds. Designed for everyday convenience, their discreet profile and portable form make them a natural companion for commuting, calls and personal entertainment."],
["NovaView 4K Monitor","Electronics",18999,22999,"photo-1527443224154-c4a3942d3acf",4.8,"NovaView",14,"Bring clarity and visual refinement to your workspace with a contemporary monitor. Its elegant presentation makes it suitable for focused productivity, creative projects and immersive everyday viewing."],

["Élan Tailored Blazer","Fashion",4299,5499,"photo-1591047139829-d91aecb6caea",4.8,"Élan Atelier",16,"Define a polished wardrobe with this elegantly tailored blazer. Its structured silhouette and timeless character create a sophisticated foundation for professional settings, refined occasions and contemporary styling."],
["Maison Everyday Sneakers","Fashion",2899,3799,"photo-1542291026-7eec264c27ff",4.7,"Maison Street",28,"A modern interpretation of everyday footwear, balancing understated styling with versatile appeal. Pair these sneakers with relaxed essentials or elevated casual ensembles for an effortlessly composed look."],
["Aurelia Silk-Feel Dress","Fashion",3499,4499,"photo-1539008835657-9e8e9680c956",4.8,"Aurelia",20,"Express understated elegance through a fluid, feminine silhouette. Designed to transition gracefully between daytime occasions and evening engagements, this statement piece brings sophistication to contemporary dressing."],
["Heritage Oxford Shirt","Fashion",1799,2399,"photo-1598033129183-c4f50c736f10",4.6,"Heritage Co.",32,"A wardrobe essential defined by clean lines and enduring versatility. Its refined appearance lends itself to smart-casual combinations, offering a considered approach to everyday dressing."],
["Noir Premium Denim","Fashion",2199,2899,"photo-1542272604-787c3835535d",4.7,"Noir Collective",25,"Reimagine casual dressing with denim that brings timeless character to a contemporary wardrobe. Its versatile styling makes it easy to create considered looks across seasons and occasions."],
["Sculpted Leather Loafers","Fashion",3899,4999,"photo-1531310197839-ccf54634509e",4.8,"Sculpted",14,"A sophisticated footwear statement with a streamlined profile and versatile appeal. These loafers bring a polished finishing touch to tailored ensembles and elevated everyday attire."],
["Essential Knitwear Sweater","Fashion",2499,3299,"photo-1576566588028-4147f3842f27",4.7,"Northline",21,"Introduce a layer of understated refinement to your wardrobe. This contemporary knitwear essential offers versatile styling potential for relaxed weekends, transitional weather and thoughtfully assembled outfits."],
["Urban Utility Jacket","Fashion",3799,4799,"photo-1551028719-00167b16eac5",4.6,"Urban Form",17,"Inspired by contemporary city dressing, this utility jacket combines a purposeful aesthetic with versatile everyday styling. An adaptable outer layer for those who appreciate functional design and modern character."],

["Forma Sculptural Lounge Chair","Home & Living",12999,15999,"photo-1598300053653-3a4b2c7f7c0b",4.8,"Forma Living",8,"Transform your interior with a statement chair defined by sculptural character and contemporary elegance. Its expressive form creates a considered focal point for sophisticated living spaces."],
["Arcadia Ceramic Table Lamp","Home & Living",2799,3699,"photo-1507473885765-e6ed057f782c",4.8,"Arcadia",22,"Introduce a softer ambience through a thoughtfully styled ceramic lamp. Its understated presence complements contemporary interiors while bringing warmth and visual balance to bedside tables, consoles and reading corners."],
["Monarch Minimalist Coffee Table","Home & Living",8499,10999,"photo-1499933374294-4584851497cc",4.7,"Monarch House",9,"A refined furniture statement designed to anchor modern living spaces. Its minimalist character pairs effortlessly with a variety of interior styles, creating an elegant centrepiece for everyday gatherings."],
["Serene Textured Cushion Set","Home & Living",1199,1699,"photo-1584100936595-c0654b55a2e2",4.6,"Serene Studio",40,"Elevate your interior styling with a considered blend of texture and visual softness. These decorative cushions introduce depth and personality to sofas, lounge chairs and thoughtfully curated spaces."],
["Luxe Ambient Floor Lamp","Home & Living",5999,7499,"photo-1507473885765-e6ed057f782c",4.7,"Luxe Habitat",13,"Create an inviting atmosphere with a floor lamp that balances functional illumination and sculptural appeal. Its contemporary character makes it a striking addition to reading areas and modern interiors."],
["Nordic Accent Side Table","Home & Living",3299,4299,"photo-1494438639946-1ebd1d20bf85",4.7,"Nordic House",16,"Bring considered simplicity to your living space with an accent table inspired by contemporary design. Its versatile proportions make it a natural companion beside a sofa, armchair or bedside."],
["Atelier Decorative Vase","Home & Living",1499,1999,"photo-1578500494198-246f612d3b3d",4.8,"Atelier Objects",35,"An expressive decorative accent that adds sculptural interest to curated interiors. Display it independently or incorporate it into a considered arrangement of books, florals and treasured objects."],
["Cloudline Premium Bedding Set","Home & Living",3999,5299,"photo-1631049307264-da0ec9d70304",4.8,"Cloudline",18,"Reimagine the bedroom as a serene personal retreat with an elegantly presented bedding ensemble. Its timeless aesthetic brings a composed, inviting finish to contemporary bedroom interiors."],

["Éclat Radiance Serum","Beauty",1299,1699,"photo-1608248543803-ba4f8c70ae0b",4.8,"Éclat Beauty",40,"Introduce a considered step to your skincare ritual with this elegant facial serum. Designed for a refined daily routine, its sophisticated presentation makes skincare feel like an intentional moment of self-care."],
["Velvet Matte Lip Colour","Beauty",899,1199,"photo-1586495777744-4413f21062fa",4.7,"Velvet Edit",45,"Make a confident statement with a beautifully presented matte lip colour. Its versatile appeal complements both understated daytime looks and more expressive evening styling."],
["Pure Balance Facial Cleanser","Beauty",699,999,"photo-1556229010-6c3f2c9ca5f8",4.6,"Pure Ritual",50,"Begin your skincare routine with a thoughtfully positioned facial cleanser. Its minimalist presentation and everyday versatility make it an essential addition to a considered personal-care collection."],
["Lumière Hydrating Moisturiser","Beauty",1099,1499,"photo-1601049541289-9b1b7bbbfe19",4.7,"Lumière",38,"Complete your daily skincare ritual with an elegantly presented moisturiser. Designed to complement a balanced routine, it brings a polished finishing touch to everyday personal care."],
["Botanical Hair Care Collection","Beauty",1599,2199,"photo-1608248543803-ba4f8c70ae0b",4.7,"Botanica",30,"Elevate everyday hair care with a coordinated collection inspired by contemporary self-care. Its thoughtfully curated presentation makes it an appealing addition to a refined grooming ritual."],
["Satin Glow Body Lotion","Beauty",799,1099,"photo-1600185365483-26d7a4cc7519",4.6,"Satin Glow",42,"Bring a touch of everyday indulgence to your personal-care routine. This elegantly presented body lotion complements a considered approach to grooming and daily self-care."],
["Noir Signature Fragrance","Beauty",2499,3299,"photo-1594035910387-fea47794261f",4.8,"Noir Parfums",20,"Make an unforgettable impression with a fragrance presented in a distinctly sophisticated style. Its refined character makes it a considered finishing touch for personal expression and memorable occasions."],
["Silk Touch Makeup Brush Set","Beauty",1199,1599,"photo-1522335789203-aabd1fc54bc9",4.7,"Silk Touch",34,"Bring precision and elegance to your beauty routine with a coordinated makeup brush collection. A polished addition to any vanity, designed for a more organised and considered application experience."],

["Chronos Classic Analog Watch","Accessories",4299,5499,"photo-1523275335684-37898b6baf30",4.9,"Chronos",18,"A timeless expression of personal style, this analog watch pairs a refined visual identity with versatile everyday appeal. An elegant accessory for those who appreciate enduring design."],
["Voyager Executive Backpack","Accessories",2299,2999,"photo-1553062407-98eeb64c6a62",4.7,"Voyager",28,"Designed for life in motion, this contemporary backpack offers a polished aesthetic for commuting, study and everyday journeys. Its versatile character complements both casual and professional settings."],
["Cavalli Structured Handbag","Accessories",3499,4499,"photo-1584917865442-de89df76afd3",4.8,"Cavalli Studio",15,"A sophisticated accessory that brings structure and character to modern styling. Its elegant profile transitions effortlessly between professional engagements, social occasions and everyday wear."],
["Monogram Leather Wallet","Accessories",1499,1999,"photo-1627123424574-724758594e93",4.6,"Monogram",32,"A compact expression of understated refinement, designed to complement the essentials you carry every day. Its classic styling makes it a versatile addition to a thoughtfully curated accessories collection."],
["Aero Polarised Sunglasses","Accessories",1899,2499,"photo-1511499767150-a48a237f0083",4.7,"Aero Optics",26,"Complete your look with sunglasses defined by a confident, contemporary silhouette. An adaptable accessory that brings visual distinction to relaxed weekends and considered everyday ensembles."],
["Atlas Travel Duffle Bag","Accessories",2799,3699,"photo-1553062407-98eeb64c6a62",4.7,"Atlas Travel",19,"Approach every journey with a refined travel essential. Its versatile design and contemporary appearance make it suitable for short escapes, weekend plans and organised everyday travel."],
["Sterling Minimal Bracelet","Accessories",1199,1699,"photo-1611591437281-460bfbe1220a",4.8,"Sterling House",30,"A subtle statement of contemporary elegance, this bracelet complements both individual styling and layered accessory combinations. Its timeless appeal makes it an effortless finishing touch."],
["Executive Card Holder","Accessories",999,1399,"photo-1627123424574-724758594e93",4.6,"Executive Edit",40,"Streamline your everyday carry with a compact accessory defined by clean, understated styling. A considered choice for keeping essential cards organised without compromising a polished appearance."]
];

const products = raw.map((p, i) => ({
  id: `nova-demo-${String(i + 1).padStart(3, "0")}`,
  name: p[0],
  category: p[1],
  price: p[2],
  originalPrice: p[3],
  image: `https://images.unsplash.com/${p[4]}?auto=format&fit=crop&w=900&q=85`,
  rating: p[5],
  brand: p[6],
  stock: p[7],
  description: p[8]
}));

const insert = db.prepare(`
  INSERT INTO products
  (id,name,description,category,price,originalPrice,image,images,rating,stock,featured,brand,createdAt,updatedAt)
  VALUES (@id,@name,@description,@category,@price,@originalPrice,@image,'[]',@rating,@stock,1,@brand,@now,@now)
  ON CONFLICT(id) DO UPDATE SET
    name=excluded.name,
    description=excluded.description,
    category=excluded.category,
    price=excluded.price,
    originalPrice=excluded.originalPrice,
    image=excluded.image,
    rating=excluded.rating,
    stock=excluded.stock,
    featured=excluded.featured,
    brand=excluded.brand,
    updatedAt=excluded.updatedAt
`);

const seed = db.transaction(() => {
  const now = new Date().toISOString();
  for (const product of products) insert.run({ ...product, now });
});

try {
  seed();
  console.log("Premium catalogue successfully updated.");
  console.log("Catalogue products:", db.prepare("SELECT COUNT(*) AS total FROM products").get().total);
  console.log("New catalogue entries:", db.prepare("SELECT COUNT(*) AS total FROM products WHERE id LIKE 'nova-demo-%'").get().total);
} finally {
  db.close();
}
