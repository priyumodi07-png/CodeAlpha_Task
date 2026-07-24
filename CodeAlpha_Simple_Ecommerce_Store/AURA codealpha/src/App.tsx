import React, { useState, useEffect } from "react";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { 
  auth 
} from "./firebase";
import { 
  fetchProducts, 
  fetchUserProfile, 
  saveUserProfile, 
  placeOrder, 
  fetchOrdersByUser 
} from "./dbHelper";
import { Product, CartItem, UserProfile, Order } from "./types";

// Component imports
import Navbar from "./components/Navbar";
import ProductCard from "./components/ProductCard";
import ProductDetails from "./components/ProductDetails";
import Cart from "./components/Cart";
import Checkout from "./components/Checkout";
import AuthModal from "./components/AuthModal";
import Profile from "./components/Profile";

import { SlidersHorizontal, Sparkles } from "lucide-react";

export default function App() {
  // Navigation / View state
  const [currentView, setView] = useState<string>("home");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Auth states
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [redirectAfterAuth, setRedirectAfterAuth] = useState<string | null>(null);

  useEffect(() => {
    if (user && redirectAfterAuth) {
      setView(redirectAfterAuth);
      setRedirectAfterAuth(null);
    }
  }, [user, redirectAfterAuth]);

  // Shop states
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Search, Category, Sorting states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc" | "rating">("featured");

  // Discount/Checkout state
  const [discountCode, setDiscountCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);

  // Initialize: Auth State & Product Fetch
  useEffect(() => {
    // 1. Fetch products
    const loadProducts = async () => {
      try {
        const data = await fetchProducts();
        setProducts(data);
      } catch (error) {
        console.error("Failed to load products:", error);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();

    // 2. Load Cart from localStorage
    const savedCart = localStorage.getItem("aura_cart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (err) {
        console.error("Failed to parse cart localstorage:", err);
      }
    }

    // 3. Auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          // Fetch user profile from firestore
          let profile = await fetchUserProfile(currentUser.uid);
          if (!profile) {
            // Seed profile if not exists
            const names = currentUser.displayName || currentUser.email?.split("@")[0] || "Guest User";
            const newProfile = {
              email: currentUser.email || "",
              fullName: names,
              createdAt: new Date().toISOString()
            };
            await saveUserProfile(currentUser.uid, newProfile);
            profile = { id: currentUser.uid, ...newProfile };
          }
          setUserProfile(profile);

          // Fetch orders for this user
          const userOrders = await fetchOrdersByUser(currentUser.uid);
          setOrders(userOrders);
        } catch (error) {
          console.warn("Notice setting up logged-in user details:", error);
        }
      } else {
        setUserProfile(null);
        setOrders([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Save cart to localstorage whenever it changes
  useEffect(() => {
    localStorage.setItem("aura_cart", JSON.stringify(cart));
  }, [cart]);

  // Auth Functions
  const handleLogin = async (email: string, password: string) => {
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();
    await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const handleRegister = async (email: string, password: string, fullName: string) => {
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();
    const cleanName = fullName.trim();
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
    // Immediately save user details in Firestore
    const profileData = {
      email: cleanEmail,
      fullName: cleanName,
      createdAt: new Date().toISOString()
    };
    await saveUserProfile(cred.user.uid, profileData);
    setUserProfile({ id: cred.user.uid, ...profileData });
  };

  const handleLogout = async () => {
    await signOut(auth);
    setView("home");
  };

  const handleSaveProfile = async (profileUpdate: Omit<UserProfile, "id">) => {
    if (user) {
      await saveUserProfile(user.uid, profileUpdate);
      setUserProfile({ id: user.uid, ...profileUpdate });
    }
  };

  // Cart operations
  const handleAddToCart = (product: Product, quantity = 1) => {
    setCart((prevCart) => {
      const existingItemIndex = prevCart.findIndex((item) => item.product.id === product.id);
      if (existingItemIndex > -1) {
        const updatedCart = [...prevCart];
        const newQty = Math.min(product.stock, updatedCart[existingItemIndex].quantity + quantity);
        updatedCart[existingItemIndex] = {
          ...updatedCart[existingItemIndex],
          quantity: newQty,
        };
        return updatedCart;
      } else {
        return [...prevCart, { product, quantity: Math.min(product.stock, quantity) }];
      }
    });
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  // Order Placement
  const handlePlaceOrder = async (shippingDetails: {
    customerName: string;
    customerEmail: string;
    shippingAddress: string;
    phone: string;
  }): Promise<string | null> => {
    const orderItems = cart.map((item) => ({
      productId: item.product.id,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      image: item.product.image,
    }));

    const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const shippingFee = subtotal > 100 ? 0 : 5.00;
    const taxFee = (subtotal - discountAmount) * 0.08;
    const finalAmount = subtotal - discountAmount + shippingFee + taxFee;

    const newOrder = {
      userId: user ? user.uid : "guest",
      customerName: shippingDetails.customerName,
      customerEmail: shippingDetails.customerEmail,
      shippingAddress: shippingDetails.shippingAddress,
      items: orderItems,
      totalAmount: finalAmount,
      status: "Pending" as const,
      createdAt: new Date().toISOString()
    };

    try {
      const orderId = await placeOrder(newOrder);
      
      // Update orders history list in UI state
      if (user) {
        const refreshedOrders = await fetchOrdersByUser(user.uid);
        setOrders(refreshedOrders);
      }

      // Empty cart state
      setCart([]);
      localStorage.removeItem("aura_cart");

      // Refetch products to get latest stocks
      const refreshedProducts = await fetchProducts();
      setProducts(refreshedProducts);

      return orderId;
    } catch (err) {
      console.error("Order placement failed:", err);
      return null;
    }
  };

  // Select a product to view details
  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setView("product-detail");
  };

  // Advanced Filtering & Sorting
  const filteredProducts = products
    .filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === "price-asc") return a.price - b.price;
      if (sortBy === "price-desc") return b.price - a.price;
      if (sortBy === "rating") return b.rating - a.rating;
      // Default: featured first, then name
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return a.name.localeCompare(b.name);
    });

  const handleProceedToCheckout = (code: string, amount: number) => {
    setDiscountCode(code);
    setDiscountAmount(amount);
    if (!user) {
      setRedirectAfterAuth("checkout");
      setIsAuthModalOpen(true);
    } else {
      setView("checkout");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-slate-900 selection:text-white" id="main-app">
      {/* Navigation bar */}
      <Navbar
        currentView={currentView}
        setView={setView}
        user={user}
        userProfileName={userProfile?.fullName || ""}
        cart={cart}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main className="flex-1 pb-16">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <svg className="animate-spin h-8 w-8 text-slate-900" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-400 animate-pulse">
              Curating catalog collections...
            </p>
          </div>
        ) : (
          <>
            {/* 1. HOME VIEW */}
            {currentView === "home" && (
              <div className="space-y-12">
                {/* Visual Editorial Hero Banner */}
                {selectedCategory === "All" && !searchQuery && (
                  <div className="relative bg-[#042f24] text-white overflow-hidden py-16 sm:py-24 px-6 sm:px-12 md:px-20" id="editorial-hero">
                    {/* Background Pattern/Grid overlay */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#10b981_1px,transparent_1px),linear-gradient(to_bottom,#10b981_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20" />
                    
                    <div className="relative max-w-4xl mx-auto text-center space-y-6">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-900/50 px-3.5 py-1 text-xs font-bold text-emerald-200 ring-1 ring-inset ring-emerald-700/50 backdrop-blur-sm">
                        <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
                        <span>Curated Indian Luxury Collections 2026</span>
                      </span>
                      <h1 className="text-4xl sm:text-6xl font-display font-extrabold tracking-tight leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-emerald-100 to-amber-200">
                        Elevate Your Environment
                      </h1>
                      <p className="max-w-xl mx-auto text-sm sm:text-base text-emerald-100/80 leading-relaxed">
                        Exquisite, premium objects curated for deep focus, elegant home aesthetics, and modern utility. Formatted in Indian Rupees with bespoke craftsmanship.
                      </p>
                      <div className="pt-2">
                        <button
                          onClick={() => {
                            const catalogSection = document.getElementById("product-grid-section");
                            catalogSection?.scrollIntoView({ behavior: "smooth" });
                          }}
                          className="px-6 py-3 bg-amber-400 text-emerald-950 hover:bg-amber-300 active:scale-95 rounded-full font-bold text-xs uppercase tracking-wider transition-all shadow-xl cursor-pointer"
                        >
                          Explore Curations
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Main Catalog Grid & Controls */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" id="product-grid-section">
                  
                  {/* Category Title & Sorting Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6 mb-8">
                    <div>
                      <h2 className="text-2xl font-display font-extrabold tracking-tight text-slate-900">
                        {selectedCategory === "All" ? "Catalog Collections" : selectedCategory}
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Displaying {filteredProducts.length} premium design pieces
                      </p>
                    </div>

                    {/* Sorting & Filter controls */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-slate-500">
                        <SlidersHorizontal className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Sort:</span>
                      </div>
                      <select
                        value={sortBy}
                        onChange={(e: any) => setSortBy(e.target.value)}
                        className="bg-white border border-slate-200 text-slate-800 text-xs rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-200 shadow-sm cursor-pointer"
                      >
                        <option value="featured">Featured Picks</option>
                        <option value="price-asc">Price: Low to High</option>
                        <option value="price-desc">Price: High to Low</option>
                        <option value="rating">Top Rated</option>
                      </select>
                    </div>
                  </div>

                  {/* Empty state for filtered lists */}
                  {filteredProducts.length === 0 ? (
                    <div className="py-24 text-center bg-white border border-slate-200 rounded-3xl max-w-md mx-auto">
                      <SlidersHorizontal className="h-8 w-8 text-slate-300 mx-auto mb-3" />
                      <h3 className="text-base font-bold text-slate-900 font-display">No Matches Found</h3>
                      <p className="text-xs text-slate-500 mt-1 mb-6 max-w-xs mx-auto leading-relaxed">
                        We couldn't find any products matching your current filters. Let's reset your search.
                      </p>
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setSelectedCategory("All");
                        }}
                        className="px-5 py-2.5 bg-slate-900 text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors"
                      >
                        Reset Filters
                      </button>
                    </div>
                  ) : (
                    /* Products Grid */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                      {filteredProducts.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onSelectProduct={handleSelectProduct}
                          onAddToCart={(p) => handleAddToCart(p, 1)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. PRODUCT DETAILS VIEW */}
            {currentView === "product-detail" && selectedProduct && (
              <ProductDetails
                product={selectedProduct}
                onBack={() => setView("home")}
                onAddToCart={(p, q) => {
                  handleAddToCart(p, q);
                  setView("cart");
                }}
              />
            )}

            {/* 3. CART VIEW */}
            {currentView === "cart" && (
              <Cart
                cart={cart}
                onUpdateQuantity={handleUpdateCartQuantity}
                onRemoveItem={handleRemoveCartItem}
                onBackToShop={() => setView("home")}
                onProceedToCheckout={handleProceedToCheckout}
              />
            )}

            {/* 4. CHECKOUT VIEW */}
            {currentView === "checkout" && (
              <Checkout
                cart={cart}
                userProfile={userProfile}
                guestEmail={user?.email || ""}
                discountCode={discountCode}
                discountAmount={discountAmount}
                onBackToCart={() => setView("cart")}
                onPlaceOrder={handlePlaceOrder}
                onOpenAuth={() => setIsAuthModalOpen(true)}
              />
            )}

            {/* 5. PROFILE & ORDERS VIEW */}
            {currentView === "profile" && (
              <Profile
                userProfile={userProfile}
                orders={orders}
                onSaveProfile={handleSaveProfile}
                onGoShopping={() => setView("home")}
              />
            )}
          </>
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-[#03231a] text-emerald-100/70 py-12 border-t border-[#043325]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <p className="font-display font-bold tracking-widest text-amber-300 text-lg">AURA</p>
          <p className="text-xs text-emerald-100/60 max-w-md mx-auto leading-relaxed">
            Fine, modern Indian curations for high-performance minimalist workspaces and homes. Made with love and beautiful engineering.
          </p>
          <div className="h-px bg-emerald-800/30 max-w-xs mx-auto" />
          <p className="text-[10px] text-emerald-500/80">
            &copy; {new Date().getFullYear()} AURA Atelier. All rights reserved. Secure Cloud Checkout active.
          </p>
        </div>
      </footer>

      {/* SIGN-IN / REGISTER AUTH MODAL */}
      {isAuthModalOpen && (
        <AuthModal
          onClose={() => setIsAuthModalOpen(false)}
          onLogin={handleLogin}
          onRegister={handleRegister}
          onGoogleLogin={handleGoogleLogin}
        />
      )}
    </div>
  );
}
