"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { Order } from '@/lib/types';
import CustomerNavigation from '@/components/customer/Navigation';
import { ShoppingBag, Calendar, CreditCard, ChevronRight, Activity, Clock } from 'lucide-react';

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await apiFetch('/orders/my');
        setOrders(data);
      } catch (err: any) {
        setError(err.message || 'Failed to retrieve order history.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
      rx_pending: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
      confirmed: 'bg-teal-500/10 border-teal-500/20 text-teal-400',
      preparing: 'bg-sky-500/10 border-sky-500/20 text-sky-400',
      out_for_delivery: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
      ready_for_pickup: 'bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-400',
      completed: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
      cancelled: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
    };

    const labels: Record<string, string> = {
      pending: 'Pending Payment',
      rx_pending: 'Awaiting Rx Approval',
      confirmed: 'Confirmed',
      preparing: 'Preparing Meds',
      out_for_delivery: 'Out for Delivery',
      ready_for_pickup: 'Ready for Pickup',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };

    return (
      <span className={`inline-flex items-center gap-1 border px-2.5 py-1 rounded-xl text-xxs font-extrabold ${styles[status] || 'bg-slate-500/10 text-slate-400'}`}>
        <Clock className="h-3 w-3" />
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      <CustomerNavigation />

      <main className="flex-grow max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Order History</h1>
          <p className="mt-2 text-sm text-slate-400 font-medium">
            Monitor active order tracking states and review your past orders.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-2xl">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            <div className="h-28 bg-slate-900/30 rounded-3xl animate-pulse" />
            <div className="h-28 bg-slate-900/30 rounded-3xl animate-pulse" />
          </div>
        ) : orders.length === 0 ? (
          <div className="p-16 text-center rounded-3xl border border-dashed border-slate-800 bg-slate-900/10 space-y-4">
            <div className="p-4 bg-slate-900/50 rounded-full inline-block text-slate-600">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-300 font-medium">No Orders Placed Yet</h3>
            <p className="text-sm text-slate-500 max-w-xs mx-auto">
              Your active and completed orders will appear here. Start shopping our catalog.
            </p>
            <div className="pt-2">
              <Link
                href="/products"
                className="py-2.5 px-6 bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold rounded-xl text-xs"
              >
                Go to Shop
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="p-6 rounded-3xl bg-slate-900/20 border border-slate-900 hover:border-slate-850 transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-6"
              >
                {/* Details */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-extrabold text-white">
                      Order #{order.id}
                    </span>
                    {getStatusBadge(order.status)}
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-slate-600" />
                      {new Date(order.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <CreditCard className="h-4 w-4 text-slate-600" />
                      {order.payment_method.toUpperCase()} ({order.payment_status})
                    </span>
                  </div>

                  {/* Summary of items */}
                  <div className="text-xs text-slate-400 leading-relaxed font-semibold">
                    {order.items.map((it) => `${it.product_name} (x${it.quantity})`).join(', ')}
                  </div>
                </div>

                {/* Pricing & Link */}
                <div className="flex items-center justify-between sm:justify-end gap-6 border-t border-slate-900 sm:border-0 pt-4 sm:pt-0">
                  <div className="text-left sm:text-right">
                    <span className="text-xxs text-slate-500 font-bold uppercase tracking-wider block">
                      Total Paid
                    </span>
                    <span className="text-lg font-black text-teal-400">
                      ₹{Number(order.total_amount).toFixed(2)}
                    </span>
                  </div>
                  <Link
                    href={`/orders/${order.id}`}
                    className="flex items-center gap-1 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-300 hover:text-white border border-slate-800 hover:bg-slate-900 transition-all"
                  >
                    Track Order
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-600 flex items-center justify-center gap-2">
          <Activity className="h-4 w-4 text-teal-400/50" />
          <span>AetherRx Track Orders · 2026</span>
        </div>
      </footer>
    </div>
  );
}
