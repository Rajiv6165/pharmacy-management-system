"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { Order } from '@/lib/types';
import StaffNavigation from '@/components/staff/Navigation';
import { ClipboardList, Filter, Calendar, CreditCard, ChevronRight, Clock, ShieldAlert } from 'lucide-react';

export default function StaffOrderQueuePage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Status filter state
  const [statusFilter, setStatusFilter] = useState<string>('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const url = statusFilter ? `/staff/orders?status=${statusFilter}` : '/staff/orders';
      const data = await apiFetch(url);
      setOrders(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load order queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

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
      pending: 'Awaiting Payment',
      rx_pending: 'Rx Approval Needed',
      confirmed: 'Confirmed',
      preparing: 'Assembling',
      out_for_delivery: 'Out for Delivery',
      ready_for_pickup: 'Ready at Counter',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };

    return (
      <span className={`inline-flex items-center gap-1 border px-2.5 py-1 rounded-xl text-xxs font-extrabold ${styles[status] || 'bg-slate-505 text-slate-400'}`}>
        <Clock className="h-3 w-3" />
        {labels[status] || status}
      </span>
    );
  };

  const filterTabs = [
    { label: 'All Orders', value: '' },
    { label: 'Pending Approval', value: 'rx_pending' },
    { label: 'Awaiting Pay', value: 'pending' },
    { label: 'Confirmed', value: 'confirmed' },
    { label: 'Assembling', value: 'preparing' },
    { label: 'Transit / Counter', value: 'out_for_delivery' },
    { label: 'Completed', value: 'completed' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      <StaffNavigation />

      <main className="flex-grow max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-white">Order Queue</h1>
            <p className="mt-1 text-sm text-slate-400">
              Manage incoming prescriptions, advance delivery statuses, and fulfill checkout requests.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-2xl">
            {error}
          </div>
        )}

        {/* Filters bar */}
        <div className="flex flex-wrap gap-2 pb-2 overflow-x-auto">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === tab.value
                  ? 'bg-violet-400 text-slate-950 font-extrabold shadow-lg shadow-violet-500/10'
                  : 'bg-slate-900 text-slate-450 hover:bg-slate-800 hover:text-slate-200 border border-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Order Queue listing */}
        {loading ? (
          <div className="space-y-4">
            <div className="h-28 bg-slate-900/30 rounded-3xl animate-pulse" />
            <div className="h-28 bg-slate-900/30 rounded-3xl animate-pulse" />
          </div>
        ) : orders.length === 0 ? (
          <div className="p-20 text-center rounded-3xl border border-dashed border-slate-800 bg-slate-900/10 space-y-4">
            <div className="p-4 bg-slate-900/50 rounded-full inline-block text-slate-650">
              <ClipboardList className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-300">No Orders in Queue</h3>
            <p className="text-sm text-slate-500 max-w-xs mx-auto">
              There are no customer orders matching the selected status filters.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="p-6 rounded-3xl bg-slate-900/20 border border-slate-900 hover:border-slate-850 transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-6"
              >
                {/* Information */}
                <div className="space-y-2.5 max-w-[70%]">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-extrabold text-white">
                      Order #OR-{order.id}
                    </span>
                    {getStatusBadge(order.status)}
                    {order.requires_rx_check && (
                      <span className="px-2 py-0.5 bg-violet-500/10 text-violet-400 font-bold border border-violet-500/20 rounded text-[9px] uppercase tracking-wide">
                        Prescription Req.
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-slate-600" />
                      {new Date(order.created_at).toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <CreditCard className="h-4 w-4 text-slate-600" />
                      {order.payment_method.toUpperCase()} ({order.payment_status})
                    </span>
                  </div>

                  {/* List of items */}
                  <div className="text-xs text-slate-450 font-semibold leading-relaxed">
                    {order.items.map((it) => `${it.product_name} (x${it.quantity})`).join(', ')}
                  </div>
                </div>

                {/* Right side controls */}
                <div className="flex items-center justify-between sm:justify-end gap-6 border-t border-slate-900 sm:border-0 pt-4 sm:pt-0">
                  <div className="text-left sm:text-right">
                    <span className="text-xxs text-slate-550 font-bold uppercase tracking-wider block">
                      Revenue Val
                    </span>
                    <span className="text-lg font-black text-violet-400">
                      ₹{Number(order.total_amount).toFixed(2)}
                    </span>
                  </div>
                  <Link
                    href={`/staff/orders/${order.id}`}
                    className="flex items-center gap-1 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-300 hover:text-white border border-slate-800 hover:bg-slate-900 transition-all cursor-pointer"
                  >
                    Details & Action
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
