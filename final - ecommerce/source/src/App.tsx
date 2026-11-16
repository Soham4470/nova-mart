
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  ArrowLeft, Search, ShoppingBag, Heart, Menu, X, ArrowRight, ArrowUpRight,
  Star, Plus, Minus, Trash2, User, Truck, ShieldCheck, Headphones,
  Sparkles, Package, LogOut, AlertTriangle, LayoutDashboard,
  Pencil, RefreshCw, IndianRupee, ClipboardList, Boxes
} from "lucide-react";
import "./index.css";

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

  // ---------------- MAIN WEBSITE ----------------

  return (
    <div className="app-shell">
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
                  <article className="product-card" key={p._id} onClick={() => { setSelectedProduct(p); setDetailQty(1); }} role="button" tabIndex={0}
                    onKeyDown={e => { if (e.key === "Enter") { setSelectedProduct(p); setDetailQty(1); } }}>
                    <div className="product-image">
                      <img src={p.image} alt={p.name} loading="lazy" onError={e => { e.currentTarget.src = "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=700"; }} />
                      {i < 2 && <span className="product-tag">NOVA PICK</span>}
                      <button className={wishlist.includes(p._id) ? "wish-button wished" : "wish-button"} onClick={e => { e.stopPropagation(); toggleWish(p._id); }} aria-label="Toggle wishlist">
                        <Heart size={18} fill={wishlist.includes(p._id) ? "currentColor" : "none"} />
                      </button>
                      <button className="quick-add" onClick={e => { e.stopPropagation(); addToCart(p); }}>Add to bag <Plus size={16} /></button>
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
          <section className="product-modal" role="dialog" aria-modal="true" aria-label="Product details">
            <button className="product-modal-close" onClick={() => setSelectedProduct(null)} aria-label="Close product details"><X /></button>
            <div className="product-modal-image">
              <img src={selectedProduct.image} alt={selectedProduct.name} onError={e => { e.currentTarget.src = "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=700"; }} />
            </div>
            <div className="product-modal-info">
              <span className="eyebrow">{selectedProduct.brand || selectedProduct.category}</span>
              <h2>{selectedProduct.name}</h2>
              <div className="detail-rating"><Star size={16} fill="currentColor" />{selectedProduct.rating || "New"}<span>Customer rating</span></div>
              <div className="detail-price"><strong>{money(selectedProduct.price)}</strong>{selectedProduct.originalPrice ? <del>{money(selectedProduct.originalPrice)}</del> : null}</div>
              <p className="detail-description">{selectedProduct.description || "A thoughtfully selected product from the NOVA MART collection. Designed to bring quality, usefulness and style to your everyday life."}</p>
              <div className="detail-stock"><span className="stock-dot" />{selectedProduct.stock !== undefined ? (selectedProduct.stock > 0 ? `${selectedProduct.stock} units available` : "Currently out of stock") : "Available"}</div>
              <div className="detail-quantity">
                <span>Quantity</span>
                <div className="quantity-control">
                  <button onClick={() => setDetailQty(q => Math.max(1, q - 1))} disabled={detailQty <= 1}><Minus size={14} /></button>
                  <span>{detailQty}</span>
                  <button onClick={() => setDetailQty(q => Math.min(selectedProduct.stock ?? 99, q + 1))} disabled={detailQty >= (selectedProduct.stock ?? 99)}><Plus size={14} /></button>
                </div>
              </div>
              <button className="primary-button full-button" disabled={selectedProduct.stock === 0} onClick={() => { if (addToCart(selectedProduct, detailQty)) setSelectedProduct(null); }}>
                {selectedProduct.stock === 0 ? "Out of stock" : "Add to bag"} <ShoppingBag size={17} />
              </button>
              <button className="detail-wishlist" onClick={() => toggleWish(selectedProduct._id)}>
                <Heart size={17} fill={wishlist.includes(selectedProduct._id) ? "currentColor" : "none"} />
                {wishlist.includes(selectedProduct._id) ? "Remove from wishlist" : "Add to wishlist"}
              </button>
              <div className="detail-benefits"><span><Truck size={17} /> Delivery available</span><span><ShieldCheck size={17} /> Secure shopping</span></div>
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

