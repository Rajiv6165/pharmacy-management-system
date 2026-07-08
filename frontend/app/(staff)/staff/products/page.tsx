"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { Product } from '@/lib/types';
import StaffNavigation from '@/components/staff/Navigation';
import { PlusCircle, Edit, RefreshCw, AlertTriangle, AlertCircle, Database, Search } from 'lucide-react';

export default function StaffInventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search query
  const [query, setQuery] = useState('');

  // Quick Restock form states
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [restockQty, setRestockQty] = useState<number>(10);
  const [restocking, setRestocking] = useState(false);

  const fetchInventory = async () => {
    try {
      // Fetch all products (for staff, we load active and inactive)
      // Since public route /products filters active only, we can search all
      // Let's call /products and we can filter or search
      const data = await apiFetch('/products');
      setProducts(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch inventory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleOpenRestock = (prod: Product) => {
    setRestockProduct(prod);
    setRestockQty(10);
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockProduct) return;
    setRestocking(true);
    setError('');

    try {
      await apiFetch(`/staff/products/${restockProduct.id}/restock`, {
        method: 'POST',
        body: { quantity: restockQty },
      });
      setRestockProduct(null);
      fetchInventory();
    } catch (err: any) {
      setError(err.message || 'Failed to restock product.');
    } finally {
      setRestocking(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.brand.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      <StaffNavigation />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white">Inventory Control</h1>
            <p className="mt-1 text-sm text-slate-400">
              Update drug listings, view catalog stock warnings, and log restocking units.
            </p>
          </div>
          <Link
            href="/staff/products/new"
            className="flex items-center gap-1.5 py-3.5 px-6 rounded-2xl text-xs font-bold text-slate-950 bg-violet-400 hover:bg-violet-300 transition-all cursor-pointer shadow-lg shadow-violet-500/10 self-start"
          >
            <PlusCircle className="h-4.5 w-4.5" />
            Add New Product
          </Link>
        </div>

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-450 text-sm rounded-2xl">
            {error}
          </div>
        )}

        {/* Filters and search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/30 border border-slate-900 rounded-3xl p-5 backdrop-blur-xl">
          <div className="relative w-full sm:max-w-md">
            <input
              type="text"
              placeholder="Search by name or brand..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="block w-full pl-10 pr-4 py-3 border border-slate-800 rounded-2xl bg-slate-950/40 text-slate-200 placeholder-slate-650 focus:outline-none focus:ring-2 focus:ring-violet-500/50 sm:text-xs"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-550">
              <Search className="h-4 w-4" />
            </div>
          </div>

          <button
            onClick={fetchInventory}
            className="p-3 border border-slate-800 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Inventory
          </button>
        </div>

        {/* Quick restock modal */}
        {restockProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-850 rounded-3xl p-8 w-full max-w-sm shadow-2xl relative">
              <button
                onClick={() => setRestockProduct(null)}
                className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white rounded-xl cursor-pointer"
              >
                Cancel
              </button>

              <h3 className="text-xl font-bold text-white mb-2">Restock Product</h3>
              <p className="text-xs text-slate-400 font-semibold mb-6 break-all">
                {restockProduct.name} ({restockProduct.brand})
              </p>

              <form onSubmit={handleRestockSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Quantity to Add
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={restockQty}
                    onChange={(e) => setRestockQty(parseInt(e.target.value) || 0)}
                    className="block w-full px-4 py-3 border border-slate-800 rounded-2xl bg-slate-950/40 text-slate-200 focus:ring-2 focus:ring-violet-500/50 sm:text-sm"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setRestockProduct(null)}
                    className="py-3 px-5 border border-slate-800 rounded-2xl text-sm font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={restocking}
                    className="py-3 px-6 bg-violet-400 hover:bg-violet-300 text-slate-950 font-bold text-sm rounded-2xl cursor-pointer disabled:opacity-50"
                  >
                    {restocking ? 'Updating...' : 'Confirm Restock'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Inventory list */}
        {loading ? (
          <div className="space-y-4">
            <div className="h-24 bg-slate-900/30 rounded-3xl animate-pulse" />
            <div className="h-24 bg-slate-900/30 rounded-3xl animate-pulse" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-20 text-center rounded-3xl border border-dashed border-slate-800 bg-slate-900/10 space-y-4">
            <div className="p-4 bg-slate-900/50 rounded-full inline-block text-slate-650">
              <Database className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-350">No Inventory Found</h3>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProducts.map((prod) => {
              const isLowStock = prod.stock_qty <= prod.low_stock_alert;
              const isOutOfStock = prod.stock_qty <= 0;

              return (
                <div
                  key={prod.id}
                  className={`p-6 rounded-3xl bg-slate-900/15 border transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 ${
                    isOutOfStock 
                      ? 'border-rose-500/10 bg-rose-950/2'
                      : isLowStock 
                        ? 'border-amber-500/10 bg-amber-950/2'
                        : 'border-slate-900 hover:border-slate-850'
                  }`}
                >
                  {/* Info */}
                  <div className="space-y-2 max-w-[60%]">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                        {prod.brand}
                      </span>
                      {prod.requires_rx && (
                        <span className="px-1.5 py-0.5 bg-violet-500/10 text-violet-400 border border-violet-500/20 text-[9px] font-bold rounded uppercase">
                          Rx Required
                        </span>
                      )}
                      {!prod.is_active && (
                        <span className="px-1.5 py-0.5 bg-slate-950 border border-slate-800 text-slate-600 text-[9px] font-bold rounded uppercase">
                          Inactive
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/staff/products/${prod.id}`}
                      className="font-bold text-slate-100 hover:text-violet-400 transition-colors text-base block line-clamp-1"
                    >
                      {prod.name}
                    </Link>
                    <p className="text-xs text-slate-450 leading-relaxed font-medium">
                      Unit Packaging: {prod.unit} · Sell Price: ₹{prod.price.toFixed(2)} · MRP: ₹{prod.mrp.toFixed(2)}
                    </p>
                  </div>

                  {/* Stock level indicators & actions */}
                  <div className="flex items-center justify-between md:justify-end gap-6 border-t border-slate-900/60 md:border-0 pt-4 md:pt-0">
                    <div className="flex items-center gap-3">
                      {isOutOfStock ? (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold rounded-xl">
                          <AlertCircle className="h-4 w-4" />
                          Out of Stock
                        </span>
                      ) : isLowStock ? (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold rounded-xl">
                          <AlertTriangle className="h-4 w-4 animate-bounce" />
                          Low Stock Alert ({prod.stock_qty} left)
                        </span>
                      ) : (
                        <span className="px-3 py-1.5 bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-bold rounded-xl">
                          Healthy ({prod.stock_qty} left)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleOpenRestock(prod)}
                        className="py-2.5 px-4 bg-slate-950 border border-slate-900 hover:border-violet-500/20 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
                      >
                        Restock
                      </button>
                      <Link
                        href={`/staff/products/${prod.id}`}
                        className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl transition-all cursor-pointer"
                        title="Edit metadata"
                      >
                        <Edit className="h-4.5 w-4.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
