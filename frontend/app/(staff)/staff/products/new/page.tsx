"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { Category } from '@/lib/types';
import StaffNavigation from '@/components/staff/Navigation';
import { ChevronLeft, PlusCircle, Sparkles, Activity } from 'lucide-react';

export default function AddProductPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [mrp, setMrp] = useState<number>(0);
  const [stockQty, setStockQty] = useState<number>(0);
  const [unit, setUnit] = useState('strip of 10');
  const [requiresRx, setRequiresRx] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [lowStockAlert, setLowStockAlert] = useState<number>(10);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await apiFetch('/categories');
        setCategories(data);
        if (data.length > 0) {
          setCategoryId(data[0].id.toString());
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load categories.');
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (price <= 0 || mrp <= 0) {
      setError('Price and MRP must be positive values.');
      return;
    }

    if (price > mrp) {
      setError('Selling price cannot exceed Maximum Retail Price (M.R.P).');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        name,
        brand,
        category_id: parseInt(categoryId),
        description: description.trim() || undefined,
        price,
        mrp,
        stock_qty: stockQty,
        unit,
        requires_rx: requiresRx,
        image_url: imageUrl.trim() || undefined,
        is_active: isActive,
        low_stock_alert: lowStockAlert,
      };

      await apiFetch('/staff/products', {
        method: 'POST',
        body: payload,
      });

      router.push('/staff/products');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to add the product.');
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      <StaffNavigation />

      <main className="flex-grow max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        {/* Back Link */}
        <div>
          <button
            onClick={() => router.push('/staff/products')}
            className="inline-flex items-center gap-1 text-sm font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Inventory
          </button>
        </div>

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-455 text-sm rounded-2xl">
            {error}
          </div>
        )}

        <div className="bg-slate-900/20 border border-slate-900 rounded-3xl p-8 backdrop-blur-xl space-y-8">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-violet-500/10 border border-violet-500/20 rounded-xl text-violet-400">
              <PlusCircle className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Add New Medicine</h2>
              <p className="text-xs text-slate-500 font-medium">
                Create a catalog listing and establish starting stock levels.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-10 bg-slate-950/40 rounded-xl" />
              <div className="h-24 bg-slate-950/40 rounded-xl" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Row 1: Name and Brand */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Medicine / Product Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Paracetamol 500mg"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full px-4 py-3 border border-slate-800 rounded-2xl bg-slate-950/40 text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50 sm:text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MediLabs"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="block w-full px-4 py-3 border border-slate-800 rounded-2xl bg-slate-950/40 text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50 sm:text-xs"
                  />
                </div>
              </div>

              {/* Row 2: Category and Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Product Category
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="block w-full px-4 py-3 border border-slate-800 rounded-2xl bg-slate-950/40 text-slate-350 focus:ring-2 focus:ring-violet-500/50 sm:text-xs cursor-pointer"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Packaging Unit
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. strip of 10, 100ml bottle"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="block w-full px-4 py-3 border border-slate-800 rounded-2xl bg-slate-950/40 text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50 sm:text-xs"
                  />
                </div>
              </div>

              {/* Row 3: Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Product Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Details about active ingredients, dosage specifications, etc."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="block w-full px-4 py-3 border border-slate-800 rounded-2xl bg-slate-950/40 text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50 sm:text-xs"
                />
              </div>

              {/* Row 4: Pricing and Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    MRP (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={mrp}
                    onChange={(e) => setMrp(parseFloat(e.target.value) || 0)}
                    className="block w-full px-4 py-3 border border-slate-800 rounded-2xl bg-slate-950/40 text-slate-200 focus:ring-2 focus:ring-violet-500/50 sm:text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Selling Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                    className="block w-full px-4 py-3 border border-slate-800 rounded-2xl bg-slate-950/40 text-slate-200 focus:ring-2 focus:ring-violet-500/50 sm:text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Initial Stock
                  </label>
                  <input
                    type="number"
                    required
                    value={stockQty}
                    onChange={(e) => setStockQty(parseInt(e.target.value) || 0)}
                    className="block w-full px-4 py-3 border border-slate-800 rounded-2xl bg-slate-950/40 text-slate-200 focus:ring-2 focus:ring-violet-500/50 sm:text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Low Stock Threshold
                  </label>
                  <input
                    type="number"
                    required
                    value={lowStockAlert}
                    onChange={(e) => setLowStockAlert(parseInt(e.target.value) || 0)}
                    className="block w-full px-4 py-3 border border-slate-800 rounded-2xl bg-slate-950/40 text-slate-200 focus:ring-2 focus:ring-violet-500/50 sm:text-xs"
                  />
                </div>
              </div>

              {/* Row 5: Image and Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Image URL <span className="text-slate-650">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. /uploads/tablet.png"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="block w-full px-4 py-3 border border-slate-800 rounded-2xl bg-slate-950/40 text-slate-200 focus:ring-2 focus:ring-violet-500/50 sm:text-xs"
                  />
                </div>

                {/* Toggles */}
                <div className="flex items-center gap-6 sm:col-span-2 pb-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="requiresRx"
                      checked={requiresRx}
                      onChange={(e) => setRequiresRx(e.target.checked)}
                      className="h-4.5 w-4.5 rounded border-slate-800 bg-slate-950/40 text-violet-550 focus:ring-violet-500/50 cursor-pointer"
                    />
                    <label
                      htmlFor="requiresRx"
                      className="text-xs text-slate-300 font-bold select-none cursor-pointer hover:text-white"
                    >
                      Requires Prescription (Rx)
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="h-4.5 w-4.5 rounded border-slate-800 bg-slate-950/40 text-violet-550 focus:ring-violet-500/50 cursor-pointer"
                    />
                    <label
                      htmlFor="isActive"
                      className="text-xs text-slate-300 font-bold select-none cursor-pointer hover:text-white"
                    >
                      Active Catalog Item
                    </label>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-6 border-t border-slate-900/50">
                <button
                  type="button"
                  onClick={() => router.push('/staff/products')}
                  className="py-3 px-5 border border-slate-800 rounded-2xl text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="py-3 px-6 rounded-2xl text-xs font-bold text-slate-950 bg-violet-400 hover:bg-violet-300 transition-all cursor-pointer shadow-lg shadow-violet-500/15"
                >
                  {submitting ? 'Creating...' : 'Create Medicine'}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
