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
    <div className="flex flex-col min-h-screen bg-paper text-ink font-sans">
      <CustomerNavigation />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-serif tracking-tight text-primary-dark sm:text-4xl">
            Medicines & Catalog
          </h1>
          <p className="mt-1 text-xs text-ink/70">
            Browse our verified inventory of prescription drugs and general healthcare products.
          </p>
        </div>

        {isBackendOffline ? (
          <div className="p-12 rounded border border-highlight bg-highlight/5 text-center space-y-3">
            <h3 className="font-serif font-bold text-primary-dark text-lg">Database Connection Offline</h3>
            <p className="text-xs font-mono text-ink/65 max-w-md mx-auto">
              We cannot load the pharmacy catalog at the moment. Please check if the FastAPI database service is running locally on port 8000.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
            {/* Filter Panel (Left) */}
            <div className="lg:col-span-1">
              <Suspense fallback={<div className="h-64 bg-white border border-primary-dark/10 rounded animate-pulse" />}>
                <CatalogFilters categories={categories} />
              </Suspense>
            </div>

            {/* Products Grid (Right) */}
            <div className="lg:col-span-3 space-y-6">
              {products.length === 0 ? (
                <div className="p-20 text-center rounded bg-white border border-primary-dark/15 space-y-4 shadow-xxs">
                  <div className="p-4 bg-paper rounded-full inline-block text-accent border border-primary-dark/10">
                    <ShoppingBag className="h-10 w-10" />
                  </div>
                  <h3 className="text-xl font-bold font-serif text-primary-dark">No Products Found</h3>
                  <p className="text-xs text-ink/60 max-w-xs mx-auto">
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
      <footer className="border-t border-primary-dark/10 bg-primary-dark py-8 pb-24 text-paper/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs flex items-center justify-center gap-2">
          <Activity className="h-4 w-4 text-highlight" />
          <span>{process.env.NEXT_PUBLIC_BRAND_NAME || 'Pharmacy'} Pharmacy Shop Catalogue · 2026</span>
        </div>
      </footer>
    </div>
  );
}
