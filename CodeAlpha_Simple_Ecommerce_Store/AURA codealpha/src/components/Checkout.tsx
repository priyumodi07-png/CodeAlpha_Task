import React, { useState, useEffect } from "react";
import { ArrowLeft, CreditCard, ShieldCheck, ShoppingBag, CheckCircle, Sparkles, Loader2 } from "lucide-react";
import { UserProfile, CartItem } from "../types";
import { formatPrice } from "../utils/format";

interface CheckoutProps {
  cart: CartItem[];
  userProfile: UserProfile | null;
  guestEmail: string;
  discountCode: string;
  discountAmount: number;
  onBackToCart: () => void;
  onPlaceOrder: (orderDetails: {
    customerName: string;
    customerEmail: string;
    shippingAddress: string;
    phone: string;
  }) => Promise<string | null>; // Returns placed order ID
  onOpenAuth: () => void;
}

export default function Checkout({
  cart,
  userProfile,
  guestEmail,
  discountCode,
  discountAmount,
  onBackToCart,
  onPlaceOrder,
  onOpenAuth,
}: CheckoutProps) {
  // Form fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  
  // Mock Payment fields
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  // States
  const [loadingStep, setLoadingStep] = useState<string | null>(null);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Pre-fill user profile if available
  useEffect(() => {
    if (userProfile) {
      setFullName(userProfile.fullName || "");
      setEmail(userProfile.email || "");
      setAddress(userProfile.address || "");
      setPhone(userProfile.phone || "");
    } else if (guestEmail) {
      setEmail(guestEmail);
    }
  }, [userProfile, guestEmail]);

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shipping = subtotal > 100 ? 0 : 5.00;
  const tax = (subtotal - discountAmount) * 0.08;
  const total = subtotal - discountAmount + shipping + tax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !address || !phone) {
      setError("Please fill out all shipping details.");
      return;
    }
    if (!cardNumber || !expiry || !cvv) {
      setError("Please fill out all payment details.");
      return;
    }

    setError("");
    
    // Multi-step realistic order processing animation
    try {
      setLoadingStep("Authorizing payment credentials...");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      setLoadingStep("Validating warehouse product inventories...");
      await new Promise((resolve) => setTimeout(resolve, 800));
      
      setLoadingStep("Finalizing invoice ledger and order receipts...");
      const orderId = await onPlaceOrder({
        customerName: fullName,
        customerEmail: email,
        shippingAddress: address,
        phone: phone,
      });

      if (orderId) {
        setPlacedOrderId(orderId);
      } else {
        setError("Something went wrong while placing your order. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "Checkout failed");
    } finally {
      setLoadingStep(null);
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").substring(0, 16);
    // Format card number into blocks of 4
    const formatted = val.match(/.{1,4}/g)?.join(" ") || val;
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").substring(0, 4);
    if (val.length >= 2) {
      setExpiry(`${val.substring(0, 2)}/${val.substring(2)}`);
    } else {
      setExpiry(val);
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").substring(0, 3);
    setCvv(val);
  };

  // AUTHENTICATION REQUIRED VIEW
  if (!userProfile) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center animate-fade-in" id="checkout-auth-required">
        <div className="p-8 bg-white border border-slate-200 rounded-3xl shadow-sm max-w-2xl mx-auto text-center space-y-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600 mb-2 border border-amber-100">
            <ShoppingBag className="h-6 w-6" />
          </div>
          
          <h1 className="text-2xl font-display font-extrabold text-slate-900 tracking-tight">
            Authentication Required
          </h1>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed font-sans">
            Please sign in or create an account before completing your purchase. 
            This allows us to securely save your delivery profile and record your shopping history.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <button
              type="button"
              onClick={onBackToCart}
              className="px-6 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-full font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              Return to Cart
            </button>
            <button
              type="button"
              onClick={onOpenAuth}
              className="px-6 py-2.5 bg-slate-900 text-white hover:bg-slate-800 rounded-full font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
              <span>Sign In / Sign Up</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SUCCESS VIEW
  if (placedOrderId) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center animate-fade-in" id="checkout-success">
        <div className="p-8 bg-white border border-slate-200 rounded-3xl shadow-sm max-w-2xl mx-auto">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-6 border border-emerald-100">
            <CheckCircle className="h-8 w-8" />
          </div>
          
          <h1 className="text-3xl font-display font-extrabold text-slate-900 tracking-tight">
            Order Placed Successfully!
          </h1>
          <p className="mt-2 text-slate-500 font-sans text-xs">
            Thank you for shopping with AURA. Your luxury pieces are on their way.
          </p>

          {/* Invoice card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-left my-8 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Order ID</span>
              <span className="text-sm font-mono font-bold text-slate-800">{placedOrderId}</span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Deliver To</span>
              <p className="text-sm font-bold text-slate-800">{fullName}</p>
              <p className="text-xs text-slate-500">{address}</p>
              <p className="text-xs text-slate-500">{phone}</p>
            </div>

            <div className="pt-3 border-t border-slate-200 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Items Purchased</span>
              {cart.map((item) => (
                <div key={item.product.id} className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>{item.product.name} (x{item.quantity})</span>
                  <span className="font-sans">{formatPrice(item.product.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-800">Total Charged</span>
              <span className="text-base font-extrabold text-emerald-800 font-sans">{formatPrice(total)}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-slate-900 text-white rounded-full font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition-colors shadow-sm"
            >
              Back to Collections
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in" id="checkout-container">
      {/* Back Button */}
      <button
        onClick={onBackToCart}
        className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold text-xs uppercase tracking-wider mb-8 transition-colors group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        <span>Return to Cart</span>
      </button>

      {/* Loading overlay */}
      {loadingStep && (
        <div className="fixed inset-0 z-50 bg-white/85 backdrop-blur-sm flex flex-col items-center justify-center">
          <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
          <p className="font-bold text-slate-900 tracking-tight text-xs uppercase tracking-wider animate-pulse">
            {loadingStep}
          </p>
        </div>
      )}

      <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 tracking-tight mb-8">
        Checkout Secured Portal
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Checkout Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-8">
          
          {/* Shipping Address Section */}
          <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
            <h2 className="text-lg font-display font-bold text-slate-900 border-b border-slate-100 pb-4 mb-5">
              1. Delivery Destination
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="E.g., Jane Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-100 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="jane.doe@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-100 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Full Shipping Address
                </label>
                <input
                  type="text"
                  required
                  placeholder="Street Address, City, State, ZIP"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-100 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Contact Phone Number
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-100 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          {/* Secure Payment details section */}
          <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
            <h2 className="text-lg font-display font-bold text-slate-900 border-b border-slate-100 pb-4 mb-5 flex items-center justify-between">
              <span>2. Secure Payment Method</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>SSL Encrypted</span>
              </span>
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Cardholder's Card Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="0000 0000 0000 0000"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-100 focus:bg-white transition-all"
                  />
                  <CreditCard className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="MM/YY"
                    value={expiry}
                    onChange={handleExpiryChange}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-100 focus:bg-white transition-all text-center"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    CVV / CVC
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="000"
                    value={cvv}
                    onChange={handleCvvChange}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-100 focus:bg-white transition-all text-center"
                  />
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-xs text-red-600 rounded-xl font-bold">
              {error}
            </div>
          )}

          {/* Place order CTA */}
          <button
            type="submit"
            className="w-full h-14 bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98] rounded-full font-sans font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 shadow-md cursor-pointer"
          >
            <span>Authorize & Place Order</span>
            <span className="font-sans">({formatPrice(total)})</span>
          </button>
        </form>

        {/* Sidebar cart review summary */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <h2 className="text-lg font-display font-bold text-slate-900 border-b border-slate-100 pb-4 mb-4">
            Items Review ({cart.reduce((sum, item) => sum + item.quantity, 0)})
          </h2>

          <div className="max-h-[300px] overflow-y-auto pr-2 divide-y divide-slate-100 mb-6">
            {cart.map((item) => (
              <div key={item.product.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                <div className="h-14 w-14 rounded-xl bg-slate-50 border border-slate-150 overflow-hidden flex-shrink-0">
                  <img src={item.product.image} alt={item.product.name} className="h-full w-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate">{item.product.name}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">Quantity: {item.quantity}</p>
                </div>
                <span className="text-xs font-bold text-emerald-800 font-sans">
                  {formatPrice(item.product.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-100 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span className="font-bold text-slate-800 font-sans">{formatPrice(subtotal)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>Discount ({discountCode || "AURA10"})</span>
                <span className="font-sans">-{formatPrice(discountAmount)}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-500">
              <span>Shipping</span>
              <span className="font-bold text-slate-800">
                {shipping === 0 ? "FREE" : formatPrice(shipping)}
              </span>
            </div>

            <div className="flex justify-between text-slate-500">
              <span>Tax (8%)</span>
              <span className="font-bold text-slate-800 font-sans">{formatPrice(tax)}</span>
            </div>

            <div className="flex justify-between items-center text-slate-900 pt-3 border-t border-slate-200 font-bold text-sm">
              <span>Grand Total</span>
              <span className="text-lg text-emerald-800 font-extrabold font-display font-sans">{formatPrice(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
