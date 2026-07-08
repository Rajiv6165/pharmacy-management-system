"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { DashboardSummary, Product } from '@/lib/types';
import StaffNavigation from '@/components/staff/Navigation';
import { 
  ClipboardList, DollarSign, FileText, AlertTriangle, 
  ArrowRight, Package, PlusCircle, Database, ShieldCheck 
} from 'lucide-react';

export default function StaffDashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      const [sumData, stockData] = await Promise.all([
        apiFetch('/admin/dashboard/summary'),
        apiFetch('/staff/inventory/low-stock'),
      ]);
      setSummary(sumData);
      setLowStock(stockData);
    } catch (err: any) {
      setError(err.message || 'Failed to load operational statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      <StaffNavigation />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-white tracking-wide">
              Operations Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-400 font-medium">
              Real-time monitoring of pharmacy orders, inventories, and prescriptions.
            </p>
          </div>
          <button
            onClick={() => {
              setLoading(true);
              fetchDashboardData();
            }}
            className="text-xs font-bold text-violet-400 hover:text-white border border-slate-800 rounded-xl px-4 py-2 hover:bg-slate-900 transition-all cursor-pointer"
          >
            Refresh Data
          </button>
        </div>

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-405 text-sm rounded-2xl">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-32 bg-slate-900/30 rounded-3xl animate-pulse" />
            <div className="h-32 bg-slate-900/30 rounded-3xl animate-pulse" />
            <div className="h-32 bg-slate-900/30 rounded-3xl animate-pulse" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Today's Orders */}
              <div className="bg-slate-900/25 border border-slate-900 rounded-3xl p-6 flex items-center gap-5 backdrop-blur-xl">
                <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-400 border border-blue-500/10">
                  <ClipboardList className="h-7 w-7" />
                </div>
                <div>
                  <span className="text-xxs font-bold text-slate-500 uppercase tracking-widest block">
                    Today's Orders
                  </span>
                  <span className="text-3xl font-black text-white">
                    {summary?.today_orders_count || 0}
                  </span>
                </div>
              </div>

              {/* Today's Revenue */}
              <div className="bg-slate-900/25 border border-slate-900 rounded-3xl p-6 flex items-center gap-5 backdrop-blur-xl">
                <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-455 border border-emerald-500/10">
                  <DollarSign className="h-7 w-7" />
                </div>
                <div>
                  <span className="text-xxs font-bold text-slate-500 uppercase tracking-widest block">
                    Today's Revenue
                  </span>
                  <span className="text-3xl font-black text-white">
                    ₹{Number(summary?.today_revenue || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Pending prescriptions */}
              <div className="bg-slate-900/25 border border-slate-900 rounded-3xl p-6 flex items-center gap-5 backdrop-blur-xl">
                <div className={`p-4 rounded-2xl border ${
                  (summary?.pending_rx_count || 0) > 0
                    ? 'bg-violet-500/10 text-violet-400 border-violet-500/20 animate-pulse'
                    : 'bg-slate-900/40 text-slate-500 border-slate-800'
                }`}>
                  <FileText className="h-7 w-7" />
                </div>
                <div>
                  <span className="text-xxs font-bold text-slate-500 uppercase tracking-widest block">
                    Pending Rx Approvals
                  </span>
                  <span className="text-3xl font-black text-white">
                    {summary?.pending_rx_count || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Low Stock Alerts banner */}
            {lowStock.length > 0 && (
              <div className="p-6 rounded-3xl bg-amber-500/5 border border-amber-500/20 backdrop-blur-md space-y-4">
                <div className="flex items-center gap-2 text-amber-500 font-bold">
                  <AlertTriangle className="h-5.5 w-5.5" />
                  <h3>Low Stock Inventory Warning ({lowStock.length} items)</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {lowStock.map((prod) => (
                    <div key={prod.id} className="p-4 bg-slate-950/40 rounded-2xl border border-slate-900 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-slate-200 block">{prod.name}</span>
                        <span className="text-slate-500 font-medium">Alert Threshold: {prod.low_stock_alert} units</span>
                      </div>
                      <span className="font-black text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-xl">
                        {prod.stock_qty} left
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions Panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              {/* Operational Tools */}
              <div className="bg-slate-900/10 border border-slate-900 rounded-3xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Quick Staff Actions
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Link
                    href="/staff/orders"
                    className="p-5 rounded-2xl bg-slate-950/40 border border-slate-900 hover:border-violet-500/20 flex flex-col justify-between h-28 group transition-all"
                  >
                    <ClipboardList className="h-6 w-6 text-violet-400" />
                    <span className="font-bold text-sm text-slate-200 group-hover:text-violet-400 transition-colors flex items-center justify-between">
                      Verify Rx Queue
                      <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Link>

                  <Link
                    href="/staff/products"
                    className="p-5 rounded-2xl bg-slate-950/40 border border-slate-900 hover:border-violet-500/20 flex flex-col justify-between h-28 group transition-all"
                  >
                    <Database className="h-6 w-6 text-violet-400" />
                    <span className="font-bold text-sm text-slate-200 group-hover:text-violet-400 transition-colors flex items-center justify-between">
                      Manage Stock
                      <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Link>
                </div>
              </div>

              {/* Administrative Actions */}
              <div className="bg-slate-900/10 border border-slate-900 rounded-3xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Inventory & Account Controls
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Link
                    href="/staff/products/new"
                    className="p-5 rounded-2xl bg-slate-950/40 border border-slate-900 hover:border-violet-500/20 flex flex-col justify-between h-28 group transition-all"
                  >
                    <PlusCircle className="h-6 w-6 text-violet-400" />
                    <span className="font-bold text-sm text-slate-200 group-hover:text-violet-400 transition-colors flex items-center justify-between">
                      Add New Medicine
                      <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Link>

                  <div className="p-5 rounded-2xl bg-violet-950/5 border border-violet-900/10 flex flex-col justify-between h-28">
                    <ShieldCheck className="h-6 w-6 text-violet-400" />
                    <p className="text-xxs text-slate-500 font-medium">
                      All drug actions logged in inventory trails for audits.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
