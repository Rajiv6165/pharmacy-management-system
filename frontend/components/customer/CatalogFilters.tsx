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
    <div className="bg-white border border-primary-dark/15 rounded-lg p-6 space-y-6 shadow-xxs">
      <div className="flex items-center gap-2 text-primary-dark font-serif font-bold text-lg">
        <Filter className="h-4.5 w-4.5 text-accent" />
        <h3>Filter Catalog</h3>
      </div>

      <form onSubmit={handleSearchSubmit} className="space-y-4">
        {/* Search text */}
        <div>
          <label className="block text-[10px] font-mono font-bold text-accent uppercase tracking-wider mb-1.5">
            Search name / brand
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="e.g. Paracetamol, MediLabs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-3 pr-9 py-2 border border-primary-dark/15 rounded bg-paper/30 text-ink placeholder-ink/40 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all text-xs font-sans"
            />
            <button
              type="submit"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-ink/40 hover:text-accent transition-colors"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Category select */}
        <div>
          <label className="block text-[10px] font-mono font-bold text-accent uppercase tracking-wider mb-1.5">
            Medication Category
          </label>
          <div className="relative">
            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                applyFilters({ categoryId: e.target.value });
              }}
              className="block w-full px-3 py-2 border border-primary-dark/15 rounded bg-paper/30 text-ink/80 focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all text-xs font-sans appearance-none cursor-pointer pr-8"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-ink/50">
              <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
              </svg>
            </div>
          </div>
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
            className="h-4 w-4 rounded border-primary-dark/20 text-accent focus:ring-accent cursor-pointer"
          />
          <label
            htmlFor="inStockOnly"
            className="text-xs text-ink/75 font-medium select-none cursor-pointer hover:text-primary-dark transition-colors"
          >
            In-Stock Items Only
          </label>
        </div>

        {/* Action button row */}
        <div className="flex items-center gap-3 pt-4 border-t border-primary-dark/10">
          <button
            type="submit"
            className="flex-grow py-2 px-4 border border-transparent rounded text-xs font-bold text-white bg-accent hover:bg-accent/90 cursor-pointer transition-colors shadow-xxs text-center"
          >
            Search
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="p-2 border border-primary-dark/20 rounded text-ink/60 hover:text-primary-dark hover:bg-paper focus:outline-none transition-colors cursor-pointer"
            title="Reset filters"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
