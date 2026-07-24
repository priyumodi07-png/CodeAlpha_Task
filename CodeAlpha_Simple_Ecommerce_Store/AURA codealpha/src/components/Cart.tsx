import React, { useState } from "react";
import { ArrowLeft, Trash2, ShoppingBag, Plus, Minus, Tag, Check, ArrowRight } from "lucide-react";
import { CartItem } from "../types";
import { formatPrice } from "../utils/format";

interface CartProps {
  cart: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onBackToShop: () => void;
  onProceedToCheckout: (discountCode: string, discountAmount: number) => void;
}

export default function Cart({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onBackToShop,
  onProceedToCheckout,
}: CartProps) {
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  
  // Promo code logic: "AURA10" gives 10% off subtotal
  const applyPromoCode = () => {
    if (promoCode.toUpperCase() === "AURA10") {
      const discount = subtotal * 0.1;
      setDiscountAmount(discount);
      setPromoApplied(true);
      setPromoError("");
    } else {
      setPromoError("Invalid code. Try 'AURA10'");
      setPromoApplied(false);
      setDiscountAmount(0);
    }
  };

  const shipping = subtotal > 100 || subtotal === 0 ? 0 : 5.00;
  const tax = (subtotal - discountAmount) * 0.08;
  const total = subtotal - discountAmount + shipping + tax;

  if (cart.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center animate-fade-in" id="empty-cart-container">
        <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl max-w-md mx-auto mb-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-900 mb-4">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-display font-bold text-slate-900">Your Shopping Cart is Empty</h2>
          <p className="mt-2 text-xs text-slate-500 leading-relaxed">
            Looks like you haven't added any products to your bag yet.
          </p>
        </div>
        <button
          onClick={onBackToShop}
          className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-full font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Explore Collections</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in" id="cart-container">
      {/* Back Button */}
      <button
        onClick={onBackToShop}
        className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold text-xs uppercase tracking-wider mb-8 transition-colors group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        <span>Continue Shopping</span>
      </button>

      <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 tracking-tight mb-8">
        Your Shopping Cart
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          {cart.map((item) => (
            <div
              key={item.product.id}
              className="flex items-center gap-4 sm:gap-6 p-4 bg-white border border-slate-200 rounded-2xl"
            >
              {/* Product Thumbnail */}
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex-shrink-0">
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">
                  {item.product.category}
                </span>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                  {item.product.name}
                </h3>
                <span className="text-sm font-bold text-emerald-800 mt-1 block font-sans">
                  {formatPrice(item.product.price)}
                </span>
              </div>

              {/* Action Column */}
              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 sm:gap-6">
                {/* Quantity Control */}
                <div className="flex items-center border border-slate-200 rounded-full p-0.5 bg-slate-50">
                  <button
                    disabled={item.quantity <= 1}
                    onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                    className="w-7 h-7 flex items-center justify-center rounded-full text-slate-500 hover:text-slate-900 hover:bg-white disabled:opacity-30 transition-all"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="font-sans font-bold text-slate-800 text-xs px-2.5 min-w-[24px] text-center">
                    {item.quantity}
                  </span>
                  <button
                    disabled={item.quantity >= item.product.stock}
                    onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                    className="w-7 h-7 flex items-center justify-center rounded-full text-slate-500 hover:text-slate-900 hover:bg-white disabled:opacity-30 transition-all"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>

                {/* Remove button */}
                <button
                  onClick={() => onRemoveItem(item.product.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove item"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary breakdown */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <h2 className="text-lg font-display font-bold text-slate-900 border-b border-slate-100 pb-4 mb-4">
            Order Summary
          </h2>

          {/* Pricing Details */}
          <div className="space-y-3 pb-4 border-b border-slate-100 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span className="font-bold text-slate-800 font-sans">{formatPrice(subtotal)}</span>
            </div>

            {promoApplied && (
              <div className="flex justify-between text-emerald-600 font-bold">
                <span className="flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5" />
                  Promo (10%)
                </span>
                <span className="font-sans">-{formatPrice(discountAmount)}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-500">
              <span>Est. Delivery</span>
              <span className="font-bold text-slate-800">
                {shipping === 0 ? "FREE" : formatPrice(shipping)}
              </span>
            </div>

            <div className="flex justify-between text-slate-500">
              <span>Est. Tax (8%)</span>
              <span className="font-bold text-slate-800 font-sans">{formatPrice(tax)}</span>
            </div>
          </div>

          {/* Promo code field */}
          <div className="py-4 border-b border-slate-100">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Promo code (AURA10)"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  disabled={promoApplied}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl pl-8 pr-2 py-2.5 focus:outline-none focus:ring-2 focus:ring-slate-100 disabled:bg-slate-100 disabled:text-slate-400"
                />
                <Tag className="absolute left-2.5 top-3 h-3.5 w-3.5 text-slate-400" />
              </div>
              <button
                onClick={applyPromoCode}
                disabled={promoApplied || !promoCode}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors disabled:bg-slate-200 disabled:text-slate-400"
              >
                {promoApplied ? <Check className="h-4 w-4 text-emerald-600" /> : "Apply"}
              </button>
            </div>
            {promoError && <p className="text-[11px] text-red-500 font-bold mt-1.5">{promoError}</p>}
            {promoApplied && <p className="text-[11px] text-emerald-600 font-bold mt-1.5">Discount code AURA10 applied!</p>}
          </div>

          {/* Total */}
          <div className="flex justify-between items-center py-4 text-slate-900">
            <span className="text-base font-bold">Estimated Total</span>
            <span className="text-xl font-extrabold font-display font-sans text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-100">{formatPrice(total)}</span>
          </div>

          {/* Checkout CTA */}
          <button
            onClick={() => onProceedToCheckout(promoApplied ? "AURA10" : "", discountAmount)}
            className="w-full h-12 bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98] rounded-full font-sans font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 mt-4 transition-all duration-200"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
