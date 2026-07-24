import React from "react";
import { Star, ShoppingCart, Eye } from "lucide-react";
import { Product } from "../types";
import { formatPrice } from "../utils/format";

interface ProductCardProps {
  key?: string;
  product: Product;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export default function ProductCard({ product, onSelectProduct, onAddToCart }: ProductCardProps) {
  const isOutOfStock = product.stock <= 0;

  return (
    <div 
      className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col gap-3 group hover:shadow-lg transition-all duration-300 h-full"
      id={`product-card-${product.id}`}
    >
      {/* Product Image Panel */}
      <div className="bg-slate-50 aspect-[4/3] rounded-xl flex items-center justify-center relative overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
          {product.featured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600 border border-blue-100">
              Featured
            </span>
          )}
          {isOutOfStock ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 border border-slate-200">
              Sold Out
            </span>
          ) : product.stock < 5 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-600 border border-orange-100">
              Only {product.stock} left
            </span>
          ) : null}
        </div>

        {/* Hover Action Overlay from Design HTML */}
        <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          <button
            onClick={() => onSelectProduct(product)}
            className="bg-white p-2 rounded-lg shadow-sm border border-slate-100 hover:bg-slate-50 text-slate-700 hover:scale-105 transition-all"
            title="View details"
          >
            <Eye className="h-4 w-4" />
          </button>
          {!isOutOfStock && (
            <button
              onClick={() => onAddToCart(product)}
              className="bg-slate-900 text-white p-2 rounded-lg shadow-sm hover:bg-slate-800 hover:scale-105 transition-all"
              title="Add to cart"
            >
              <ShoppingCart className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Information Panel */}
      <div className="flex flex-col flex-1 gap-1">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0 pr-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
              {product.category}
            </p>
            <h4 
              onClick={() => onSelectProduct(product)}
              className="font-bold text-slate-900 text-sm line-clamp-1 hover:text-blue-600 cursor-pointer"
            >
              {product.name}
            </h4>
            <div className="flex items-center gap-1 mt-1">
              <div className="flex text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${
                      i < Math.floor(product.rating) ? "fill-amber-400" : "text-slate-200"
                    }`}
                  />
                ))}
              </div>
              <span className="text-[10px] text-slate-400 font-semibold">{product.rating}</span>
            </div>
          </div>
          <span className="font-bold text-sm sm:text-base text-emerald-800 shrink-0 bg-emerald-50/50 px-2.5 py-1 rounded-lg border border-emerald-100 font-sans">{formatPrice(product.price)}</span>
        </div>

        {/* Standard CTA Button */}
        <div className="mt-auto pt-3 border-t border-slate-100 flex justify-end">
          <button
            disabled={isOutOfStock}
            onClick={() => onAddToCart(product)}
            className={`w-full py-1.5 rounded-lg text-xs font-bold transition-colors ${
              isOutOfStock
                ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                : "bg-slate-900 text-white hover:bg-slate-800"
            }`}
          >
            {isOutOfStock ? "Sold Out" : "Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
}
