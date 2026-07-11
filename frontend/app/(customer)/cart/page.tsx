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
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      <CustomerNavigation />

      <main className="flex-grow max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Shopping Cart
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Review your selected medicines and adjust quantities before placing the order.
          </p>
        </div>

        {cartItems.length === 0 ? (
          <div className="p-20 text-center rounded-3xl border border-dashed border-slate-800 bg-slate-900/10 space-y-4">
            <div className="p-4 bg-slate-900/50 rounded-full inline-block text-slate-600">
              <ShoppingBag className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-300">Your Cart is Empty</h3>
            <p className="text-sm text-slate-500 max-w-xs mx-auto">
              It looks like you haven't added any products to your cart yet. Explore our medicines catalog to get started.
            </p>
            <div className="pt-2">
              <Link
                href="/products"
                className="inline-block py-3 px-6 bg-teal-400 hover:bg-teal-300 text-slate-950 rounded-xl text-sm font-bold transition-all shadow-md shadow-teal-500/10"
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
                  <div
                    key={item.product.id}
                    className="p-5 rounded-2xl bg-slate-900/20 border border-slate-900 hover:border-slate-850 transition-all flex items-center justify-between gap-4"
                  >
                    {/* Item details */}
                    <div className="flex-grow space-y-1.5 max-w-[60%]">
                      <div className="flex items-center gap-2">
                        <span className="text-xxs text-slate-500 font-bold uppercase tracking-wider">
                          {item.product.brand}
                        </span>
                        {item.product.requires_rx && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xxs font-semibold text-teal-400 bg-teal-500/10 border border-teal-500/20">
                            <FileText className="h-3 w-3" />
                            Rx
                          </span>
                        )}
                      </div>
                      <Link
                        href={`/products/${item.product.id}`}
                        className="font-bold text-slate-100 hover:text-teal-400 transition-colors text-base block line-clamp-1"
                      >
                        {item.product.name}
                      </Link>
                      <p className="text-xs text-slate-400">
                        Unit: {item.product.unit} · ₹{Number(item.product.price).toFixed(2)}/unit
                      </p>
                    </div>

                    {/* Quantity selectors */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border border-slate-850 rounded-xl bg-slate-950/20 p-1">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-slate-900 transition-all cursor-pointer"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="px-3 text-sm font-bold text-white select-none">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          disabled={isMaxReached}
                          className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Total Price */}
                    <div className="text-right min-w-[70px]">
                      <span className="font-extrabold text-white text-base block">
                        ₹{(Number(item.product.price) * item.quantity).toFixed(2)}
                      </span>
                      {discount > 0 && (
                        <span className="text-xxs text-teal-400 font-bold block">
                          Saved {discount}%
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary & Checkout Actions (Right) */}
            <div className="space-y-6">
              <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-6 space-y-6 backdrop-blur-xl">
                <h3 className="text-lg font-bold text-white border-b border-slate-900 pb-3">
                  Order Summary
                </h3>

                {/* Sub-totals list */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm text-slate-400">
                    <span>Items Count</span>
                    <span className="font-bold text-slate-200">
                      {cartItems.reduce((acc, item) => acc + item.quantity, 0)} items
                    </span>
                  </div>
                  <hr className="border-slate-900" />
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-slate-400 font-medium">Grand Total</span>
                    <span className="text-2xl font-black text-teal-400">
                      ₹{Number(cartTotal).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Rx Warning Banner */}
                {requiresRx && (
                  <div className="p-4 bg-teal-500/10 border border-teal-500/20 rounded-2xl flex items-start gap-3">
                    <FileText className="h-5 w-5 text-teal-400 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-white">Prescription Upload Required</h4>
                      <p className="text-xxs text-slate-400 leading-normal">
                        Your cart contains prescription-only items. You will need to upload a doctor prescription PDF or image file during checkout.
                      </p>
                    </div>
                  </div>
                )}

                {/* Checkout Trigger */}
                <button
                  onClick={handleCheckoutRedirect}
                  className="w-full flex items-center justify-center gap-2 py-4 px-6 border border-transparent rounded-2xl text-sm font-extrabold text-slate-950 bg-teal-400 hover:bg-teal-300 transition-all duration-300 shadow-lg shadow-teal-500/20 cursor-pointer"
                >
                  Proceed to Checkout
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mini Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-600 flex items-center justify-center gap-2">
          <Activity className="h-4 w-4 text-teal-400/50" />
          <span>{process.env.NEXT_PUBLIC_BRAND_NAME || 'Pharmacy'} Pharmacy Shop Cart · 2026</span>
        </div>
      </footer>
    </div>
  );
}
