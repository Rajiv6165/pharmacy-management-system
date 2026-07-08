import React from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { Category, Product } from '@/lib/types';
import CustomerNavigation from '@/components/customer/Navigation';
import ProductCard from '@/components/customer/ProductCard';
import { Shield, Sparkles, Truck, ClipboardList, Activity } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function Homepage() {
  let categories: Category[] = [];
  let products: Product[] = [];
  let isBackendOffline = false;

  try {
    categories = await apiFetch('/categories');
    products = await apiFetch('/products?in_stock=true');
    // Limit featured products to 8
    products = products.slice(0, 8);
  } catch (err) {
    console.error('Failed to fetch homepage data:', err);
    isBackendOffline = true;
  }

  const features = [
    {
      icon: <ClipboardList className="h-6 w-6 text-teal-400" />,
      title: 'Digital Prescriptions',
      description: 'Upload Rx files directly during checkout for quick pharmacist review and verification.',
    },
    {
      icon: <Truck className="h-6 w-6 text-teal-400" />,
      title: 'Express Delivery',
      description: 'Get your health supplies delivered straight to your door or choose instant pickup.',
    },
    {
      icon: <Shield className="h-6 w-6 text-teal-400" />,
      title: 'Verified Pharmacists',
      description: 'Rest assured that every single prescription order is checked manually by our staff.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      <CustomerNavigation />

      {/* Hero Section */}
      <header className="relative py-20 overflow-hidden border-b border-slate-900 bg-radial from-slate-900/50 via-slate-950 to-slate-950">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-7xl h-96 bg-teal-500/5 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold text-teal-400 bg-teal-500/10 border border-teal-500/20">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Digital-First Pharmacy Experience</span>
          </div>
          <h1 className="text-4xl font-extrabold sm:text-6xl text-white tracking-tight max-w-3xl mx-auto leading-tight">
            Order Medicines and Track <span className="text-teal-400">Prescriptions</span> Safely
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-slate-400">
            Welcome to AetherRx. We bridge the gap between healthcare convenience and safety, facilitating quick order fulfillment, prescription validation, and real-time status updates.
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <Link
              href="/products"
              className="py-3.5 px-8 rounded-2xl text-sm font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 transition-all duration-300 shadow-lg shadow-teal-500/20"
            >
              Shop Medicines
            </Link>
            <Link
              href="/login"
              className="py-3.5 px-8 rounded-2xl text-sm font-bold text-slate-200 border border-slate-800 bg-slate-900/50 hover:bg-slate-800 transition-all duration-300"
            >
              Sign In to Order
            </Link>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">
        
        {/* Backend offline warning banner */}
        {isBackendOffline && (
          <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-center space-y-2">
            <h3 className="font-extrabold text-amber-400 text-lg">Local API Server is Offline</h3>
            <p className="text-sm text-slate-400 max-w-lg mx-auto">
              We cannot connect to the backend database API. Make sure the FastAPI application is running on <code>http://localhost:8000</code> to browse categories and products.
            </p>
          </div>
        )}

        {/* Features list */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feat, i) => (
            <div key={i} className="p-8 rounded-3xl bg-slate-900/20 border border-slate-900 hover:border-slate-800/80 transition-all duration-300 space-y-4">
              <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-2xl inline-block">
                {feat.icon}
              </div>
              <h3 className="text-xl font-bold text-white">{feat.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{feat.description}</p>
            </div>
          ))}
        </section>

        {/* Categories Section */}
        {!isBackendOffline && categories.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-white tracking-wide">Shop by Category</h2>
              <Link href="/products" className="text-sm font-bold text-teal-400 hover:underline">
                View All
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/products?category_id=${cat.id}`}
                  className="p-6 rounded-2xl bg-slate-900/30 border border-slate-900 hover:border-teal-500/30 text-center font-bold text-slate-200 hover:text-teal-400 transition-all duration-300 hover:shadow-lg hover:shadow-teal-500/1"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Featured Products */}
        {!isBackendOffline && products.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-white tracking-wide">Featured Meds & Healthcare</h2>
              <Link href="/products" className="text-sm font-bold text-teal-400 hover:underline">
                See Catalog
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-teal-400" />
            <span className="font-extrabold text-white">AetherRx</span>
            <span>© 2026. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/staff/login" className="hover:text-slate-300 transition-colors font-semibold">
              Pharmacist Portal
            </Link>
            <Link href="/products" className="hover:text-slate-300 transition-colors">
              All Medicines
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
