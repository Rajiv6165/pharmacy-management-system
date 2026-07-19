"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { Order } from '@/lib/types';
import CustomerNavigation from '@/components/customer/Navigation';
import { ShoppingBag, Calendar, CreditCard, ChevronRight, Activity, Clock, CheckCircle2, Package, XCircle, FileText } from 'lucide-react';

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
      pending: 'bg-highlight/10 border-highlight/30 text-primary-dark',
      rx_pending: 'bg-highlight/15 border-highlight/40 text-primary-dark',
      confirmed: 'bg-accent/10 border-accent/20 text-accent',
      preparing: 'bg-accent/15 border-accent/25 text-accent',
      out_for_delivery: 'bg-accent/15 border-accent/25 text-accent',
      ready_for_pickup: 'bg-accent/10 border-accent/20 text-accent',
      completed: 'bg-accent/10 border-accent/20 text-accent',
      cancelled: 'bg-rose-50 border-rose-200 text-rose-600',
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

    // Contextual icon per status family
    const getIcon = (s: string) => {
      if (s === 'cancelled') return <XCircle className="h-3 w-3" />;
      if (s === 'completed') return <CheckCircle2 className="h-3 w-3" />;
      if (s === 'confirmed') return <CheckCircle2 className="h-3 w-3" />;
      if (s === 'rx_pending') return <FileText className="h-3 w-3" />;
      if (s === 'preparing' || s === 'out_for_delivery' || s === 'ready_for_pickup') return <Package className="h-3 w-3" />;
      return <Clock className="h-3 w-3" />;
    };

    return (
      <span className={`inline-flex items-center gap-1 border px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${styles[status] || 'bg-paper text-ink/40 border-primary-dark/10'}`}>
        {getIcon(status)}
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-paper text-ink font-sans">
      <CustomerNavigation />

      <main className="flex-grow max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Page header with ledger styling */}
        <div className="border-b border-primary-dark/10 pb-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Package className="h-4 w-4 text-accent" />
                <span className="text-[10px] font-mono font-bold text-accent uppercase tracking-widest">
                  ORDER LEDGER
                </span>
              </div>
              <h1 className="text-3xl font-bold font-serif text-primary-dark tracking-tight">Order History</h1>
              <p className="mt-1.5 text-xs text-ink/65 font-sans">
                Monitor active order tracking states and review your past orders.
              </p>
            </div>
            {orders.length > 0 && (
              <div className="flex-shrink-0 text-right">
                <span className="text-[10px] font-mono font-bold text-ink/40 uppercase tracking-wider block">Orders</span>
                <span className="text-2xl font-mono font-bold text-primary-dark">{orders.length}</span>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-600 text-xs rounded font-mono uppercase tracking-wider">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            <div className="h-28 bg-white border border-primary-dark/10 rounded animate-pulse" />
            <div className="h-28 bg-white border border-primary-dark/10 rounded animate-pulse" />
          </div>
        ) : orders.length === 0 ? (
          <div className="p-16 text-center rounded bg-white border border-primary-dark/15 space-y-4 shadow-xxs">
            <div className="p-4 bg-paper rounded-full inline-block text-accent border border-primary-dark/10">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold font-serif text-primary-dark">No Orders Placed Yet</h3>
            <p className="text-xs text-ink/60 max-w-xs mx-auto">
              Your active and completed orders will appear here. Start shopping our catalog.
            </p>
            <div className="pt-2">
              <Link
                href="/products"
                className="py-2 px-5 bg-accent hover:bg-accent/90 text-white rounded text-xs font-bold transition-all shadow-sm"
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
                className="p-6 rounded bg-white border border-primary-dark/15 hover:border-accent/30 transition-colors flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-xxs"
              >
                {/* Details */}
                <div className="space-y-2 flex-grow">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-mono font-bold text-primary-dark">
                      ORDER #{order.id}
                    </span>
                    {getStatusBadge(order.status)}
                  </div>

                  <div className="flex flex-wrap gap-4 text-[10px] text-ink/50 font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-accent" />
                      {new Date(order.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <span className="flex items-center gap-1 uppercase">
                      <CreditCard className="h-3.5 w-3.5 text-accent" />
                      {order.payment_method} · {order.payment_status}
                    </span>
                  </div>

                  {/* Summary of items */}
                  <div className="text-xs text-ink/75 leading-relaxed font-medium">
                    {order.items.map((it) => `${it.product_name} (x${it.quantity})`).join(', ')}
                  </div>
                </div>

                {/* Vertical perforation dividing elements */}
                <div className="hidden sm:block relative h-12 w-px mx-4">
                  <div className="absolute top-[-32px] left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-paper border border-primary-dark/15 z-10" />
                  <div className="absolute bottom-[-32px] left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-paper border border-primary-dark/15 z-10" />
                  <div className="border-l border-dashed border-primary-dark/15 h-full" />
                </div>

                {/* Pricing & Link */}
                <div className="flex items-center justify-between sm:justify-end gap-6 border-t border-primary-dark/10 sm:border-0 pt-4 sm:pt-0 min-w-[180px]">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] font-mono font-bold text-accent uppercase tracking-wider block mb-0.5">
                      TOTAL PAID
                    </span>
                    <span className="text-lg font-mono font-bold text-primary-dark">
                      ₹{Number(order.total_amount).toFixed(2)}
                    </span>
                  </div>
                  <Link
                    href={`/orders/${order.id}`}
                    className="flex items-center gap-1 py-2 px-3 border border-primary-dark/20 rounded text-xs font-sans font-bold text-ink hover:text-primary-dark hover:bg-paper transition-colors cursor-pointer"
                  >
                    Track Order
                    <ChevronRight className="h-3.5 w-3.5 text-accent" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-primary-dark/10 bg-primary-dark py-8 mt-12 text-paper/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs flex items-center justify-center gap-2">
          <Activity className="h-4 w-4 text-highlight" />
          <span>{process.env.NEXT_PUBLIC_BRAND_NAME || 'Pharmacy'} Track Orders · 2026</span>
        </div>
      </footer>
    </div>
  );
}
