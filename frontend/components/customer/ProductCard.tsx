"use client";

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { Product } from '@/lib/types';
import { ShoppingCart, FileText, AlertCircle, Check } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart, cartItems } = useCart();
  
  const discount = product.mrp > product.price 
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;

  const cartItem = cartItems.find(item => item.product.id === product.id);
  const qtyInCart = cartItem ? cartItem.quantity : 0;
  const isOutOfStock = product.stock_qty <= 0;
  const isMaxedOut = qtyInCart >= product.stock_qty;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating to detail page when clicking add button
    addToCart(product);
  };

  return (
    <div className="group relative bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden hover:border-teal-500/30 transition-all duration-300 flex flex-col justify-between hover:shadow-xl hover:shadow-teal-500/2">
      {/* Product Link wrapper */}
      <Link href={`/products/${product.id}`} className="block flex-grow p-5">
        {/* Badges container */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
          {discount > 0 && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black text-slate-950 bg-teal-400">
              {discount}% OFF
            </span>
          )}
          {product.requires_rx && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-teal-400 bg-teal-500/10 border border-teal-500/20">
              <FileText className="h-3.5 w-3.5" />
              Rx Required
            </span>
          )}
        </div>

        {/* Product Image placeholder */}
        <div className="aspect-square w-full bg-slate-950/50 rounded-xl flex items-center justify-center text-slate-600 mb-4 overflow-hidden relative border border-slate-900 group-hover:border-slate-800 transition-colors">
          {product.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={product.image_url.startsWith('http') ? product.image_url : `${process.env.NEXT_PUBLIC_API_URL}${product.image_url}`} 
              alt={product.name}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                // If fails, replace with default text
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : null}
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/20 text-slate-700 font-medium uppercase text-xs tracking-wider">
            {product.brand}
          </div>
        </div>

        {/* Metadata */}
        <div className="space-y-1">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
            {product.brand}
          </span>
          <h3 className="font-bold text-slate-100 text-base line-clamp-1 group-hover:text-teal-400 transition-colors">
            {product.name}
          </h3>
          <p className="text-xs text-slate-400">
            Unit: {product.unit}
          </p>
        </div>

        {/* Stock warning */}
        {product.stock_qty <= product.low_stock_alert && product.stock_qty > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-amber-500 font-medium mt-2">
            <AlertCircle className="h-3.5 w-3.5" />
            Only {product.stock_qty} left in stock
          </div>
        )}
      </Link>

      {/* Pricing & Add to Cart (Fixed height base) */}
      <div className="p-5 pt-0 border-t border-slate-900/50 mt-auto flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-lg font-extrabold text-white">
            ₹{product.price.toFixed(2)}
          </span>
          {product.mrp > product.price && (
            <span className="text-xs text-slate-500 line-through">
              M.R.P. ₹{product.mrp.toFixed(2)}
            </span>
          )}
        </div>

        <div>
          {isOutOfStock ? (
            <span className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-900 text-slate-600 block">
              Sold Out
            </span>
          ) : (
            <button
              onClick={handleAdd}
              disabled={isMaxedOut}
              className={`p-2.5 rounded-xl cursor-pointer transition-all duration-300 flex items-center justify-center ${
                isMaxedOut 
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-teal-400 hover:bg-teal-300 text-slate-950 hover:shadow-lg hover:shadow-teal-500/10'
              }`}
              title={isMaxedOut ? 'Max stock reached in cart' : 'Add to Cart'}
            >
              {isMaxedOut ? <Check className="h-5 w-5" /> : <ShoppingCart className="h-5 w-5" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
