"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import CustomerNavigation from '@/components/customer/Navigation';
import { Trash2, Plus, Minus, ArrowRight, FileText, ShoppingBag, Activity } from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { cartItems, cartTotal, requiresRx, updateQuantity, removeFromCart } = useCart();

  const handleCheckoutRedirect = () => {
    if (user) {
      router.push('/checkout');
    } else {
      router.push('/login?redirect=checkout');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-paper text-ink font-sans">
      <CustomerNavigation />

      <main className="flex-grow max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="border-b border-primary-dark/10 pb-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShoppingBag className="h-4 w-4 text-accent" />
                <span className="text-[10px] font-mono font-bold text-accent uppercase tracking-widest">
                  PURCHASE ORDER
                </span>
              </div>
              <h1 className="text-3xl font-bold font-serif tracking-tight text-primary-dark sm:text-4xl">
                Shopping Cart
              </h1>
              <p className="mt-1.5 text-xs text-ink/65 font-sans">
                Review your selected medicines and adjust quantities before placing the order.
              </p>
            </div>
            {cartItems.length > 0 && (
              <div className="flex-shrink-0 text-right">
                <span className="text-[10px] font-mono font-bold text-ink/40 uppercase tracking-wider block">Items</span>
                <span className="text-2xl font-mono font-bold text-primary-dark">
                  {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
                </span>
              </div>
            )}
          </div>
        </div>

        {cartItems.length === 0 ? (
          <div className="p-20 text-center rounded bg-white border border-primary-dark/15 space-y-4 shadow-xxs">
            <div className="p-4 bg-paper rounded-full inline-block text-accent border border-primary-dark/10">
              <ShoppingBag className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-bold font-serif text-primary-dark">Your Cart is Empty</h3>
            <p className="text-xs text-ink/60 max-w-xs mx-auto">
              It looks like you haven't added any products to your cart yet. Explore our medicines catalog to get started.
            </p>
            <div className="pt-2">
              <Link
                href="/products"
                className="inline-block py-2.5 px-5 bg-accent hover:bg-accent/90 text-white rounded text-xs font-bold transition-all shadow-sm"
              >
                Browse Medicines
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Cart Items (Left) */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => {
                const maxStock = item.product.stock_qty;
                const isMaxReached = item.quantity >= maxStock;
                const discount = Number(item.product.mrp) > Number(item.product.price) 
                  ? Math.round(((Number(item.product.mrp) - Number(item.product.price)) / Number(item.product.mrp)) * 100)
                  : 0;

                  return (
                   <div key={item.product.id}>
                    <div
                      className="p-5 rounded-t bg-white border border-primary-dark/15 hover:border-accent/30 transition-colors flex items-center justify-between gap-4 shadow-xxs"
                    >
                      {/* Item details */}
                      <div className="flex-grow space-y-1.5 max-w-[60%]">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold text-accent uppercase tracking-wider">
                            {item.product.brand}
                          </span>
                          {item.product.requires_rx && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-primary-dark bg-highlight border border-primary-dark/10 uppercase">
                              <FileText className="h-3 w-3" />
                              Rx
                            </span>
                          )}
                        </div>
                        <Link
                          href={`/products/${item.product.id}`}
                          className="font-serif font-bold text-primary-dark hover:text-accent transition-colors text-base block line-clamp-1"
                        >
                          {item.product.name}
                        </Link>
                        <p className="text-[10px] text-ink/55 font-mono">
                          UNIT: <span className="font-bold text-ink/75">{item.product.unit}</span>
                          &nbsp;·&nbsp;
                          <span className="text-primary-dark font-bold">₹{Number(item.product.price).toFixed(2)}</span>
                          &nbsp;/ unit
                        </p>
                      </div>

                      {/* Quantity selectors */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center border border-primary-dark/15 rounded bg-paper/30 p-0.5">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="p-1 rounded text-ink/75 hover:text-primary-dark hover:bg-paper/85 transition-colors cursor-pointer"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="px-3 text-xs font-mono font-bold text-primary-dark select-none">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            disabled={isMaxReached}
                            className="p-1 rounded text-ink/75 hover:text-primary-dark hover:bg-paper/85 disabled:opacity-25 disabled:cursor-not-allowed transition-colors cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.product.id)}
                          className="p-2 text-ink/40 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </div>

                      {/* Total Price */}
                      <div className="text-right min-w-[70px]">
                        <span className="font-mono font-bold text-primary-dark text-base block">
                          ₹{(Number(item.product.price) * item.quantity).toFixed(2)}
                        </span>
                        {discount > 0 && (
                          <span className="text-[10px] font-mono text-accent font-bold block">
                            Saved {discount}%
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Prescription label perforated bottom edge */}
                    <div className="relative flex items-center bg-white border-x border-b border-dashed border-primary-dark/15 rounded-b px-5 py-0">
                      <div className="absolute -left-2 w-4 h-4 rounded-full bg-paper border border-primary-dark/15 flex-shrink-0" />
                      <div className="flex-1 border-t-0" />
                      <div className="absolute -right-2 w-4 h-4 rounded-full bg-paper border border-primary-dark/15 flex-shrink-0" />
                    </div>
                   </div>
                  );
              })}
            </div>

            {/* Summary & Checkout Actions (Right) */}
            <div className="space-y-6">
              <div className="bg-white border border-primary-dark/15 rounded-lg overflow-hidden shadow-xxs">
                {/* Ledger header strip */}
                <div className="bg-primary-dark/5 border-b border-primary-dark/10 px-6 py-3 flex items-center justify-between">
                  <h3 className="text-xs font-mono font-bold text-primary-dark uppercase tracking-wider">
                    Order Summary
                  </h3>
                  <span className="text-[10px] font-mono text-ink/40">DRAFT RECEIPT</span>
                </div>
                <div className="p-6 space-y-6">

                {/* Sub-totals list */}
                <div className="space-y-3">
                  <div className="flex justify-between text-xs text-ink/70 font-sans">
                    <span>Items Count</span>
                    <span className="font-mono font-bold text-primary-dark">
                      {cartItems.reduce((acc, item) => acc + item.quantity, 0)} units
                    </span>
                  </div>
                  <hr className="border-primary-dark/10" />
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-ink/70 font-medium font-sans">Grand Total</span>
                    <span className="text-2xl font-mono font-bold text-accent">
                      ₹{Number(cartTotal).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Rx Warning Banner */}
                {requiresRx && (
                  <div className="p-4 bg-highlight/10 border border-highlight/20 rounded flex items-start gap-3">
                    <FileText className="h-4.5 w-4.5 text-highlight flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="text-xs font-serif font-bold text-primary-dark">Prescription Required</h4>
                      <p className="text-[10px] text-ink/65 leading-relaxed font-sans">
                        Your cart contains prescription-only items. You will need to upload a doctor prescription PDF or image file during checkout.
                      </p>
                    </div>
                  </div>
                )}

                {/* Checkout Trigger */}
                <button
                  onClick={handleCheckoutRedirect}
                  className="w-full flex items-center justify-center gap-2 py-3 px-6 border border-transparent rounded text-sm font-sans font-bold text-white bg-accent hover:bg-accent/90 transition-colors shadow-sm cursor-pointer"
                >
                  Proceed to Checkout
                  <ArrowRight className="h-4 w-4" />
                </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mini Footer */}
      <footer className="border-t border-primary-dark/10 bg-primary-dark py-8 text-paper/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs flex items-center justify-center gap-2">
          <Activity className="h-4 w-4 text-highlight" />
          <span>{process.env.NEXT_PUBLIC_BRAND_NAME || 'Pharmacy'} Pharmacy Shop Cart · 2026</span>
        </div>
      </footer>
    </div>
  );
}
