"use client";

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { Product } from '@/lib/types';
import { ShoppingCart, FileText, AlertCircle, Check } from 'lucide-react';
import ProductImage from '@/components/customer/ProductImage';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart, cartItems } = useCart();
  
  const discount = Number(product.mrp) > Number(product.price) 
    ? Math.round(((Number(product.mrp) - Number(product.price)) / Number(product.mrp)) * 100)
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
    <div className="group relative bg-white border border-primary-dark/15 rounded-lg transition-all duration-300 flex flex-col justify-between p-5 hover:border-accent/40 hover:shadow-md">
      {/* Category corner tab & Discount label */}
      <div className="absolute top-0 right-4 z-10">
        {product.requires_rx ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-b text-[10px] font-mono font-bold uppercase tracking-wider text-primary-dark bg-highlight border-x border-b border-primary-dark/10">
            <FileText className="h-3 w-3" />
            Rx Req
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-1 rounded-b text-[10px] font-mono font-bold uppercase tracking-wider text-white bg-accent border-x border-b border-primary-dark/10">
            OTC
          </span>
        )}
      </div>

      {/* Product Link wrapper */}
      <Link href={`/products/${product.id}`} className="block flex-grow">
        {/* Brand label */}
        <span className="text-[10px] font-mono font-bold text-accent uppercase tracking-wider block mb-1">
          {product.brand}
        </span>
        
        {/* Product Title */}
        <h3 className="font-sans font-bold text-ink text-base line-clamp-1 group-hover:text-accent transition-colors leading-tight pr-16 mb-3">
          {product.name}
        </h3>

        {/* Product Image Wrapper */}
        <div className="aspect-video w-full bg-paper/30 rounded border border-primary-dark/10 mb-4 overflow-hidden relative group-hover:border-primary-dark/20 transition-colors">
          <ProductImage src={product.image_url} alt={product.name} brand={product.brand} />
        </div>

        {/* Unit and Stock Details */}
        <div className="space-y-1.5">
          <p className="text-xs font-mono text-ink/60">
            UNIT: <span className="font-bold text-ink/80">{product.unit}</span>
          </p>

          {/* Stock warning */}
          {product.stock_qty <= product.low_stock_alert && product.stock_qty > 0 ? (
            <div className="flex items-center gap-1 text-[11px] font-mono text-highlight font-bold">
              <AlertCircle className="h-3 w-3" />
              <span>STOCK: ONLY {product.stock_qty} LEFT</span>
            </div>
          ) : isOutOfStock ? (
            <div className="flex items-center gap-1 text-[11px] font-mono text-rose-600 font-bold">
              <AlertCircle className="h-3 w-3" />
              <span>OUT OF STOCK</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[11px] font-mono text-accent">
              <span>STOCK: AVAILABLE ({product.stock_qty})</span>
            </div>
          )}
        </div>
      </Link>

      {/* Prescription-label perforated tear strip */}
      <div className="relative my-4 flex items-center">
        {/* Left half-circle notch — sits flush on card left edge */}
        <div className="absolute -left-5 w-4 h-4 rounded-full bg-paper border border-primary-dark/15 flex-shrink-0" />
        {/* Dashed perforation line */}
        <div className="flex-1 border-t-2 border-dashed border-primary-dark/15 mx-2" />
        {/* Right half-circle notch — sits flush on card right edge */}
        <div className="absolute -right-5 w-4 h-4 rounded-full bg-paper border border-primary-dark/15 flex-shrink-0" />
      </div>

      {/* Pricing & Add to Cart */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-mono font-bold text-primary-dark">
              ₹{Number(product.price).toFixed(2)}
            </span>
            {discount > 0 && (
              <span className="text-[10px] font-mono font-bold text-accent bg-accent/10 px-1 rounded">
                -{discount}%
              </span>
            )}
          </div>
          {Number(product.mrp) > Number(product.price) && (
            <span className="text-xxs font-mono text-ink/40 line-through">
              MRP: ₹{Number(product.mrp).toFixed(2)}
            </span>
          )}
        </div>

        <div>
          {isOutOfStock ? (
            <span className="text-[11px] font-mono font-bold px-2.5 py-1.5 rounded border border-primary-dark/10 bg-paper/40 text-ink/45 select-none">
              SOLD OUT
            </span>
          ) : (
            <button
              onClick={handleAdd}
              disabled={isMaxedOut}
              className={`p-2 rounded cursor-pointer transition-colors flex items-center justify-center border border-primary-dark/10 ${
                isMaxedOut 
                  ? 'bg-paper text-ink/30 cursor-not-allowed'
                  : 'bg-accent hover:bg-accent/90 text-white shadow-sm'
              }`}
              title={isMaxedOut ? 'Max stock reached in cart' : 'Add to Cart'}
            >
              {isMaxedOut ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
