import React from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { Category, Product } from '@/lib/types';
import CustomerNavigation from '@/components/customer/Navigation';
import ProductCard from '@/components/customer/ProductCard';
import { Shield, Sparkles, Truck, ClipboardList, Activity } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function Homepage() {
  const brandName = process.env.NEXT_PUBLIC_BRAND_NAME || 'Pharmacy';
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
      icon: <ClipboardList className="h-5 w-5" />,
      title: 'Digital Prescriptions',
      description: 'Upload Rx files directly during checkout for quick pharmacist review and verification.',
    },
    {
      icon: <Truck className="h-5 w-5" />,
      title: 'Express Delivery',
      description: 'Get your health supplies delivered straight to your door or choose instant pickup.',
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: 'Verified Pharmacists',
      description: 'Rest assured that every single prescription order is checked manually by our staff.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-paper text-ink font-sans">
      <CustomerNavigation />

      {/* Hero Section */}
      <header className="relative py-16 sm:py-24 border-b border-primary-dark/10 bg-paper">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
          {/* Trust Signal / Verified Pharmacist Review Badge */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-[11px] font-mono text-ink/70">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-accent/10 border border-accent/20 rounded text-accent font-bold">
              <Shield className="h-3.5 w-3.5" />
              <span>VERIFIED PHARMACIST QUALITY CHECK</span>
            </div>
            <span className="hidden sm:inline text-primary-dark/20">•</span>
            <div className="flex items-center gap-1">
              <span className="text-highlight">★★★★★</span>
              <span>4.9/5 RATING ACROSS 12,000+ ORDERS</span>
            </div>
          </div>

          <h1 className="text-4xl sm:text-6xl font-serif text-primary-dark tracking-tight max-w-3xl mx-auto leading-[1.1] font-bold">
            Order Medicines and Track Prescriptions Safely
          </h1>
          
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-ink/70 font-sans leading-relaxed">
            Welcome to {brandName}. We bridge the gap between healthcare convenience and safety, facilitating quick order fulfillment, prescription validation, and real-time status updates.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/products"
              className="py-3 px-6 rounded text-sm font-sans font-bold text-white bg-accent hover:bg-accent/90 transition-colors shadow-sm"
            >
              Browse Medicines Catalog
            </Link>
            <Link
              href="/login"
              className="py-3 px-6 rounded text-sm font-sans font-semibold text-primary-dark border border-primary-dark/20 hover:bg-primary-dark/5 transition-colors"
            >
              Sign In to Your Account
            </Link>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">
        
        {/* Backend offline warning banner */}
        {isBackendOffline && (
          <div className="p-6 rounded border border-highlight bg-highlight/5 text-center space-y-2">
            <h3 className="font-serif font-bold text-primary-dark text-lg">Local API Server is Offline</h3>
            <p className="text-xs font-mono text-ink/65 max-w-lg mx-auto">
              We cannot connect to the backend database API. Make sure the FastAPI application is running on <code>http://localhost:8000</code> to browse categories and products.
            </p>
          </div>
        )}

        {/* Features list */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feat, i) => (
            <div key={i} className="p-8 rounded bg-white border border-primary-dark/10 hover:border-accent/30 transition-colors space-y-4 shadow-xxs">
              <div className="p-2.5 bg-accent/10 border border-accent/15 rounded inline-block text-accent">
                {feat.icon}
              </div>
              <h3 className="text-lg font-serif font-bold text-primary-dark">{feat.title}</h3>
              <p className="text-ink/65 text-xs font-sans leading-relaxed">{feat.description}</p>
            </div>
          ))}
        </section>

        {/* Categories Section */}
        {!isBackendOffline && categories.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-baseline justify-between border-b border-primary-dark/10 pb-3">
              <h2 className="text-2xl font-serif font-bold text-primary-dark">Shop by Category</h2>
              <Link href="/products" className="text-xs font-mono font-bold text-accent hover:underline tracking-wider">
                VIEW ALL CATEGORIES →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/products?category_id=${cat.id}`}
                  className="p-5 rounded bg-white border border-primary-dark/10 text-center font-sans font-bold text-ink/80 hover:text-accent hover:border-accent/40 hover:shadow-sm transition-all"
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
            <div className="flex items-baseline justify-between border-b border-primary-dark/10 pb-3">
              <h2 className="text-2xl font-serif font-bold text-primary-dark">Featured Catalog Items</h2>
              <Link href="/products" className="text-xs font-mono font-bold text-accent hover:underline tracking-wider">
                SEE ENTIRE CATALOG →
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
      <footer className="border-t border-primary-dark/10 bg-primary-dark py-12 pb-24 text-paper/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs font-sans">
          <div className="flex items-center gap-2 text-paper">
            <Activity className="h-5 w-5 text-highlight" />
            <span className="font-serif font-bold text-sm tracking-wide">{brandName}</span>
            <span className="text-[10px] font-mono opacity-60">© 2026. SECURE RX VERIFICATION.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/staff/login" className="hover:text-white hover:underline transition-colors font-mono font-semibold">
              PHARMACIST PORTAL GATES
            </Link>
            <Link href="/products" className="hover:text-white hover:underline transition-colors font-mono font-semibold">
              ALL MEDICINES
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
