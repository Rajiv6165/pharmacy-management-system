"use client";

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { Product } from '@/lib/types';
import { Plus, Minus, ShoppingCart, Check } from 'lucide-react';

interface ProductDetailActionsProps {
  product: Product;
}

export default function ProductDetailActions({ product }: ProductDetailActionsProps) {
  const { addToCart, cartItems } = useCart();
  const [quantity, setQuantity] = useState(1);

  const cartItem = cartItems.find((item) => item.product.id === product.id);
  const qtyInCart = cartItem ? cartItem.quantity : 0;
  const isOutOfStock = product.stock_qty <= 0;
  const isMaxedOut = qtyInCart >= product.stock_qty;

  const handleIncrement = () => {
    setQuantity((prev) => Math.min(prev + 1, product.stock_qty - qtyInCart));
  };

  const handleDecrement = () => {
    setQuantity((prev) => Math.max(prev - 1, 1));
  };

  const handleAdd = () => {
    addToCart(product, quantity);
    setQuantity(1); // Reset counter
  };

  // Remaining available stock that isn't already added to the cart
  const availableStock = product.stock_qty - qtyInCart;

  return (
    <div className="space-y-6 pt-4 border-t border-slate-900">
      {isOutOfStock ? (
        <div className="p-4 bg-slate-900 border border-slate-800 text-slate-500 rounded-2xl font-bold text-center">
          Temporarily Out of Stock
        </div>
      ) : isMaxedOut ? (
        <div className="p-4 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-2xl font-bold text-center">
          All Available Units Added to Cart
        </div>
      ) : (
        <div className="space-y-4">
          {/* Quantity Selector */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Quantity
            </span>
            <div className="flex items-center border border-slate-800 rounded-2xl bg-slate-950/40 p-1">
              <button
                type="button"
                onClick={handleDecrement}
                disabled={quantity <= 1}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="px-5 font-bold text-white text-base select-none">
                {quantity}
              </span>
              <button
                type="button"
                onClick={handleIncrement}
                disabled={quantity >= availableStock}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              ({product.stock_qty} available in stock)
            </span>
          </div>

          {/* Add to Cart button */}
          <button
            onClick={handleAdd}
            className="w-full flex items-center justify-center gap-2 py-4 px-6 border border-transparent rounded-2xl text-sm font-extrabold text-slate-950 bg-teal-400 hover:bg-teal-300 transition-all duration-300 shadow-lg shadow-teal-500/20 cursor-pointer"
          >
            <ShoppingCart className="h-5 w-5" />
            Add to Cart (₹{(product.price * quantity).toFixed(2)})
          </button>
        </div>
      )}
    </div>
  );
}
