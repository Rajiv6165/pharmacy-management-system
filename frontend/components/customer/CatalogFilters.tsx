"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Category } from '@/lib/types';
import { Search, Filter, RotateCcw } from 'lucide-react';

interface CatalogFiltersProps {
  categories: Category[];
}

export default function CatalogFilters({ categories }: CatalogFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Load initial states from URL search params
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [categoryId, setCategoryId] = useState(searchParams.get('category_id') || '');
  const [inStock, setInStock] = useState(searchParams.get('in_stock') === 'true');

  // Keep state sync if search params change externally (e.g. going back in history)
  useEffect(() => {
    setSearch(searchParams.get('search') || '');
    setCategoryId(searchParams.get('category_id') || '');
    setInStock(searchParams.get('in_stock') === 'true');
  }, [searchParams]);

  const applyFilters = (updates: { search?: string; categoryId?: string; inStock?: boolean }) => {
    const params = new URLSearchParams(searchParams.toString());

    const finalSearch = updates.search !== undefined ? updates.search : search;
    const finalCategory = updates.categoryId !== undefined ? updates.categoryId : categoryId;
    const finalInStock = updates.inStock !== undefined ? updates.inStock : inStock;

    if (finalSearch.trim()) {
      params.set('search', finalSearch.trim());
    } else {
      params.delete('search');
    }

    if (finalCategory) {
      params.set('category_id', finalCategory);
    } else {
      params.delete('category_id');
    }

    if (finalInStock) {
      params.set('in_stock', 'true');
    } else {
      params.delete('in_stock');
    }

    router.push(`/products?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters({ search });
  };

  const handleClear = () => {
    setSearch('');
    setCategoryId('');
    setInStock(false);
    router.push('/products');
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 space-y-6 backdrop-blur-xl">
      <div className="flex items-center gap-2 text-white font-bold text-lg">
        <Filter className="h-5 w-5 text-teal-400" />
        <h3>Filter Catalog</h3>
      </div>

      <form onSubmit={handleSearchSubmit} className="space-y-4">
        {/* Search text */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Search name / brand
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="e.g. Paracetamol, MediLabs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-4 pr-10 py-3 border border-slate-800 rounded-2xl bg-slate-950/40 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/80 transition-all duration-300 sm:text-sm"
            />
            <button
              type="submit"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
            >
              <Search className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Category select */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Medication Category
          </label>
          <select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              applyFilters({ categoryId: e.target.value });
            }}
            className="block w-full px-4 py-3 border border-slate-800 rounded-2xl bg-slate-950/40 text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/80 transition-all duration-300 sm:text-sm appearance-none cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Stock Toggle */}
        <div className="flex items-center gap-3 pt-2">
          <input
            type="checkbox"
            id="inStockOnly"
            checked={inStock}
            onChange={(e) => {
              setInStock(e.target.checked);
              applyFilters({ inStock: e.target.checked });
            }}
            className="h-4.5 w-4.5 rounded border-slate-800 bg-slate-950/40 text-teal-400 focus:ring-teal-500/50 cursor-pointer"
          />
          <label
            htmlFor="inStockOnly"
            className="text-sm text-slate-300 font-medium select-none cursor-pointer hover:text-white transition-colors"
          >
            In-Stock Items Only
          </label>
        </div>

        {/* Action button row */}
        <div className="flex items-center gap-3 pt-4 border-t border-slate-850">
          <button
            type="submit"
            className="flex-grow py-3 px-4 border border-transparent rounded-2xl text-sm font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 cursor-pointer transition-all duration-300 shadow-md shadow-teal-500/10 text-center"
          >
            Search
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="p-3 border border-slate-800 rounded-2xl text-slate-400 hover:text-slate-200 hover:bg-slate-900 focus:outline-none transition-all duration-300 cursor-pointer"
            title="Reset filters"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
