import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  ArrowLeft, Search, ShoppingBag, Heart, Menu, X, ArrowRight, ArrowUpRight,
  Star, Plus, Minus, Trash2, User, Truck, ShieldCheck, Headphones,
  Sparkles, Package, LogOut, AlertTriangle, LayoutDashboard,
  Pencil, RefreshCw, IndianRupee, ClipboardList, Boxes
} from "lucide-react";
import "./index.css";
import "./phase2-motion.css";

const API = import.meta.env.VITE_API_URL || "/api";

type Product = {
  _id: string;
  name: string;
  category: string;
  subcategory?: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  rating: number;
  description?: string;
  stock?: number;
  featured?: boolean;
  brand?: string;
};

type CartItem = { product: Product; quantity: number };
type UserData = { id: string; name: string; email: string; role: string };
type AdminTab = "overview" | "products" | "orders";

const demoProducts: Product[] = [
  { _id: "demo1", name: "Minimal Ceramic Table Lamp", category: "Home Decor", subcategory: "Lighting", price: 2499, originalPrice: 3299, image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=700", rating: 4.8, brand: "Form Studio" },
  { _id: "demo2", name: "Everyday Leather Sneakers", category: "Shoes & Footwear", subcategory: "Sneakers", price: 3199, originalPrice: 3999, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=700", rating: 4.7, brand: "Northline" },
  { _id: "demo3", name: "Wireless Studio Headphones", category: "Electronics", subcategory: "Headphones", price: 5499, originalPrice: 6999, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700", rating: 4.9, brand: "Soundform" },
  { _id: "demo4", name: "Classic Everyday Backpack", category: "Bags & Luggage", subcategory: "Backpacks", price: 1899, originalPrice: 2499, image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=700", rating: 4.6, brand: "Carry Co." },
  { _id: "demo5", name: "Modern Skincare Essentials", category: "Beauty & Personal Care", subcategory: "Face Serums", price: 1299, originalPrice: 1699, image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=700", rating: 4.8, brand: "Pure Ritual" },
  { _id: "demo6", name: "Sculptural Lounge Chair", category: "Furniture", subcategory: "Chairs", price: 8999, originalPrice: 10999, image: "https://images.unsplash.com/photo-1598300053653-3a4b2c7f7c0b?w=700", rating: 4.7, brand: "Form Studio" },
  { _id: "demo7", name: "Premium Analog Watch", category: "Watches", subcategory: "Analog Watches", price: 4299, originalPrice: 5499, image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=700", rating: 4.9, brand: "Moment" },
  { _id: "demo8", name: "Portable Bluetooth Speaker", category: "Electronics", subcategory: "Bluetooth Speakers", price: 2799, originalPrice: 3499, image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=700", rating: 4.6, brand: "Soundform" }
];

const categoryImages: Record<string, string> = {
  "Bags & Luggage": "photo-1553062407-98eeb64c6a62",
  "Beauty & Personal Care": "photo-1608248543803-ba4f8c70ae0b",
  "Cameras & Photography": "photo-1516035069371-29a1b244cc32",
  "Computers & Laptops": "photo-1496181133206-80ce9b88a853",
  "Electronics": "photo-1498049794561-7780e7231661",
  "Fashion": "photo-1483985988355-763728e1935b",
  "Fashion Accessories": "photo-1511499767150-a48a237f0083",
  "Furniture": "photo-1555041469-a586c61ea9bc",
  "Home & Kitchen": "photo-1556911220-e15b29be8c8f",
  "Home Decor": "photo-1616486338812-3dadae4b4ace",
  "Jewellery": "photo-1611652022419-a9419f74343d",
  "Mobiles & Accessories": "photo-1511707171634-5f897ff02aa9",
  "Shoes & Footwear": "photo-1542291026-7eec264c27ff",
  "Watches": "photo-1523275335684-37898b6baf30"
};

const money = (n: number) => "₹" + Number(n || 0).toLocaleString("en-IN");

const emptyProductForm = {
  name: "",
  category: "",
  subcategory: "",
  brand: "",
  description: "",
  price: "",
  originalPrice: "",
  stock: "0",
  image: "",
  featured: false
};

export default function App() {
  const [products, setProducts] = useState<Product[]>(demoProducts);
  const [apiOnline, setApiOnline] = useState(false);
  const [loading, setLoading] = useState(true);

  const [category, setCategory] = useState("All");
  const [subcategory, setSubcategory] = useState("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("featured");

  const [cart, setCart] = useState<CartItem[]>(() => JSON.parse(localStorage.getItem("nova-cart") || "[]"));
  const [wishlist, setWishlist] = useState<string[]>(() => JSON.parse(localStorage.getItem("nova-wishlist") || "[]"));
  const [user, setUser] = useState<UserData | null>(() => JSON.parse(localStorage.getItem("nova-user") || "null"));
  const [token, setToken] = useState(() => localStorage.getItem("nova-token") || "");

  const [drawer, setDrawer] = useState<"cart" | "wishlist" | "account" | "checkout" | "orders" | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [detailQty, setDetailQty] = useState(1);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [notice, setNotice] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [address, setAddress] = useState({ fullName: "", phone: "", address: "", city: "", state: "", postalCode: "" });

  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [cancelTarget, setCancelTarget] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);

  // Admin dashboard state
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminTab, setAdminTab] = useState<AdminTab>("overview");
  const [adminOrders, setAdminOrders] = useState<any[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [adminFormOpen, setAdminFormOpen] = useState(false);
  const [adminEditingId, setAdminEditingId] = useState<string | null>(null);
  const [adminSaving, setAdminSaving] = useState(false);
  const [adminSearch, setAdminSearch] = useState("");
  const [adminProductForm, setAdminProductForm] = useState({ ...emptyProductForm });

  const isAdmin = user?.role === "admin";
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  async function loadProducts() {
    try {
      const { data } = await axios.get(`${API}/products`);
      setProducts(data.products || []);
      setApiOnline(true);
    } catch {
      setApiOnline(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    localStorage.setItem("nova-cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("nova-wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    if (!cancelTarget) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) setCancelTarget(null);
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [cancelTarget, busy]);

  // Phase 2 motion system: one observer, one scroll RAF and one pointer RAF.
  // This keeps the visual effects smooth without stacking duplicate listeners.
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const root = document.documentElement;
    // Do not hide long catalogue containers behind IntersectionObserver.
    // Large product grids can be taller than the viewport, so a percentage
    // visibility threshold may never be reached and the whole catalogue stays
    // transparent. Product cards already have their own entrance animation.
    const revealSelector = [
      ".benefits",
      ".site-footer",
      ".section-heading",
      ".editorial",
      ".collection-footer",
      ".category-grid"
    ].join(",");
    const revealTargets = Array.from(document.querySelectorAll<HTMLElement>(revealSelector));

    let revealObserver: IntersectionObserver | null = null;
    if (!reduceMotion && "IntersectionObserver" in window) {
      revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("nova-in-view");
          revealObserver?.unobserve(entry.target);
        });
      }, { threshold: 0.01, rootMargin: "0px 0px -20px 0px" });
    }

    revealTargets.forEach((element) => {
      element.classList.add("nova-reveal");
      if (reduceMotion || !revealObserver) {
        element.classList.add("nova-in-view");
      } else {
        revealObserver.observe(element);
      }
    });

    let scrollFrame = 0;
    const updateScroll = () => {
      if (scrollFrame) return;
      scrollFrame = window.requestAnimationFrame(() => {
        scrollFrame = 0;
        const maxScroll = root.scrollHeight - window.innerHeight;
        const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
        root.style.setProperty("--nova-scroll-progress", `${Math.max(0, Math.min(1, progress)) * 100}%`);
        root.style.setProperty("--nova-scroll-y", `${window.scrollY * 0.12}px`);
      });
    };

    let pointerFrame = 0;
    let pointerX = 0;
    let pointerY = 0;
    let activeCard: HTMLElement | null = null;

    const resetTilt = (element: HTMLElement) => {
      element.style.setProperty("--nova-rx", "0deg");
      element.style.setProperty("--nova-ry", "0deg");
      element.style.setProperty("--nova-mx", "50%");
      element.style.setProperty("--nova-my", "50%");
      element.style.setProperty("--nova-depth", "0px");
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!canHover || reduceMotion || event.pointerType === "touch") return;

      pointerX = event.clientX;
      pointerY = event.clientY;
      const target = event.target instanceof HTMLElement ? event.target : null;
      activeCard = target?.closest<HTMLElement>(
        ".product-card, .category-card, .hero-visual, .nova-product-main-image"
      ) || null;

      if (pointerFrame) return;
      pointerFrame = window.requestAnimationFrame(() => {
        pointerFrame = 0;
        root.style.setProperty("--nova-pointer-x", `${pointerX}px`);
        root.style.setProperty("--nova-pointer-y", `${pointerY}px`);

        if (!activeCard) return;
        const rect = activeCard.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        const x = Math.max(0, Math.min(1, (pointerX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, (pointerY - rect.top) / rect.height));
        const maxTilt = activeCard.classList.contains("hero-visual") ? 4.5 : 6;

        activeCard.style.setProperty("--nova-rx", `${(0.5 - y) * maxTilt}deg`);
        activeCard.style.setProperty("--nova-ry", `${(x - 0.5) * maxTilt}deg`);
        activeCard.style.setProperty("--nova-mx", `${x * 100}%`);
        activeCard.style.setProperty("--nova-my", `${y * 100}%`);
        activeCard.style.setProperty("--nova-depth", "10px");
      });
    };

    const handlePointerOut = (event: PointerEvent) => {
      if (!canHover || reduceMotion) return;
      const from = event.target instanceof HTMLElement ? event.target : null;
      const to = event.relatedTarget instanceof HTMLElement ? event.relatedTarget : null;
      const card = from?.closest<HTMLElement>(
        ".product-card, .category-card, .hero-visual, .nova-product-main-image"
      );

      if (card && (!to || !card.contains(to))) {
        resetTilt(card);
        if (activeCard === card) activeCard = null;
      }
    };

    window.addEventListener("scroll", updateScroll, { passive: true });
    window.addEventListener("resize", updateScroll, { passive: true });
    updateScroll();

    if (canHover && !reduceMotion) {
      document.addEventListener("pointermove", handlePointerMove, { passive: true });
      document.addEventListener("pointerout", handlePointerOut, { passive: true });
    }

    return () => {
      if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
      if (pointerFrame) window.cancelAnimationFrame(pointerFrame);
      revealObserver?.disconnect();
      window.removeEventListener("scroll", updateScroll);
      window.removeEventListener("resize", updateScroll);
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerout", handlePointerOut);
      root.style.removeProperty("--nova-scroll-progress");
      root.style.removeProperty("--nova-scroll-y");
      root.style.removeProperty("--nova-pointer-x");
      root.style.removeProperty("--nova-pointer-y");
    };
  }, []);

  useEffect(() => {
    if (!selectedProduct) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleProductModalEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedProduct(null);
    }

    window.addEventListener("keydown", handleProductModalEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleProductModalEscape);
    };
  }, [selectedProduct]);

  const categories = useMemo(() => [
    "All",
    ...Array.from(new Set(products.map(p => p.category).filter(Boolean))).sort()
  ], [products]);

  const subcategories = useMemo(() => {
    if (category === "All") return [];
    return Array.from(new Set(
      products
        .filter(p => p.category === category)
        .map(p => p.subcategory)
        .filter((value): value is string => Boolean(value))
    )).sort();
  }, [products, category]);

  const filtered = useMemo(() => {
    let list = products.filter(p =>
      (category === "All" || p.category === category) &&
      (subcategory === "All" || p.subcategory === subcategory) &&
      `${p.name} ${p.category} ${p.subcategory || ""} ${p.brand || ""} ${p.description || ""}`
        .toLowerCase().includes(search.toLowerCase())
    );

    if (sort === "low") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "high") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "rating") list = [...list].sort((a, b) => b.rating - a.rating);
    if (sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));

    return list;
  }, [products, category, subcategory, search, sort]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const wishlistProducts = products.filter(p => wishlist.includes(p._id));

  function selectCategory(value: string) {
    setCategory(value);
    setSubcategory("All");
    setMobileMenu(false);
  }

  function resetFilters() {
    setCategory("All");
    setSubcategory("All");
    setSearch("");
    setSort("featured");
  }

  function toast(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  }

  function addToCart(product: Product, quantity = 1): boolean {
    if (product.stock === 0) {
      toast("This product is currently out of stock");
      return false;
    }

    const existing = cart.find(item => item.product._id === product._id);
    const nextQuantity = (existing?.quantity || 0) + quantity;

    if (product.stock !== undefined && nextQuantity > product.stock) {
      toast(`Only ${product.stock} units are available`);
      return false;
    }

    setCart(old => {
      const found = old.find(item => item.product._id === product._id);
      return found
        ? old.map(item => item.product._id === product._id
          ? { ...item, quantity: item.quantity + quantity }
          : item)
        : [...old, { product, quantity }];
    });

    toast("Added to your bag");
    return true;
  }

  function moveWishlistItemToCart(product: Product) {
    if (product.stock === 0) {
      toast("This product is out of stock and cannot be moved");
      return;
    }

    const existing = cart.find(item => item.product._id === product._id);
    const nextQuantity = (existing?.quantity || 0) + 1;

    if (product.stock !== undefined && nextQuantity > product.stock) {
      toast(`Only ${product.stock} units are available`);
      return;
    }

    setCart(old => {
      const found = old.find(item => item.product._id === product._id);
      return found
        ? old.map(item => item.product._id === product._id
          ? { ...item, quantity: item.quantity + 1 }
          : item)
        : [...old, { product, quantity: 1 }];
    });

    setWishlist(old => old.filter(id => id !== product._id));
    toast("Product moved from wishlist to your bag");
  }

  function changeQuantity(id: string, amount: number) {
    setCart(old => old.map(item => {
      if (item.product._id !== id) return item;

      const nextQuantity = item.quantity + amount;
      const stock = item.product.stock;

      if (stock !== undefined && nextQuantity > stock) {
        toast(`Only ${stock} units are available`);
        return item;
      }

      return { ...item, quantity: nextQuantity };
    }).filter(item => item.quantity > 0));
  }

  function openProduct(product: Product) {
    setSelectedProduct(product);
    setSelectedImage(product.image || product.images?.[0] || "");
    setDetailQty(1);
  }

  function toggleWish(id: string) {
    setWishlist(old =>
      old.includes(id) ? old.filter(x => x !== id) : [...old, id]
    );
  }

  async function authenticate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);

    try {
      const endpoint = authMode === "login" ? "login" : "register";
      const { data } = await axios.post(`${API}/auth/${endpoint}`, authForm);

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem("nova-token", data.token);
      localStorage.setItem("nova-user", JSON.stringify(data.user));

      setDrawer(null);
      toast(`Welcome${data.user.name ? ", " + data.user.name : ""}!`);
    } catch (error: any) {
      toast(error.response?.data?.message || "Could not connect to the account service");
    } finally {
      setBusy(false);
    }
  }

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();

    if (!token || !user) {
      setDrawer("account");
      toast("Please sign in before checkout");
      return;
    }

    if (!apiOnline || cart.some(item => item.product._id.startsWith("demo"))) {
      toast("Live products and database are required before ordering");
      return;
    }

    setBusy(true);

    try {
      const { data } = await axios.post(`${API}/orders`, {
        items: cart.map(item => ({
          productId: item.product._id,
          quantity: item.quantity
        })),
        shippingAddress: address
      }, authHeaders);

      setCart([]);
      setDrawer(null);
      toast(`Order ${String(data.order._id).slice(-7)} placed successfully`);
    } catch (error: any) {
      toast(error.response?.data?.message || "Order could not be placed");
    } finally {
      setBusy(false);
    }
  }

  async function loadOrders() {
    if (!token) {
      setDrawer("account");
      return;
    }

    try {
      const { data } = await axios.get(`${API}/orders/my`, authHeaders);
      setOrders(data.orders || []);
      setSelectedOrder(null);
      setDrawer("orders");
    } catch {
      toast("Could not load your orders");
    }
  }

  function askToCancelOrder(order: any) {
    if (order.status !== "Placed") {
      toast("This order can no longer be cancelled");
      return;
    }
    setCancelTarget(order);
  }

  async function confirmCancelOrder() {
    if (!cancelTarget || busy) return;

    const orderId = cancelTarget._id;
    setBusy(true);

    try {
      const { data } = await axios.patch(
        `${API}/orders/${orderId}/cancel`,
        {},
        authHeaders
      );

      setOrders(current => current.map(order =>
        order._id === orderId ? data.order : order
      ));
      setSelectedOrder(data.order);
      setCancelTarget(null);
      toast("Your order has been cancelled successfully");
    } catch (error: any) {
      toast(error.response?.data?.message || "Could not cancel this order");
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    setUser(null);
    setToken("");
    setOrders([]);
    setSelectedOrder(null);
    setShowAdmin(false);
    localStorage.removeItem("nova-user");
    localStorage.removeItem("nova-token");
    setDrawer(null);
    toast("You have signed out");
  }

  // ---------------- ADMIN DASHBOARD ----------------

  async function loadAdminData() {
    if (!isAdmin || !token) {
      toast("Administrator access is required");
      return;
    }

    setAdminLoading(true);
    setAdminError("");

    try {
      const [productResponse, orderResponse] = await Promise.all([
        axios.get(`${API}/products`),
        axios.get(`${API}/orders`, authHeaders)
      ]);

      setProducts(productResponse.data.products || []);
      setAdminOrders(orderResponse.data.orders || []);
      setApiOnline(true);
    } catch (error: any) {
      setAdminError(
        error.response?.data?.message ||
        "Could not load admin data. Please check your admin account and backend."
      );
    } finally {
      setAdminLoading(false);
    }
  }

  function openAdmin() {
    if (!isAdmin) {
      toast("Please sign in with an administrator account");
      setDrawer("account");
      return;
    }

    setDrawer(null);
    setShowAdmin(true);
    setAdminTab("overview");
    loadAdminData();
  }

  function startAddProduct() {
    setAdminEditingId(null);
    setAdminProductForm({ ...emptyProductForm });
    setAdminFormOpen(true);
    setAdminTab("products");
  }

  function startEditProduct(product: Product) {
    setAdminEditingId(product._id);
    setAdminProductForm({
      name: product.name || "",
      category: product.category || "",
      subcategory: product.subcategory || "",
      brand: product.brand || "",
      description: product.description || "",
      price: String(product.price ?? ""),
      originalPrice: String(product.originalPrice ?? ""),
      stock: String(product.stock ?? 0),
      image: product.image || "",
      featured: Boolean(product.featured)
    });
    setAdminFormOpen(true);
    setAdminTab("products");
  }

  async function saveAdminProduct(event: React.FormEvent) {
    event.preventDefault();

    const price = Number(adminProductForm.price);
    const stock = Number(adminProductForm.stock);
    const originalPrice = adminProductForm.originalPrice
      ? Number(adminProductForm.originalPrice)
      : price;

    if (!adminProductForm.name.trim() || !adminProductForm.category.trim() || !adminProductForm.image.trim()) {
      toast("Name, category and image URL are required");
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      toast("Enter a valid product price");
      return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
      toast("Stock must be a whole number of 0 or more");
      return;
    }

    if (!Number.isFinite(originalPrice) || originalPrice < 0) {
      toast("Enter a valid original price");
      return;
    }

    const payload = {
      name: adminProductForm.name.trim(),
      category: adminProductForm.category.trim(),
      subcategory: adminProductForm.subcategory.trim(),
      brand: adminProductForm.brand.trim(),
      description: adminProductForm.description.trim(),
      price,
      originalPrice,
      stock,
      image: adminProductForm.image.trim(),
      featured: adminProductForm.featured
    };

    setAdminSaving(true);

    try {
      if (adminEditingId) {
        await axios.patch(`${API}/products/${adminEditingId}`, payload, authHeaders);
        toast("Product updated successfully");
      } else {
        await axios.post(`${API}/products`, payload, authHeaders);
        toast("Product added successfully");
      }

      setAdminFormOpen(false);
      setAdminEditingId(null);
      setAdminProductForm({ ...emptyProductForm });
      await loadAdminData();
    } catch (error: any) {
      toast(error.response?.data?.message || "Could not save product");
    } finally {
      setAdminSaving(false);
    }
  }

  async function deleteAdminProduct(product: Product) {
    if (!window.confirm(`Are you sure you want to delete "${product.name}"?`)) return;

    try {
      await axios.delete(`${API}/products/${product._id}`, authHeaders);
      toast("Product deleted successfully");
      await loadAdminData();
    } catch (error: any) {
      toast(error.response?.data?.message || "Could not delete product");
    }
  }

  async function updateAdminOrderStatus(orderId: string, status: string) {
    try {
      await axios.patch(
        `${API}/orders/${orderId}/status`,
        { status },
        authHeaders
      );
      toast("Order status updated");
      await loadAdminData();
    } catch (error: any) {
      toast(error.response?.data?.message || "Could not update order status");
    }
  }

  const adminFilteredProducts = products.filter(product =>
    `${product.name} ${product.category} ${product.brand || ""}`
      .toLowerCase()
      .includes(adminSearch.toLowerCase())
  );

  const adminPendingOrders = adminOrders.filter(order =>
    ["Placed", "Processing"].includes(order.status)
  );

  const adminOrderValue = adminOrders
    .filter(order => order.status !== "Cancelled")
    .reduce((sum, order) => sum + Number(order.total || 0), 0);

  const adminLowStock = products.filter(product =>
    Number(product.stock ?? 0) <= 5
  );

  const adminCss = `
    .nova-admin {
      min-height: calc(100vh - 65px);
      padding: 28px;
      background: #f5f5f1;
      color: #262720;
    }
    .nova-admin * { box-sizing: border-box; }
    .nova-admin-inner { max-width: 1450px; margin: auto; }
    .nova-admin-top {
      display: flex; align-items: center; justify-content: space-between;
      gap: 15px; flex-wrap: wrap; margin-bottom: 25px;
    }
    .nova-admin-title { display: flex; align-items: center; gap: 13px; }
    .nova-admin-logo {
      width: 46px; height: 46px; display: grid; place-items: center;
      border-radius: 13px; background: #292c23; color: white;
      font-size: 23px; font-weight: 800;
    }
    .nova-admin-title h1 { margin: 0; font-size: 24px; }
    .nova-admin-title p { margin: 4px 0 0; color: #85857c; font-size: 12px; }
    .nova-admin-back, .nova-admin-btn {
      display: inline-flex; align-items: center; justify-content: center;
      gap: 8px; padding: 11px 15px; border-radius: 9px;
      cursor: pointer; font-weight: 650; font-size: 13px;
    }
    .nova-admin-back {
      border: 1px solid #deded7; background: white; color: #333;
    }
    .nova-admin-btn { border: 0; background: #292c23; color: white; }
    .nova-admin-btn.light {
      border: 1px solid #e2e2dc; background: white; color: #333;
    }
    .nova-admin-btn:disabled { opacity: .55; cursor: wait; }
    .nova-admin-layout {
      display: grid; grid-template-columns: 220px minmax(0, 1fr); gap: 22px;
    }
    .nova-admin-sidebar {
      height: fit-content; padding: 11px; border: 1px solid #e8e8e2;
      border-radius: 15px; background: white;
    }
    .nova-admin-nav {
      display: flex; align-items: center; gap: 11px; width: 100%;
      padding: 14px; margin: 3px 0; border: 0; border-radius: 9px;
      background: transparent; color: #66665e; cursor: pointer;
      text-align: left; font-weight: 650;
    }
    .nova-admin-nav.active { background: #292c23; color: white; }
    .nova-admin-main { min-width: 0; }
    .nova-admin-heading {
      display: flex; justify-content: space-between; align-items: center;
      flex-wrap: wrap; gap: 14px; margin-bottom: 20px;
    }
    .nova-admin-heading h2 { margin: 0; font-size: 26px; }
    .nova-admin-heading p { margin: 5px 0 0; color: #85857c; font-size: 13px; }
    .nova-admin-stats {
      display: grid; grid-template-columns: repeat(4,minmax(0,1fr));
      gap: 14px; margin-bottom: 20px;
    }
    .nova-admin-stat {
      padding: 19px; border: 1px solid #e8e8e2; border-radius: 14px;
      background: white;
    }
    .nova-admin-stat-label {
      display: flex; justify-content: space-between; align-items: center;
      gap: 8px; color: #77776f; font-size: 12px;
    }
    .nova-admin-stat-icon {
      width: 34px; height: 34px; display: grid; place-items: center;
      border-radius: 9px; background: #f0f0eb; color: #34372c;
    }
    .nova-admin-stat strong { display: block; margin-top: 13px; font-size: 25px; }
    .nova-admin-panel {
      padding: 19px; margin-bottom: 18px; border: 1px solid #e8e8e2;
      border-radius: 14px; background: white; overflow: hidden;
    }
    .nova-admin-panel h3 { margin: 0 0 16px; font-size: 17px; }
    .nova-admin-table-wrap { width: 100%; overflow-x: auto; }
    .nova-admin table { width: 100%; min-width: 650px; border-collapse: collapse; font-size: 13px; }
    .nova-admin th {
      padding: 12px; background: #f7f7f3; color: #77776f;
      text-align: left; font-weight: 650;
    }
    .nova-admin td { padding: 12px; border-bottom: 1px solid #eee; vertical-align: middle; }
    .nova-admin-product-cell { display: flex; align-items: center; gap: 10px; min-width: 190px; }
    .nova-admin-product-cell img {
      width: 45px; height: 45px; border-radius: 8px; object-fit: cover; background: #eee;
    }
    .nova-admin-product-cell strong { display: block; max-width: 200px; }
    .nova-admin-product-cell small { color: #888; }
    .nova-admin-actions { display: flex; gap: 7px; }
    .nova-admin-icon {
      width: 33px; height: 33px; display: grid; place-items: center;
      border: 1px solid #e5e5df; border-radius: 8px; background: white;
      color: #444; cursor: pointer;
    }
    .nova-admin-icon.danger { color: #b64b3b; }
    .nova-admin-input, .nova-admin-select {
      width: 100%; min-width: 110px; padding: 11px;
      border: 1px solid #deded7; border-radius: 8px;
      background: white; color: #292922; font: inherit;
    }
    .nova-admin-form {
      display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 13px;
    }
    .nova-admin-form label {
      display: grid; gap: 7px; color: #62625b; font-size: 12px; font-weight: 650;
    }
    .nova-admin-form .wide { grid-column: 1 / -1; }
    .nova-admin-form textarea { min-height: 85px; resize: vertical; }
    .nova-admin-form-actions {
      grid-column: 1 / -1; display: flex; justify-content: flex-end; gap: 9px;
    }
    .nova-admin-empty { padding: 27px; text-align: center; color: #85857c; }
    .nova-admin-error {
      padding: 13px 15px; margin-bottom: 18px; border-radius: 9px;
      background: #fff0ed; color: #a23d30; font-size: 13px;
    }
    .nova-admin-message {
      position: fixed; right: 22px; bottom: 22px; z-index: 10030;
      padding: 14px 18px; border-radius: 10px; background: #292c23;
      color: white; box-shadow: 0 10px 35px #0002; font-size: 13px;
    }
    @media(max-width:900px) {
      .nova-admin-layout { grid-template-columns: 1fr; }
      .nova-admin-sidebar { display: flex; overflow-x: auto; }
      .nova-admin-nav { width: auto; white-space: nowrap; }
      .nova-admin-stats { grid-template-columns: repeat(2,minmax(0,1fr)); }
    }
    @media(max-width:560px) {
      .nova-admin { padding: 15px; }
      .nova-admin-stats { gap: 8px; }
      .nova-admin-stat { padding: 13px; }
      .nova-admin-stat strong { font-size: 20px; }
      .nova-admin-form { grid-template-columns: 1fr; }
      .nova-admin-form .wide, .nova-admin-form-actions { grid-column: auto; }
    }
  `;

  const productModalCss = `
    .product-modal-backdrop { position: fixed !important; inset: 0 !important; z-index: 10050 !important; display: flex !important; align-items: center !important; justify-content: center !important; padding: 24px !important; background: rgba(19, 21, 17, .68) !important; backdrop-filter: blur(8px); overflow-y: auto !important; }
    .nova-product-modal { position: relative; z-index: 10051; width: min(1080px, calc(100vw - 32px)); max-height: min(900px, calc(100vh - 48px)); overflow: auto; display: grid; grid-template-columns: minmax(0, 1.02fr) minmax(360px, .98fr); gap: 0; background: #fff; border-radius: 24px; box-shadow: 0 35px 100px rgba(25,25,20,.28); border: 1px solid rgba(40,40,30,.08); }
    .nova-product-gallery { padding: 28px; background: linear-gradient(145deg,#f7f7f2,#ecece5); min-width: 0; }
    .nova-product-main-image { position: relative; aspect-ratio: 1 / 1.03; overflow: hidden; border-radius: 18px; background: #f2f2ed; box-shadow: inset 0 0 0 1px rgba(0,0,0,.04); }
    .nova-product-main-image img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .55s cubic-bezier(.2,.8,.2,1); }
    .nova-product-main-image:hover img { transform: scale(1.045); }
    .nova-product-badge { position: absolute; z-index: 2; top: 16px; left: 16px; padding: 8px 11px; border-radius: 999px; background: rgba(28,30,24,.9); color: #fff; font-size: 9px; letter-spacing: .14em; font-weight: 800; }
    .nova-product-thumbs { display: flex; gap: 10px; margin-top: 12px; overflow-x: auto; padding-bottom: 2px; }
    .nova-product-thumb { flex: 0 0 66px; width: 66px; height: 66px; padding: 0; border: 1px solid rgba(30,30,25,.12); border-radius: 10px; overflow: hidden; background: #fff; cursor: pointer; transition: .2s ease; }
    .nova-product-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .nova-product-thumb.active { border: 2px solid #292c23; transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,.1); }
    .nova-product-info { padding: 38px 38px 34px; overflow-y: auto; }
    .nova-product-breadcrumb { font-size: 10px; color: #8b8b82; text-transform: uppercase; letter-spacing: .12em; margin-bottom: 17px; }
    .nova-product-info h2 { font-size: clamp(28px,3vw,43px); line-height: 1.03; letter-spacing: -.045em; margin: 8px 0 13px; color: #25261f; }
    .nova-product-rating-row { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #77776f; margin-bottom: 19px; }
    .nova-stars { display: inline-flex; gap: 1px; color: #b48a2d; }
    .nova-price-row { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 8px; }
    .nova-price-row > strong { font-size: 28px; letter-spacing: -.03em; color: #24251f; }
    .nova-price-row del { color: #9b9b92; font-size: 14px; }
    .nova-save { font-size: 11px; font-weight: 700; color: #3f684a; }
    .nova-sale-pill { display: inline-flex; margin: 4px 0 16px; padding: 6px 9px; border-radius: 7px; background: #edf5ed; color: #3f684a; font-size: 10px; font-weight: 800; letter-spacing: .08em; }
    .nova-product-info .detail-description { font-size: 14px; line-height: 1.75; color: #66665f; margin: 5px 0 18px; }
    .nova-stock-card { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 12px 14px; border: 1px solid #e8e8e1; border-radius: 11px; background: #fafaf7; margin-bottom: 18px; }
    .nova-stock-card > div { display: flex; align-items: center; gap: 8px; font-size: 12px; }
    .nova-stock-card.out { background: #fff4f2; border-color: #f0d8d3; }
    .nova-low-stock { color: #a85b2f; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; }
    .nova-buy-row { margin-bottom: 12px; }
    .nova-quantity { justify-content: space-between; border: 1px solid #e7e7e0; border-radius: 11px; padding: 8px 11px; background: #fff; }
    .nova-add-button { min-height: 52px; border-radius: 11px; justify-content: center; font-size: 13px; }
    .nova-wishlist-button { width: 100%; margin-top: 8px; min-height: 45px; border-radius: 10px; }
    .nova-service-grid { display: grid; grid-template-columns: 1fr; gap: 8px; margin-top: 18px; }
    .nova-service-grid > div { display: flex; align-items: center; gap: 11px; padding: 10px 0; border-top: 1px solid #eeeeea; color: #3e4038; }
    .nova-service-grid svg { flex: 0 0 auto; color: #686a60; }
    .nova-service-grid span { display: grid; gap: 2px; }
    .nova-service-grid strong { font-size: 11px; }
    .nova-service-grid small { font-size: 10px; color: #92928a; }
    .nova-details { margin-top: 10px; border-top: 1px solid #e9e9e3; }
    .nova-details summary { display: flex; justify-content: space-between; align-items: center; padding: 15px 0; cursor: pointer; list-style: none; font-size: 12px; font-weight: 750; }
    .nova-details summary::-webkit-details-marker { display: none; }
    .nova-details[open] summary svg { transform: rotate(90deg); }
    .nova-details summary svg { transition: transform .2s ease; }
    .nova-detail-copy { padding: 0 0 8px; color: #77776f; font-size: 11px; line-height: 1.6; }
    .nova-detail-copy p { margin: 5px 0; }
    .nova-detail-copy strong { color: #3f4038; }
    .hero-visual { position: relative !important; isolation: isolate; overflow: hidden; border-radius: 24px; min-height: 460px; background: #e9e7df; }
    .hero-visual > img { display: block; width: 100%; height: 100%; min-height: 460px; object-fit: cover; }
    .hero-sticker { position: absolute !important; top: 24px !important; right: 24px !important; bottom: auto !important; left: auto !important; z-index: 2; display: flex; flex-direction: column; align-items: flex-start; gap: 5px; width: max-content; max-width: calc(100% - 48px); padding: 19px 22px; border: 1px solid rgba(255,255,255,.65); border-radius: 13px; background: rgba(250,249,245,.94); color: #25271f; box-shadow: 0 14px 40px rgba(20,20,15,.12); backdrop-filter: blur(10px); }
    .hero-sticker > span { display: block; font-size: 9px; line-height: 1.3; letter-spacing: .2em; font-weight: 800; }
    .hero-sticker strong { display: block; font-size: clamp(22px, 3vw, 36px); line-height: .98; letter-spacing: -.055em; }
    .hero-caption { position: absolute !important; right: auto !important; top: auto !important; left: 24px !important; bottom: 24px !important; z-index: 2; max-width: calc(100% - 48px); padding: 12px 16px; border: 1px solid rgba(255,255,255,.2); border-radius: 9px; background: rgba(25,27,22,.78); color: #fff !important; font-size: 12px; line-height: 1.5; letter-spacing: .035em; backdrop-filter: blur(8px); }
    .product-card { cursor: pointer !important; }
    .product-card:focus-visible { outline: 3px solid #9a8050; outline-offset: 4px; }
    .product-card .product-image { position: relative; }
    .product-card .product-image > img { pointer-events: none; }
    .product-card .wish-button { z-index: 3; }
    .product-card .quick-add { display: none !important; }
    @media (max-width: 820px) {
      .hero-visual, .hero-visual > img { min-height: 360px; }
      .hero-sticker { top: 14px !important; right: 14px !important; padding: 14px 16px; }
      .hero-caption { left: 14px !important; bottom: 14px !important; max-width: calc(100% - 28px); }
    }
    @media (max-width: 820px) {
      .nova-product-modal { grid-template-columns: 1fr; max-height: calc(100vh - 24px); border-radius: 18px; }
      .nova-product-gallery { padding: 17px; }
      .nova-product-main-image { aspect-ratio: 1 / .88; }
      .nova-product-info { padding: 24px 20px 28px; }
      .nova-product-info h2 { font-size: 30px; }
    }
    @media (max-width: 480px) {
      .nova-product-modal { width: calc(100vw - 16px); }
      .nova-product-gallery { padding: 12px; }
      .nova-product-main-image { border-radius: 13px; }
      .nova-product-info { padding: 21px 16px 24px; }
      .nova-product-info h2 { font-size: 26px; }
      .nova-product-thumb { flex-basis: 58px; width: 58px; height: 58px; }
    }

    /* PHASE 2 — restrained motion and depth */
    @keyframes nova-rise-in {
      from { opacity: 0; transform: translateY(22px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes nova-soft-zoom {
      from { transform: scale(1.075); }
      to { transform: scale(1); }
    }
    @keyframes nova-float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-7px); }
    }
    @keyframes nova-modal-in {
      from { opacity: 0; transform: translateY(18px) scale(.985); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .hero-copy { animation: nova-rise-in .75s cubic-bezier(.2,.7,.2,1) both; }
    .hero-visual { animation: nova-rise-in .9s .12s cubic-bezier(.2,.7,.2,1) both; }
    .hero-visual > img { animation: nova-soft-zoom 1.25s cubic-bezier(.2,.7,.2,1) both; transition: transform .8s cubic-bezier(.2,.7,.2,1), filter .5s ease; }
    .hero-visual:hover > img { transform: scale(1.045); filter: saturate(1.06); }
    .hero-sticker { animation: nova-float 6s 1.2s ease-in-out infinite; }
    .hero-caption { transition: transform .35s ease, background .35s ease; }
    .hero-visual:hover .hero-caption { transform: translateY(-4px); background: rgba(25,27,22,.9); }
    .benefits > div { transition: transform .28s ease, background .28s ease, box-shadow .28s ease; }
    .benefits > div:hover { transform: translateY(-4px); box-shadow: 0 12px 28px rgba(35,35,25,.07); }
    .category-card { transform: translateZ(0); transition: transform .35s cubic-bezier(.2,.7,.2,1), box-shadow .35s ease; }
    .category-card img { transition: transform .65s cubic-bezier(.2,.7,.2,1), filter .4s ease; }
    .category-card:hover { transform: translateY(-7px); box-shadow: 0 18px 38px rgba(25,25,20,.13); }
    .category-card:hover img { transform: scale(1.055); filter: saturate(1.08); }
    .product-card { transform: translateZ(0); transition: transform .32s cubic-bezier(.2,.7,.2,1), box-shadow .32s ease, border-color .32s ease; animation: nova-rise-in .55s both; }
    .product-card:nth-child(2) { animation-delay: .045s; }
    .product-card:nth-child(3) { animation-delay: .09s; }
    .product-card:nth-child(4) { animation-delay: .135s; }
    .product-card:nth-child(5) { animation-delay: .18s; }
    .product-card:nth-child(6) { animation-delay: .225s; }
    .product-card:nth-child(7) { animation-delay: .27s; }
    .product-card:nth-child(8) { animation-delay: .315s; }
    .product-card:hover { transform: translateY(-6px); box-shadow: 0 18px 38px rgba(30,30,20,.11); }
    .product-card .product-image img { transition: transform .6s cubic-bezier(.2,.7,.2,1), filter .4s ease; }
    .product-card:hover .product-image img { transform: scale(1.045); filter: saturate(1.05); }
    .wish-button { transition: transform .25s ease, background .25s ease, color .25s ease; }
    .wish-button:hover { transform: scale(1.09); }
    .primary-button, .secondary-button, .icon-button { transition: transform .22s ease, box-shadow .22s ease, background .22s ease; }
    .primary-button:hover:not(:disabled), .secondary-button:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 9px 22px rgba(25,30,20,.13); }
    .product-modal-backdrop { animation: nova-backdrop-in .22s ease both; }
    @keyframes nova-backdrop-in { from { opacity: 0; } to { opacity: 1; } }
    .nova-product-modal { transform-origin: center; animation: nova-modal-in .32s cubic-bezier(.2,.75,.2,1) both; }
    .nova-product-thumb:hover { transform: translateY(-3px); }
    /* PHASE 2 — immersive 3D, pointer depth and scroll choreography */
    .hero-visual, .product-card, .category-card, .nova-product-main-image {
      --nova-rx: 0deg; --nova-ry: 0deg; --nova-mx: 50%; --nova-my: 50%; --nova-depth: 0px;
      transform-style: preserve-3d;
      will-change: transform;
    }
    .hero-visual {
      transform: perspective(1100px) rotateX(var(--nova-rx)) rotateY(var(--nova-ry));
      transition: transform .22s ease-out, box-shadow .35s ease;
      box-shadow: 0 24px 65px rgba(35,34,25,.12);
    }
    .hero-visual::before {
      content: ""; position: absolute; inset: 0; z-index: 1; pointer-events: none;
      background: radial-gradient(circle at var(--nova-mx) var(--nova-my), rgba(255,255,255,.28), transparent 34%);
      opacity: .8; mix-blend-mode: screen;
    }
    .hero-visual > img { transform: translateZ(22px) scale(1.025); }
    .hero-sticker { transform: translateZ(65px); box-shadow: 0 18px 40px rgba(20,20,15,.16); }
    .hero-caption { transform: translateZ(48px); }
    .product-card {
      position: relative; transform: perspective(900px) rotateX(var(--nova-rx)) rotateY(var(--nova-ry)) translateY(0);
      transform-style: preserve-3d; isolation: isolate;
      transition: transform .18s ease-out, box-shadow .3s ease, border-color .3s ease;
    }
    .product-card::after {
      content: ""; position: absolute; inset: 0; z-index: 2; pointer-events: none; border-radius: inherit;
      background: radial-gradient(circle at var(--nova-mx) var(--nova-my), rgba(255,255,255,.32), transparent 42%);
      opacity: 0; transition: opacity .25s ease;
    }
    .product-card:hover::after { opacity: 1; }
    .product-card .product-image { transform: translateZ(18px); transform-style: preserve-3d; }
    .product-card .product-info { transform: translateZ(10px); }
    .product-card:hover { transform: perspective(900px) rotateX(var(--nova-rx)) rotateY(var(--nova-ry)) translateY(-7px); box-shadow: 0 25px 55px rgba(30,30,20,.16); }
    .product-card .product-image img { transition: transform .55s cubic-bezier(.2,.7,.2,1), filter .4s ease; }
    .product-card:hover .product-image img { transform: translateZ(20px) scale(1.075); }
    .category-card { transform: perspective(900px) rotateX(var(--nova-rx)) rotateY(var(--nova-ry)); transition: transform .2s ease-out, box-shadow .35s ease; }
    .category-card:hover { transform: perspective(900px) rotateX(var(--nova-rx)) rotateY(var(--nova-ry)) translateY(-8px); }
    .category-card img { transform: translateZ(14px); }
    .nova-product-main-image { transform: perspective(1000px) rotateX(var(--nova-rx)) rotateY(var(--nova-ry)); transition: transform .2s ease-out; }
    .nova-product-main-image img { transform: translateZ(18px) scale(1.015); }
    .nova-reveal { opacity: 0; transform: translateY(34px); transition: opacity .75s ease, transform .75s cubic-bezier(.2,.7,.2,1); }
    .nova-reveal.nova-in-view { opacity: 1; transform: translateY(0); }
    .section-heading.nova-reveal { transition-delay: .05s; }
    .benefits.nova-reveal > div { animation: nova-rise-in .65s both; }
    .benefits.nova-reveal > div:nth-child(2) { animation-delay: .08s; }
    .benefits.nova-reveal > div:nth-child(3) { animation-delay: .16s; }
    .benefits.nova-reveal > div:nth-child(4) { animation-delay: .24s; }
    .primary-button, .secondary-button, .icon-button { position: relative; overflow: hidden; }
    .primary-button::after, .secondary-button::after { content: ""; position: absolute; inset: 0; transform: translateX(-120%); background: linear-gradient(105deg,transparent 30%,rgba(255,255,255,.25) 50%,transparent 70%); transition: transform .65s ease; pointer-events: none; }
    .primary-button:hover::after, .secondary-button:hover::after { transform: translateX(120%); }
    .nova-product-modal { transform-style: preserve-3d; }
    @keyframes nova-orbit { from { transform: rotate(0deg) translateX(5px) rotate(0deg); } to { transform: rotate(360deg) translateX(5px) rotate(-360deg); } }
    @keyframes nova-glow-pulse { 0%,100% { box-shadow: 0 0 0 rgba(177,145,83,0); } 50% { box-shadow: 0 0 28px rgba(177,145,83,.18); } }
    .hero-sticker { animation: nova-float 5.5s ease-in-out infinite, nova-glow-pulse 5s ease-in-out infinite; }
    .announcement span { display: inline-block; animation: nova-orbit 12s linear infinite; }
    @media (hover: none), (max-width: 820px) {
      .hero-visual, .product-card, .category-card, .nova-product-main-image { transform: none !important; }
      .hero-sticker { animation: nova-float 6s ease-in-out infinite; }
    }
    /* PHASE 2 PRO — cinematic motion language */
    :root { --nova-scroll-progress: 0%; --nova-pointer-x: 50vw; --nova-pointer-y: 35vh; --nova-scroll-y: 0px; }
    .nova-scroll-progress { position: fixed; inset: 0 auto auto 0; width: var(--nova-scroll-progress); height: 3px; z-index: 12000; pointer-events: none; background: linear-gradient(90deg,#8f7448,#d8c39a,#8f7448); box-shadow: 0 0 12px rgba(177,145,83,.35); transform-origin: left; }
    .app-shell { isolation: isolate; }
    .app-shell::after { content: ""; position: fixed; z-index: 0; inset: 0; pointer-events: none; opacity: .22; background: radial-gradient(360px circle at var(--nova-pointer-x) var(--nova-pointer-y), rgba(190,165,115,.13), transparent 72%); transition: opacity .25s ease; }
    .app-shell > * { position: relative; z-index: 1; }
    .app-shell > .nova-scroll-progress { position: fixed; z-index: 12000; }
    .hero { perspective: 1400px; }
    .hero-copy { transform-style: preserve-3d; animation: nova-copy-enter .9s .05s cubic-bezier(.2,.75,.2,1) both; }
    .hero-copy .eyebrow { animation: nova-fade-up .7s .12s both; }
    .hero-copy h1 { animation: nova-fade-up .85s .2s both; }
    .hero-copy p { animation: nova-fade-up .85s .3s both; }
    .hero-copy .primary-button { animation: nova-fade-up .85s .4s both; }
    .hero-visual { overflow: hidden; }
    .hero-visual::after { content: ""; position: absolute; z-index: 1; width: 42%; aspect-ratio: 1; right: -12%; bottom: -30%; border-radius: 50%; border: 1px solid rgba(255,255,255,.42); box-shadow: 0 0 0 24px rgba(255,255,255,.06),0 0 0 52px rgba(255,255,255,.045); pointer-events: none; animation: nova-orbit-drift 18s linear infinite; }
    .hero-visual > img { animation: nova-hero-drift 18s ease-in-out infinite alternate; }
    .hero-caption, .hero-sticker { transition: transform .45s cubic-bezier(.2,.75,.2,1), box-shadow .4s ease; }
    .hero-visual:hover .hero-sticker { transform: translateZ(78px) rotate(-2deg) translateY(-5px); }
    .hero-visual:hover .hero-caption { transform: translateZ(60px) translateY(-5px); }
    .product-card { backface-visibility: hidden; }
    .product-card .product-image { overflow: hidden; }
    .product-card .product-image::after { content: ""; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(115deg,transparent 25%,rgba(255,255,255,.23) 48%,transparent 68%); transform: translateX(-130%); transition: transform .8s ease; }
    .product-card:hover .product-image::after { transform: translateX(130%); }
    .category-card { overflow: hidden; }
    .category-card::after { content: ""; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(180deg,transparent 45%,rgba(0,0,0,.18)); opacity: .5; transition: opacity .4s ease; }
    .category-card:hover::after { opacity: .9; }
    .editorial, .promo-section { transform-style: preserve-3d; }
    .editorial-image img { transition: transform 1s cubic-bezier(.2,.7,.2,1), filter .7s ease; }
    .editorial:hover .editorial-image img { transform: scale(1.045); filter: saturate(1.08); }
    .nova-reveal { filter: blur(3px); }
    .nova-reveal.nova-in-view { filter: blur(0); }
    .primary-button, .secondary-button, .pill, .wish-button, .icon-button { transition: transform .25s cubic-bezier(.2,.75,.2,1), box-shadow .25s ease, background .25s ease, color .25s ease; }
    .primary-button:active, .secondary-button:active, .pill:active, .wish-button:active { transform: scale(.96); }
    .nova-product-modal { animation: nova-modal-cinematic .48s cubic-bezier(.16,1,.3,1) both; }
    .nova-product-gallery { animation: nova-gallery-enter .6s .06s both; }
    .nova-product-info { animation: nova-info-enter .6s .12s both; }
    .nova-product-main-image img { transition: transform .8s cubic-bezier(.2,.7,.2,1), filter .5s ease; }
    .nova-product-main-image:hover img { transform: translateZ(35px) scale(1.07); filter: saturate(1.08); }
    @keyframes nova-copy-enter { from { opacity: 0; transform: translate3d(0,28px,-35px); } to { opacity: 1; transform: translate3d(0,0,0); } }
    @keyframes nova-fade-up { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes nova-hero-drift { from { transform: translateZ(22px) scale(1.025) translateY(0); } to { transform: translateZ(22px) scale(1.07) translateY(-7px); } }
    @keyframes nova-orbit-drift { from { transform: rotate(0deg) translateY(0); } to { transform: rotate(360deg) translateY(-12px); } }
    @keyframes nova-modal-cinematic { from { opacity: 0; transform: perspective(1200px) translateY(32px) rotateX(5deg) scale(.96); } to { opacity: 1; transform: perspective(1200px) translateY(0) rotateX(0) scale(1); } }
    @keyframes nova-gallery-enter { from { opacity: 0; transform: translateX(-18px); } to { opacity: 1; transform: translateX(0); } }
    @keyframes nova-info-enter { from { opacity: 0; transform: translateX(18px); } to { opacity: 1; transform: translateX(0); } }
    @media (max-width: 820px) { .app-shell::after { display: none; } .hero-visual::after { width: 30%; } .nova-product-gallery, .nova-product-info { animation: none; } }
    @media (prefers-reduced-motion: reduce) {
      .nova-reveal { opacity: 1 !important; transform: none !important; }
      .hero-visual, .product-card, .category-card, .nova-product-main-image { transform: none !important; }
      *, *::before, *::after { scroll-behavior: auto !important; animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
    }
  `;

  // ---------------- MAIN WEBSITE ----------------

  return (
    <div className="app-shell">
      <style>{productModalCss}</style>
      <div className="nova-scroll-progress" aria-hidden="true" />
      <div className="announcement">
        A little something special — free shipping on orders over ₹1,999
        <span>✦</span>
      </div>

      <header className="site-header">
        <button
          className="icon-button mobile-toggle"
          onClick={() => setMobileMenu(!mobileMenu)}
          aria-label="Menu"
        >
          <Menu />
        </button>

        <a className="brand" href="#" onClick={e => { e.preventDefault(); setShowAdmin(false); resetFilters(); }}>
          <span className="brand-mark">N</span>
          <span>NOVA<span className="brand-light">MART</span></span>
        </a>

        <nav className={mobileMenu ? "main-nav nav-open" : "main-nav"}>
          <button onClick={() => { setShowAdmin(false); selectCategory("All"); }}>Discover</button>
          {categories.slice(1, 5).map(c => (
            <button key={c} onClick={() => { setShowAdmin(false); selectCategory(c); }}>
              {c}
            </button>
          ))}
        </nav>

        <div className="header-actions">
          {isAdmin && (
            <button
              className="primary-button"
              onClick={openAdmin}
              style={{ padding: "10px 13px", fontSize: "12px" }}
            >
              <LayoutDashboard size={15} /> Admin
            </button>
          )}

          <button
            className="icon-button search-toggle"
            onClick={() => {
              setShowAdmin(false);
              document.getElementById("shop-search")?.focus();
              document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
            }}
            aria-label="Search"
          >
            <Search />
          </button>

          <button className="icon-button account-action" onClick={() => setDrawer("account")} aria-label="Account">
            <User />
          </button>

          <button className="icon-button" onClick={() => setDrawer("wishlist")} aria-label="Wishlist">
            <Heart />
            <span className="count-badge">{wishlist.length}</span>
          </button>

          <button className="icon-button bag-action" onClick={() => setDrawer("cart")} aria-label="Shopping bag">
            <ShoppingBag />
            <span className="count-badge">{cartCount}</span>
          </button>
        </div>
      </header>

      {showAdmin && isAdmin ? (
        <main className="nova-admin">
          <style>{adminCss}</style>
          <div className="nova-admin-inner">
            <div className="nova-admin-top">
              <div className="nova-admin-title">
                <div className="nova-admin-logo">N</div>
                <div>
                  <h1>NOVA MART ADMIN</h1>
                  <p>Store management dashboard · Signed in as {user?.email}</p>
                </div>
              </div>
              <button className="nova-admin-back" onClick={() => setShowAdmin(false)}>
                <ArrowLeft size={16} /> Back to store
              </button>
            </div>

            <div className="nova-admin-layout">
              <aside className="nova-admin-sidebar">
                <button className={`nova-admin-nav ${adminTab === "overview" ? "active" : ""}`} onClick={() => setAdminTab("overview")}>
                  <LayoutDashboard size={18} /> Overview
                </button>
                <button className={`nova-admin-nav ${adminTab === "products" ? "active" : ""}`} onClick={() => setAdminTab("products")}>
                  <Boxes size={18} /> Products
                </button>
                <button className={`nova-admin-nav ${adminTab === "orders" ? "active" : ""}`} onClick={() => setAdminTab("orders")}>
                  <ClipboardList size={18} /> Orders
                </button>
              </aside>

              <section className="nova-admin-main">
                {adminError && <div className="nova-admin-error">{adminError}</div>}

                <div className="nova-admin-heading">
                  <div>
                    <h2>
                      {adminTab === "overview" ? "Dashboard overview" :
                        adminTab === "products" ? "Product management" : "Order management"}
                    </h2>
                    <p>Manage your NOVA MART store from one place.</p>
                  </div>
                  <button className="nova-admin-btn light" onClick={loadAdminData} disabled={adminLoading}>
                    <RefreshCw size={15} /> Refresh data
                  </button>
                </div>

                {adminLoading ? (
                  <div className="nova-admin-panel nova-admin-empty">Loading dashboard data...</div>
                ) : (
                  <>
                    {adminTab === "overview" && (
                      <>
                        <div className="nova-admin-stats">
                          <div className="nova-admin-stat">
                            <div className="nova-admin-stat-label">Total products <span className="nova-admin-stat-icon"><Package size={17} /></span></div>
                            <strong>{products.length}</strong>
                          </div>
                          <div className="nova-admin-stat">
                            <div className="nova-admin-stat-label">Total orders <span className="nova-admin-stat-icon"><ShoppingBag size={17} /></span></div>
                            <strong>{adminOrders.length}</strong>
                          </div>
                          <div className="nova-admin-stat">
                            <div className="nova-admin-stat-label">Pending orders <span className="nova-admin-stat-icon"><RefreshCw size={17} /></span></div>
                            <strong>{adminPendingOrders.length}</strong>
                          </div>
                          <div className="nova-admin-stat">
                            <div className="nova-admin-stat-label">Order value <span className="nova-admin-stat-icon"><IndianRupee size={17} /></span></div>
                            <strong>{money(adminOrderValue)}</strong>
                          </div>
                        </div>

                        <div className="nova-admin-panel">
                          <h3>Recent orders</h3>
                          {!adminOrders.length ? (
                            <div className="nova-admin-empty">No customer orders yet.</div>
                          ) : (
                            <div className="nova-admin-table-wrap">
                              <table>
                                <thead>
                                  <tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th></tr>
                                </thead>
                                <tbody>
                                  {adminOrders.slice(0, 8).map(order => (
                                    <tr key={order._id}>
                                      <td>#{String(order._id).slice(-7)}</td>
                                      <td>{order.user?.name || order.shippingAddress?.fullName || "Customer"}</td>
                                      <td>{new Date(order.createdAt).toLocaleDateString("en-IN")}</td>
                                      <td>{money(order.total)}</td>
                                      <td>{order.status}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>

                        <div className="nova-admin-panel">
                          <h3>Low stock products (5 or fewer)</h3>
                          {!adminLowStock.length ? (
                            <div className="nova-admin-empty">No low-stock products.</div>
                          ) : (
                            <div className="nova-admin-table-wrap">
                              <table>
                                <thead><tr><th>Product</th><th>Category</th><th>Stock</th></tr></thead>
                                <tbody>
                                  {adminLowStock.slice(0, 10).map(product => (
                                    <tr key={product._id}>
                                      <td>{product.name}</td><td>{product.category}</td><td>{product.stock}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {adminTab === "products" && (
                      <>
                        <div className="nova-admin-heading">
                          <div><p>{products.length} products in your catalogue</p></div>
                          <button className="nova-admin-btn" onClick={startAddProduct}>
                            <Plus size={16} /> Add product
                          </button>
                        </div>

                        {adminFormOpen && (
                          <div className="nova-admin-panel">
                            <h3>{adminEditingId ? "Edit product" : "Add new product"}</h3>
                            <form className="nova-admin-form" onSubmit={saveAdminProduct}>
                              <label>Product name *
                                <input className="nova-admin-input" required value={adminProductForm.name} onChange={e => setAdminProductForm({ ...adminProductForm, name: e.target.value })} />
                              </label>
                              <label>Category *
                                <input className="nova-admin-input" required value={adminProductForm.category} onChange={e => setAdminProductForm({ ...adminProductForm, category: e.target.value })} placeholder="e.g. Electronics" />
                              </label>
                              <label>Subcategory
                                <input className="nova-admin-input" value={adminProductForm.subcategory} onChange={e => setAdminProductForm({ ...adminProductForm, subcategory: e.target.value })} />
                              </label>
                              <label>Brand
                                <input className="nova-admin-input" value={adminProductForm.brand} onChange={e => setAdminProductForm({ ...adminProductForm, brand: e.target.value })} />
                              </label>
                              <label>Selling price (₹) *
                                <input className="nova-admin-input" type="number" min="1" required value={adminProductForm.price} onChange={e => setAdminProductForm({ ...adminProductForm, price: e.target.value })} />
                              </label>
                              <label>Original price (₹)
                                <input className="nova-admin-input" type="number" min="0" value={adminProductForm.originalPrice} onChange={e => setAdminProductForm({ ...adminProductForm, originalPrice: e.target.value })} />
                              </label>
                              <label>Stock quantity *
                                <input className="nova-admin-input" type="number" min="0" step="1" required value={adminProductForm.stock} onChange={e => setAdminProductForm({ ...adminProductForm, stock: e.target.value })} />
                              </label>
                              <label>Product image URL *
                                <input className="nova-admin-input" type="url" required value={adminProductForm.image} onChange={e => setAdminProductForm({ ...adminProductForm, image: e.target.value })} />
                              </label>
                              <label className="wide">Description
                                <textarea className="nova-admin-input" value={adminProductForm.description} onChange={e => setAdminProductForm({ ...adminProductForm, description: e.target.value })} />
                              </label>
                              <label className="wide" style={{ display: "flex", alignItems: "center", gap: 9 }}>
                                <input type="checkbox" checked={adminProductForm.featured} onChange={e => setAdminProductForm({ ...adminProductForm, featured: e.target.checked })} />
                                Mark as featured product
                              </label>
                              <div className="nova-admin-form-actions">
                                <button type="button" className="nova-admin-btn light" onClick={() => { setAdminFormOpen(false); setAdminEditingId(null); }}>
                                  Cancel
                                </button>
                                <button className="nova-admin-btn" disabled={adminSaving}>
                                  {adminSaving ? "Saving..." : adminEditingId ? "Save changes" : "Add product"}
                                </button>
                              </div>
                            </form>
                          </div>
                        )}

                        <div className="nova-admin-panel">
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                            <h3 style={{ margin: 0 }}>All products ({adminFilteredProducts.length})</h3>
                            <input className="nova-admin-input" style={{ maxWidth: 260 }} placeholder="Search products..." value={adminSearch} onChange={e => setAdminSearch(e.target.value)} />
                          </div>
                          <div className="nova-admin-table-wrap">
                            <table>
                              <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead>
                              <tbody>
                                {adminFilteredProducts.map(product => (
                                  <tr key={product._id}>
                                    <td>
                                      <div className="nova-admin-product-cell">
                                        <img src={product.image} alt={product.name} onError={e => { e.currentTarget.style.visibility = "hidden"; }} />
                                        <div><strong>{product.name}</strong><small>{product.brand || "NOVA MART"}</small></div>
                                      </div>
                                    </td>
                                    <td>{product.category}<br /><small>{product.subcategory || ""}</small></td>
                                    <td>{money(product.price)}</td>
                                    <td>{product.stock ?? 0}</td>
                                    <td>
                                      <div className="nova-admin-actions">
                                        <button className="nova-admin-icon" title="Edit product" onClick={() => startEditProduct(product)}><Pencil size={15} /></button>
                                        <button className="nova-admin-icon danger" title="Delete product" onClick={() => deleteAdminProduct(product)}><Trash2 size={15} /></button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {!adminFilteredProducts.length && <div className="nova-admin-empty">No products found.</div>}
                          </div>
                        </div>
                      </>
                    )}

                    {adminTab === "orders" && (
                      <div className="nova-admin-panel">
                        <h3>All customer orders ({adminOrders.length})</h3>
                        {!adminOrders.length ? (
                          <div className="nova-admin-empty">No customer orders yet.</div>
                        ) : (
                          <div className="nova-admin-table-wrap">
                            <table>
                              <thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th></tr></thead>
                              <tbody>
                                {adminOrders.map(order => (
                                  <tr key={order._id}>
                                    <td>#{String(order._id).slice(-7)}</td>
                                    <td>{order.user?.name || order.shippingAddress?.fullName || "Customer"}<br /><small>{order.user?.email || ""}</small></td>
                                    <td>{new Date(order.createdAt).toLocaleDateString("en-IN")}</td>
                                    <td>{(order.items || []).reduce((sum: number, item: any) => sum + Number(item.quantity || 0), 0)}</td>
                                    <td>{money(order.total)}</td>
                                    <td>
                                      <select
                                        className="nova-admin-select"
                                        value={order.status}
                                        disabled={order.status === "Cancelled"}
                                        onChange={e => updateAdminOrderStatus(order._id, e.target.value)}
                                      >
                                        {order.status === "Placed" && <option value="Placed">Placed</option>}
                                        {["Processing", "Shipped", "Delivered", "Cancelled"].map(status => (
                                          <option key={status} value={status}>{status}</option>
                                        ))}
                                      </select>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </section>
            </div>
          </div>
        </main>
      ) : (
        <main>
          <section className="hero">
            <div className="hero-copy">
              <div className="eyebrow"><Sparkles size={15} /> THE EVERYDAY EDIT</div>
              <h1>Good things.<br /><em>Better living.</em></h1>
              <p>
                Thoughtfully picked essentials for the way you live, work and unwind.
                Discover pieces that make every day feel a little more special.
              </p>
              <button className="primary-button" onClick={() => document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" })}>
                Explore collection <ArrowUpRight size={17} />
              </button>
              <div className="hero-note"><span className="note-line" /> Curated for the curious</div>
            </div>

            <div className="hero-visual">
              <img src="https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=1400" alt="Warm, thoughtfully styled modern living space" />
              <div className="hero-sticker">
                <span>THE</span><strong>NEW<br />STANDARD</strong><span>OF EVERYDAY</span>
              </div>
              <div className="hero-caption">Objects with purpose. Style with soul.</div>
            </div>
          </section>

          <section className="benefits">
            <div><Truck /><span><strong>Free delivery</strong><small>On orders over ₹1,999</small></span></div>
            <div><ShieldCheck /><span><strong>Secure checkout</strong><small>Shopping made safer</small></span></div>
            <div><Headphones /><span><strong>Here to help</strong><small>Support when you need it</small></span></div>
            <div><Package /><span><strong>Easy returns</strong><small>Simple, no-fuss process</small></span></div>
          </section>

          <section className="category-section">
            <div className="section-heading">
              <div><div className="eyebrow">FIND YOUR SOMETHING</div><h2>Shop by <em>category</em></h2></div>
              <span className="heading-aside">A world of good finds, all in one place.</span>
            </div>

            <div className="category-grid">
              {categories.filter(c => c !== "All").map((c, index) => (
                <button className="category-card" key={c} onClick={() => {
                  selectCategory(c);
                  document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
                }}>
                  <img src={`https://images.unsplash.com/${categoryImages[c] || "photo-1494438639946-1ebd1d20bf85"}?w=700`} alt={c} loading="lazy" />
                  <span className="category-number">{String(index + 1).padStart(2, "0")}</span>
                  <span className="category-name">{c}<ArrowUpRight size={18} /></span>
                </button>
              ))}
            </div>
          </section>

          <section className="shop-section" id="shop">
            <div className="section-heading shop-heading">
              <div><div className="eyebrow">THE NOVA SELECTION</div><h2>Find your <em>next favourite.</em></h2></div>
              <span className="heading-aside">Good design. Great finds. Everyday value.</span>
            </div>

            <div className="shop-toolbar">
              <div className="category-pills">
                {categories.map(c => (
                  <button key={c} className={category === c ? "pill active" : "pill"} onClick={() => selectCategory(c)}>{c}</button>
                ))}
              </div>

              {subcategories.length > 0 && (
                <div className="category-pills subcategory-pills">
                  {["All", ...subcategories].map(sub => (
                    <button key={sub} className={subcategory === sub ? "pill active" : "pill"} onClick={() => setSubcategory(sub)}>{sub}</button>
                  ))}
                </div>
              )}

              <div className="shop-controls">
                <div className="search-box">
                  <Search size={17} />
                  <input id="shop-search" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
                  <button onClick={() => setSearch("")} aria-label="Clear search"><X size={14} /></button>
                </div>
                <select value={sort} onChange={e => setSort(e.target.value)} aria-label="Sort products">
                  <option value="featured">Featured</option>
                  <option value="low">Price: low to high</option>
                  <option value="high">Price: high to low</option>
                  <option value="rating">Top rated</option>
                  <option value="name">Name: A to Z</option>
                </select>
              </div>
            </div>

            {!apiOnline && <div className="preview-notice">Live catalogue is unavailable. Showing preview products instead.</div>}

            <div className="product-grid">
              {loading ? (
                <div className="empty-state">Preparing your collection...</div>
              ) : filtered.length ? (
                filtered.map((p, i) => (
                  <article
                    className="product-card"
                    key={p._id}
                    onClick={() => openProduct(p)}
                    role="button"
                    tabIndex={0}
                    aria-label={`View details for ${p.name}`}
                    onKeyDown={e => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openProduct(p);
                      }
                    }}
                  >
                    <div className="product-image">
                      <img src={p.image} alt={p.name} loading="lazy" onError={e => { e.currentTarget.src = "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=700"; }} />
                      {i < 2 && <span className="product-tag">NOVA PICK</span>}
                      <button className={wishlist.includes(p._id) ? "wish-button wished" : "wish-button"} onClick={e => { e.stopPropagation(); toggleWish(p._id); }} aria-label="Toggle wishlist">
                        <Heart size={18} fill={wishlist.includes(p._id) ? "currentColor" : "none"} />
                      </button>
                    </div>
                    <div className="product-info">
                      <div className="product-brand">{p.brand || p.subcategory || p.category}</div>
                      <h3>{p.name}</h3>
                      <div className="product-bottom">
                        <div><strong>{money(p.price)}</strong>{p.originalPrice ? <del>{money(p.originalPrice)}</del> : null}</div>
                        <span className="rating"><Star size={13} fill="currentColor" /> {p.rating || "New"}</span>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="empty-state">No products found. Try another search or category.<button className="text-link" onClick={resetFilters}>Clear all filters</button></div>
              )}
            </div>

            <div className="collection-footer">
              <span>Showing {filtered.length} thoughtfully selected finds</span>
              <button onClick={resetFilters}>View all products <ArrowRight size={16} /></button>
            </div>
          </section>

          <section className="editorial">
            <div className="editorial-image">
              <img src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200" alt="Warm modern interior" />
            </div>
            <div className="editorial-copy">
              <div className="eyebrow">A BETTER WAY TO SHOP</div>
              <h2>Less noise.<br /><em>More meaning.</em></h2>
              <p>We believe the things you bring into your life should earn their place. That's why we look for thoughtful design, everyday usefulness and value that feels right.</p>
              <button className="text-link" onClick={() => document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" })}>Explore the edit <ArrowUpRight size={17} /></button>
            </div>
          </section>

          <section className="newsletter">
            <div>
              <div className="eyebrow">A NOTE FROM NOVA</div>
              <h2>Good finds, <em>good news.</em></h2>
              <p>Get first looks at new arrivals, thoughtful edits and occasional surprises.</p>
            </div>
            <form onSubmit={e => { e.preventDefault(); toast("Thanks for joining the NOVA list!"); }}>
              <input type="email" placeholder="Your email address" required />
              <button type="submit">Join us <ArrowRight size={17} /></button>
            </form>
          </section>
        </main>
      )}

      {!showAdmin && (
        <footer className="site-footer">
          <div className="footer-main">
            <div>
              <a className="brand footer-brand" href="#" onClick={e => { e.preventDefault(); resetFilters(); }}>
                <span className="brand-mark">N</span><span>NOVA<span className="brand-light">MART</span></span>
              </a>
              <p>Thoughtful finds for everyday living.</p>
            </div>
            <div>
              <strong>Explore</strong>
              <button onClick={() => { resetFilters(); document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" }); }}>All products</button>
              <button onClick={loadOrders}>My orders</button>
            </div>
            <div>
              <strong>Customer care</strong><span>Shipping & returns</span><span>Contact us</span><span>Privacy policy</span>
            </div>
            <div>
              <strong>Your account</strong>
              <button onClick={() => setDrawer("account")}>Sign in / Register</button>
              <button onClick={() => setDrawer("cart")}>Shopping bag ({cartCount})</button>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 NOVA MART. Made for everyday.</span>
            <span>Designed to make life feel a little better.</span>
          </div>
        </footer>
      )}

      {selectedProduct && (
        <div className="product-modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setSelectedProduct(null); }}>
          <section className="product-modal nova-product-modal" role="dialog" aria-modal="true" aria-label="Product details">
            <button className="product-modal-close" onClick={() => setSelectedProduct(null)} aria-label="Close product details"><X /></button>

            <div className="nova-product-gallery">
              <div className="nova-product-main-image">
                <div className="nova-product-badge">NOVA PICK</div>
                <img
                  src={selectedImage || selectedProduct.image}
                  alt={selectedProduct.name}
                  onError={e => { e.currentTarget.src = "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=1000"; }}
                />
              </div>
              <div className="nova-product-thumbs">
                {Array.from(new Set([selectedProduct.image, ...(selectedProduct.images || [])].filter(Boolean))).slice(0, 5).map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    className={selectedImage === image ? "nova-product-thumb active" : "nova-product-thumb"}
                    onClick={() => setSelectedImage(image)}
                    aria-label={`View product image ${index + 1}`}
                  >
                    <img src={image} alt="" onError={e => { e.currentTarget.style.opacity = "0.25"; }} />
                  </button>
                ))}
              </div>
            </div>

            <div className="product-modal-info nova-product-info">
              <div className="nova-product-breadcrumb">{selectedProduct.category} {selectedProduct.subcategory ? ` / ${selectedProduct.subcategory}` : ""}</div>
              <span className="eyebrow">{selectedProduct.brand || selectedProduct.category}</span>
              <h2>{selectedProduct.name}</h2>

              <div className="nova-product-rating-row">
                <span className="nova-stars">{[1,2,3,4,5].map(i => <Star key={i} size={14} fill={i <= Math.round(selectedProduct.rating || 0) ? "currentColor" : "none"} />)}</span>
                <strong>{selectedProduct.rating || "New"}</strong>
                <span>Customer rating</span>
              </div>

              <div className="nova-price-row">
                <strong>{money(selectedProduct.price)}</strong>
                {selectedProduct.originalPrice && selectedProduct.originalPrice > selectedProduct.price ? (
                  <>
                    <del>{money(selectedProduct.originalPrice)}</del>
                    <span className="nova-save">Save {money(selectedProduct.originalPrice - selectedProduct.price)}</span>
                  </>
                ) : null}
              </div>

              {selectedProduct.originalPrice && selectedProduct.originalPrice > selectedProduct.price && (
                <div className="nova-sale-pill">{Math.round(((selectedProduct.originalPrice - selectedProduct.price) / selectedProduct.originalPrice) * 100)}% OFF</div>
              )}

              <p className="detail-description">{selectedProduct.description || "A thoughtfully selected product from the NOVA MART collection. Designed to bring quality, usefulness and style to your everyday life."}</p>

              <div className={selectedProduct.stock === 0 ? "nova-stock-card out" : "nova-stock-card"}>
                <div>
                  <span className="stock-dot" />
                  <strong>{selectedProduct.stock === 0 ? "Currently out of stock" : selectedProduct.stock !== undefined ? `${selectedProduct.stock} units available` : "Available to order"}</strong>
                </div>
                {selectedProduct.stock !== undefined && selectedProduct.stock > 0 && selectedProduct.stock <= 10 && <span className="nova-low-stock">Low stock</span>}
              </div>

              <div className="nova-buy-row">
                <div className="detail-quantity nova-quantity">
                  <span>Quantity</span>
                  <div className="quantity-control">
                    <button onClick={() => setDetailQty(q => Math.max(1, q - 1))} disabled={detailQty <= 1}><Minus size={14} /></button>
                    <span>{detailQty}</span>
                    <button onClick={() => setDetailQty(q => Math.min(selectedProduct.stock ?? 99, q + 1))} disabled={detailQty >= (selectedProduct.stock ?? 99)}><Plus size={14} /></button>
                  </div>
                </div>
              </div>

              <button className="primary-button full-button nova-add-button" disabled={selectedProduct.stock === 0} onClick={() => { if (addToCart(selectedProduct, detailQty)) setSelectedProduct(null); }}>
                {selectedProduct.stock === 0 ? "Out of stock" : `Add ${detailQty} ${detailQty === 1 ? "item" : "items"} to bag`} <ShoppingBag size={17} />
              </button>

              <button className="detail-wishlist nova-wishlist-button" onClick={() => toggleWish(selectedProduct._id)}>
                <Heart size={17} fill={wishlist.includes(selectedProduct._id) ? "currentColor" : "none"} />
                {wishlist.includes(selectedProduct._id) ? "Remove from wishlist" : "Add to wishlist"}
              </button>

              <div className="nova-service-grid">
                <div><Truck size={18} /><span><strong>Fast delivery</strong><small>Delivered to your address</small></span></div>
                <div><ShieldCheck size={18} /><span><strong>Secure checkout</strong><small>Your payment is protected</small></span></div>
                <div><Package size={18} /><span><strong>Easy returns</strong><small>Simple return experience</small></span></div>
              </div>

              <details className="nova-details" open>
                <summary>Product details <ArrowRight size={15} /></summary>
                <div className="nova-detail-copy">
                  <p><strong>Category:</strong> {selectedProduct.category}</p>
                  {selectedProduct.subcategory && <p><strong>Subcategory:</strong> {selectedProduct.subcategory}</p>}
                  {selectedProduct.brand && <p><strong>Brand:</strong> {selectedProduct.brand}</p>}
                  <p><strong>Availability:</strong> {selectedProduct.stock === 0 ? "Out of stock" : "In stock"}</p>
                </div>
              </details>
            </div>
          </section>
        </div>
      )}

      {drawer && (
        <div className="drawer-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) { setDrawer(null); setSelectedOrder(null); } }}>
          <aside className="drawer">
            <div className="drawer-header">
              <div>
                <span className="eyebrow">NOVA MART</span>
                <h2>
                  {drawer === "cart" ? "Your bag" : drawer === "wishlist" ? "Your wishlist" : drawer === "account" ? "Your account" : drawer === "checkout" ? "Checkout" : "Your orders"}
                </h2>
              </div>
              <button className="icon-button" onClick={() => { setDrawer(null); setSelectedOrder(null); }}><X /></button>
            </div>

            {drawer === "cart" && (
              <div className="drawer-content">
                {!cart.length ? (
                  <div className="drawer-empty"><ShoppingBag size={38} /><h3>Your bag is waiting</h3><p>Find something you'll love.</p><button className="primary-button" onClick={() => setDrawer(null)}>Explore products</button></div>
                ) : (
                  <>
                    {cart.map(item => (
                      <div className="cart-row" key={item.product._id}>
                        <img src={item.product.image} alt={item.product.name} />
                        <div className="cart-detail">
                          <strong>{item.product.name}</strong><span>{money(item.product.price)}</span>
                          <div className="quantity-control">
                            <button onClick={() => changeQuantity(item.product._id, -1)}><Minus size={13} /></button>
                            <span>{item.quantity}</span>
                            <button onClick={() => changeQuantity(item.product._id, 1)}><Plus size={13} /></button>
                          </div>
                        </div>
                        <button className="remove-item" onClick={() => setCart(old => old.filter(x => x.product._id !== item.product._id))}><Trash2 size={16} /></button>
                      </div>
                    ))}
                    <div className="cart-summary">
                      <div><span>Subtotal</span><strong>{money(cartTotal)}</strong></div>
                      <small>Shipping calculated at checkout.</small>
                      <button className="primary-button full-button" onClick={() => setDrawer(user ? "checkout" : "account")}>Continue to checkout <ArrowRight size={17} /></button>
                    </div>
                  </>
                )}
              </div>
            )}

            {drawer === "wishlist" && (
              <div className="drawer-content">
                {!wishlistProducts.length ? (
                  <div className="drawer-empty"><Heart size={38} /><h3>Your wishlist is empty</h3><p>Save your favourite products here for later.</p><button className="primary-button" onClick={() => setDrawer(null)}>Explore products</button></div>
                ) : wishlistProducts.map(product => (
                  <div className="cart-row" key={product._id}>
                    <img src={product.image} alt={product.name} />
                    <div className="cart-detail">
                      <strong>{product.name}</strong><span>{money(product.price)}</span>
                      <button className="text-link" onClick={() => moveWishlistItemToCart(product)}>Move to bag <ShoppingBag size={14} /></button>
                    </div>
                    <button className="remove-item" onClick={() => toggleWish(product._id)} aria-label="Remove from wishlist"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            )}

            {drawer === "account" && (
              <div className="drawer-content">
                {user ? (
                  <div className="account-card">
                    <div className="avatar"><User /></div>
                    <h3>Hello, {user.name}</h3>
                    <p>{user.email}</p>
                    {isAdmin && (
                      <button className="primary-button full-button" onClick={openAdmin}>
                        <LayoutDashboard size={17} /> Open Admin Dashboard
                      </button>
                    )}
                    <button className="secondary-button full-button" onClick={loadOrders}>View my orders</button>
                    <button className="text-link" onClick={logout}>Sign out <LogOut size={15} /></button>
                  </div>
                ) : (
                  <form className="auth-form" onSubmit={authenticate}>
                    <p>Sign in to enjoy a more personal shopping experience.</p>
                    {authMode === "register" && (
                      <label>Full name
                        <input required value={authForm.name} onChange={e => setAuthForm({ ...authForm, name: e.target.value })} placeholder="Your name" />
                      </label>
                    )}
                    <label>Email address
                      <input type="email" required value={authForm.email} onChange={e => setAuthForm({ ...authForm, email: e.target.value })} placeholder="you@example.com" />
                    </label>
                    <label>Password
                      <input type="password" minLength={8} required value={authForm.password} onChange={e => setAuthForm({ ...authForm, password: e.target.value })} placeholder="At least 8 characters" />
                    </label>
                    <button className="primary-button full-button" disabled={busy}>{busy ? "Please wait..." : authMode === "login" ? "Sign in" : "Create account"}</button>
                    <p className="switch-auth">
                      {authMode === "login" ? "New to NOVA?" : "Already have an account?"}{" "}
                      <button type="button" onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}>{authMode === "login" ? "Create an account" : "Sign in"}</button>
                    </p>
                  </form>
                )}
              </div>
            )}

            {drawer === "checkout" && (
              <div className="drawer-content">
                <div className="checkout-total"><span>Order total</span><strong>{money(cartTotal)}</strong></div>
                <p className="checkout-method">Payment method: Cash on Delivery</p>
                <form className="auth-form" onSubmit={placeOrder}>
                  <label>Full name
                    <input required value={address.fullName} onChange={e => setAddress({ ...address, fullName: e.target.value })} />
                  </label>
                  <label>Phone number
                    <input required pattern="[0-9]{10}" title="Enter a 10-digit phone number" value={address.phone} onChange={e => setAddress({ ...address, phone: e.target.value })} />
                  </label>
                  <label>Delivery address
                    <input required value={address.address} onChange={e => setAddress({ ...address, address: e.target.value })} />
                  </label>
                  <div className="form-two">
                    <label>City
                      <input required value={address.city} onChange={e => setAddress({ ...address, city: e.target.value })} />
                    </label>
                    <label>State
                      <input required value={address.state} onChange={e => setAddress({ ...address, state: e.target.value })} />
                    </label>
                  </div>
                  <label>Postal code
                    <input required value={address.postalCode} onChange={e => setAddress({ ...address, postalCode: e.target.value })} />
                  </label>
                  <button className="primary-button full-button" disabled={busy}>{busy ? "Placing order..." : "Place COD order"}</button>
                </form>
              </div>
            )}

            {drawer === "orders" && (
              <div className="drawer-content">
                {selectedOrder ? (
                  <div className="order-detail-view">
                    <button className="text-link" onClick={() => setSelectedOrder(null)}>← Back to all orders</button>
                    <h3>Order #{String(selectedOrder._id).slice(-7)}</h3>
                    <div className="order-detail-card">
                      <div className="order-detail-line"><span>Order date</span><strong>{new Date(selectedOrder.createdAt).toLocaleString("en-IN")}</strong></div>
                      <div className="order-detail-line"><span>Order status</span><strong className="order-status">{selectedOrder.status}</strong></div>
                      <div className="order-detail-line"><span>Payment method</span><strong>{selectedOrder.paymentMethod || "COD"}</strong></div>
                      <div className="order-detail-line"><span>Payment status</span><strong>{selectedOrder.paymentStatus || "Pending"}</strong></div>
                    </div>
                    <h4>Items ordered</h4>
                    {(selectedOrder.items || []).map((item: any, index: number) => (
                      <div className="cart-row order-item-row" key={`${item.product || item.name}-${index}`}>
                        <img src={item.image || ""} alt={item.name || "Ordered product"} />
                        <div className="cart-detail">
                          <strong>{item.name}</strong><span>{money(item.price)} × {item.quantity}</span>
                          <strong>{money(Number(item.price) * Number(item.quantity))}</strong>
                        </div>
                      </div>
                    ))}
                    <div className="order-detail-card">
                      <h4>Delivery address</h4>
                      <p>
                        {selectedOrder.shippingAddress?.fullName}<br />
                        {selectedOrder.shippingAddress?.phone}<br />
                        {selectedOrder.shippingAddress?.address}<br />
                        {selectedOrder.shippingAddress?.city},{" "}
                        {selectedOrder.shippingAddress?.state} {selectedOrder.shippingAddress?.postalCode}<br />
                        {selectedOrder.shippingAddress?.country || "India"}
                      </p>
                    </div>
                    <div className="order-total-line"><span>Total amount</span><strong>{money(selectedOrder.total)}</strong></div>
                    {selectedOrder.status === "Placed" && (
                      <button type="button" className="cancel-order-button" disabled={busy} onClick={() => askToCancelOrder(selectedOrder)}>Cancel this order</button>
                    )}
                    {selectedOrder.status === "Cancelled" && <p className="cancelled-message">This order has been cancelled.</p>}
                    {selectedOrder.status !== "Placed" && selectedOrder.status !== "Cancelled" && (
                      <p className="order-cannot-cancel">This order can no longer be cancelled because it is being processed.</p>
                    )}
                  </div>
                ) : !orders.length ? (
                  <div className="drawer-empty"><Package size={38} /><h3>No orders yet</h3><p>Your orders will appear here.</p></div>
                ) : orders.map(order => (
                  <button type="button" className="order-row" key={order._id} onClick={() => setSelectedOrder(order)} style={{ width: "100%", textAlign: "left", cursor: "pointer" }}>
                    <div><strong>Order #{String(order._id).slice(-7)}</strong><span>{new Date(order.createdAt).toLocaleDateString("en-IN")}</span></div>
                    <strong>{money(order.total)}</strong><span className="order-status">{order.status}</span>
                  </button>
                ))}
              </div>
            )}
          </aside>
        </div>
      )}

      {cancelTarget && (
        <div className="nova-cancel-backdrop" onMouseDown={e => { if (e.target === e.currentTarget && !busy) setCancelTarget(null); }}>
          <section className="nova-cancel-modal" role="alertdialog" aria-modal="true" aria-labelledby="cancel-title" aria-describedby="cancel-description">
            <button className="nova-cancel-close" type="button" onClick={() => setCancelTarget(null)} disabled={busy} aria-label="Close confirmation"><X size={19} /></button>
            <div className="nova-cancel-icon"><AlertTriangle size={27} /></div>
            <span className="eyebrow">ORDER CANCELLATION</span>
            <h2 id="cancel-title">Cancel your order?</h2>
            <p id="cancel-description">Are you sure you want to cancel this order? This action cannot be undone.</p>
            <div className="nova-cancel-summary">
              <div><span>Order reference</span><strong>#{String(cancelTarget._id).slice(-7)}</strong></div>
              <div><span>Order total</span><strong>{money(cancelTarget.total)}</strong></div>
              <div><span>Current status</span><strong>{cancelTarget.status}</strong></div>
            </div>
            <div className="nova-cancel-actions">
              <button type="button" className="nova-keep-order" onClick={() => setCancelTarget(null)} disabled={busy}>Keep my order</button>
              <button type="button" className="nova-confirm-cancel" onClick={confirmCancelOrder} disabled={busy}>{busy ? "Cancelling..." : "Yes, cancel order"}</button>
            </div>
          </section>
        </div>
      )}

      {notice && <div className="toast-message">{notice}</div>}

      {!showAdmin && (
        <button className="floating-bag" onClick={() => setDrawer("cart")} aria-label="Open shopping bag">
          <ShoppingBag /><span>{cartCount}</span>
        </button>
      )}

      <style>{`
        .nova-cancel-backdrop {
          position: fixed; inset: 0; z-index: 10000; display: flex;
          align-items: center; justify-content: center; padding: 20px;
          background: rgba(20,20,20,.58); backdrop-filter: blur(7px);
          animation: novaFadeIn .2s ease;
        }
        .nova-cancel-modal {
          position: relative; width: min(100%,440px); padding: 34px;
          border-radius: 22px; background: #fff; color: #25231f;
          box-shadow: 0 24px 90px rgba(0,0,0,.24);
          animation: novaModalIn .25s ease;
        }
        .nova-cancel-close {
          position: absolute; top: 17px; right: 17px; width: 36px;
          height: 36px; display: grid; place-items: center; border: 0;
          border-radius: 50%; background: #f3f1ed; color: #37332e; cursor: pointer;
        }
        .nova-cancel-close:disabled { opacity: .5; cursor: not-allowed; }
        .nova-cancel-icon {
          width: 54px; height: 54px; display: grid; place-items: center;
          margin-bottom: 22px; border-radius: 17px; background: #fff0e9; color: #c45d38;
        }
        .nova-cancel-modal .eyebrow { color: #a56c4d; font-size: 10px; letter-spacing: 2px; font-weight: 700; }
        .nova-cancel-modal h2 { margin: 10px 0; font-size: 27px; line-height: 1.2; color: #26231f; }
        .nova-cancel-modal > p { margin: 0; color: #77716b; font-size: 14px; line-height: 1.7; }
        .nova-cancel-summary {
          display: grid; gap: 13px; margin: 24px 0; padding: 18px;
          border: 1px solid #eeeae4; border-radius: 14px; background: #faf9f6;
        }
        .nova-cancel-summary > div { display: flex; justify-content: space-between; align-items: center; gap: 12px; font-size: 13px; }
        .nova-cancel-summary span { color: #817a72; }
        .nova-cancel-summary strong { color: #292620; text-align: right; }
        .nova-cancel-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .nova-cancel-actions button {
          min-height: 47px; padding: 10px 13px; border-radius: 10px;
          font-size: 13px; font-weight: 700; cursor: pointer;
          transition: transform .2s ease, opacity .2s ease;
        }
        .nova-cancel-actions button:hover:not(:disabled) { transform: translateY(-2px); }
        .nova-cancel-actions button:disabled { opacity: .6; cursor: not-allowed; }
        .nova-keep-order { border: 1px solid #e7e1d9; background: #fff; color: #38332d; }
        .nova-confirm-cancel { border: 1px solid #a94c36; background: #a94c36; color: #fff; }
        @keyframes novaFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes novaModalIn {
          from { opacity: 0; transform: translateY(12px) scale(.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @media(max-width:480px) {
          .nova-cancel-modal { padding: 27px 21px; }
          .nova-cancel-modal h2 { font-size: 23px; }
          .nova-cancel-actions { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}

