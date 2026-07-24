import React, { useState } from "react";
import { ArrowLeft, Star, ShoppingBag, Truck, ShieldCheck, RefreshCw, StarHalf } from "lucide-react";
import { Product } from "../types";
import { formatPrice } from "../utils/format";

interface ProductDetailsProps {
  product: Product;
  onBack: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

export default function ProductDetails({ product, onBack, onAddToCart }: ProductDetailsProps) {
  const [quantity, setQuantity] = useState(1);
  const isOutOfStock = product.stock <= 0;

  const handleIncrement = () => {
    if (quantity < product.stock) {
      setQuantity((prev) => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in" id="product-details-container">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold text-xs uppercase tracking-wider mb-8 transition-colors group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        <span>Back to Collections</span>
      </button>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
        {/* Left Side: Product Image */}
        <div className="relative aspect-square rounded-3xl overflow-hidden bg-slate-50 border border-slate-200 shadow-sm">
          <img
            src={product.image}
            alt={product.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center"
          />
          {product.featured && (
            <span className="absolute top-4 left-4 inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 border border-blue-100 shadow-sm">
              Featured Pick
            </span>
          )}
        </div>

        {/* Right Side: Product Details */}
        <div className="flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              {product.category}
            </span>
            <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-slate-900 tracking-tight mt-2 mb-4">
              {product.name}
            </h1>

            {/* Ratings & Stock */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="flex items-center gap-1.5">
                <div className="flex text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(product.rating) ? "fill-amber-400" : "text-slate-200"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-bold text-slate-700">{product.rating} / 5</span>
              </div>

              <div className="h-4 w-[1px] bg-slate-200" />

              {/* Stock Status Indicator */}
              <div>
                {isOutOfStock ? (
                  <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500 border border-slate-200">
                    Sold Out
                  </span>
                ) : product.stock < 5 ? (
                  <span className="inline-flex items-center rounded-md bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-600 border border-orange-150 animate-pulse">
                    Urgent: Only {product.stock} units remaining!
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-150">
                    In Stock ({product.stock} available)
                  </span>
                )}
              </div>
            </div>

            {/* Price Card */}
            <div className="p-5 bg-emerald-50/40 border border-emerald-100 rounded-2xl mb-6">
              <span className="text-xs text-emerald-600/85 font-bold uppercase tracking-wider block mb-1">Catalog Price</span>
              <span className="text-3xl font-extrabold text-emerald-800 font-display font-sans">{formatPrice(product.price)}</span>
            </div>

            {/* Description */}
            <div className="prose prose-slate mb-8">
              <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                {product.description}
              </p>
            </div>
          </div>

          <div>
            {/* Purchase Controls */}
            {!isOutOfStock ? (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-6 border-t border-slate-200">
                {/* Quantity Selector */}
                <div className="flex items-center justify-between border border-slate-200 rounded-full p-1 bg-white max-w-[140px] h-12">
                  <button
                    disabled={quantity <= 1}
                    onClick={handleDecrement}
                    className="w-10 h-10 flex items-center justify-center rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                  >
                    -
                  </button>
                  <span className="font-sans font-bold text-slate-900 text-sm px-2 select-none">
                    {quantity}
                  </span>
                  <button
                    disabled={quantity >= product.stock}
                    onClick={handleIncrement}
                    className="w-10 h-10 flex items-center justify-center rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                  >
                    +
                  </button>
                </div>

                {/* Add to Cart CTA */}
                <button
                  onClick={() => onAddToCart(product, quantity)}
                  className="flex-1 h-12 bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98] rounded-full font-sans font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all duration-200"
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span>Add to Shopping Cart</span>
                </button>
              </div>
            ) : (
              <button
                disabled
                className="w-full h-12 bg-slate-100 text-slate-400 rounded-full font-sans font-bold text-xs uppercase tracking-wider cursor-not-allowed"
              >
                Out of Stock
              </button>
            )}

            {/* Additional Value Props */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-200">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-slate-100 rounded-full border border-slate-200 text-slate-700">
                  <Truck className="h-4 w-4" />
                </span>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Express Delivery</span>
                  <span className="text-[10px] text-slate-400">Ships in 1-2 working days</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="p-2 bg-slate-100 rounded-full border border-slate-200 text-slate-700">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Secure Checkout</span>
                  <span className="text-[10px] text-slate-400">Fully encrypted transaction</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="p-2 bg-slate-100 rounded-full border border-slate-200 text-slate-700">
                  <RefreshCw className="h-4 w-4" />
                </span>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Returns Policy</span>
                  <span className="text-[10px] text-slate-400">30-day hassle-free returns</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
