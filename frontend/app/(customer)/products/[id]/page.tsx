import React from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { Product } from '@/lib/types';
import CustomerNavigation from '@/components/customer/Navigation';
import ProductDetailActions from '@/components/customer/ProductDetailActions';
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
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      <CustomerNavigation />

      <main className="flex-grow max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        {/* Back Link */}
        <div>
          <Link
            href="/products"
            className="inline-flex items-center gap-1 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Catalog
          </Link>
        </div>

        {isError || !product ? (
          <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800/80 text-center space-y-4">
            <AlertCircle className="h-10 w-10 text-rose-400 mx-auto" />
            <h3 className="text-xl font-bold text-white">Product Not Found</h3>
            <p className="text-sm text-slate-400 max-w-sm mx-auto">
              We couldn't load details for this medicine. It may have been deactivated or the backend database API is offline.
            </p>
            <Link
              href="/products"
              className="inline-block py-2.5 px-6 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-bold transition-all"
            >
              Return to Catalog
            </Link>
          </div>
        ) : (
          <div className="bg-slate-900/20 border border-slate-900 rounded-3xl p-8 backdrop-blur-xl grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
            {/* Left side: Image and Core Badges */}
            <div className="space-y-4">
              <div className="aspect-square bg-slate-950/60 rounded-2xl flex items-center justify-center text-slate-700 relative overflow-hidden border border-slate-900">
                {product.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.image_url.startsWith('http') ? product.image_url : `${process.env.NEXT_PUBLIC_API_URL}${product.image_url}`}
                    alt={product.name}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="text-center p-6 uppercase tracking-wider text-sm font-bold text-slate-600">
                    {product.name}
                  </div>
                )}
                {product.requires_rx && (
                  <div className="absolute top-4 left-4 bg-teal-500/10 border border-teal-500/30 text-teal-400 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 backdrop-blur-md">
                    <FileText className="h-4 w-4" />
                    Rx Required
                  </div>
                )}
              </div>
            </div>

            {/* Right side: Detailed Metadata */}
            <div className="space-y-6">
              <div>
                <span className="text-sm font-bold text-teal-400 uppercase tracking-widest block mb-1">
                  {product.brand}
                </span>
                <h1 className="text-3xl font-extrabold text-white leading-tight">
                  {product.name}
                </h1>
                <p className="text-slate-400 text-sm mt-2 font-medium">
                  Packaging Unit: {product.unit}
                </p>
              </div>

              {/* Price Details */}
              <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-900 flex items-center justify-between">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white">
                      ₹{Number(product.price).toFixed(2)}
                    </span>
                    {Number(product.mrp) > Number(product.price) && (
                      <span className="text-sm text-slate-500 line-through">
                        M.R.P. ₹{Number(product.mrp).toFixed(2)}
                      </span>
                    )}
                  </div>
                  {Number(product.mrp) > Number(product.price) && (
                    <span className="text-xs text-teal-400 font-bold mt-1 block">
                      You save ₹{(Number(product.mrp) - Number(product.price)).toFixed(2)} ({Math.round(((Number(product.mrp) - Number(product.price)) / Number(product.mrp)) * 100)}%)
                    </span>
                  )}
                </div>

                <div className="text-right">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${
                    product.stock_qty <= 0 
                      ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                      : 'bg-teal-500/10 border border-teal-500/20 text-teal-400'
                  }`}>
                    {product.stock_qty <= 0 ? 'Out of Stock' : 'In Stock'}
                  </span>
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Product Description
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Add to Cart Actions */}
              <ProductDetailActions product={product} />

              {/* Assurance Banner */}
              <div className="flex gap-3 p-4 bg-slate-950/20 border border-slate-900 rounded-2xl">
                <ShieldCheck className="h-6 w-6 text-teal-400 flex-shrink-0" />
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-white">{process.env.NEXT_PUBLIC_BRAND_NAME || 'Pharmacy'} Quality Assurance</h4>
                  <p className="text-xxs text-slate-500 leading-normal">
                    This item is sourced from licensed manufacturers and kept under monitored temperatures. Manual review is conducted on every prescription item.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mini Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-600 flex items-center justify-center gap-2">
          <Activity className="h-4 w-4 text-teal-400/50" />
          <span>{process.env.NEXT_PUBLIC_BRAND_NAME || 'Pharmacy'} Pharmacy Catalogue · 2026</span>
        </div>
      </footer>
    </div>
  );
}
