import React, { useState } from "react";
import { ShoppingBag, User, Search, LogOut, Menu, X, Landmark } from "lucide-react";
import { User as FirebaseUser } from "firebase/auth";
import { CartItem } from "../types";

interface NavbarProps {
  currentView: string;
  setView: (view: string) => void;
  user: FirebaseUser | null;
  userProfileName: string;
  cart: CartItem[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export default function Navbar({
  currentView,
  setView,
  user,
  userProfileName,
  cart,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  onOpenAuth,
  onLogout,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cartItemsCount = cart.reduce((total, item) => total + item.quantity, 0);

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setView("home");
    setMobileMenuOpen(false);
  };

  const categories = ["All", "Home & Living", "Stationery", "Electronics", "Fitness & Outdoors"];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200" id="app-navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setView("home"); setSelectedCategory("All"); }}>
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-950 via-[#0a4436] to-emerald-800 text-white px-3.5 py-1 rounded-xl font-display shadow-sm">
              AURA
            </span>
          </div>

          {/* Desktop Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search products, brands, collections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 border-none rounded-full py-2 pl-10 pr-4 focus:ring-2 focus:ring-slate-200 text-xs text-slate-600 focus:outline-none transition-all duration-200"
              />
              <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategorySelect(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  selectedCategory === cat && currentView === "home"
                    ? "bg-[#0a4436] text-white"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Search Toggle for Mobile */}
            <div className="md:hidden relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-32 sm:w-44 bg-slate-100 border-none text-slate-600 text-[11px] rounded-full pl-8 pr-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
              <Search className="absolute left-2.5 top-2 h-3 w-3 text-slate-400" />
            </div>

            {/* Profile / Auth Button */}
            {user ? (
              <div className="relative flex items-center gap-1 sm:gap-2">
                <button
                  onClick={() => setView("profile")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    currentView === "profile" || currentView === "orders"
                      ? "bg-[#0a4436] text-white border-[#0a4436]"
                      : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                  }`}
                >
                  <User className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline max-w-[100px] truncate">
                    {userProfileName || "Account"}
                  </span>
                </button>
                <button
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-2 text-slate-400 hover:text-slate-900 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#0a4436] hover:bg-[#073228] text-white rounded-full text-xs font-semibold transition-colors"
              >
                <User className="h-3.5 w-3.5" />
                <span>Sign In</span>
              </button>
            )}

            {/* Cart Icon */}
            <button
              onClick={() => setView("cart")}
              className={`relative p-2 rounded-full border transition-all ${
                currentView === "cart"
                  ? "bg-[#0a4436] text-white border-[#0a4436]"
                  : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
              }`}
            >
              <ShoppingBag className="h-4 w-4" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
                  {cartItemsCount}
                </span>
              )}
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-100 py-3 px-4 space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-1">Categories</p>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategorySelect(cat)}
              className={`block w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === cat && currentView === "home"
                  ? "bg-[#0a4436] text-white"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
