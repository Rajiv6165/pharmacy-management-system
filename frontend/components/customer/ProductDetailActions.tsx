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
    <div className="space-y-6 pt-4 border-t border-primary-dark/10">
      {isOutOfStock ? (
        <div className="p-4 bg-paper/40 border border-primary-dark/10 text-ink/45 rounded font-mono text-center text-xs uppercase tracking-wider">
          Temporarily Out of Stock
        </div>
      ) : isMaxedOut ? (
        <div className="p-4 bg-accent/10 border border-accent/15 text-accent rounded font-sans font-bold text-center text-xs">
          All Available Units Added to Cart
        </div>
      ) : (
        <div className="space-y-4">
          {/* Quantity Selector */}
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono font-bold text-accent uppercase tracking-wider">
              QUANTITY
            </span>
            <div className="flex items-center border border-primary-dark/15 rounded bg-paper/30 p-0.5">
              <button
                type="button"
                onClick={handleDecrement}
                disabled={quantity <= 1}
                className="p-1.5 rounded text-ink/70 hover:text-primary-dark hover:bg-paper/85 disabled:opacity-25 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="px-4 font-mono font-bold text-primary-dark text-base select-none">
                {quantity}
              </span>
              <button
                type="button"
                onClick={handleIncrement}
                disabled={quantity >= availableStock}
                className="p-1.5 rounded text-ink/70 hover:text-primary-dark hover:bg-paper/85 disabled:opacity-25 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <span className="text-[10px] font-mono text-ink/45">
              ({product.stock_qty} IN STOCK)
            </span>
          </div>

          {/* Add to Cart button */}
          <button
            onClick={handleAdd}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 border border-transparent rounded text-sm font-sans font-bold text-white bg-accent hover:bg-accent/90 transition-colors shadow-sm cursor-pointer"
          >
            <ShoppingCart className="h-4.5 w-4.5" />
            Add to Cart (₹{(Number(product.price) * quantity).toFixed(2)})
          </button>
        </div>
      )}
    </div>
  );
}
