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
    <div className="flex flex-col min-h-screen bg-paper text-ink font-sans">
      <StaffNavigation />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-serif text-primary-dark tracking-tight">
              Operations Dashboard
            </h1>
            <p className="mt-1 text-xs text-ink/70">
              Real-time monitoring of pharmacy orders, inventories, and prescriptions.
            </p>
          </div>
          <button
            onClick={() => {
              setLoading(true);
              fetchDashboardData();
            }}
            className="text-xs font-sans font-bold text-ink hover:bg-paper border border-primary-dark/20 bg-white rounded px-4 py-2 transition-colors cursor-pointer shadow-xxs"
          >
            Refresh Data
          </button>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-600 text-xs rounded font-mono uppercase tracking-wider">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-32 bg-white border border-primary-dark/10 rounded animate-pulse" />
            <div className="h-32 bg-white border border-primary-dark/10 rounded animate-pulse" />
            <div className="h-32 bg-white border border-primary-dark/10 rounded animate-pulse" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Today's Orders */}
              <div className="bg-white border border-primary-dark/15 rounded p-6 flex items-center gap-5 shadow-xxs">
                <div className="p-4 bg-accent/10 rounded border border-accent/20 text-accent">
                  <ClipboardList className="h-7 w-7" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-accent uppercase tracking-wider block mb-0.5">
                    Today's Orders
                  </span>
                  <span className="text-3xl font-mono font-bold text-primary-dark">
                    {summary?.today_orders_count || 0}
                  </span>
                </div>
              </div>

              {/* Today's Revenue */}
              <div className="bg-white border border-primary-dark/15 rounded p-6 flex items-center gap-5 shadow-xxs">
                <div className="p-4 bg-accent/10 rounded border border-accent/20 text-accent">
                  <DollarSign className="h-7 w-7" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-accent uppercase tracking-wider block mb-0.5">
                    Today's Revenue
                  </span>
                  <span className="text-3xl font-mono font-bold text-primary-dark">
                    ₹{Number(summary?.today_revenue || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Pending prescriptions */}
              <div className="bg-white border border-primary-dark/15 rounded p-6 flex items-center gap-5 shadow-xxs">
                <div className={`p-4 rounded border ${
                  (summary?.pending_rx_count || 0) > 0
                    ? 'bg-highlight/15 text-primary-dark border-highlight/30 animate-pulse'
                    : 'bg-paper/40 text-ink/40 border-primary-dark/10'
                }`}>
                  <FileText className="h-7 w-7" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-accent uppercase tracking-wider block mb-0.5">
                    Pending Rx Approvals
                  </span>
                  <span className="text-3xl font-mono font-bold text-primary-dark">
                    {summary?.pending_rx_count || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Low Stock Alerts banner */}
            {lowStock.length > 0 && (
              <div className="p-6 rounded bg-rose-50 border border-rose-200 space-y-4 shadow-xxs">
                <div className="flex items-center gap-2 text-rose-700 font-serif font-bold text-sm uppercase tracking-wider">
                  <AlertTriangle className="h-5 w-5" />
                  <h3>Low Stock Inventory Warning ({lowStock.length} items)</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {lowStock.map((prod) => (
                    <div key={prod.id} className="p-4 bg-white rounded border border-rose-200 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-serif font-bold text-primary-dark block text-sm leading-tight">{prod.name}</span>
                        <span className="text-ink/50 text-[10px] font-mono">THRESHOLD: {prod.low_stock_alert} units</span>
                      </div>
                      <span className="font-mono font-bold text-rose-700 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded">
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
              <div className="bg-white border border-primary-dark/15 rounded p-6 space-y-4 shadow-xxs">
                <h3 className="text-[10px] font-mono font-bold text-accent uppercase tracking-wider mb-2 block border-b border-primary-dark/10 pb-3">
                  Quick Staff Actions
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Link
                    href="/staff/orders"
                    className="p-5 rounded bg-paper/40 border border-primary-dark/10 hover:border-accent/40 flex flex-col justify-between h-28 group transition-colors shadow-xxs"
                  >
                    <ClipboardList className="h-6 w-6 text-accent" />
                    <span className="font-serif font-bold text-sm text-primary-dark group-hover:text-accent transition-colors flex items-center justify-between">
                      Verify Rx Queue
                      <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform text-accent" />
                    </span>
                  </Link>

                  <Link
                    href="/staff/products"
                    className="p-5 rounded bg-paper/40 border border-primary-dark/10 hover:border-accent/40 flex flex-col justify-between h-28 group transition-colors shadow-xxs"
                  >
                    <Database className="h-6 w-6 text-accent" />
                    <span className="font-serif font-bold text-sm text-primary-dark group-hover:text-accent transition-colors flex items-center justify-between">
                      Manage Stock
                      <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform text-accent" />
                    </span>
                  </Link>
                </div>
              </div>

              {/* Administrative Actions */}
              <div className="bg-white border border-primary-dark/15 rounded p-6 space-y-4 shadow-xxs">
                <h3 className="text-[10px] font-mono font-bold text-accent uppercase tracking-wider mb-2 block border-b border-primary-dark/10 pb-3">
                  Inventory & Account Controls
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Link
                    href="/staff/products/new"
                    className="p-5 rounded bg-paper/40 border border-primary-dark/10 hover:border-accent/40 flex flex-col justify-between h-28 group transition-colors shadow-xxs"
                  >
                    <PlusCircle className="h-6 w-6 text-accent" />
                    <span className="font-serif font-bold text-sm text-primary-dark group-hover:text-accent transition-colors flex items-center justify-between">
                      Add New Medicine
                      <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform text-accent" />
                    </span>
                  </Link>

                  <div className="p-5 rounded bg-paper/30 border border-primary-dark/10 flex flex-col justify-between h-28">
                    <ShieldCheck className="h-6 w-6 text-accent" />
                    <p className="text-[10px] text-ink/50 font-mono leading-relaxed">
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
