import React, { Suspense } from 'react';
import { apiFetch } from '@/lib/api';
import { Category, Product } from '@/lib/types';
import CustomerNavigation from '@/components/customer/Navigation';
import ProductCard from '@/components/customer/ProductCard';
import CatalogFilters from '@/components/customer/CatalogFilters';
import { Activity, ShoppingBag } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface ProductsPageProps {
  searchParams: Promise<{
    category_id?: string;
    search?: string;
    in_stock?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const resolvedParams = await searchParams;
  const categoryId = resolvedParams.category_id || '';
  const search = resolvedParams.search || '';
  const inStock = resolvedParams.in_stock === 'true';

  let categories: Category[] = [];
  let products: Product[] = [];
  let isBackendOffline = false;

  try {
    // 1. Fetch categories
    categories = await apiFetch('/categories');

    // 2. Build backend query string
    const queryParts = [];
    if (categoryId) queryParts.push(`category_id=${categoryId}`);
    if (search) queryParts.push(`search=${encodeURIComponent(search)}`);
    if (inStock) queryParts.push('in_stock=true');
    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';

    // 3. Fetch filtered active products
    products = await apiFetch(`/products${queryString}`);
  } catch (err) {
    console.error('Failed to load products list:', err);
    isBackendOffline = true;
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      <CustomerNavigation />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Medicines & Catalog
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Browse our verified inventory of prescription drugs and general healthcare products.
          </p>
        </div>

        {isBackendOffline ? (
          <div className="p-12 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-center space-y-3">
            <h3 className="font-extrabold text-amber-400 text-xl">Database Connection Offline</h3>
            <p className="text-slate-400 max-w-md mx-auto text-sm">
              We cannot load the pharmacy catalog at the moment. Please check if the FastAPI database service is running locally on port 8000.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
            {/* Filter Panel (Left) */}
            <div className="lg:col-span-1">
              <Suspense fallback={<div className="h-64 bg-slate-900/30 rounded-3xl animate-pulse" />}>
                <CatalogFilters categories={categories} />
              </Suspense>
            </div>

            {/* Products Grid (Right) */}
            <div className="lg:col-span-3 space-y-6">
              {products.length === 0 ? (
                <div className="p-20 text-center rounded-3xl border border-dashed border-slate-800 bg-slate-900/10 space-y-4">
                  <div className="p-4 bg-slate-900/50 rounded-full inline-block text-slate-600">
                    <ShoppingBag className="h-10 w-10" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-300">No Products Found</h3>
                  <p className="text-sm text-slate-500 max-w-xs mx-auto">
                    Try updating your search query or choosing another category in the filters panel.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((prod) => (
                    <ProductCard key={prod.id} product={prod} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Mini Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-600 flex items-center justify-center gap-2">
          <Activity className="h-4 w-4 text-teal-400/50" />
          <span>{process.env.NEXT_PUBLIC_BRAND_NAME || 'Pharmacy'} Pharmacy Shop Catalogue · 2026</span>
        </div>
      </footer>
    </div>
  );
}
