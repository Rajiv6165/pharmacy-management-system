import React from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { Product } from '@/lib/types';
import CustomerNavigation from '@/components/customer/Navigation';
import ProductDetailActions from '@/components/customer/ProductDetailActions';
import ProductImage from '@/components/customer/ProductImage';
import { ChevronLeft, FileText, Activity, ShieldCheck, AlertCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface ProductDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;
  let product: Product | null = null;
  let isError = false;

  try {
    product = await apiFetch(`/products/${id}`);
  } catch (err) {
    console.error(`Failed to fetch product with ID ${id}:`, err);
    isError = true;
  }

  return (
    <div className="flex flex-col min-h-screen bg-paper text-ink font-sans">
      <CustomerNavigation />

      <main className="flex-grow max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        {/* Back Link */}
        <div>
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-ink/60 hover:text-accent transition-colors uppercase tracking-wider"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Catalog
          </Link>
        </div>

        {isError || !product ? (
          <div className="p-12 rounded bg-white border border-primary-dark/15 text-center space-y-4 shadow-xxs">
            <AlertCircle className="h-8 w-8 text-rose-600 mx-auto" />
            <h3 className="text-xl font-bold font-serif text-primary-dark">Product Not Found</h3>
            <p className="text-xs text-ink/65 max-w-sm mx-auto">
              We couldn't load details for this medicine. It may have been deactivated or the backend database API is offline.
            </p>
            <Link
              href="/products"
              className="inline-block py-2 px-5 bg-accent hover:bg-accent/90 text-white rounded text-xs font-bold transition-all shadow-sm"
            >
              Return to Catalog
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-primary-dark/15 rounded-lg p-6 sm:p-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-start shadow-sm">
            {/* Left side: Image and Core Badges */}
            <div className="space-y-4">
              <div className="aspect-square bg-paper/20 rounded border border-primary-dark/10 relative overflow-hidden">
                <ProductImage src={product.image_url} alt={product.name} brand={product.brand} />
                {product.requires_rx && (
                  <div className="absolute top-4 left-4 bg-highlight text-primary-dark font-mono font-bold px-2.5 py-1 rounded text-[10px] flex items-center gap-1 border border-primary-dark/10 uppercase tracking-wider">
                    <FileText className="h-3.5 w-3.5" />
                    Rx Required
                  </div>
                )}
              </div>
            </div>

            {/* Right side: Detailed Metadata */}
            <div className="space-y-6">
              <div>
                <span className="text-xs font-mono font-bold text-accent uppercase tracking-widest block mb-1">
                  {product.brand}
                </span>
                <h1 className="text-3xl font-bold font-serif text-primary-dark leading-tight pr-6">
                  {product.name}
                </h1>
                <p className="text-ink/65 text-xs mt-1.5 font-mono">
                  PACKAGING UNIT: <span className="font-bold text-ink">{product.unit}</span>
                </p>
              </div>

              {/* Price Details */}
              <div className="p-5 rounded border border-primary-dark/10 bg-paper/40 flex items-center justify-between">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-mono font-bold text-primary-dark">
                      ₹{Number(product.price).toFixed(2)}
                    </span>
                    {Number(product.mrp) > Number(product.price) && (
                      <span className="text-xs font-mono text-ink/40 line-through">
                        MRP: ₹{Number(product.mrp).toFixed(2)}
                      </span>
                    )}
                  </div>
                  {Number(product.mrp) > Number(product.price) && (
                    <span className="text-xxs font-mono text-accent font-bold mt-1 block">
                      YOU SAVE ₹{(Number(product.mrp) - Number(product.price)).toFixed(2)} ({Math.round(((Number(product.mrp) - Number(product.price)) / Number(product.mrp)) * 100)}%)
                    </span>
                  )}
                </div>

                <div className="text-right">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${
                    product.stock_qty <= 0 
                      ? 'bg-rose-50 border-rose-200 text-rose-600'
                      : 'bg-accent/10 border-accent/25 text-accent'
                  }`}>
                    {product.stock_qty <= 0 ? 'Out of Stock' : 'In Stock'}
                  </span>
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div className="space-y-2 pt-2">
                  <h3 className="text-[10px] font-mono font-bold text-accent uppercase tracking-wider">
                    Product Description
                  </h3>
                  <p className="text-xs text-ink/75 leading-relaxed font-sans">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Add to Cart Actions */}
              <ProductDetailActions product={product} />

              {/* Assurance Banner */}
              <div className="flex gap-3 p-4 bg-paper/30 border border-primary-dark/10 rounded">
                <ShieldCheck className="h-5 w-5 text-accent flex-shrink-0" />
                <div className="space-y-0.5">
                  <h4 className="text-xs font-serif font-bold text-primary-dark">{process.env.NEXT_PUBLIC_BRAND_NAME || 'Pharmacy'} Quality Assurance</h4>
                  <p className="text-[10px] text-ink/50 leading-relaxed font-sans">
                    This item is sourced from licensed manufacturers and kept under monitored temperatures. Manual review is conducted on every prescription item.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mini Footer */}
      <footer className="border-t border-primary-dark/10 bg-primary-dark py-8 mt-12 text-paper/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs flex items-center justify-center gap-2">
          <Activity className="h-4 w-4 text-highlight" />
          <span>{process.env.NEXT_PUBLIC_BRAND_NAME || 'Pharmacy'} Pharmacy Catalogue · 2026</span>
        </div>
      </footer>
    </div>
  );
}
